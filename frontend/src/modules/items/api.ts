import { apiFetch } from "@/lib/apiFetch";
import type {
  ListItemsResponse,
  ShowItemResponse,
  UpdateItemPayload,
  UpdateItemResponse,
} from "./types";

export async function listItems(): Promise<ListItemsResponse> {
  return apiFetch<ListItemsResponse>("/api/items/admin");
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