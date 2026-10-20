import { apiFetch } from "@/lib/apiFetch";
import type {
  PaginatedBalances,
  PaginatedLedger,
  WarehousesResponse,
} from "./types";

export interface StockParams {
  page?: number;
  search?: string;
  company_id?: number;
  date_from?: string;
  date_to?: string;
  hide_zero?: boolean;
}
export interface CompanyOption {
  id: number;
  name: string;
}

export async function listStockCompanies(): Promise<{ data: CompanyOption[] }> {
  return apiFetch("/api/stock/companies");
}
function buildQueryString(params: StockParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listWarehouses(): Promise<WarehousesResponse> {
  return apiFetch<WarehousesResponse>("/api/stock/warehouses");
}

export async function listStockBalances(
  params: StockParams = {},
): Promise<PaginatedBalances> {
  return apiFetch<PaginatedBalances>(
    `/api/stock/balances${buildQueryString(params)}`,
  );
}

export async function listStockLedger(
  itemId: number,
  params: StockParams = {},
): Promise<PaginatedLedger> {
  return apiFetch<PaginatedLedger>(
    `/api/stock/ledger/${itemId}${buildQueryString(params)}`,
  );
}