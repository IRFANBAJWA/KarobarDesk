import { apiFetch } from "@/lib/apiFetch";
import type { DashboardData } from "./types";

export async function getDashboardData() {
    return apiFetch<DashboardData>("/api/dashboard");
}