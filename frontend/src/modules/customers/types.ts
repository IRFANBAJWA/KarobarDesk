import type { SyncStatus } from "@/components/badges/SyncStatusBadge";
export type { SyncStatus };

export interface Customer {
  id: number;
  erpnext_customer: string;
  customer_name: string;
  customer_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  credit_limit: string | null;
  current_balance: string | null;
  tax_number: string | null;

  loyalty_card_number: string | null;
  loyalty_member: boolean;
  special_discount: string | null;
  loyalty_points: string | null;
  loyalty_program: string | null;
  loyalty_expiry: string | null;

  is_active: boolean;
  sync_status: SyncStatus | string | null;
  last_synced_at: string | null;
  erpnext_modified_at: string | null;

  sales_invoices_count?: number;
  rejected_sales_count?: number;

  created_at: string | null;
  updated_at: string | null;
}

export interface ListCustomersResponse {
  data: Customer[];
}

export interface ShowCustomerResponse {
  data: Customer;
}

export interface UpdateCustomerResponse {
  message: string;
  data: Customer;
}

export interface UpdateCustomerPayload {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  tax_number?: string | null;
  is_active?: boolean;
}

export interface PaginatedCustomersResponse {
  data: Customer[];
  meta: { current_page: number; last_page: number; total: number; };
}

export interface ListCustomersParams {
  page?: number;
  search?: string;
  is_active?: boolean;
}