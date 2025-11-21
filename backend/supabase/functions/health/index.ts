import { StatusCodes } from "std/http/status.ts";
import { TOTAL_CELLS } from "@pck/shared";
import { corsHeaders } from "../_shared/errors.ts";

type HealthResponse = {
  status: "ok";
  timestamp: string;
  totalCells: number;
};

Deno.serve((_request: Request): Response => {
  const body: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    totalCells: TOTAL_CELLS,
  };

  return new Response(JSON.stringify(body), {
    status: StatusCodes.OK,
    headers: corsHeaders,
  });
});
