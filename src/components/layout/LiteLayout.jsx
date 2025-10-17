// LiteLayout.jsx - Production Ready with Full Backend Integration
// Path: /src/components/layout/LiteLayout.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Bell,
  LogOut,
  Zap,
  Menu,
  X,
  User,
  Settings,
  CreditCard,
  Wallet,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  TrendingUp,
  Shield,
  Lock,
  ChevronRight,
  Home,
  BarChart3,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import io from 'socket.io-client';

// API & Services
import api, { 
  walletAPI, 
  userAPI, 
  transactionAPI,
  notificationsAPI,
  aiAPI 
} from '../../services/api';

// Contexts & Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

// Constants
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://paywolt-backend.onrender.com';

export default function LiteLayout({ onSwitchToPro }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Refs
  const socketRef = useRef(null);
  const { showNotification, success, error, info } = useNotifications();

  // Initialize WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
      fetchInitialData();
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Real-time updates
    socketRef.current.on('notification', (data) => {
      setNotifications(prev => [data, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
      showNotification(data.message, data.type || 'info');
    });

    socketRef.current.on('walletUpdate', (data) => {
      if (data.totalBalance) {
        setWalletBalance(data.totalBalance);
      }
    });

    socketRef.current.on('transactionUpdate', (data) => {
      if (data.type && data.amount) {
        info(`${data.type}: ${data.currency || '€'}${data.amount}`);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      const [notifResponse, walletResponse] = await Promise.all([
        notificationsAPI.getAll(),
        walletAPI.getAll()
      ]);

      // Process notifications
      if (notifResponse?.notifications) {
        setNotifications(notifResponse.notifications.slice(0, 10));
        const unread = notifResponse.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }

      // Process wallet balance
      if (walletResponse?.wallets) {
        const totalBalance = walletResponse.wallets.reduce((sum, wallet) => {
          if (wallet.currency === 'EUR' || wallet.currency === 'USD') {
            return sum + (wallet.balance || 0);
          }
          return sum;
        }, 0);
        setWalletBalance(totalBalance);
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      success('All notifications marked as read');
    } catch (err) {
      error('Failed to mark notifications as read');
    }
  };

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // AI Chat handler
  const sendAIMessage = async (message) => {
    if (!message.trim() || aiLoading) return;

    setAiLoading(true);
    setAiMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await aiAPI.chat(message);
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.reply || 'I understand. How can I help you with your banking needs?' 
      }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Menu items
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', badge: null },
    { icon: Wallet, label: 'Wallets', path: '/wallets', badge: formatCurrency(walletBalance) },
    { icon: CreditCard, label: 'Cards', path: '/cards', badge: 'LITE' },
    { icon: Send, label: 'Send Money', path: '/send', badge: null },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', badge: 'PRO', locked: true },
    { icon: User, label: 'Profile', path: '/profile', badge: null },
    { icon: Settings, label: 'Settings', path: '/settings', badge: null },
    { icon: HelpCircle, label: 'Help & Support', path: '/help', badge: null }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Connection Status Bar */}
      {connectionStatus !== 'connected' && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-xs text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            <span>Limited connectivity - Some features may be unavailable</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <svg width="40" height="40" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <defs>
                  <linearGradient id="shieldGradientLite" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#F4E4B7', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#B8941F', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  d="M 55 10 L 95 22 L 95 70 Q 95 100 55 110 Q 15 100 15 70 L 15 22 Z" 
                  fill="url(#shieldGradientLite)"
                />
                <g transform="translate(55, 55)">
                  <rect x="-20" y="-15" width="8" height="30" fill="#0A1929" rx="1"/>
                  <rect x="-4" y="-20" width="8" height="35" fill="#0A1929" rx="1"/>
                  <rect x="12" y="-15" width="8" height="30" fill="#0A1929" rx="1"/>
                </g>
              </svg>
              <div>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text">
                  PayWolt
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">LITE Mode</p>
                  {connectionStatus === 'connected' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Balance Display (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                <Wallet className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-white">
                  {formatCurrency(walletBalance)}
                </span>
              </div>

              {/* Upgrade to Pro Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSwitchToPro}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 rounded-xl text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-yellow-500/30 transition-all duration-300 group"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Upgrade to</span>
                <span>PRO</span>
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all relative border border-white/10"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-950"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNotifications(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <h3 className="font-bold text-white text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-yellow-400 hover:text-yellow-300"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <motion.div
                                key={notif.id}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                onClick={() => !notif.read && markAsRead(notif.id)}
                                className="p-4 border-b border-white/5 cursor-pointer"
                              >
                                <div className="flex items-start gap-3">
                                  {!notif.read && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm text-white mb-1">{notif.message || notif.text}</p>
                                    <p className="text-xs text-slate-400">{formatTime(notif.createdAt || notif.time)}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-slate-400">No notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              >
                {menuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                )}
              </motion.button>

              {/* User Avatar (Desktop) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 rounded-full flex items-center justify-center text-slate-900 font-black text-sm shadow-lg">
                    {getInitials(user?.name)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400">LITE • ID: {user?.id?.slice(0, 8)}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Gradient line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Menu</h3>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 rounded-full flex items-center justify-center text-slate-900 font-black shadow-lg">
                      {getInitials(user?.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block text-[10px] font-bold text-yellow-400 uppercase px-2 py-0.5 bg-yellow-400/10 rounded border border-yellow-400/20">
                        LITE
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatCurrency(walletBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navigation</p>
                
                {menuItems.map((item) => (
                  <motion.button
                    key={item.path}
                    whileHover={{ x: item.locked ? 0 : 4 }}
                    onClick={() => {
                      if (item.locked) {
                        info('Upgrade to PRO to unlock this feature');
                        onSwitchToPro();
                      } else {
                        navigate(item.path);
                        setMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-white transition-all border border-white/10 group ${
                      item.locked 
                        ? 'bg-white/5 opacity-50 cursor-not-allowed' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${
                        item.locked ? 'text-slate-500' : 'text-yellow-400 group-hover:scale-110'
                      } transition-transform`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.badge === 'PRO' 
                          ? 'bg-yellow-500/20 text-yellow-400 font-bold'
                          : item.badge === 'LITE'
                          ? 'bg-slate-500/20 text-slate-400'
                          : 'bg-white/10 text-slate-300'
                      }`}>
                        {item.locked && <Lock className="w-3 h-3 inline mr-1" />}
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Upgrade Section */}
              <div className="p-6 border-t border-white/10">
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4 border border-yellow-500/30 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Unlock Full Access</h4>
                      <p className="text-xs text-slate-300">
                        Get unlimited features, advanced analytics, and priority support
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onSwitchToPro}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold text-sm py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all"
                  >
                    Upgrade to PRO
                  </button>
                </div>

                {/* Logout */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-semibold transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="min-h-full p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center min-h-[400px]"
                >
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <motion.div
                        className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
                      />
                      <motion.div
                        className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm">Loading PayWolt LITE...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Outlet context={{ 
                    walletBalance,
                    connectionStatus,
                    formatCurrency,
                    onSwitchToPro
                  }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* AI Chat Widget */}
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAIChat(!showAIChat)}
        className="fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/40 z-40 group"
      >
        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 group-hover:rotate-12 transition-transform" />
        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
      </motion.button>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-80 h-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-40 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">AI Assistant (LITE)</h3>
              <button
                onClick={() => setShowAIChat(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    Ask me anything about your account!
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Upgrade to PRO for advanced AI features
                  </p>
                </div>
              )}
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-yellow-500/20 text-yellow-100' 
                      : 'bg-white/10 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.message;
                sendAIMessage(input.value);
                input.value = '';
              }}
              className="p-4 border-t border-white/10"
            >
              <div className="flex gap-2">
                <input
                  name="message"
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-yellow-500/50"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-yellow-400" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}