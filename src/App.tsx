import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfileEdit from "./pages/SellerProfileEdit";
import SellerSettings from "./pages/SellerSettings";
import QueueDetailPage from "./pages/QueueDetailPage";
import SellerPublicProfile from "./pages/SellerPublicProfile";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import VisitorTracker from "./components/analytics/VisitorTracker";
import { useThemeMode } from "@/hooks/useThemeMode";

const queryClient = new QueryClient();

const ThemeInit = () => {
  useThemeMode(); // Initialize theme from localStorage on app load
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInit />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <VisitorTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/seller" element={<SellerDashboard />} />
          <Route path="/dashboard/seller/edit" element={<SellerProfileEdit />} />
          <Route path="/dashboard/seller/settings" element={<SellerSettings />} />
          <Route path="/seller/:sellerId" element={<SellerPublicProfile />} />
          <Route path="/queue/:bookingId" element={<QueueDetailPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
