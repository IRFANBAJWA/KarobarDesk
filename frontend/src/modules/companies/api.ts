import { apiFetch } from '@/lib/apiFetch';
import type {
  Company,
  ListCompaniesResponse,
  ToggleActiveResponse,
} from './types';

export async function listCompanies(): Promise<Company[]> {
  const res = await apiFetch<ListCompaniesResponse>('/api/companies/admin');
  return res.data;
}

export async function getCompany(id: number): Promise<Company> {
  const res = await apiFetch<{ data: Company }>(`/api/companies/${id}`);
  return res.data;
}

export async function toggleCompanyActive(id: number): Promise<ToggleActiveResponse> {
  return apiFetch<ToggleActiveResponse>(`/api/companies/${id}/toggle-active`, {
    method: 'PATCH',
  });
}