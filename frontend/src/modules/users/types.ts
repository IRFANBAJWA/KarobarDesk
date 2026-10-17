export interface Role {
  id: number;
  name: string;
  label: string;
  description?: string | null;
  is_system?: boolean;
  is_super_admin?: boolean;
  is_active?: boolean;
}

export interface Company {
  id: number;
  name: string;
  code: string;
  erpnext_company?: string | null;
  is_active: boolean;
}

export interface TillOperationAccount {
  id: number;
  erpnext_account: string;
  name: string;
  account_type?: string | null;
  is_default: boolean;
}

export interface TillOperation {
  id: number;
  erpnext_name: string | null;
  till_no: number | null;
  shop_name: string | null;
  shop_code: string | null;
  warehouse: string | null;
  price_list: string | null;
  erpnext_role: string | null;
  is_online?: boolean;
  allow_rate?: boolean;
  return_pin_set?: boolean;
  is_active?: boolean;
  accounts?: TillOperationAccount[];
}

export interface ErpNextLink {
  user: string | null;
  linked: boolean;
  last_tested_at: string | null;
  last_error: string | null;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  company?: Company | null;
  companies?: Company[];
  roles?: Role[];
  erpnext?: ErpNextLink;
  till_operation?: TillOperation | null;
}

export interface PaginatedUsers {
  current_page: number;
  data: User[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ListUsersParams {
  search?: string;
  is_active?: boolean;
  company_id?: number;
  role?: string;
  erpnext?: 'linked' | 'unlinked';
  page?: number;
  per_page?: number;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  company_id: number;
  company_access?: number[];
  roles?: string[];
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  company_id: number;
  company_access?: number[];
  roles?: string[];
  is_active?: boolean;
}

export interface LinkErpNextPayload {
  erpnext_user: string;
  erpnext_password: string;
}