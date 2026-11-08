import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Setup from "@/pages/Setup";
import Users from "@/pages/Users";
import Companies from "@/pages/Companies";
import Items from "@/pages/Items";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PriceLists from "@/pages/PriceLists";
import ItemPrices from "@/pages/ItemPrices";
import Customers from "@/pages/Customers";
import Stock from "@/pages/Stock";
import TillAccounts from "@/pages/TillAccounts";
import Sales from "./pages/Sales";
import QueueMonitor from "./pages/QueueMonitor";
import Shifts from "./pages/Shifts";
import DayClosings from "./pages/DayClosings";
import JournalEntries from "./pages/JournalEntries";
import StockAudit from "@/pages/StockAudit";

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Base layout for all authenticated users */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    {/* Everyone can see the Dashboard */}
                    <Route index element={<Dashboard />} />

                    {/* ⭐ Super Admin Only ⭐ */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={["super_admin"]} />
                        }
                    >
                        <Route path="setup" element={<Setup />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="companies" element={<Companies />} />
                        <Route path="/price-lists" element={<PriceLists />} />
                        <Route
                            path="/queue-monitor"
                            element={<QueueMonitor />}
                        />
                    </Route>

                    {/* ⭐ SA / Admin / Manager Only ⭐ */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "super_admin",
                                    "admin",
                                    "manager",
                                ]}
                            />
                        }
                    >
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/items" element={<Items />} />
                        <Route path="/stock" element={<Stock />} />
                        <Route path="/shifts" element={<Shifts />} />
                    </Route>

                    {/* ⭐ SA / Admin Only ⭐ */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={["super_admin", "admin"]}
                            />
                        }
                    >
                        <Route path="/item-prices" element={<ItemPrices />} />
                        <Route
                            path="/till-accounts"
                            element={<TillAccounts />}
                        />
                    </Route>

                    {/* Everyone (including Cashier) */}
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/day-closings" element={<DayClosings />} />
                    <Route
                        path="/journal-entries"
                        element={<JournalEntries />}
                    />
                    <Route path="/stock-audit" element={<StockAudit />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
