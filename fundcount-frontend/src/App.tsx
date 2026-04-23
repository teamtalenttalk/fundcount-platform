import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/pages/login/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { Loader2 } from 'lucide-react';

// ---- Portfolio pages ----
import PortfoliosPage from '@/pages/portfolio/PortfoliosPage';
import PortfolioDetailPage from '@/pages/portfolio/PortfolioDetailPage';
import AssetsPage from '@/pages/portfolio/AssetsPage';
import PositionsPage from '@/pages/portfolio/PositionsPage';
import TradesPage from '@/pages/portfolio/TradesPage';

// ---- General Ledger pages ----
import ChartOfAccountsPage from '@/pages/general-ledger/ChartOfAccountsPage';
import JournalEntriesPage from '@/pages/general-ledger/JournalEntriesPage';
import TrialBalancePage from '@/pages/general-ledger/TrialBalancePage';
import ReconciliationPage from '@/pages/general-ledger/ReconciliationPage';

// ---- Protected Route wrapper ----
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ---- Performance pages ----
import AttributionPage from '@/pages/performance/AttributionPage';
import ReturnsPage from '@/pages/performance/ReturnsPage';

// ---- Partnership pages ----
import PartnersPage from '@/pages/partnership/PartnersPage';
import CapitalAccountsPage from '@/pages/partnership/CapitalAccountsPage';
import AllocationsPage from '@/pages/partnership/AllocationsPage';

// ---- AI Intelligence pages ----
import AiDashboardPage from '@/pages/ai/AiDashboardPage';
import PortfolioAnalysisPage from '@/pages/ai/PortfolioAnalysisPage';
import NlQueryPage from '@/pages/ai/NlQueryPage';
import PredictionsPage from '@/pages/ai/PredictionsPage';
import AiReconciliationPage from '@/pages/ai/ReconciliationPage';
import NavCalculatorPage from '@/pages/ai/NavCalculatorPage';

// ---- Other pages ----
import InvestorPortalPage from '@/pages/investor-portal/InvestorPortalPage';
import DataSourcesPage from '@/pages/data/DataSourcesPage';
import DataImportsPage from '@/pages/data/DataImportsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* General Ledger */}
                <Route path="general-ledger/chart-of-accounts" element={<ChartOfAccountsPage />} />
                <Route path="general-ledger/journal-entries" element={<JournalEntriesPage />} />
                <Route path="general-ledger/trial-balance" element={<TrialBalancePage />} />
                <Route path="general-ledger/reconciliation" element={<ReconciliationPage />} />

                {/* Portfolio */}
                <Route path="portfolio/portfolios" element={<PortfoliosPage />} />
                <Route path="portfolio/portfolios/:id" element={<PortfolioDetailPage />} />
                <Route path="portfolio/assets" element={<AssetsPage />} />
                <Route path="portfolio/positions" element={<PositionsPage />} />
                <Route path="portfolio/trades" element={<TradesPage />} />

                {/* Performance */}
                <Route path="performance/attribution" element={<AttributionPage />} />
                <Route path="performance/returns" element={<ReturnsPage />} />

                {/* Partnership */}
                <Route path="partnership/partners" element={<PartnersPage />} />
                <Route path="partnership/capital-accounts" element={<CapitalAccountsPage />} />
                <Route path="partnership/allocations" element={<AllocationsPage />} />

                {/* AI Intelligence */}
                <Route path="ai/dashboard" element={<AiDashboardPage />} />
                <Route path="ai/portfolio-analysis" element={<PortfolioAnalysisPage />} />
                <Route path="ai/query" element={<NlQueryPage />} />
                <Route path="ai/predictions" element={<PredictionsPage />} />
                <Route path="ai/reconciliation" element={<AiReconciliationPage />} />
                <Route path="ai/nav-calculator" element={<NavCalculatorPage />} />

                {/* Other */}
                <Route path="investor-portal" element={<InvestorPortalPage />} />
                <Route path="data/sources" element={<DataSourcesPage />} />
                <Route path="data/imports" element={<DataImportsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
