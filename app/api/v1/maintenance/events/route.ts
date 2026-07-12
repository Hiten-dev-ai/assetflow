import { subscribeToMaintenance, type MaintenanceStatusEvent } from "@/lib/maintenanceEvents";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function encode(event: MaintenanceStatusEvent) { return `event: maintenance-status\ndata: ${JSON.stringify(event)}\n\n`; }
export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeToMaintenance((event) => { try { controller.enqueue(encoder.encode(encode(event))); } catch { unsubscribe?.(); } });
      heartbeat = setInterval(() => { try { controller.enqueue(encoder.encode(": heartbeat\n\n")); } catch { if (heartbeat) clearInterval(heartbeat); unsubscribe?.(); } }, 25000);
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    cancel() { if (heartbeat) clearInterval(heartbeat); unsubscribe?.(); },
  });
  return new Response(stream, { headers: { "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "Content-Type": "text/event-stream; charset=utf-8" } });
}
