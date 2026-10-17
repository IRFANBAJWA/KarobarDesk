import type { SyncStatus } from "@/components/badges/SyncStatusBadge";
export type { SyncStatus };

export interface PriceList {
  id: number;
  erpnext_name: string;
  name: string;
  is_selling: boolean;
  is_active: boolean;
  sync_status: SyncStatus | string | null;
  last_synced_at: string | null;
  erpnext_modified_at: string | null;

  item_prices_count?: number;
  till_operations_count?: number;

  created_at: string | null;
  updated_at: string | null;
}

export interface ListPriceListsResponse {
  data: PriceList[];
}

export interface ShowPriceListResponse {
  data: PriceList;
}