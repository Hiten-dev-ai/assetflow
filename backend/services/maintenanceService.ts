/** Backend-facing maintenance contract. Domain rules live in the shared service. */
export { MaintenanceRuleError, transitionMaintenance } from "../../features/maintenance/service";
export type { AssetStatus, EmployeeRole, MaintenanceAction, MaintenanceRequest, MaintenanceStatus, MaintenanceEffects } from "../../features/maintenance/service";
