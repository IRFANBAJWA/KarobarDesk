export type SyncStep =
  | 'companies'
  | 'accounts'
  | 'price_lists'
  | 'items'
  | 'item_prices'
  | 'customers';

export interface SyncStatusRow {
  step: SyncStep;
  count: number;
}

export interface SyncStatusResponse {
  steps: SyncStatusRow[];
}

export interface SyncResult {
  step: SyncStep;
  status: 'ok' | 'failed';
  inserted?: number;
  updated?: number;
  error?: string;
  duration_ms?: number;
}

export interface SyncActivityRow {
  id: number;
  doctype: string;
  status: string;
  error: string | null;
  created_at: string;
}

export interface TestErpNextResponse {
  ok: boolean;
  user?: string;
  error?: string;
}

export interface ErpNextCredentials {
    username: '',
  password: '',
}