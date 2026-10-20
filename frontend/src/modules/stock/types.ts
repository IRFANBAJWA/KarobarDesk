export interface StockItem {
  id: number;
  item_name: string;
  erpnext_item_code: string;
  item_group: string | null;
}

export interface StockCompany {
  id: number;
  name: string;
}

export interface StockBalance {
  id: number;
  item_id: number;
  company: { id: number; name: string };
  item: { id: number; item_name: string; erpnext_item_code: string; };
  opening_qty: number;
  in_qty: number;
  out_qty: number;
  closing_qty: number;
}

export interface StockLedger {
  id: number;
  company_id: number;
  company: StockCompany;
  warehouse: string;
  item_id: number;
  item: StockItem;
  qty: string;
  balance_after: string;
  reference_type: string;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface PaginatedBalances {
  data: StockBalance[];
  meta: PaginationMeta;
}

export interface PaginatedLedger {
  data: StockLedger[];
  meta: PaginationMeta;
}

export interface WarehousesResponse {
  data: string[];
}