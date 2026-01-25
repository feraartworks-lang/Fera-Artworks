import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import GalleryPage from "@/pages/GalleryPage";
import ArtworkDetailPage from "@/pages/ArtworkDetailPage";
import SecureViewerPage from "@/pages/SecureViewerPage";
import DashboardPage from "@/pages/DashboardPage";
import MarketplacePage from "@/pages/MarketplacePage";
import AuthCallback from "@/pages/AuthCallback";
import BankTransferCheckout from "@/pages/BankTransferCheckout";
import HowItWorksPage from "@/pages/HowItWorksPage";
import LicenseAgreementPage from "@/pages/LicenseAgreementPage";

// Admin Pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminArtworks from "@/pages/admin/AdminArtworks";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminPayments from "@/pages/admin/AdminPayments";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// App Router with session_id detection
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id - must be synchronous during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/secure-view/:id" element={
        <ProtectedRoute>
          <SecureViewerPage />
        </ProtectedRoute>
      } />
      <Route path="/checkout/:artworkId" element={
        <ProtectedRoute>
          <BankTransferCheckout />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - Separate authentication */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="artworks" element={<AdminArtworks />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <BrowserRouter>
          <div className="App min-h-screen bg-background">
            {/* Noise overlay */}
            <div className="noise-overlay" />
            
            <AppRouter />
            
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'hsl(0 0% 4%)',
                  border: '1px solid hsl(0 0% 15%)',
                  color: 'hsl(0 0% 93%)',
                },
              }}
            />
          </div>
        </BrowserRouter>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
