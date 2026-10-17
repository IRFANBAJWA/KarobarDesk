import { apiFetch } from "@/lib/apiFetch";
import type {
  ListCustomersParams,
  ListCustomersResponse,
  PaginatedCustomersResponse,
  ShowCustomerResponse,
  UpdateCustomerPayload,
  UpdateCustomerResponse,
} from "./types";

export async function listCustomers(
  params: ListCustomersParams = {},
): Promise<PaginatedCustomersResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  });
  const queryString = qs.toString();
  return apiFetch<PaginatedCustomersResponse>(
    `/api/customers/admin${queryString ? `?${queryString}` : ""}`
  );
}

export async function getCustomer(id: number): Promise<ShowCustomerResponse> {
  return apiFetch<ShowCustomerResponse>(`/api/customers/${id}`);
}
export async function updateCustomer(
  id: number,
  payload: UpdateCustomerPayload,
): Promise<UpdateCustomerResponse> {
  return apiFetch<UpdateCustomerResponse>(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}