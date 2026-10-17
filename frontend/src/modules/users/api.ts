import { apiFetch } from '@/lib/apiFetch';
import type {
  Company,
  CreateUserPayload,
  ListUsersParams,
  PaginatedUsers,
  Role,
  UpdateUserPayload,
  User,
} from './types';

const BASE = '/api';

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    usp.append(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function listUsers(params: ListUsersParams = {}): Promise<PaginatedUsers> {
  return apiFetch<PaginatedUsers>(`${BASE}/users${toQuery(params)}`);
}

export async function getUser(id: number): Promise<{ data: User }> {
  return apiFetch<{ data: User }>(`${BASE}/users/${id}`);
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<{ data: User; message: string }> {
  return apiFetch(`${BASE}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<{ data: User; message: string }> {
  return apiFetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deactivateUser(
  id: number,
): Promise<{ data: User; message: string }> {
  return apiFetch(`${BASE}/users/${id}/deactivate`, { method: 'POST' });
}

export async function activateUser(
  id: number,
): Promise<{ data: User; message: string }> {
  return apiFetch(`${BASE}/users/${id}/activate`, { method: 'POST' });
}

export async function listRoles(): Promise<{ data: Role[] }> {
  return apiFetch<{ data: Role[] }>(`${BASE}/roles`);
}

export async function listCompanies(): Promise<{ data: Company[] }> {
  return apiFetch<{ data: Company[] }>(`${BASE}/companies`);
}

export async function linkErpNext(
  id: number,
  payload: { erpnext_user: string; erpnext_password: string },
): Promise<{ data: User; message: string }> {
  return apiFetch(`/api/users/${id}/erpnext/link`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unlinkErpNext(id: number): Promise<{ message: string }> {
  return apiFetch(`/api/users/${id}/erpnext/unlink`, {
    method: 'DELETE',
  });
}