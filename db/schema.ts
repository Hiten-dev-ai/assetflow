import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), code:text("code"), notes:text("notes"),
  parentId: integer("parent_id"), headEmployeeId: integer("head_employee_id"), active: integer("active",{mode:"boolean"}).notNull().default(true),
});
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({autoIncrement:true}), name:text("name").notNull(), email:text("email").notNull(), employeeId:text("employee_id"), jobTitle:text("job_title"), phone:text("phone"), location:text("location"),
  departmentId:integer("department_id").references(()=>departments.id), role:text("role",{enum:["ADMIN","ASSET_MANAGER","DEPARTMENT_HEAD","EMPLOYEE","TECHNICIAN"]}).notNull().default("EMPLOYEE"),
  status:text("status",{enum:["ACTIVE","INACTIVE"]}).notNull().default("ACTIVE"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[uniqueIndex("employees_email_unique").on(table.email)]);
export const assetCategories = sqliteTable("asset_categories", {
  id:integer("id").primaryKey({autoIncrement:true}), name:text("name").notNull(), code:text("code"), description:text("description"), usefulLife:text("useful_life"), requiresSerial:integer("requires_serial",{mode:"boolean"}).notNull().default(true), trackWarranty:integer("track_warranty",{mode:"boolean"}).notNull().default(false), customFields:text("custom_fields",{mode:"json"}), active:integer("active",{mode:"boolean"}).notNull().default(true),
});
export const assets = sqliteTable("assets", {
  id:integer("id").primaryKey({autoIncrement:true}), tag:text("tag").notNull(), name:text("name").notNull(), categoryId:integer("category_id").notNull().references(()=>assetCategories.id),
  serialNumber:text("serial_number"), acquisitionDate:integer("acquisition_date",{mode:"timestamp"}), acquisitionCost:real("acquisition_cost"), condition:text("condition").notNull().default("Good"), location:text("location"),
  status:text("status",{enum:["AVAILABLE","ALLOCATED","RESERVED","UNDER_MAINTENANCE","LOST","RETIRED","DISPOSED"]}).notNull().default("AVAILABLE"), shared:integer("shared",{mode:"boolean"}).notNull().default(false), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[uniqueIndex("assets_tag_unique").on(table.tag), index("assets_location_idx").on(table.location)]);
export const assetProfiles = sqliteTable("asset_profiles", {
  assetId:integer("asset_id").primaryKey().references(()=>assets.id), department:text("department").notNull(), qrCode:text("qr_code").notNull(), notes:text("notes").notNull(),
  lastUpdated:text("last_updated").notNull(), recentActivity:text("recent_activity").notNull(), allocationHistory:text("allocation_history").notNull().default("[]"), maintenanceHistory:text("maintenance_history").notNull().default("[]"),
}, table=>[index("asset_profiles_department_idx").on(table.department)]);
export const allocations = sqliteTable("allocations", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), employeeId:integer("employee_id").references(()=>employees.id), departmentId:integer("department_id").references(()=>departments.id),
  expectedReturnAt:integer("expected_return_at",{mode:"timestamp"}), returnedAt:integer("returned_at",{mode:"timestamp"}), checkInNotes:text("check_in_notes"), requestedToEmployeeId:integer("requested_to_employee_id").references(()=>employees.id),
  reason:text("reason"), conditionOut:text("condition_out"), conditionIn:text("condition_in"), notes:text("notes"), status:text("status",{enum:["ACTIVE","RETURNED","TRANSFERRED","TRANSFER_PENDING"]}).notNull().default("ACTIVE"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
export const bookings = sqliteTable("bookings", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), employeeId:integer("employee_id").notNull().references(()=>employees.id), startAt:integer("start_at",{mode:"timestamp"}).notNull(), endAt:integer("end_at",{mode:"timestamp"}).notNull(), purpose:text("purpose"), status:text("status",{enum:["UPCOMING","ONGOING","COMPLETED","CANCELLED"]}).notNull().default("UPCOMING"), createdAt:integer("created_at",{mode:"timestamp"}),
});
export const maintenanceRequests = sqliteTable("maintenance_requests", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), requestedBy:integer("requested_by").notNull().references(()=>employees.id), description:text("description").notNull(), priority:text("priority",{enum:["LOW","MEDIUM","HIGH","CRITICAL"]}).notNull().default("MEDIUM"), status:text("status",{enum:["PENDING","APPROVED","REJECTED","TECHNICIAN_ASSIGNED","IN_PROGRESS","RESOLVED"]}).notNull().default("PENDING"), technician:text("technician"), attachmentName:text("attachment_name"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(), updatedAt:integer("updated_at",{mode:"timestamp"}), resolvedAt:integer("resolved_at",{mode:"timestamp"}),
}, table=>[
  index("maintenance_requests_status_idx").on(table.status),
  index("maintenance_requests_asset_status_idx").on(table.assetId, table.status),
]);
export const notifications = sqliteTable("notifications", {
  id:integer("id").primaryKey({autoIncrement:true}), employeeId:integer("employee_id").notNull().references(()=>employees.id), type:text("type").notNull(), title:text("title").notNull(), body:text("body"), readAt:integer("read_at",{mode:"timestamp"}), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
export const activityLogs = sqliteTable("activity_logs", {
  id:integer("id").primaryKey({autoIncrement:true}), actorId:integer("actor_id").references(()=>employees.id), action:text("action").notNull(), entityType:text("entity_type").notNull(), entityId:text("entity_id").notNull(), metadata:text("metadata",{mode:"json"}),
  kind:text("kind"), title:text("title"), description:text("description"), target:text("target"), severity:text("severity"), status:text("status"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});

export const users = sqliteTable("users", {
  id:text("id").primaryKey(),
  employeeId:integer("employee_id").notNull().references(()=>employees.id),
  email:text("email").notNull(),
  passwordHash:text("password_hash").notNull(),
  createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[uniqueIndex("users_email_unique").on(table.email)]);

export const sessions = sqliteTable("sessions", {
  id:text("id").primaryKey(),
  userId:text("user_id").notNull().references(()=>users.id),
  createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
  expiresAt:integer("expires_at",{mode:"timestamp"}).notNull(),
});

export const transferRequests = sqliteTable("transfer_requests", {
  id:text("id").primaryKey(),
  allocationId:integer("allocation_id").notNull().references(()=>allocations.id),
  assetId:integer("asset_id").notNull().references(()=>assets.id),
  fromEmployeeId:integer("from_employee_id").notNull().references(()=>employees.id),
  toEmployeeId:integer("to_employee_id").notNull().references(()=>employees.id),
  reason:text("reason").notNull(),
  status:text("status",{enum:["REQUESTED","APPROVED","REJECTED"]}).notNull().default("REQUESTED"),
  requestedAt:integer("requested_at",{mode:"timestamp"}).notNull(),
  decidedAt:integer("decided_at",{mode:"timestamp"}),
  decidedBy:integer("decided_by").references(()=>employees.id),
});
export const maintenanceAssignments = sqliteTable("maintenance_assignments", {
  id:integer("id").primaryKey({autoIncrement:true}), requestId:integer("request_id").notNull().references(()=>maintenanceRequests.id),
  technicianId:text("technician_id").notNull(), technicianName:text("technician_name").notNull(), assignedBy:text("assigned_by").notNull(),
  assignedAt:integer("assigned_at",{mode:"timestamp"}).notNull(), estimatedCompletionAt:integer("estimated_completion_at",{mode:"timestamp"}),
}, table=>[
  index("maintenance_assignments_request_idx").on(table.requestId),
  index("maintenance_assignments_technician_idx").on(table.technicianId),
]);
export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id:integer("id").primaryKey({autoIncrement:true}), requestId:integer("request_id").notNull().references(()=>maintenanceRequests.id),
  assetId:integer("asset_id").notNull().references(()=>assets.id), actorId:text("actor_id").notNull(),
  fromStatus:text("from_status"), toStatus:text("to_status").notNull(), notes:text("notes"), cost:real("cost"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[
  index("maintenance_logs_request_idx").on(table.requestId, table.createdAt),
  index("maintenance_logs_asset_idx").on(table.assetId, table.createdAt),
]);

export const auditCycles = sqliteTable("audit_cycles", {
  id:text("id").primaryKey(),
  departmentId:text("department_id"),
  locationId:text("location_id"),
  status:text("status",{enum:["DRAFT","ACTIVE","CLOSED"]}).notNull().default("ACTIVE"),
  startedAt:integer("started_at",{mode:"timestamp"}).notNull(), startDate:integer("start_date",{mode:"timestamp"}).notNull(), endDate:integer("end_date",{mode:"timestamp"}).notNull(), extensionGrantedAt:integer("extension_granted_at",{mode:"timestamp"}), extensionGrantedBy:text("extension_granted_by"),
  closedAt:integer("closed_at",{mode:"timestamp"}),
  createdBy:text("created_by").notNull(),
}, table=>[index("audit_cycles_scope_status_idx").on(table.departmentId, table.locationId, table.status)]);

export const auditAssignments = sqliteTable("audit_assignments", {
  id:text("id").primaryKey(),
  auditCycleId:text("audit_cycle_id").notNull().references(()=>auditCycles.id),
  employeeId:text("employee_id").notNull(),
}, table=>[index("audit_assignments_cycle_idx").on(table.auditCycleId)]);

export const auditItems = sqliteTable("audit_items", {
  id:text("id").primaryKey(),
  auditCycleId:text("audit_cycle_id").notNull().references(()=>auditCycles.id),
  assetId:integer("asset_id").notNull().references(()=>assets.id),
  expectedLocation:text("expected_location").notNull(),
  verificationStatus:text("verification_status",{enum:["PENDING","VERIFIED","MISSING","DAMAGED"]}).notNull().default("PENDING"),
  verifiedBy:text("verified_by"),
  updatedAt:integer("updated_at",{mode:"timestamp"}).notNull(),
}, table=>[
  index("audit_items_cycle_status_idx").on(table.auditCycleId, table.verificationStatus),
  uniqueIndex("audit_items_cycle_asset_unique").on(table.auditCycleId, table.assetId),
]);
export const discrepancyReports = sqliteTable("discrepancy_reports", {
  id:text("id").primaryKey(), auditCycleId:text("audit_cycle_id").notNull().references(()=>auditCycles.id), generatedBy:text("generated_by").notNull(), generatedAt:integer("generated_at",{mode:"timestamp"}).notNull(),
  missingCount:integer("missing_count").notNull(), damagedCount:integer("damaged_count").notNull(), itemsSnapshot:text("items_snapshot",{mode:"json"}).notNull(), resolutionActions:text("resolution_actions",{mode:"json"}).notNull().default("[]"),
}, table=>[
  uniqueIndex("discrepancy_reports_cycle_unique").on(table.auditCycleId),
  index("discrepancy_reports_generated_idx").on(table.generatedAt),
]);
