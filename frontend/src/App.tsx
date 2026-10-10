import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { MainLayout } from './components/layout/MainLayout';

import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InventoryListPage } from './features/inventory/InventoryListPage';
import { ProductFormPage } from './features/inventory/ProductFormPage';
import { AddBatchPage } from './features/inventory/AddBatchPage';
import { RecordSalePage } from './features/sales/RecordSalePage';
import { SalesHistoryPage } from './features/sales/SalesHistoryPage';
import { ExpiryAlertsPage } from './features/expiry/ExpiryAlertsPage';
import { SmartSuggestionsPage } from './features/recommendations/SmartSuggestionsPage';
import { NearbyExchangePage } from './features/exchange/NearbyExchangePage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { ReplenishmentPage } from './features/replenishment/ReplenishmentPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { FeedbackPage } from './features/feedback/FeedbackPage';
import { SettingsPage } from './features/settings/SettingsPage';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes (No sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated routes inside MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/inventory" element={<InventoryListPage />} />
            <Route path="/inventory/new" element={<ProductFormPage />} />
            <Route path="/inventory/:productId/edit" element={<ProductFormPage />} />
            <Route path="/inventory/:productId/batches/new" element={<AddBatchPage />} />

            <Route path="/sales" element={<SalesHistoryPage />} />
            <Route path="/sales/new" element={<RecordSalePage />} />

            <Route path="/expiry" element={<ExpiryAlertsPage />} />
            <Route path="/recommendations" element={<SmartSuggestionsPage />} />
            <Route path="/exchange" element={<NearbyExchangePage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/replenishment" element={<ReplenishmentPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
