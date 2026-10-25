export interface Till {
  id: number;
  name: string;
  till_no: string | null;
  shop_name: string | null;
}

// Keep the rest the same
export interface Account {
  id: number;
  name: string;
  erpnext_account: string | null;
  account_type: string;
  company: { id: number; name: string };
}

export interface TillAccountData {
  user: { id: number; name: string; company_id: number }; // <--- ADDED company_id
  till: { id: number; till_no: string; shop_name: string | null };
  accounts: Account[];
  linked_account_ids: number[];
  default_account_id: number | null;
}