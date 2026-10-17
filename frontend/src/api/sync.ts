import { api } from './client';
import type {
  ErpNextCredentials,
  ErpNextLoginResponse,
  SyncActivityRow,
  SyncResult,
  SyncStatusResponse,
  SyncStep,
} from '@/types/sync';

export async function getSyncStatus(): Promise<SyncStatusResponse> {
  const { data } = await api.get<SyncStatusResponse>('/sync/status');
  return data;
}

export async function getSyncActivity(): Promise<SyncActivityRow[]> {
  const { data } = await api.get<{ activity: SyncActivityRow[] }>(
    '/sync/activity',
  );
  return data.activity;
}

export async function loginToErpNext(
  credentials: ErpNextCredentials,
): Promise<ErpNextLoginResponse> {
  const { data } = await api.post<ErpNextLoginResponse>(
    '/sync/login',
    credentials,
  );
  return data;
}

export async function syncStep(
  step: SyncStep,
  token: string,
): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>(
    `/sync/${step}`,
    {},
    {
      headers: {
        'X-ERPNext-Token': token,
      },
    },
  );
  return data;
}