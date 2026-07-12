import { AuditStoreError, getAuditSummary } from "@/lib/auditStore";
import { subscribeToAudit, type AuditSummaryEvent } from "@/lib/auditEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cycleId: string }> };

function encodeEvent(event: AuditSummaryEvent) {
  return `event: audit-summary\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { cycleId } = await context.params;
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(encodeEvent(await getAuditSummary(cycleId))));
      } catch (error) {
        const status = error instanceof AuditStoreError ? error.status : 400;
        const message = error instanceof Error ? error.message : "Unable to subscribe to audit events.";
        controller.enqueue(encoder.encode(`event: audit-error\ndata: ${JSON.stringify({ status, error: message })}\n\n`));
        controller.close();
        return;
      }

      unsubscribe = subscribeToAudit(cycleId, (event) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
