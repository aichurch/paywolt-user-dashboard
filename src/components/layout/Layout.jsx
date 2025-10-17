// Layout.jsx - Ultra Premium Production Version
// Path: /src/components/layout/Layout.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  WifiOff, Wifi, AlertTriangle, CheckCircle, Info, X, RefreshCw,
  DollarSign, Bitcoin, Activity, Shield, ArrowUpRight, ArrowDownRight,
  TrendingUp, Users, Globe, Zap, Server, BarChart3, Lock, 
  CreditCard, Wallet, Eye, EyeOff, Bell
} from 'lucide-react';
import io from 'socket.io-client';

// Component Imports
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatWidget from '../ai/AIChatWidget';

// API & Services
import api, { 
  walletAPI, 
  userAPI, 
  transactionAPI,
  paymentAPI,
  cardAPI,
  savingsAPI,
  aiAPI,
  notificationsAPI 
} from '../../services/api';

// Contexts & Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

// Constants
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://paywolt-backend.onrender.com';
const PROVIDERS = ['Treezor', 'Flutterwave', 'Paysafe', 'ZeroHash', 'Alpaca', 'Wallester', 'Nium', 'Worldline', 'Viva Wallet'];
const RECONNECT_DELAY = 3000;
const HEALTH_CHECK_INTERVAL = 30000;

