import {
  Building2,
  DollarSign,
  Package,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SyncStep } from '@/types/sync';

export interface SyncStepMeta {
  step: SyncStep;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SYNC_STEPS: SyncStepMeta[] = [
  {
    step: 'companies',
    label: 'Companies',
    description: 'Pull all companies from ERPNext',
    icon: Building2,
  },
  {
    step: 'accounts',
    label: 'Accounts',
    description: 'Cash / Bank / Expense accounts',
    icon: Wallet,
  },
  {
    step: 'price_lists',
    label: 'Price Lists',
    description: 'Selling price lists only',
    icon: DollarSign,
  },
  {
    step: 'items',
    label: 'Items',
    description: 'Full item catalog from ERPNext',
    icon: Package,
  },
  {
    step: 'item_prices',
    label: 'Item Prices',
    description: 'Selling rates from each price list',
    icon: Tags,
  },
  {
    step: 'customers',
    label: 'Customers',
    description: 'Customer master records',
    icon: Users,
  },
];