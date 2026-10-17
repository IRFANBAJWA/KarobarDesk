import { apiFetch } from "@/lib/apiFetch";
import type {
  ListPriceListsResponse,
  ShowPriceListResponse,
} from "./types";

export async function listPriceLists(): Promise<ListPriceListsResponse> {
  return apiFetch<ListPriceListsResponse>("/api/price-lists/admin");
}

export async function getPriceList(id: number): Promise<ShowPriceListResponse> {
  return apiFetch<ShowPriceListResponse>(`/api/price-lists/${id}`);
}