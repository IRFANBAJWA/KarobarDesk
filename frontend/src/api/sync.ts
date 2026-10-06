import { api } from './client';
import type {
  ErpNextCredentials,
  SyncActivityRow,
  SyncResult,
  SyncStatusResponse,
  SyncStep,
  TestErpNextResponse,
} from '@/types/sync';

export async function getSyncStatus(): Promise<SyncStatusResponse> {
  const { data } = await api.get<SyncStatusResponse>('/sync/status');
  return data;
}

export async function getSyncActivity(): Promise<SyncActivityRow[]> {
  const { data } = await api.get<{ activity: SyncActivityRow[] }>('/sync/activity');
  return data.activity;
}

export async function testErpNextConnection(
  credentials: ErpNextCredentials,
): Promise<TestErpNextResponse> {
  const { data } = await api.post<TestErpNextResponse>('/sync/test', credentials);
  return data;
}

export async function runSyncStep(
  step: SyncStep,
  credentials: ErpNextCredentials,
): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>(`/sync/${step}`, credentials);
  return data;
}