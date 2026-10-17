import type { SyncStatus } from "@/components/badges/SyncStatusBadge";
export type { SyncStatus };

export interface Company {
  id: number;
  name: string;
  code: string;
  erpnext_company: string | null;
  is_active: boolean;
  sync_status: SyncStatus | string | null;
  last_synced_at: string | null;       // ISO 8601
  erpnext_modified_at: string | null;  // ISO 8601
  users_count: number;
  accounts_count: number;
  till_operations_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ListCompaniesResponse {
  data: Company[];
}

export interface ToggleActiveResponse {
  message: string;
  data: Company;
}