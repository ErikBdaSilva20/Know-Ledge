// The boundary between transport (client.ts) and domain (repos/UI) — Story 5.1.
// Repos/screens never see a Response, a fetch error, or an HTTP status; they
// only ever catch a DomainError and switch on `.type`.
//
// One class with a `type` discriminant (instead of 6 subclasses) is still a
// proper discriminated union in TypeScript — `switch (err.type)` narrows
// exactly the same way — with far less boilerplate for 6 near-identical shapes.
export type DomainErrorType =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unexpected";

export class DomainError extends Error {
  readonly type: DomainErrorType;
  readonly requestId?: string;

  constructor(type: DomainErrorType, message: string, requestId?: string) {
    super(message);
    this.name = "DomainError";
    this.type = type;
    this.requestId = requestId;
  }
}

// Story 5.2's status map, mirrored here so a status number never leaks past
// this function — everything downstream only ever sees `.type`.
function statusToType(status: number): DomainErrorType {
  switch (status) {
    case 400:
    case 422:
      return "validation";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "rate_limited";
    default:
      return "unexpected";
  }
}

// AC#2: the user sees a friendly message, never the server's raw one — except
// for "validation", where the server's message is usually the one actionable
// thing the user needs to read (e.g. "source_document_id is required").
function friendlyMessage(type: DomainErrorType, serverMessage: string): string {
  switch (type) {
    case "validation":
      return serverMessage || "Dados inválidos. Confira os campos e tente de novo.";
    case "unauthorized":
      return "Sua sessão expirou. Faça login novamente.";
    case "forbidden":
      return "Você não tem permissão para fazer isso.";
    case "not_found":
      return "Não encontrado — pode ter sido removido.";
    case "conflict":
      return "Este item foi alterado em outro lugar. Recarregue e tente de novo.";
    case "rate_limited":
      return "Muitas tentativas em pouco tempo. Aguarde um instante.";
    case "unexpected":
      return "Algo deu errado. Tente novamente.";
  }
}

export function domainErrorFromResponse(
  status: number,
  serverMessage: string,
  requestId?: string,
): DomainError {
  const type = statusToType(status);
  return new DomainError(type, friendlyMessage(type, serverMessage), requestId);
}

export function networkDomainError(message: string): DomainError {
  return new DomainError("unexpected", message);
}

// Story 5.2 AC#4 — what a screen should DO for each error type. Screens stay
// free to render their own copy/toast; this only encodes the *behavior*
// (redirect vs. just surface it) so that decision isn't reinvented per screen.
export function isSessionExpired(err: unknown): err is DomainError {
  return err instanceof DomainError && err.type === "unauthorized";
}
