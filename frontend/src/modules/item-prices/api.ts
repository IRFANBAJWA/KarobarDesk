import { apiFetch } from "@/lib/apiFetch";
import type {
  CreateItemPricePayload,
  CreateItemPriceResponse,
  ListItemPricesParams,
  ListItemPricesResponse,
  ShowItemPriceResponse,
  UpdateItemPricePayload,
  UpdateItemPriceResponse,
} from "./types";

function toQueryString(params: ListItemPricesParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, String(value));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export async function listItemPrices(
  params: ListItemPricesParams = {},
): Promise<ListItemPricesResponse> {
  return apiFetch<ListItemPricesResponse>(
    `/api/item-prices/admin${toQueryString(params)}`,
  );
}

export async function getItemPrice(
  id: number,
): Promise<ShowItemPriceResponse> {
  return apiFetch<ShowItemPriceResponse>(`/api/item-prices/${id}`);
}

export async function updateItemPrice(
  id: number,
  payload: UpdateItemPricePayload,
): Promise<UpdateItemPriceResponse> {
  return apiFetch<UpdateItemPriceResponse>(`/api/item-prices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createItemPrice(
  payload: CreateItemPricePayload,
): Promise<CreateItemPriceResponse> {
  return apiFetch<CreateItemPriceResponse>("/api/item-prices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}