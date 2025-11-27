type HeaderTag = 'USR' | 'SYS';

const HEADER_REGEX = /^\s*\[(?<tag>[A-Za-z]{3})\]\s*/;

export type HandlerResult =
  | { kind: 'userReply'; text: string }
  | { kind: 'systemForwarded'; target: string; payload: string }
  | { kind: 'unknown'; raw: string };

export interface HandlerRouteResult {
  target: string;
}

export type HandlerRoute = (payload: string) => Promise<HandlerRouteResult>;

export interface TaskIngestorPort {
  ingestTask(payload: string): Promise<void>;
}

interface HandlerDependencies {
  routes?: Partial<Record<HeaderTag, HandlerRoute>>;
  defaultUserHeader?: HeaderTag;
}

export class GPTResponseHandler {
  private readonly routes: Partial<Record<HeaderTag, HandlerRoute>>;
  private readonly fallbackHeader: HeaderTag;

  constructor({ routes = {}, defaultUserHeader = 'USR' }: HandlerDependencies = {}) {
    this.routes = routes;
    this.fallbackHeader = defaultUserHeader;
  }

  async handle(rawResponse: string): Promise<HandlerResult> {
    if (!rawResponse) {
      return { kind: 'unknown', raw: rawResponse };
    }

    const { header, body } = this.extractHeader(rawResponse);

    if (header === 'USR') {
      return { kind: 'userReply', text: body.trim() };
    }

    const route = this.routes[header];
    if (route) {
      const result = await route(body.trim());
      return { kind: 'systemForwarded', target: result.target, payload: body.trim() };
    }

    if (this.fallbackHeader === 'USR') {
      return { kind: 'userReply', text: rawResponse.trim() };
    }

    return { kind: 'unknown', raw: rawResponse };
  }

  private extractHeader(raw: string): { header: HeaderTag; body: string } {
    const match = raw.match(HEADER_REGEX);
    if (!match?.groups?.tag) {
      return { header: this.fallbackHeader, body: raw };
    }

    const tag = match.groups.tag.toUpperCase();
    const header = (['USR', 'SYS'].includes(tag) ? (tag as HeaderTag) : this.fallbackHeader) ?? this.fallbackHeader;
    const body = raw.replace(match[0], '');
    return { header, body };
  }
}

export const createDefaultResponseHandler = (deps: { taskIngestor: TaskIngestorPort }) =>
  new GPTResponseHandler({
    routes: {
      SYS: async (payload: string) => {
        await deps.taskIngestor.ingestTask(payload);
        return { target: 'TaskIngestor' };
      },
    },
  });

