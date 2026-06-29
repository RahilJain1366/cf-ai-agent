declare module "cloudflare:workers" {
  export interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
  }

  export interface DurableObjectState {
    storage: DurableObjectStorage;
    waitUntil(promise: Promise<unknown>): void;
  }

  export class DurableObject<Env = unknown> {
    constructor(state: DurableObjectState, env: Env);
    protected ctx: DurableObjectState;
    protected env: Env;
  }

  export interface WorkflowEvent<Payload> {
    payload: Payload;
  }

  export interface WorkflowStep {
    do<T>(name: string, task: () => Promise<T> | T): Promise<T>;
  }

  export class WorkflowEntrypoint<Env = unknown, Payload = unknown> {
    constructor(env: Env);
    protected env: Env;
  }
}

interface DurableObjectId {
  readonly id?: string;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface Workflow {
  create(options: { params: unknown }): Promise<{ id: string }>;
  get(id: string): Promise<{ status(): Promise<unknown> }>;
}

interface Ai {
  run(model: string, options: unknown): Promise<unknown>;
}