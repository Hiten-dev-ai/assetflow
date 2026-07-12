# AssetFlow backend

Service contracts are exposed from `backend/services`. They are intentionally UI-independent and can be called by API routes, server actions, or a database adapter. The shared schema in `db/schema.ts` remains the source of truth for table and field names.
