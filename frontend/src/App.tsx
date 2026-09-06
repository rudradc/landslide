import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GisMapPage } from './pages/GisMapPage';
import { WeatherPage } from './pages/WeatherPage';
import { HabitationsPage } from './pages/HabitationsPage';

import { HabitationDetailPage } from './pages/HabitationDetailPage';
import { RelocationPage } from './pages/RelocationPage';
import { MlStudioPage } from './pages/MlStudioPage';
import { DataUploadPage } from './pages/DataUploadPage';
import { SettingsPage } from './pages/SettingsPage';

import { MonsoonForestBackground } from './components/MonsoonForestBackground';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950">
      <MonsoonForestBackground intensity="moderate" />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/gis-map"
              element={
                <AppLayout>
                  <GisMapPage />
                </AppLayout>
              }
            />
            <Route
              path="/weather"
              element={
                <AppLayout>
                  <WeatherPage />
                </AppLayout>
              }
            />

            <Route
              path="/habitations"
              element={
                <AppLayout>
                  <HabitationsPage />
                </AppLayout>
              }
            />
            <Route
              path="/habitations/:id"
              element={
                <AppLayout>
                  <HabitationDetailPage />
                </AppLayout>
              }
            />
            <Route
              path="/relocation"
              element={
                <AppLayout>
                  <RelocationPage />
                </AppLayout>
              }
            />
            <Route
              path="/ml-studio"
              element={
                <AppLayout>
                  <MlStudioPage />
                </AppLayout>
              }
            />
            <Route
              path="/data-upload"
              element={
                <AppLayout>
                  <DataUploadPage />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              }
            />
          </Route>

          {/* Fallback redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
