import { transitionMaintenance, type EmployeeRole, type MaintenanceAction, type MaintenanceRequest, type AssetStatus } from "./maintenanceService";

export function transitionMaintenanceController(request: MaintenanceRequest, action: MaintenanceAction, actor: { id: number; role: EmployeeRole }, assetStatus: AssetStatus, technician?: string) {
  return transitionMaintenance(request, action, actor, { assetStatus, technician });
}
