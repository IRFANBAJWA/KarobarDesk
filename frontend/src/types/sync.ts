// Ensure 'item_stocks' is in the list
export type SyncStep = 
  | 'companies' 
  | 'accounts' 
  | 'price_lists' 
  | 'items' 
  | 'item_prices' 
  | 'item_stocks' 
  | 'customers';

export interface SyncStepResult {
  step: string;
  status: 'ok' | 'failed';
  inserted?: number;
  updated?: number;
  error?: string;
  duration_ms?: number;
}