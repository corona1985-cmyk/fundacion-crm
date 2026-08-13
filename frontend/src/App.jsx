import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BecariosPage from './pages/BecariosPage';
import BecarioDetailPage from './pages/BecarioDetailPage';
import PadrinosPage from './pages/PadrinosPage';
import PadrinoDetailPage from './pages/PadrinoDetailPage';
import FinancieroPage from './pages/FinancieroPage';
import AlarmasPage from './pages/AlarmasPage';
import ReportesPage from './pages/ReportesPage';
import PresupuestoPage from './pages/PresupuestoPage';
import UsuariosPage from './pages/UsuariosPage';
import AuditoriaPage from './pages/AuditoriaPage';

function App() {
  return (
    <ConfigProvider locale={esES} theme={{ token: { primaryColor: '#1890ff', borderRadius: 6 } }}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/becarios" element={<BecariosPage />} />
                  <Route path="/becarios/:id" element={<BecarioDetailPage />} />
                  <Route path="/padrinos" element={<PadrinosPage />} />
                  <Route path="/padrinos/:id" element={<PadrinoDetailPage />} />
                  <Route path="/financiero" element={<FinancieroPage />} />
                  <Route path="/presupuesto" element={<PresupuestoPage />} />
                  <Route path="/alarmas" element={<AlarmasPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/auditoria" element={<AuditoriaPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
