import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(),
  parentId: integer("parent_id"), headEmployeeId: integer("head_employee_id"), active: integer("active",{mode:"boolean"}).notNull().default(true),
});
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({autoIncrement:true}), name:text("name").notNull(), email:text("email").notNull(),
  departmentId:integer("department_id").references(()=>departments.id), role:text("role",{enum:["ADMIN","ASSET_MANAGER","DEPARTMENT_HEAD","EMPLOYEE"]}).notNull().default("EMPLOYEE"),
  status:text("status",{enum:["ACTIVE","INACTIVE"]}).notNull().default("ACTIVE"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[uniqueIndex("employees_email_unique").on(table.email)]);
export const assetCategories = sqliteTable("asset_categories", {
  id:integer("id").primaryKey({autoIncrement:true}), name:text("name").notNull(), customFields:text("custom_fields",{mode:"json"}), active:integer("active",{mode:"boolean"}).notNull().default(true),
});
export const assets = sqliteTable("assets", {
  id:integer("id").primaryKey({autoIncrement:true}), tag:text("tag").notNull(), name:text("name").notNull(), categoryId:integer("category_id").notNull().references(()=>assetCategories.id),
  serialNumber:text("serial_number"), acquisitionDate:integer("acquisition_date",{mode:"timestamp"}), acquisitionCost:real("acquisition_cost"), condition:text("condition").notNull().default("Good"), location:text("location"),
  status:text("status",{enum:["AVAILABLE","ALLOCATED","RESERVED","UNDER_MAINTENANCE","LOST","RETIRED","DISPOSED"]}).notNull().default("AVAILABLE"), shared:integer("shared",{mode:"boolean"}).notNull().default(false), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
}, table=>[uniqueIndex("assets_tag_unique").on(table.tag)]);
export const allocations = sqliteTable("allocations", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), employeeId:integer("employee_id").references(()=>employees.id), departmentId:integer("department_id").references(()=>departments.id),
  expectedReturnAt:integer("expected_return_at",{mode:"timestamp"}), returnedAt:integer("returned_at",{mode:"timestamp"}), checkInNotes:text("check_in_notes"), status:text("status",{enum:["ACTIVE","RETURNED","TRANSFERRED"]}).notNull().default("ACTIVE"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
export const bookings = sqliteTable("bookings", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), employeeId:integer("employee_id").notNull().references(()=>employees.id), startAt:integer("start_at",{mode:"timestamp"}).notNull(), endAt:integer("end_at",{mode:"timestamp"}).notNull(), purpose:text("purpose"), status:text("status",{enum:["UPCOMING","ONGOING","COMPLETED","CANCELLED"]}).notNull().default("UPCOMING"),
});
export const maintenanceRequests = sqliteTable("maintenance_requests", {
  id:integer("id").primaryKey({autoIncrement:true}), assetId:integer("asset_id").notNull().references(()=>assets.id), requestedBy:integer("requested_by").notNull().references(()=>employees.id), description:text("description").notNull(), priority:text("priority",{enum:["LOW","MEDIUM","HIGH","CRITICAL"]}).notNull().default("MEDIUM"), status:text("status",{enum:["PENDING","APPROVED","REJECTED","TECHNICIAN_ASSIGNED","IN_PROGRESS","RESOLVED"]}).notNull().default("PENDING"), technician:text("technician"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(), resolvedAt:integer("resolved_at",{mode:"timestamp"}),
});
export const notifications = sqliteTable("notifications", {
  id:integer("id").primaryKey({autoIncrement:true}), employeeId:integer("employee_id").notNull().references(()=>employees.id), type:text("type").notNull(), title:text("title").notNull(), body:text("body"), readAt:integer("read_at",{mode:"timestamp"}), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
export const activityLogs = sqliteTable("activity_logs", {
  id:integer("id").primaryKey({autoIncrement:true}), actorId:integer("actor_id").references(()=>employees.id), action:text("action").notNull(), entityType:text("entity_type").notNull(), entityId:text("entity_id").notNull(), metadata:text("metadata",{mode:"json"}), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
