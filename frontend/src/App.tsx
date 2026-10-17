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

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="setup" element={<Setup />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/price-lists" element={<PriceLists />} />
                    <Route path="/item-prices" element={<ItemPrices />} />
                    <Route path="/customers" element={<Customers />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
