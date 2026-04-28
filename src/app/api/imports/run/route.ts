import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { importMembersStream, type ImportProgress } from "@/actions/imports";

export const runtime = "nodejs";
// Auth user creation can take a while for large rosters. Allow plenty of headroom.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Auth check up-front so we can fail fast before opening the stream.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const rows = (body as { rows?: unknown })?.rows;
  if (!Array.isArray(rows)) {
    return new Response("Expected { rows: [...] }", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const result = await importMembersStream(
          rows as { board_member_name: string; [key: string]: unknown }[],
          (progress: ImportProgress) => {
            send({ type: "progress", ...progress });
          }
        );
        send({ type: "done", ...result });
      } catch (err) {
        send({
          type: "fatal",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
