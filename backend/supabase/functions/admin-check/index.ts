import { requireAdmin } from "../_shared/adminAuth.ts";
import { corsHeaders, HttpError, jsonResponse } from "../_shared/errors.ts";

type AdminCheckResponse = {
  isAdmin: true;
  address: string;
};

Deno.serve((request: Request): Response => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const admin = requireAdmin(request);
    const body: AdminCheckResponse = {
      isAdmin: true,
      address: admin.address,
    };
    return jsonResponse(body, { status: 200, headers: corsHeaders });
  } catch (error) {
    return handleError(error);
  }
});

function handleError(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.code, message: error.message },
      {
        status: error.status,
        headers: corsHeaders,
      },
    );
  }

  console.error("[admin-check] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}
