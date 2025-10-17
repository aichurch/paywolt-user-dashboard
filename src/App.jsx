import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModeProvider, useMode } from './contexts/ModeContext';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import LiteLayout from './components/layout/LiteLayout';
import Dashboard from './pages/Dashboard';
import LiteDashboard from './pages/lite/LiteDashboard';
import LiteSend from './pages/lite/LiteSend';
import LiteAdd from './pages/lite/LiteAdd';
import LiteHistory from './pages/lite/LiteHistory';
import Settings from './pages/Settings';
import Wallets from './pages/Wallets';
import Transactions from './pages/Transactions';
import AddMoney from './pages/AddMoney';
import SendMoney from './pages/SendMoney';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
function AppRoutes() {
  const { mode, switchToPro, switchToLite } = useMode();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* LITE MODE Routes */}
      {mode === 'lite' && (
        <Route path="/" element={<ProtectedRoute><LiteLayout onSwitchToPro={switchToPro} /></ProtectedRoute>}>
          <Route index element={<LiteDashboard />} />
          <Route path="lite" element={<LiteDashboard />} />
          <Route path="lite/send" element={<LiteSend />} />
          <Route path="lite/add" element={<LiteAdd />} />
          <Route path="lite/history" element={<LiteHistory />} />
          <Route path="*" element={<Navigate to="/lite" replace />} />
        </Route>
      )}

      {/* PRO MODE Routes */}
      {mode === 'pro' && (
        <Route path="/" element={<ProtectedRoute><Layout onSwitchToLite={switchToLite} /></ProtectedRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route index element={<Dashboard />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="add-money" element={<AddMoney />} />
          <Route path="send-money" element={<SendMoney />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ModeProvider>
          <AppRoutes />
        </ModeProvider>
      </AuthProvider>
    </Router>
  );
}