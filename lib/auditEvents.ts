export type AuditSummaryEvent = {
  cycleId: string;
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  missingCount: number;
  damagedCount: number;
  updatedAt: string;
};

type Listener = (event: AuditSummaryEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeToAudit(cycleId: string, listener: Listener) {
  const cycleListeners = listeners.get(cycleId) ?? new Set<Listener>();
  cycleListeners.add(listener);
  listeners.set(cycleId, cycleListeners);

  return () => {
    cycleListeners.delete(listener);
    if (cycleListeners.size === 0) {
      listeners.delete(cycleId);
    }
  };
}

export function publishAuditSummary(event: AuditSummaryEvent) {
  const cycleListeners = listeners.get(event.cycleId);
  if (!cycleListeners) return;

  for (const listener of cycleListeners) {
    listener(event);
  }
}