export default function Layout() {
  // State Management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [liveData, setLiveData] = useState({
    walletBalance: 0,
    cryptoBalance: 0,
    pendingTransactions: 0,
    dailyVolume: 0,
    activeUsers: 0,
    providers: [],
    totalSavings: 0,
    activeCards: 0
  });
  const [systemStatus, setSystemStatus] = useState({
    providers: {},
    apiHealth: 'checking',
    lastSync: null,
    uptime: 0,
    responseTime: 0
  });
  const [marketData, setMarketData] = useState({
    btc: { price: 0, change: 0, volume: 0 },
    eth: { price: 0, change: 0, volume: 0 },
    usdt: { price: 0, change: 0, volume: 0 }
  });
  const [providerMetrics, setProviderMetrics] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const healthCheckIntervalRef = useRef(null);
  const controls = useAnimation();

  // Hooks
  const { user, isAdmin } = useAuth();
  const { showNotification, success, error, warning, info, notifications } = useNotifications();

  // WebSocket Connection Management
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setConnectionStatus('disconnected');
        return;
      }

      socketRef.current = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: RECONNECT_DELAY,
        timeout: 20000
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts = 0;
        fetchInitialData();
        success('System connected successfully');
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setConnectionStatus('disconnected');
        
        if (reason === 'io server disconnect') {
          socketRef.current.connect();
        } else {
          warning('Connection lost. Reconnecting...');
        }
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        setConnectionStatus('connected');
        info('Connection restored');
        fetchInitialData();
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        reconnectAttempts = attemptNumber;
        setConnectionStatus('reconnecting');
      });

      socketRef.current.on('reconnect_failed', () => {
        error('Failed to reconnect. Please refresh the page.');
        setConnectionStatus('error');
      });

      // Real-time data events
      socketRef.current.on('walletUpdate', handleWalletUpdate);
      socketRef.current.on('transactionUpdate', handleTransactionUpdate);
      socketRef.current.on('providerStatus', handleProviderStatus);
      socketRef.current.on('marketUpdate', handleMarketUpdate);
      socketRef.current.on('notification', handleNotification);
      socketRef.current.on('metricsUpdate', handleMetricsUpdate);
      socketRef.current.on('systemAlert', handleSystemAlert);

      // Admin events
      if (isAdmin) {
        socketRef.current.on('adminAlert', handleAdminAlert);
        socketRef.current.on('kycUpdate', handleKycUpdate);
        socketRef.current.on('systemMetrics', handleSystemMetrics);
        socketRef.current.on('fraudAlert', handleFraudAlert);
        socketRef.current.on('providerIssue', handleProviderIssue);
      }

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionStatus('error');
      });
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [isAdmin]);

  // WebSocket Event Handlers
  const handleWalletUpdate = useCallback((data) => {
    setLiveData(prev => ({
      ...prev,
      walletBalance: data.totalBalance || prev.walletBalance,
      cryptoBalance: data.cryptoBalance || prev.cryptoBalance,
      totalSavings: data.totalSavings || prev.totalSavings
    }));
    animateValueChange();
  }, []);

  const handleTransactionUpdate = useCallback((data) => {
    setLiveData(prev => ({
      ...prev,
      pendingTransactions: data.pending || prev.pendingTransactions,
      dailyVolume: prev.dailyVolume + (data.amount || 0)
    }));
    
    if (data.type && data.amount) {
      info(`New ${data.type}: ${data.currency || '€'}${data.amount.toLocaleString()}`);
    }
  }, [info]);

  const handleProviderStatus = useCallback((data) => {
    setSystemStatus(prev => ({
      ...prev,
      providers: data.providers || prev.providers,
      uptime: data.uptime || prev.uptime
    }));
  }, []);

  const handleMarketUpdate = useCallback((data) => {
    setMarketData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const handleNotification = useCallback((data) => {
    showNotification(data.message, data.type || 'info', data.duration);
    setUnreadNotifications(prev => prev + 1);
  }, [showNotification]);

  const handleMetricsUpdate = useCallback((data) => {
    setProviderMetrics(data);
    setSystemStatus(prev => ({
      ...prev,
      responseTime: data.avgResponseTime || prev.responseTime
    }));
  }, []);

  const handleSystemAlert = useCallback((data) => {
    warning(`System Alert: ${data.message}`);
  }, [warning]);

  const handleAdminAlert = useCallback((data) => {
    warning(`Admin Alert: ${data.message}`, { persistent: true });
  }, [warning]);

  const handleKycUpdate = useCallback((data) => {
    info(`KYC Update: User ${data.userId} - Status: ${data.status}`);
  }, [info]);

  const handleSystemMetrics = useCallback((data) => {
    setLiveData(prev => ({
      ...prev,
      activeUsers: data.activeUsers || prev.activeUsers,
      activeCards: data.activeCards || prev.activeCards
    }));
  }, []);

  const handleFraudAlert = useCallback((data) => {
    error(`⚠️ Fraud Alert: ${data.message}`, { persistent: true });
  }, [error]);

  const handleProviderIssue = useCallback((data) => {
    error(`Provider Issue: ${data.provider} - ${data.message}`);
  }, [error]);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      const requests = [
        walletAPI.getAll(),
        userAPI.getProfile(),
        transactionAPI.getStats(),
        notificationsAPI.getAll()
      ];

      // Add admin requests
      if (isAdmin) {
        requests.push(
          api.get('/api/admin/dashboard/stats'),
          api.get('/api/admin/system/metrics')
        );
      }

      const responses = await Promise.all(requests);
      
      // Process wallet data
      if (responses[0]?.wallets) {
        const totalBalance = responses[0].wallets.reduce((sum, wallet) => {
          if (wallet.currency === 'EUR' || wallet.currency === 'USD') {
            return sum + (wallet.balance || 0);
          } else if (wallet.type === 'crypto') {
            return sum + (wallet.balanceInEUR || 0);
          }
          return sum;
        }, 0);

        const cryptoBalance = responses[0].wallets
          .filter(w => w.type === 'crypto')
          .reduce((sum, w) => sum + (w.balance || 0), 0);

        const savingsBalance = responses[0].wallets
          .filter(w => w.type === 'savings')
          .reduce((sum, w) => sum + (w.balance || 0), 0);

        setLiveData(prev => ({
          ...prev,
          walletBalance: totalBalance,
          cryptoBalance: cryptoBalance,
          totalSavings: savingsBalance
        }));
      }

      // Process transaction stats
      if (responses[2]) {
        setLiveData(prev => ({
          ...prev,
          pendingTransactions: responses[2].pending || 0,
          dailyVolume: responses[2].dailyVolume || 0
        }));
      }

      // Process notifications
      if (responses[3]?.notifications) {
        const unread = responses[3].notifications.filter(n => !n.read).length;
        setUnreadNotifications(unread);
      }

      // Process admin data
      if (isAdmin && responses[4]) {
        setLiveData(prev => ({
          ...prev,
          activeUsers: responses[4].activeUsers || 0,
          activeCards: responses[4].activeCards || 0
        }));
      }

      // Check provider health
      await checkProviderHealth();

    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      error('Failed to load data. Please refresh the page.');
      
      // Retry after delay
      setTimeout(() => fetchInitialData(), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Provider health check
  const checkProviderHealth = useCallback(async () => {
    try {
      const response = await api.get('/api/providers/health');
      
      if (response.data) {
        setSystemStatus(prev => ({
          ...prev,
          providers: response.data.providers || {},
          apiHealth: response.data.overall || 'checking',
          lastSync: new Date().toISOString(),
          uptime: response.data.uptime || 0
        }));
        
        if (response.data.metrics) {
          setProviderMetrics(response.data.metrics);
        }
      }
    } catch (err) {
      console.error('Provider health check failed:', err);
      setSystemStatus(prev => ({
        ...prev,
        apiHealth: 'error'
      }));
    }
  }, []);

  // Periodic health checks
  useEffect(() => {
    healthCheckIntervalRef.current = setInterval(checkProviderHealth, HEALTH_CHECK_INTERVAL);
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkProviderHealth]);

  // Value change animation
  const animateValueChange = useCallback(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3, ease: "easeInOut" }
    });
  }, [controls]);

  // Sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setSidebarOpen(isDesktop);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    info('Refreshing data...');
    await Promise.all([
      fetchInitialData(),
      checkProviderHealth()
    ]);
    success('Data refreshed successfully');
  };

  // Provider status helper
  const getProviderStatus = useCallback((provider) => {
    const status = systemStatus.providers[provider];
    if (!status) return { color: 'gray', text: 'Unknown', bgClass: 'bg-gray-400' };
    
    switch(status) {
      case 'healthy':
        return { color: 'green', text: 'Online', bgClass: 'bg-green-400' };
      case 'degraded':
        return { color: 'yellow', text: 'Degraded', bgClass: 'bg-yellow-400' };
      case 'error':
        return { color: 'red', text: 'Offline', bgClass: 'bg-red-400' };
      default:
        return { color: 'gray', text: 'Checking...', bgClass: 'bg-gray-400' };
    }
  }, [systemStatus.providers]);

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(250, 204, 21, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* System Status Bar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 h-8 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 z-[60] flex items-center justify-between px-4"
      >
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: connectionStatus === 'connected' ? [1, 1.2, 1] : 1,
                opacity: connectionStatus === 'connected' ? 1 : [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : connectionStatus === 'disconnected' ? (
                <WifiOff className="w-3 h-3 text-red-400" />
              ) : connectionStatus === 'reconnecting' ? (
                <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />
              ) : (
                <Zap className="w-3 h-3 text-yellow-400" />
              )}
            </motion.div>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {connectionStatus}
            </span>
          </div>

          {/* Provider Status Indicators */}
          <div className="hidden md:flex items-center gap-3">
            {PROVIDERS.slice(0, 5).map(provider => {
              const statusInfo = getProviderStatus(provider);
              const metrics = providerMetrics[provider] || {};
              
              return (
                <div key={provider} className="group relative flex items-center gap-1.5 cursor-pointer">
                  <motion.div
                    animate={{ 
                      scale: statusInfo.text === 'Online' ? [1, 1.2, 1] : 1 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${statusInfo.bgClass}`}
                  />
                  <span className="text-[10px] text-slate-500">{provider}</span>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[70]">
                    <div className="bg-slate-800/95 backdrop-blur-xl text-white text-xs p-3 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                      <div className="font-bold mb-1">{provider}</div>
                      <div className="space-y-1 text-[10px]">
                        <div>Status: <span className={`text-${statusInfo.color}-400`}>{statusInfo.text}</span></div>
                        {metrics.latency && <div>Latency: {metrics.latency}ms</div>}
                        {metrics.uptime && <div>Uptime: {metrics.uptime}%</div>}
                        {metrics.requests && <div>Requests: {formatNumber(metrics.requests)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {PROVIDERS.length > 5 && (
              <button className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                +{PROVIDERS.length - 5} more
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Metrics */}
          <motion.div 
            animate={controls}
            className="hidden lg:flex items-center gap-4"
          >
            <div className="flex items-center gap-2 group">
              <Wallet className="w-3 h-3 text-green-400" />
              <span className="text-[11px] font-bold text-green-400 tabular-nums">
                {formatCurrency(liveData.walletBalance)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Bitcoin className="w-3 h-3 text-orange-400" />
              <span className="text-[11px] font-bold text-orange-400 tabular-nums">
                ₿{liveData.cryptoBalance.toFixed(4)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-slate-400">
                {liveData.pendingTransactions} pending
              </span>
            </div>
            
            {isAdmin && (
              <>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span className="text-[11px] text-purple-400">
                    {formatNumber(liveData.activeUsers)} users
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-cyan-400" />
                  <span className="text-[11px] text-cyan-400">
                    {formatNumber(liveData.activeCards)} cards
                  </span>
                </div>
              </>
            )}
          </motion.div>

          {/* Notifications Badge */}
          {unreadNotifications > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30"
            >
              <Bell className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-bold text-red-400">{unreadNotifications}</span>
            </motion.div>
          )}

          {/* Admin Mode */}
          {isAdmin && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => window.location.href = '/admin'}
              className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded border border-purple-500/30 transition-all hover:border-purple-500/50"
            >
              <Shield className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400 uppercase">Admin</span>
            </motion.button>
          )}

          {/* System Health */}
          <div className="flex items-center gap-2">
            <Server className={`w-3 h-3 ${
              systemStatus.apiHealth === 'healthy' ? 'text-green-400' :
              systemStatus.apiHealth === 'degraded' ? 'text-yellow-400' :
              systemStatus.apiHealth === 'error' ? 'text-red-400' :
              'text-gray-400 animate-pulse'
            }`} />
            <span className="text-[10px] text-slate-500">
              {systemStatus.responseTime > 0 ? `${systemStatus.responseTime}ms` : 'API'}
            </span>
          </div>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Notification Toast Container */}
      <AnimatePresence>
        <div className="fixed top-12 right-4 z-[70] space-y-2 pointer-events-none">
          {notifications.slice(0, 5).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl shadow-2xl pointer-events-auto min-w-[300px] max-w-[400px]
                ${notification.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : ''}
                ${notification.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : ''}
                ${notification.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' : ''}
                ${notification.type === 'info' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : ''}
              `}
            >
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {notification.type === 'error' && <X className="w-4 h-4 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{notification.message}</span>
              <button 
                onClick={() => notification.onClose && notification.onClose()}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 pt-8">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 1024 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 pt-8"
            >
              <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative pt-8">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Market Ticker */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block bg-slate-900/50 backdrop-blur-xl border-b border-white/5 py-2 overflow-hidden"
        >
          <div className="flex items-center justify-around text-xs">
            {Object.entries(marketData).map(([symbol, data]) => (
              <motion.div 
                key={symbol} 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-slate-500 uppercase">{symbol}/EUR</span>
                <span className={`font-bold flex items-center gap-1 ${
                  data.change > 0 ? 'text-green-400' : data.change < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {formatCurrency(data.price)} 
                  {data.change > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : data.change < 0 ? (
                    <ArrowDownRight className="w-3 h-3" />
                  ) : null}
                  {data.change && (
                    <span className="text-[10px]">
                      {Math.abs(data.change).toFixed(2)}%
                    </span>
                  )}
                </span>
                {data.volume > 0 && (
                  <span className="text-[10px] text-slate-600">
                    Vol: {formatNumber(data.volume)}
                  </span>
                )}
              </motion.div>
            ))}
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500">24h Volume</span>
              <span className="font-bold text-blue-400">
                {formatCurrency(liveData.dailyVolume)}
              </span>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-slate-500">System Load</span>
                <span className="font-bold text-green-400">
                  {systemStatus.uptime > 0 ? `${systemStatus.uptime.toFixed(2)}%` : 'Optimal'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
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
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-full h-full rounded-full border-4 border-transparent border-t-yellow-400 border-r-yellow-400" />
                        </motion.div>
                        <motion.div
                          className="absolute inset-2"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-full h-full rounded-full border-4 border-transparent border-b-blue-400 border-l-blue-400" />
                        </motion.div>
                        <motion.div
                          className="absolute inset-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-full h-full rounded-full border-4 border-transparent border-t-purple-400 border-b-purple-400" />
                        </motion.div>
                        <div className="absolute inset-6 bg-gradient-to-br from-yellow-400 via-blue-500 to-purple-500 rounded-full blur-xl opacity-50" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Loading PayWolt Banking System...</p>
                      <motion.p 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-slate-500 text-xs mt-2"
                      >
                        Connecting to {PROVIDERS.length} payment providers...
                      </motion.p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Outlet context={{ 
                      api, 
                      socket: socketRef.current, 
                      liveData, 
                      systemStatus,
                      marketData,
                      providerMetrics,
                      isAdmin,
                      showNotification,
                      checkProviderHealth,
                      refreshData: fetchInitialData,
                      connectionStatus,
                      formatCurrency,
                      formatNumber
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/50 via-slate-950/20 to-transparent pointer-events-none lg:left-64" />
        </main>

        {/* AI Chat Widget */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          className="fixed bottom-6 right-6 z-30"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl"
            />
            <AIChatWidget />
          </div>
        </motion.div>

        {/* Connection Lost Banner */}
        <AnimatePresence>
          {connectionStatus === 'disconnected' && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-xl text-white py-3 px-4 z-50"
            >
              <div className="flex items-center justify-center gap-3">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Connection lost. Attempting to reconnect...</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}