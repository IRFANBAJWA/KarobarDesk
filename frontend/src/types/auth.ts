export interface Company {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Role {
  name: string;
  label: string;
  is_super_admin?: boolean;
}

export interface Permission {
  module: string;
  action: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  is_super_admin?: boolean;
}

/** Shape returned by GET /api/me */
export interface MeResponse {
  user: User & { is_super_admin: boolean };
  roles: Role[];
  permissions: Permission[];
  active_company: Company | null;
}

/** Shape returned by POST /api/login with client_type: 'spa' */
export interface LoginSpaResponse {
  user: User;
  companies: Company[];
  roles: Role[];
}

/** Standard Laravel error body */
export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}