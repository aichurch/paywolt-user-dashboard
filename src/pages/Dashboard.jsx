import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Building2, CreditCard, Plus, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Eye, EyeOff, TrendingUp, Wallet, Sparkles,
  Activity, Globe, Shield, Clock, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Zap, Star, Crown, Diamond, Info,
  DollarSign, Euro, PoundSterling, Bitcoin, BarChart3,
  PieChart, Calendar, Filter, Download, Bell, Settings,
  Users, Gift, Target, Award, Banknote, Coins, TrendingDown
} from 'lucide-react';
import api, { walletAPI, transactionAPI, analyticsAPI, providerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import DepositModal from '../components/modals/DepositModal';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';

// Production-ready Dashboard with full backend integration
export default function Dashboard() {
  const navigate = window.__navigate || ((path) => window.location.href = path);
  const { user, subscription, kycLevel } = useAuth();
  const { userTier, limits, features, hasFeature } = useMode();
  
  // State management
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [insights, setInsights] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [error, setError] = useState('');
  
  // Real-time data
  const [exchangeRates, setExchangeRates] = useState({});
  const [providerStatus, setProviderStatus] = useState({});
  const [marketData, setMarketData] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // WebSocket & intervals
  const ws = useRef(null);
  const refreshInterval = useRef(null);
  const lastUpdate = useRef(new Date());

  // Enhanced greeting with context
  const getGreeting = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    
    if (hour < 5) return { greeting: 'Late Night', emoji: '🌙' };
    if (hour < 12) return { greeting: 'Good Morning', emoji: '☀️' };
    if (hour < 18) return { greeting: 'Good Afternoon', emoji: '🌤️' };
    if (hour < 22) return { greeting: 'Good Evening', emoji: '🌆' };
    return { greeting: 'Good Night', emoji: '🌜' };
  };

  // Load dashboard data with retry logic
  const loadDashboardData = useCallback(async () => {
    try {
      setError('');
      const startTime = Date.now();
      
      // Parallel API calls for better performance
      const [
        walletsRes,
        transactionsRes,
        cardsRes,
        statsRes,
        insightsRes,
        notificationsRes,
        exchangeRes,
        providerRes
      ] = await Promise.all([
        walletAPI.getAll(),
        transactionAPI.getAll({ limit: 10, period: selectedPeriod }),
        api.get('/api/cards'),
        analyticsAPI.getStatistics({ period: selectedPeriod }),
        analyticsAPI.getInsights(),
        api.get('/api/notifications/unread'),
        api.get('/api/exchange/rates'),
        providerAPI.health.checkAll()
      ]);
      
      // Process wallet data
      const walletData = walletsRes.data?.wallets || walletsRes.wallets || [];
      const enhancedWallets = await enhanceWalletsData(walletData);
      setWallets(enhancedWallets);
      
      // Process transaction data
      const txData = transactionsRes.data?.transactions || transactionsRes.transactions || [];
      setTransactions(txData);
      
      // Process cards data
      const cardData = cardsRes.data?.cards || cardsRes.cards || [];
      setCards(cardData);
      
      // Process statistics
      const statsData = statsRes.data || {};
      setStatistics(statsData);
      
      // Process insights
      const insightsData = insightsRes.data || {};
      setInsights(insightsData);
      
      // Process notifications
      const notifData = notificationsRes.data?.notifications || [];
      setNotifications(notifData);
      
      // Process exchange rates
      const ratesData = exchangeRes.data?.rates || {};
      setExchangeRates(ratesData);
      
      // Process provider status
      const providerData = {};
      providerRes.data?.providers?.forEach(p => {
        providerData[p.name] = {
          operational: p.status === 'operational',
          latency: p.latency
        };
      });
      setProviderStatus(providerData);
      
      // Track loading time
      const loadTime = Date.now() - startTime;
      console.log(`Dashboard loaded in ${loadTime}ms`);
      
      // Track analytics
      api.post('/api/analytics/dashboard-view', {
        load_time: loadTime,
        wallet_count: walletData.length,
        transaction_count: txData.length
      }).catch(console.error);
      
      lastUpdate.current = new Date();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Load from cache as fallback
      loadFromCache();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  // Enhance wallets with real-time data
  const enhanceWalletsData = async (wallets) => {
    try {
      const enhanced = await Promise.all(wallets.map(async (wallet) => {
        // Get spending analytics for each wallet
        const analytics = await walletAPI.getAnalytics(wallet.id).catch(() => null);
        
        return {
          ...wallet,
          analytics: analytics?.data || {},
          trend: calculateTrend(wallet.balance, wallet.previous_balance)
        };
      }));
      
      return enhanced;
    } catch (error) {
      console.error('Error enhancing wallets:', error);
      return wallets;
    }
  };

  // Calculate balance trend
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(2);
  };

  // Load from cache
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem('paywolt_dashboard');
      if (cachedData) {
        const { wallets, transactions, cards, statistics } = JSON.parse(cachedData);
        setWallets(wallets || []);
        setTransactions(transactions || []);
        setCards(cards || []);
        setStatistics(statistics || {});
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  };

  // Save to cache
  const saveToCache = useCallback(() => {
    try {
      const dataToCache = {
        wallets,
        transactions: transactions.slice(0, 10),
        cards,
        statistics,
        timestamp: Date.now()
      };
      localStorage.setItem('paywolt_dashboard', JSON.stringify(dataToCache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [wallets, transactions, cards, statistics]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://paywolt-backend.onrender.com';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Dashboard WebSocket connected');
      if (user?.id) {
        ws.current.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
          token: localStorage.getItem('paywolt_token')
        }));
        
        // Subscribe to real-time updates
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          channels: ['wallets', 'transactions', 'notifications', 'market']
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(initializeWebSocket, 5000);
    };
  }, [user?.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'wallet_update':
        handleWalletUpdate(data);
        break;
      case 'new_transaction':
        handleNewTransaction(data);
        break;
      case 'notification':
        handleNewNotification(data);
        break;
      case 'market_update':
        setMarketData(data.market);
        break;
      case 'provider_status':
        setProviderStatus(prev => ({
          ...prev,
          [data.provider]: data.status
        }));
        break;
      default:
        console.log('Unknown WebSocket message:', data.type);
    }
  };

  // Handle wallet update
  const handleWalletUpdate = (data) => {
    setWallets(prev => prev.map(wallet => 
      wallet.id === data.walletId 
        ? { ...wallet, ...data.updates }
        : wallet
    ));
  };

  // Handle new transaction
  const handleNewTransaction = (data) => {
    setTransactions(prev => [data.transaction, ...prev.slice(0, 9)]);
    
    // Update wallet balance
    setWallets(prev => prev.map(wallet => 
      wallet.id === data.walletId 
        ? { ...wallet, balance: data.newBalance }
        : wallet
    ));
  };

  // Handle new notification
  const handleNewNotification = (data) => {
    setNotifications(prev => [data.notification, ...prev]);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  // Handle deposit success
  const handleDepositSuccess = useCallback(async () => {
    await loadDashboardData();
    setDepositModalOpen(false);
  }, [loadDashboardData]);

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = { 
      EUR: '€', USD: '$', GBP: '£', NGN: '₦', 
      PKR: '₨', INR: '₹', JPY: '¥', CNY: '¥',
      BTC: '₿', ETH: 'Ξ', USDT: '₮'
    };
    return symbols[currency] || currency;
  };

  // Calculate total balance in base currency
  const calculateTotalBalance = useCallback(() => {
    return wallets.reduce((total, wallet) => {
      const rate = exchangeRates[wallet.currency] || 1;
      return total + (parseFloat(wallet.balance || 0) / rate);
    }, 0);
  }, [wallets, exchangeRates]);

  // Get spending by category
  const getSpendingByCategory = useCallback(() => {
    return statistics.spending_by_category || {
      'Food & Dining': 35,
      'Transport': 20,
      'Shopping': 25,
      'Entertainment': 10,
      'Bills': 10
    };
  }, [statistics]);

  // Get KYC status display
  const getKYCDisplay = () => {
    const levels = {
      0: { name: 'Unverified', color: 'text-slate-400', limit: '€100', stars: 0 },
      1: { name: 'Basic', color: 'text-blue-400', limit: '€1,000', stars: 1 },
      2: { name: 'Verified', color: 'text-yellow-400', limit: '€5,000', stars: 2 },
      3: { name: 'Premium', color: 'text-purple-400', limit: '€25,000', stars: 3 },
      4: { name: 'VIP', color: 'text-green-400', limit: 'Unlimited', stars: 4 }
    };
    return levels[kycLevel] || levels[0];
  };

  // Load AI suggestions
  const loadAISuggestions = async () => {
    try {
      const response = await api.get('/api/ai/suggestions', {
        params: {
          wallets: wallets.length,
          balance: calculateTotalBalance(),
          transactions: transactions.length
        }
      });
      setAiSuggestions(response.data?.suggestions || []);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    }
  };

  // Effects
  useEffect(() => {
    loadDashboardData();
    initializeWebSocket();
    
    // Set up auto-refresh
    refreshInterval.current = setInterval(() => {
      loadDashboardData();
    }, 60000); // Refresh every minute
    
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (ws.current) ws.current.close();
    };
  }, [loadDashboardData, initializeWebSocket]);

  // Save to cache when data changes
  useEffect(() => {
    if (wallets.length > 0 || transactions.length > 0) {
      saveToCache();
    }
  }, [wallets, transactions, saveToCache]);

  // Load AI suggestions when data is ready
  useEffect(() => {
    if (wallets.length > 0 && transactions.length > 0) {
      loadAISuggestions();
    }
  }, [wallets, transactions]);

  const totalBalance = calculateTotalBalance();
  const kycDisplay = getKYCDisplay();
  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
            />
            <motion.div
              className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-white font-bold text-lg mb-2">Loading your dashboard...</p>
          <p className="text-slate-400 text-sm">Securing your financial data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 max-w-7xl mx-auto">
      {/* Enhanced Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2 sm:mb-3 flex items-center gap-3">
            {greeting.greeting}, {user?.name?.split(' ')[0] || 'User'}! {greeting.emoji}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Your complete financial command center
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notifications')}
              className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <Bell className="w-5 h-5 text-slate-400" />
            </motion.button>
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{notifications.length}</span>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBalances(!showBalances)}
            className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            {showBalances ? (
              <Eye className="w-5 h-5 text-slate-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-slate-400" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced KYC & Tier Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-yellow-500/10 via-yellow-600/5 to-transparent border border-yellow-500/30 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-6 h-6 ${
                    i < kycDisplay.stars 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-slate-600'
                  }`} 
                />
              ))}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              userTier === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
              userTier === 'premium' ? 'bg-purple-500/20 text-purple-400' :
              userTier === 'pro' ? 'bg-blue-500/20 text-blue-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {userTier?.toUpperCase()} TIER
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`font-bold ${kycDisplay.color} text-base sm:text-lg mb-1`}>
              KYC Level {kycLevel} - {kycDisplay.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
              <span>Daily Limit: <strong className="text-yellow-400">{kycDisplay.limit}</strong></span>
              <span>•</span>
              <span>Monthly: <strong className="text-yellow-400">€{limits?.monthlyVolume || 10000}</strong></span>
              <span>•</span>
              <span>Cards: <strong className="text-yellow-400">{cards.length}/{limits?.cards || 5}</strong></span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {kycLevel < 3 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/kyc')}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded-xl text-yellow-400 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Upgrade KYC
              </motion.button>
            )}
            {userTier !== 'enterprise' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/upgrade')}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl text-purple-400 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade Tier
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-yellow-400" />
            <span className={`text-xs font-bold ${
              statistics.balance_change > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {statistics.balance_change > 0 ? '+' : ''}{statistics.balance_change || 0}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mb-1">
            {showBalances ? `€${totalBalance.toFixed(2)}` : '••••••'}
          </p>
          <p className="text-xs text-slate-400">Total Balance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="w-5 h-5 text-green-400" />
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mb-1">
            €{statistics.monthly_income || 0}
          </p>
          <p className="text-xs text-slate-400">Monthly Income</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <ArrowDownLeft className="w-5 h-5 text-red-400" />
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mb-1">
            €{statistics.monthly_spending || 0}
          </p>
          <p className="text-xs text-slate-400">Monthly Spending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-purple-400">
              {statistics.savings_rate || 15}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mb-1">
            €{statistics.monthly_savings || 0}
          </p>
          <p className="text-xs text-slate-400">Savings Rate</p>
        </motion.div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { 
            icon: Send, 
            color: 'emerald', 
            title: 'Send Money', 
            subtitle: 'Instant transfers', 
            path: '/send-money',
            gradient: 'from-emerald-500/20 to-emerald-600/20',
            available: true
          },
          { 
            icon: Building2, 
            color: 'purple', 
            title: 'IBAN', 
            subtitle: 'EU account', 
            path: '/request-iban',
            gradient: 'from-purple-500/20 to-purple-600/20',
            available: kycLevel >= 2
          },
          { 
            icon: CreditCard, 
            color: 'cyan', 
            title: 'Cards', 
            subtitle: cards.length > 0 ? `${cards.length} active` : 'Get card', 
            path: '/cards',
            gradient: 'from-cyan-500/20 to-cyan-600/20',
            available: true
          },
          { 
            icon: Bitcoin, 
            color: 'orange', 
            title: 'Crypto', 
            subtitle: 'Buy & sell', 
            path: '/crypto',
            gradient: 'from-orange-500/20 to-orange-600/20',
            available: hasFeature('crypto')
          },
          { 
            icon: Banknote, 
            color: 'yellow', 
            title: 'Add Money', 
            subtitle: 'Deposit funds', 
            action: () => setDepositModalOpen(true),
            gradient: 'from-yellow-500/20 to-yellow-600/20',
            featured: true,
            available: true
          }
        ].map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + index * 0.05 }}
            whileHover={{ scale: action.available ? 1.03 : 1, y: action.available ? -6 : 0 }}
            whileTap={{ scale: action.available ? 0.97 : 1 }}
            onClick={() => {
              if (!action.available) return;
              action.action ? action.action() : navigate(action.path);
            }}
            disabled={!action.available}
            className={`bg-white/5 backdrop-blur-xl border ${
              action.featured ? 'border-2 border-yellow-500/40' : 'border-white/10'
            } ${
              action.available ? 'hover:border-' + action.color + '-500/50' : 'opacity-50 cursor-not-allowed'
            } rounded-2xl p-4 sm:p-5 text-left group transition-all relative overflow-hidden`}
          >
            {!action.available && (
              <div className="absolute top-2 right-2">
                <Info className="w-4 h-4 text-slate-500" />
              </div>
            )}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 border border-${action.color}-500/30 ${
              action.available ? 'group-hover:scale-110' : ''
            } transition-transform`}>
              <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${action.color}-400`} />
            </div>
            <h3 className={`font-bold text-white text-sm sm:text-base mb-1 flex items-center gap-1 ${
              action.featured ? 'text-yellow-400' : ''
            }`}>
              {action.title}
              {action.featured && <Sparkles className="w-3 h-3" />}
            </h3>
            <p className="text-xs text-slate-400">{action.subtitle}</p>
          </motion.button>
        ))}
      </div>

      {/* Wallets Section with Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text">
              Wallets & Accounts
            </h2>
          </div>
          <button
            onClick={() => navigate('/wallets')}
            className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm font-bold transition-colors px-3 py-2 rounded-xl hover:bg-yellow-500/10 flex items-center gap-1"
          >
            Manage All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {wallets.length > 0 ? (
            wallets.slice(0, 5).map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => navigate(`/wallets/${wallet.id}`)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-yellow-500/50 rounded-3xl p-5 sm:p-6 cursor-pointer group transition-all relative overflow-hidden"
              >
                {/* Background gradient animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl sm:text-4xl">
                      {wallet.type === 'crypto' ? '🪙' : '💰'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-white/10 rounded-full">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {wallet.currency}
                        </p>
                      </div>
                      {wallet.is_primary && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Available Balance</p>
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {showBalances ? (
                        `${getCurrencySymbol(wallet.currency)}${parseFloat(wallet.balance || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      ) : (
                        '••••••'
                      )}
                    </p>
                    {wallet.trend && (
                      <p className={`text-xs mt-1 ${
                        wallet.trend > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {wallet.trend > 0 ? '↑' : '↓'} {Math.abs(wallet.trend)}% this month
                      </p>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWallet(wallet);
                        setDepositModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded-xl text-yellow-400 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/send-money');
                      }}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </button>
                  </div>
                  
                  {/* Status & Analytics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-slate-400">Active</span>
                    </div>
                    {wallet.analytics?.transactions_count > 0 && (
                      <span className="text-xs text-slate-500">
                        {wallet.analytics.transactions_count} txns
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : null}

          {/* Add New Wallet Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/wallets/create')}
            className="bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/20 hover:border-yellow-500/50 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center min-h-[200px] group transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-all group-hover:scale-110">
              <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
            <h3 className="font-bold text-white text-base sm:text-lg mb-2">Create Wallet</h3>
            <p className="text-xs sm:text-sm text-slate-400">40+ currencies</p>
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7"
      >
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Activity</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500/50"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm font-bold transition-colors px-3 py-2 rounded-xl hover:bg-yellow-500/10 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + index * 0.05 }}
                whileHover={{ scale: 1.01, x: 4 }}
                onClick={() => navigate(`/transactions/${tx.id}`)}
                className="flex items-center justify-between p-4 sm:p-5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-transparent hover:border-yellow-500/20 transition-all group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    tx.type === 'credit' || tx.type === 'deposit'
                      ? 'bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30'
                  }`}>
                    {tx.type === 'credit' || tx.type === 'deposit' ? (
                      <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                      {tx.description || tx.merchant || tx.type || 'Transaction'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <span>
                        {new Date(tx.created_at || tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {tx.status && (
                        <>
                          <span>•</span>
                          <span className={`capitalize ${
                            tx.status === 'completed' ? 'text-green-400' :
                            tx.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {tx.status}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <span className={`text-base sm:text-xl font-bold whitespace-nowrap ${
                    tx.type === 'credit' || tx.type === 'deposit' ? 'text-green-400' : 'text-white'
                  }`}>
                    {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                    {getCurrencySymbol(tx.currency)}
                    {parseFloat(tx.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  {tx.fee && tx.fee > 0 && (
                    <p className="text-xs text-slate-500">
                      Fee: {getCurrencySymbol(tx.currency)}{tx.fee}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="text-5xl sm:text-6xl mb-4 opacity-30">📜</div>
              <p className="text-slate-400 text-base sm:text-lg">No transactions yet</p>
              <p className="text-slate-500 text-xs sm:text-sm mt-2">Start by adding money to your wallet</p>
            </div>
          )}
        </div>

        {transactions.length > 5 && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-slate-400 hover:text-white transition-all"
            >
              {transactions.length - 5} more transactions →
            </button>
          </div>
        )}
      </motion.div>

      {/* Spending Analytics */}
      {statistics.spending_by_category && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-5">
            <PieChart className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Spending Breakdown</h2>
          </div>
          
          <div className="space-y-3">
            {Object.entries(getSpendingByCategory()).map(([category, percentage], index) => (
              <div key={category} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: [
                    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'
                  ][index % 5]
                }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{category}</span>
                    <span className="text-slate-400">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        background: [
                          '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'
                        ][index % 5]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <AIInsightsPanel 
          wallets={wallets} 
          transactions={transactions}
          statistics={statistics}
          suggestions={aiSuggestions}
        />
      </motion.div>

      {/* Provider Status Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            Object.values(providerStatus).some(p => p.operational) 
              ? 'bg-green-400' 
              : 'bg-red-400'
          } animate-pulse`} />
          <span>System Status: Operational</span>
        </div>
        <span>•</span>
        <span>Last updated: {lastUpdate.current.toLocaleTimeString()}</span>
        <span>•</span>
        <span>
          Providers: {Object.values(providerStatus).filter(p => p.operational).length}/
          {Object.keys(providerStatus).length} online
        </span>
      </motion.div>
      
      {/* Deposit Modal */}
      <DepositModal 
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
        wallets={wallets}
        selectedWallet={selectedWallet}
      />
    </div>
  );
}