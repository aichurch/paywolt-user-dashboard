import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Plus,
  Receipt,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  RefreshCw,
  Info,
  Sparkles
} from 'lucide-react';
import { walletAPI, transactionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function LiteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [walletsRes, transactionsRes] = await Promise.all([
        walletAPI.getAll(),
        transactionAPI.getAll({ limit: 10 })
      ]);
      
      setWallets(walletsRes.data?.wallets || walletsRes.wallets || []);
      setTransactions(transactionsRes.data?.transactions || transactionsRes.transactions || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { 
      EUR: '€', 
      USD: '$', 
      GBP: '£', 
      NGN: '₦',
      BTC: '₿',
      ETH: 'Ξ'
    };
    return symbols[currency] || currency;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalBalance = wallets.reduce((sum, w) => {
    return sum + parseFloat(w.balance || 0);
  }, 0);

  // Calculate 30-day change (mock data - replace with real API)
  const balanceChange = 12.5;
  const isPositive = balanceChange > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Here's your balance overview</p>
        </div>
        
        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
          >
            <Info className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-yellow-400" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Total Balance</p>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4">
                {showBalance ? (
                  <motion.h2
                    key="balance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-black text-white"
                  >
                    €{totalBalance.toFixed(2)}
                  </motion.h2>
                ) : (
                  <motion.h2
                    key="hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-black text-white"
                  >
                    ••••••
                  </motion.h2>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5 text-slate-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Change Indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                isPositive 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-bold ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? '+' : ''}{balanceChange}%
              </span>
            </motion.div>
          </div>

          {/* Quick Wallets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wallets.slice(0, 3).map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.05) }}
                whileHover={{ scale: 1.05, y: -2 }}
                onClick={() => navigate('/lite/wallets')}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {wallet.currency}
                  </p>
                  <CreditCard className="w-3.5 h-3.5 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                </div>
                <p className="text-base sm:text-lg font-bold text-white">
                  {showBalance ? (
                    `${getCurrencySymbol(wallet.currency)}${parseFloat(wallet.balance || 0).toFixed(2)}`
                  ) : (
                    '••••'
                  )}
                </p>
              </motion.div>
            ))}
            
            {/* View All Wallets Card */}
            {wallets.length > 3 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.05, y: -2 }}
                onClick={() => navigate('/lite/wallets')}
                className="p-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl border border-yellow-500/30 transition-all"
              >
                <p className="text-xs font-bold text-yellow-400 mb-2">View All</p>
                <p className="text-lg font-bold text-yellow-400">
                  +{wallets.length - 3} more
                </p>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/lite/send')}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl text-center group transition-all"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
            <Send className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="font-bold text-white text-sm sm:text-lg mb-1">Send</h3>
          <p className="text-[10px] sm:text-xs text-slate-400">Transfer money</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/lite/add')}
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 hover:from-yellow-500/20 hover:to-yellow-600/10 backdrop-blur-xl border-2 border-yellow-500/40 p-4 sm:p-6 rounded-2xl text-center group transition-all shadow-lg shadow-yellow-500/10"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/30">
            <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-slate-900 font-bold" />
          </div>
          <h3 className="font-bold text-yellow-400 text-sm sm:text-lg mb-1">Add Money</h3>
          <p className="text-[10px] sm:text-xs text-slate-400">Deposit funds</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/lite/history')}
          className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl text-center group transition-all"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
            <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="font-bold text-white text-sm sm:text-lg mb-1">History</h3>
          <p className="text-[10px] sm:text-xs text-slate-400">View transactions</p>
        </motion.button>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h2>
          </div>
          <button
            onClick={() => navigate('/lite/history')}
            className="text-yellow-400 text-xs sm:text-sm font-bold hover:text-yellow-300 transition-colors flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {transactions.slice(0, 5).map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index * 0.05) }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${
                  tx.type === 'credit' || tx.type === 'deposit'
                    ? 'bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30'
                }`}>
                  {tx.type === 'credit' || tx.type === 'deposit' ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {tx.description || tx.type || 'Transaction'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.created_at || tx.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <span className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                tx.type === 'credit' || tx.type === 'deposit' ? 'text-green-400' : 'text-white'
              }`}>
                {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                {getCurrencySymbol(tx.currency)}
                {parseFloat(tx.amount).toFixed(2)}
              </span>
            </motion.div>
          ))}

          {transactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm">No transactions yet</p>
              <p className="text-slate-500 text-xs mt-1">Start by adding money to your wallet</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}