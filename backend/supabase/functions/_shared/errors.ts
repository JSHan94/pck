export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const unauthorized = (message = "Unauthorized"): HttpError =>
  new HttpError(401, message, "UNAUTHORIZED");

export const forbidden = (message = "Forbidden"): HttpError =>
  new HttpError(403, message, "FORBIDDEN");

export const badRequest = (message = "Bad Request"): HttpError =>
  new HttpError(400, message, "BAD_REQUEST");

export const corsHeaders: HeadersInit = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-address",
};

export const jsonResponse = <T>(
  data: T,
  init?: ResponseInit,
): Response =>
  new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
    ...init,
  });
