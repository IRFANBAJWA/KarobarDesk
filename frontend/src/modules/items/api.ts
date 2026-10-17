import { apiFetch } from "@/lib/apiFetch";
import type {
  PaginatedItemsResponse,
  ShowItemResponse,
  UpdateItemPayload,
  UpdateItemResponse,
} from "./types";

export interface ListItemsParams {
  page?: number;
  search?: string;
  item_group?: string;
  is_active?: boolean;
  sync_status?: string;
  hide_internal?: boolean;
}

export async function listItems(
  params: ListItemsParams = {},
): Promise<PaginatedItemsResponse> {
  const qs = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  });

  const queryString = qs.toString();
  return apiFetch<PaginatedItemsResponse>(
    `/api/items/admin${queryString ? `?${queryString}` : ""}`
  );
}

export async function getItem(id: number): Promise<ShowItemResponse> {
  return apiFetch<ShowItemResponse>(`/api/items/${id}`);
}

export async function updateItem(
  id: number,
  payload: UpdateItemPayload,
): Promise<UpdateItemResponse> {
  return apiFetch<UpdateItemResponse>(`/api/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// --- THE MISSING EXPORT IS HERE ---
export interface PickerItem {
  id: number;
  item_name: string;
  item_code: string;
  item_group: string | null;
  is_active: boolean;
}

export interface PickerItemsResponse {
  data: PickerItem[];
}

export async function pickerAllItems(): Promise<PickerItemsResponse> {
  return apiFetch<PickerItemsResponse>("/api/items/picker");
}