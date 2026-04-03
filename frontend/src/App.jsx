import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/LoginPage';

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const MenuCategories = React.lazy(() => import('./pages/admin/MenuCategories'));
const MenuItems = React.lazy(() => import('./pages/admin/MenuItems'));
const TableManagement = React.lazy(() => import('./pages/admin/TableManagement'));
const OrderHistory = React.lazy(() => import('./pages/admin/OrderHistory'));
const Reports = React.lazy(() => import('./pages/admin/Reports'));
const WaiterDashboard = React.lazy(() => import('./pages/waiter/WaiterDashboard'));
const KitchenDashboard = React.lazy(() => import('./pages/kitchen/KitchenDashboard'));

// Loading Fallback Component
const PageSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded w-full mt-6"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="categories" element={<MenuCategories />} />
                  <Route path="menu" element={<MenuItems />} />
                  <Route path="tables" element={<TableManagement />} />
                  <Route path="orders" element={<OrderHistory />} />
                  <Route path="reports" element={<Reports />} />
                </Route>

                {/* Waiter */}
                <Route path="/waiter" element={
                  <ProtectedRoute roles={['waiter', 'admin']}>
                    <WaiterDashboard />
                  </ProtectedRoute>
                } />

                {/* Kitchen */}
                <Route path="/kitchen" element={
                  <ProtectedRoute roles={['kitchen', 'admin']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
