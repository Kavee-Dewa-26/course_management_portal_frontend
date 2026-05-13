import { getIdToken } from "@/infrastructure/firebase/getToken";

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string[]>;
  requestId?: string;
}

export class ApiRequestError extends Error implements ApiError {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  requestId?: string;

  constructor(err: ApiError) {
    super(err.message);
    this.code = err.code;
    this.status = err.status;
    this.details = err.details;
    this.requestId = err.requestId;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean; // default true — attach Bearer token
};

/**
 * Base API request helper.
 * - Prepends API prefix
 * - Attaches Authorization: Bearer <id-token> by default
 * - Serialises JSON body
 * - Throws ApiRequestError on non-2xx with the parsed error envelope
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await getIdToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => ({}))) as
    | { error?: { code?: string; message?: string; details?: Record<string, string[]> }; requestId?: string }
    | T;

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: Record<string, string[]> }; requestId?: string }).error;
    throw new ApiRequestError({
      code: err?.code ?? "UNKNOWN_ERROR",
      message: err?.message ?? `Request failed with status ${res.status}`,
      status: res.status,
      details: err?.details,
      requestId: (json as { requestId?: string }).requestId,
    });
  }

  return json as T;
}
