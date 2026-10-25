import { apiFetch } from "@/lib/apiFetch";
import type { Till, TillAccountData } from "./types";

export async function listTills(): Promise<{ data: Till[] }> {
  return apiFetch("/api/till-accounts/tills");
}

export async function getTillAccounts(userId: number): Promise<{ data: TillAccountData }> {
  return apiFetch(`/api/till-accounts/${userId}`);
}

export async function updateTillAccounts(
  userId: number,
  accountIds: number[],
  defaultAccountId: number | null
): Promise<any> {
  return apiFetch(`/api/till-accounts/${userId}`, {
    method: "POST",
    body: JSON.stringify({
      account_ids: accountIds,
      default_account_id: defaultAccountId,
    }),
  });
}