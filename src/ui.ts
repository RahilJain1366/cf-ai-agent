export const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aria</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f3efe7;
      --panel: rgba(255, 255, 255, 0.74);
      --panel-strong: #ffffff;
      --text: #171717;
      --muted: #64605a;
      --line: rgba(23, 23, 23, 0.1);
      --accent: #0f766e;
      --accent-strong: #115e59;
      --warning: #9a3412;
      --shadow: 0 24px 80px rgba(11, 20, 28, 0.12);
      --radius: 22px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, "Avenir Next", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 30%),
        radial-gradient(circle at top right, rgba(17, 94, 89, 0.12), transparent 24%),
        linear-gradient(180deg, #faf7f1 0%, #f3efe7 52%, #ece6db 100%);
    }

    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 24px;
      padding: 24px;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
      border-radius: var(--radius);
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 28px;
    }

    .brand {
      display: grid;
      gap: 12px;
    }

    .mark {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--accent), #2dd4bf);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
    }

    h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .lede {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
      max-width: 24ch;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .chip {
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.66);
      color: var(--muted);
      font-size: 13px;
    }

    .main {
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      overflow: hidden;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 22px 24px 0;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.08);
      color: var(--accent-strong);
      font-size: 14px;
    }

    .status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 6px rgba(15, 118, 110, 0.12);
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 18px 24px 0;
    }

    .mode {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.72);
      color: var(--muted);
      box-shadow: none;
      padding: 10px 14px;
      border-radius: 999px;
    }

    .mode.active {
      color: var(--text);
      background: rgba(15, 118, 110, 0.1);
      border-color: rgba(15, 118, 110, 0.16);
    }

    .conversation {
      padding: 24px;
      overflow: auto;
      display: grid;
      gap: 14px;
      align-content: start;
    }

    .message,
    .card {
      max-width: min(760px, 92%);
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 8px 30px rgba(20, 26, 32, 0.05);
      line-height: 1.6;
      white-space: pre-wrap;
      animation: fadeUp 180ms ease-out;
    }

    .message.user {
      margin-left: auto;
      background: linear-gradient(135deg, #ffffff 0%, #f3f8f7 100%);
      border-color: rgba(15, 118, 110, 0.16);
    }

    .message.assistant {
      background: rgba(255, 255, 255, 0.94);
    }

    .card {
      display: grid;
      gap: 10px;
    }

    .card-title {
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .card-meta {
      color: var(--muted);
      font-size: 13px;
    }

    .composer {
      padding: 0 24px 24px;
    }

    .composer-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: end;
      padding: 16px;
      border-radius: 24px;
      background: var(--panel-strong);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
    }

    textarea {
      width: 100%;
      min-height: 68px;
      max-height: 180px;
      resize: vertical;
      border: 0;
      outline: none;
      font: inherit;
      color: var(--text);
      background: transparent;
    }

    button {
      appearance: none;
      border: 0;
      border-radius: 16px;
      padding: 14px 18px;
      font: inherit;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(15, 118, 110, 0.22);
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .hint {
      margin-top: 10px;
      color: var(--muted);
      font-size: 13px;
    }

    .hint.error {
      color: var(--warning);
    }

    .sources {
      display: grid;
      gap: 10px;
    }

    .source {
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid var(--line);
    }

    .source a {
      color: var(--accent-strong);
      text-decoration: none;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 900px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        padding: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="panel sidebar">
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <h1>Aria</h1>
          <p class="lede">A Cloudflare Worker for chat, exports, and workflow-backed research.</p>
        </div>
        <div class="chips">
          <span class="chip">Streaming chat</span>
          <span class="chip">Durable history</span>
          <span class="chip">Research jobs</span>
        </div>
      </div>
      <div>
        <p class="hint">Use Chat for normal conversation or switch to Research for a background brief with sources.</p>
        <p class="hint">History is tied to the session cookie set on first load.</p>
      </div>
    </aside>

    <section class="panel main">
      <div class="topbar">
        <div id="status" class="status">Ready</div>
        <button id="clearButton" class="mode" type="button">Clear history</button>
      </div>

      <div class="toolbar" role="tablist" aria-label="Mode selector">
        <button id="chatMode" class="mode active" type="button">Chat</button>
        <button id="researchMode" class="mode" type="button">Research</button>
      </div>

      <div id="conversation" class="conversation" aria-live="polite"></div>

      <div class="composer">
        <form id="composerForm" class="composer-card">
          <textarea id="message" placeholder="Ask something or request research..." rows="3"></textarea>
          <button id="sendButton" type="submit">Send</button>
        </form>
        <div id="help" class="hint">Shift+Enter for a newline. Enter sends.</div>
      </div>
    </section>
  </div>

  <script>
    const conversation = document.getElementById('conversation');
    const form = document.getElementById('composerForm');
    const input = document.getElementById('message');
    const sendButton = document.getElementById('sendButton');
    const status = document.getElementById('status');
    const help = document.getElementById('help');
    const clearButton = document.getElementById('clearButton');
    const chatMode = document.getElementById('chatMode');
    const researchMode = document.getElementById('researchMode');

    let mode = 'chat';
    let streamBuffer = '';

    function setStatus(text, isError = false) {
      status.textContent = text;
      help.classList.toggle('error', isError);
    }

    function setMode(nextMode) {
      mode = nextMode;
      chatMode.classList.toggle('active', mode === 'chat');
      researchMode.classList.toggle('active', mode === 'research');
      sendButton.textContent = mode === 'chat' ? 'Send' : 'Research';
      input.placeholder = mode === 'chat' ? 'Ask something...' : 'Enter a research topic...';
    }

    function scrollToBottom() {
      conversation.scrollTop = conversation.scrollHeight;
    }

    function escapeHtml(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderText(text) {
      return escapeHtml(text).replace(/\n/g, '<br />');
    }

    function addMessage(role, text) {
      const el = document.createElement('div');
      el.className = 'message ' + role;
      el.innerHTML = renderText(text);
      conversation.appendChild(el);
      scrollToBottom();
      return el;
    }

    function addResearchCard(title, meta, body) {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML =
        '<div class="card-title">' + escapeHtml(title) + '</div>' +
        '<div class="card-meta">' + escapeHtml(meta) + '</div>' +
        '<div class="card-body">' + renderText(body) + '</div>';
      conversation.appendChild(el);
      scrollToBottom();
      return el;
    }

    function addSources(sources) {
      if (!Array.isArray(sources) || sources.length === 0) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'card';
      const items = sources.map((source) =>
        '<div class="source">' +
          '<div><strong>' + escapeHtml(source.title || 'Source') + '</strong></div>' +
          '<div><a href="' + escapeHtml(source.url || '#') + '" target="_blank" rel="noreferrer">' + escapeHtml(source.url || '') + '</a></div>' +
          '<div>' + escapeHtml(source.snippet || '') + '</div>' +
        '</div>'
      ).join('');
      wrapper.innerHTML = '<div class="card-title">Sources</div><div class="sources">' + items + '</div>';
      conversation.appendChild(wrapper);
      scrollToBottom();
    }

    async function loadHistory() {
      try {
        const response = await fetch('/api/history');
        if (!response.ok) return;
        const session = await response.json();
        if (session.title) {
          document.title = session.title + ' · Aria';
        }

        if (Array.isArray(session.messages) && session.messages.length > 0) {
          conversation.innerHTML = '';
          for (const message of session.messages) {
            addMessage(message.role === 'user' ? 'user' : 'assistant', message.content);
          }
          if (session.summary) {
            addResearchCard('Earlier context', 'Stored from the same session', session.summary);
          }
        } else {
          conversation.innerHTML = '';
          addMessage('assistant', 'Ask a question to start the session, or switch to Research for a background brief.');
        }
      } catch (error) {
        setStatus('History unavailable', true);
      }
    }

    async function streamChat(message) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Chat request failed');
      }

      const assistantBubble = addMessage('assistant', '');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.response) {
              fullText += data.response;
              assistantBubble.innerHTML = renderText(fullText);
              scrollToBottom();
            }
          } catch {
            continue;
          }
        }
      }
    }

    async function runResearch(query) {
      const start = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!start.ok) {
        throw new Error('Failed to start research');
      }

      const { instanceId } = await start.json();
      const progressCard = addResearchCard('Research running', 'Polling workflow status', 'Query: ' + query);

      while (true) {
        const response = await fetch('/api/research/' + instanceId);
        if (!response.ok) {
          throw new Error('Failed to fetch research status');
        }

        const statusPayload = await response.json();
        const output = statusPayload.output || statusPayload.result || statusPayload;

        if (output && output.synthesis) {
          progressCard.querySelector('.card-title').textContent = 'Research complete';
          progressCard.querySelector('.card-meta').textContent = 'Workflow finished successfully';
          progressCard.querySelector('.card-body').textContent = output.synthesis;
          addSources(output.sources || []);
          return;
        }

        progressCard.querySelector('.card-meta').textContent = statusPayload.status || statusPayload.state || 'running';
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    async function clearHistory() {
      const response = await fetch('/api/clear', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
      conversation.innerHTML = '';
      addMessage('assistant', 'History cleared.');
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      sendButton.disabled = true;
      clearButton.disabled = true;
      setStatus(mode === 'chat' ? 'Streaming response' : 'Running research job');

      try {
        addMessage('user', message);
        if (mode === 'chat') {
          await streamChat(message);
        } else {
          await runResearch(message);
        }
        setStatus('Ready');
      } catch (error) {
        setStatus('Request failed', true);
        addMessage('assistant', 'The request failed. Try again or check the Worker logs.');
      } finally {
        sendButton.disabled = false;
        clearButton.disabled = false;
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    chatMode.addEventListener('click', () => setMode('chat'));
    researchMode.addEventListener('click', () => setMode('research'));
    clearButton.addEventListener('click', async () => {
      try {
        clearButton.disabled = true;
        await clearHistory();
        setStatus('History cleared');
      } catch (error) {
        setStatus('Could not clear history', true);
      } finally {
        clearButton.disabled = false;
      }
    });

    setMode('chat');
    loadHistory();
  </script>
</body>
</html>`;
