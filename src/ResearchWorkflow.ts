import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AI_MODEL, ANGLE_SUMMARY_PROMPT, SEARCH_RESULT_PROMPT, SUB_QUERY_PROMPT, SYNTHESIS_PROMPT } from "./lib/prompts";
import { Env } from "./types";

export interface ResearchParams {
  query: string;
  sessionId: string;
}

export interface ResearchResult {
  query: string;
  synthesis: string;
  sources: { title: string; url: string; snippet: string }[];
  completedAt: number;
}

function cleanJsonResponse(response: string): string {
  return response.replace(/```json|```/g, "").trim();
}

async function generateSubQueries(ai: Ai, query: string): Promise<string[]> {
  const result = (await ai.run(AI_MODEL, {
    messages: [
      {
        role: "system",
        content: "Return only a JSON array of three search sub-queries.",
      },
      {
        role: "user",
        content: SUB_QUERY_PROMPT(query),
      },
    ],
    max_tokens: 200,
  })) as { response: string };

  try {
    const parsed = JSON.parse(cleanJsonResponse(result.response));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3);
    }
  } catch {
    // fall through to the local fallback below
  }

  return [query, `${query} examples`, `${query} latest developments`];
}

async function fetchSearchResults(
  ai: Ai,
  subQuery: string
): Promise<{ title: string; url: string; snippet: string }[]> {
  const result = (await ai.run(AI_MODEL, {
    messages: [
      {
        role: "system",
        content: "Return only a JSON array of search results.",
      },
      {
        role: "user",
        content: SEARCH_RESULT_PROMPT(subQuery),
      },
    ],
    max_tokens: 400,
  })) as { response: string };

  try {
    return JSON.parse(cleanJsonResponse(result.response));
  } catch {
    return [{ title: subQuery, url: "https://example.com", snippet: result.response.slice(0, 200) }];
  }
}

async function summarizeAngle(
  ai: Ai,
  angle: string,
  results: { title: string; snippet: string }[]
): Promise<string> {
  const context = results.map((result) => `${result.title}: ${result.snippet}`).join("\n\n");
  const result = (await ai.run(AI_MODEL, {
    messages: [{ role: "user", content: ANGLE_SUMMARY_PROMPT(angle, context) }],
    max_tokens: 250,
  })) as { response: string };

  return result.response;
}

export class ResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
  async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep): Promise<ResearchResult> {
    const { query } = event.payload;

    const subQueries = await step.do("generate-sub-queries", async () => {
      return generateSubQueries(this.env.AI, query);
    });

    const allResults = await step.do("fetch-search-results", async () => {
      const batches = await Promise.all(subQueries.map((subQuery) => fetchSearchResults(this.env.AI, subQuery)));
      return batches.flat();
    });

    const angleSummaries = await step.do("summarize-angles", async () => {
      return Promise.all(
        subQueries.map((subQuery, index) => {
          const relevant = allResults.slice(index * 2, index * 2 + 2);
          return summarizeAngle(this.env.AI, subQuery, relevant);
        })
      );
    });

    const synthesis = await step.do("synthesize", async () => {
      const combined = subQueries
        .map((subQuery, index) => `**${subQuery}**\n${angleSummaries[index]}`)
        .join("\n\n");

      const result = (await this.env.AI.run(AI_MODEL, {
        messages: [
          {
            role: "system",
            content: "Write clear research briefs in markdown.",
          },
          {
            role: "user",
            content: SYNTHESIS_PROMPT(query, combined),
          },
        ],
        max_tokens: 800,
      })) as { response: string };

      return result.response;
    });

    return {
      query,
      synthesis,
      sources: allResults,
      completedAt: Date.now(),
    };
  }
}
