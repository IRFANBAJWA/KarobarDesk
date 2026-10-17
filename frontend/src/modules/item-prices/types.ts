import type { SyncStatus } from "@/components/badges/SyncStatusBadge";
export type { SyncStatus };

export interface ItemPrice {
  id: number;
  price_list_id: number;
  item_id: number;
  rate: string;              // decimal cast → string
  pack_rate: string | null;
  is_active: boolean;
  sync_status: SyncStatus | string | null;
  last_synced_at: string | null;
  erpnext_modified_at: string | null;

  // Flattened relation fields (present when priceList + item are loaded)
  price_list_name?: string;
  price_list_erpnext_name?: string;
  price_list_is_selling?: boolean;
  item_name?: string;
  item_code?: string;
  item_group?: string | null;
  item_uom?: string | null;

  created_at: string | null;
  updated_at: string | null;
}

export interface ListItemPricesMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface ListItemPricesResponse {
  data: ItemPrice[];
  meta: ListItemPricesMeta;
}

export interface ShowItemPriceResponse {
  data: ItemPrice;
}

export interface UpdateItemPriceResponse {
  message: string;
  data: ItemPrice;
}

export interface CreateItemPriceResponse {
  message: string;
  data: ItemPrice;
}

export interface UpdateItemPricePayload {
  rate?: number;
  pack_rate?: number | null;
  is_active?: boolean;
}

export interface CreateItemPricePayload {
  price_list_id: number;
  item_id: number;
  rate: number;
  pack_rate?: number | null;
  is_active?: boolean;
}

export interface ListItemPricesParams {
  price_list_id?: number;
  item_id?: number;
  item_group?: string;
  search?: string;
  is_active?: boolean;
  sync_status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}