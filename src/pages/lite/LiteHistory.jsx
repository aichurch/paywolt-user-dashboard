import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  Calendar,
  X,
  Receipt,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { transactionAPI } from '../../services/api';

export default function LiteHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getAll({ limit: 100 });
      setTransactions(response.data?.transactions || response.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
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

  const getTransactionType = (tx) => {
    // Normalize transaction type
    if (tx.type === 'credit' || tx.type === 'deposit' || tx.type === 'receive') {
      return 'income';
    }
    return 'expense';
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        tx.description?.toLowerCase().includes(query) ||
        tx.amount?.toString().includes(query) ||
        tx.currency?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all') {
      const txType = getTransactionType(tx);
      if (txType !== filterType) return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: transactions.length,
    income: transactions.filter(tx => getTransactionType(tx) === 'income').length,
    expense: transactions.filter(tx => getTransactionType(tx) === 'expense').length,
    totalIncome: transactions
      .filter(tx => getTransactionType(tx) === 'income')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
    totalExpense: transactions
      .filter(tx => getTransactionType(tx) === 'expense')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
  };

  // Group by date
  const groupedTransactions = {};
  filteredTransactions.forEach(tx => {
    const date = new Date(tx.created_at || tx.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(tx);
  });

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
          <p className="text-slate-400 text-sm">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/lite')}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </motion.button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Transaction History</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Total</p>
          </div>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-400 font-medium">Income</p>
          </div>
          <p className="text-2xl font-black text-green-400">{stats.income}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-xs text-red-400 font-medium">Expenses</p>
          </div>
          <p className="text-2xl font-black text-red-400">{stats.expense}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-yellow-400 font-medium">Net</p>
          </div>
          <p className={`text-lg sm:text-xl font-black ${
            stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            €{Math.abs(stats.totalIncome - stats.totalExpense).toFixed(0)}
          </p>
        </motion.div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative flex-1"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-slate-400" />
            </motion.button>
          )}
        </motion.div>

        <div className="flex gap-2">
          {/* Filter Toggle */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              showFilters || filterType !== 'all'
                ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {filterType !== 'all' && (
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </motion.button>

          {/* Export Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </motion.button>
        </div>
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {['all', 'income', 'expense'].map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  filterType === type
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {type === 'all' ? 'All' : type === 'income' ? 'Income' : 'Expenses'}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-6"
      >
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, txs], groupIndex) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (groupIndex * 0.05) }}
                className="flex items-center gap-3"
              >
                <Calendar className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {date}
                </h3>
                <div className="flex-1 h-px bg-white/5" />
              </motion.div>

              {/* Transactions */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 space-y-2">
                {txs.map((tx, index) => {
                  const txType = getTransactionType(tx);
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + (groupIndex * 0.05) + (index * 0.02) }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          txType === 'income'
                            ? 'bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30'
                        }`}>
                          {txType === 'income' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm truncate">
                            {tx.description || tx.type || 'Transaction'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(tx.created_at || tx.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {tx.status && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {tx.status}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`text-base sm:text-lg font-bold whitespace-nowrap ml-3 ${
                        txType === 'income' ? 'text-green-400' : 'text-white'
                      }`}>
                        {txType === 'income' ? '+' : '-'}
                        {getCurrencySymbol(tx.currency)}
                        {parseFloat(tx.amount).toFixed(2)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery || filterType !== 'all' ? 'No matches found' : 'No transactions yet'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by adding money to your wallet'}
            </p>
            {(searchQuery || filterType !== 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-xl transition-all"
              >
                Clear Filters
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}