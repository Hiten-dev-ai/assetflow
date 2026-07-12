export type MaintenanceStatusEvent = {
  requestId: number;
  assetId: number;
  oldStatus: string;
  newStatus: string;
  actorId: string;
  updatedAt: string;
};

type Listener = (event: MaintenanceStatusEvent) => void;
const listeners = new Set<Listener>();

export function subscribeToMaintenance(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishMaintenanceStatus(event: MaintenanceStatusEvent) {
  for (const listener of listeners) listener(event);
}
