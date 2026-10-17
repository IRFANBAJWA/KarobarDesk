import type { SyncStatus } from "@/components/badges/SyncStatusBadge";
export type { SyncStatus };

export interface Item {
  id: number;
  erpnext_item_code: string;
  item_name: string;
  item_group: string | null;
  brand: string | null;
  uom: string | null;
  barcode: string | null;
  alias: string | null;
  description: string | null;
  weight: string | null;          // decimal cast → string
  weight_uom: string | null;
  cost_price: string | null;
  standard_rate: string | null;
  last_purchase_rate: string | null;
  average_rate: string | null;
  tax_rate: string | null;
  is_stock_item: boolean;
  is_taxable: boolean;
  is_active: boolean;
  has_variants: boolean;
  woocommerce_id: string | null;
  sync_status: SyncStatus | string | null;
  last_synced_at: string | null;
  erpnext_modified_at: string | null;

  // Counts — present on listAll + show responses
  item_prices_count?: number;
  item_stocks_count?: number;
  stock_ledgers_count?: number;
  sales_invoice_items_count?: number;
  purchase_order_items_count?: number;
  purchase_receipt_items_count?: number;
  company_item_statuses_count?: number;

  created_at: string | null;
  updated_at: string | null;
}

export interface ListItemsResponse {
  data: Item[];
}

export interface ShowItemResponse {
  data: Item;
}

export interface UpdateItemResponse {
  message: string;
  data: Item;
}

export interface UpdateItemPayload {
  item_name?: string;
  alias?: string | null;
  barcode?: string | null;
  description?: string | null;
  item_group?: string | null;
  brand?: string | null;
  weight?: number | null;
  weight_uom?: string | null;
  cost_price?: number | null;
  standard_rate?: number | null;
  tax_rate?: number | null;
  is_taxable?: boolean;
  is_active?: boolean;
}