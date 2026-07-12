import { transitionMaintenanceController } from "../features/maintenance/maintenanceController";
export { transitionMaintenanceController };

/** Framework-neutral route registration seam for an API adapter. */
export function registerMaintenanceRoutes(router: { post: (path: string, handler: typeof transitionMaintenanceController) => void }) {
  router.post("/maintenance/:id/transition", transitionMaintenanceController);
}
