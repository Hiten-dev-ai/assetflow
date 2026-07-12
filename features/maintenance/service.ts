export type EmployeeRole = "ADMIN" | "ASSET_MANAGER" | "DEPARTMENT_HEAD" | "EMPLOYEE";
export type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
export type AssetStatus = "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";
export type MaintenanceAction = "APPROVE" | "REJECT" | "ASSIGN_TECHNICIAN" | "START_WORK" | "RESOLVE";

export type MaintenanceRequest = {
  id: number;
  assetId: number;
  requestedBy: number;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: MaintenanceStatus;
  technician?: string;
  createdAt: Date;
  resolvedAt?: Date;
};

export type MaintenanceEffects = {
  request: MaintenanceRequest;
  assetStatus?: AssetStatus;
  notification: { employeeId: number; type: string; title: string; body: string };
  activityLog: { actorId: number; action: string; entityType: "maintenance_request"; entityId: string; metadata: Record<string, unknown> };
};

export class MaintenanceRuleError extends Error {}

const transitions: Record<MaintenanceAction, [MaintenanceStatus, MaintenanceStatus]> = {
  APPROVE: ["PENDING", "APPROVED"],
  REJECT: ["PENDING", "REJECTED"],
  ASSIGN_TECHNICIAN: ["APPROVED", "TECHNICIAN_ASSIGNED"],
  START_WORK: ["TECHNICIAN_ASSIGNED", "IN_PROGRESS"],
  RESOLVE: ["IN_PROGRESS", "RESOLVED"],
};

export function transitionMaintenance(
  request: MaintenanceRequest,
  action: MaintenanceAction,
  actor: { id: number; role: EmployeeRole },
  options: { technician?: string; assetStatus: AssetStatus; now?: Date },
): MaintenanceEffects {
  if ((action === "APPROVE" || action === "REJECT") && actor.role !== "ASSET_MANAGER") {
    throw new MaintenanceRuleError("Only Asset Managers can approve or reject maintenance.");
  }
  const [from, to] = transitions[action];
  if (request.status !== from) throw new MaintenanceRuleError(`${action} requires status ${from}.`);
  if (action === "ASSIGN_TECHNICIAN" && !options.technician?.trim()) {
    throw new MaintenanceRuleError("A technician is required.");
  }
  const now = options.now ?? new Date();
  const updated = {
    ...request,
    status: to,
    ...(action === "ASSIGN_TECHNICIAN" ? { technician: options.technician!.trim() } : {}),
    ...(action === "RESOLVE" ? { resolvedAt: now } : {}),
  };
  let assetStatus: AssetStatus | undefined;
  if (action === "APPROVE") assetStatus = "UNDER_MAINTENANCE";
  if (action === "RESOLVE") {
    const terminal = ["LOST", "RETIRED", "DISPOSED"].includes(options.assetStatus);
    assetStatus = terminal ? options.assetStatus : "AVAILABLE";
  }
  return {
    request: updated,
    assetStatus,
    notification: {
      employeeId: request.requestedBy,
      type: `MAINTENANCE_${to}`,
      title: `Maintenance request ${to.toLowerCase().replaceAll("_", " ")}`,
      body: `Request #${request.id} moved from ${from} to ${to}.`,
    },
    activityLog: {
      actorId: actor.id,
      action: `maintenance.${action.toLowerCase()}`,
      entityType: "maintenance_request",
      entityId: String(request.id),
      metadata: { from, to, assetId: request.assetId },
    },
  };
}
