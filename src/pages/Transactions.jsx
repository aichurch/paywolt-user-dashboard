import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Eye,
  FileText,
  Sparkles,
  BarChart3,
  Zap,
  Target,
  Activity
} from 'lucide-react';

export default function UltraPremiumTransactions() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 3
    }));
    setParticles(newParticles);
  }, []);

  const mockTransactions = [
    { id: 1, type: 'credit', description: 'Salary Payment', destination: 'ACME Corp', amount: 3500, currency: 'EUR', status: 'completed', provider: 'Treezor', aiTag: 'Recurring', created_at: new Date().toISOString() },
    { id: 2, type: 'debit', description: 'Restaurant', destination: 'Taverna Mykonos', amount: 45.50, currency: 'EUR', status: 'completed', provider: 'Flutterwave', aiTag: null, created_at: new Date().toISOString() },
    { id: 3, type: 'credit', description: 'Freelance Work', destination: 'john@paywolt.com', amount: 850, currency: 'EUR', status: 'completed', provider: 'PayWolt', aiTag: null, created_at: new Date().toISOString() },
    { id: 4, type: 'debit', description: 'Netflix Subscription', destination: 'Netflix Inc', amount: 12.99, currency: 'EUR', status: 'completed', provider: 'Treezor', aiTag: 'Recurring', created_at: new Date().toISOString() },
    { id: 5, type: 'debit', description: 'Grocery Shopping', destination: 'AB Vassilopoulos', amount: 89.20, currency: 'EUR', status: 'completed', provider: 'Flutterwave', aiTag: null, created_at: new Date().toISOString() },
    { id: 6, type: 'credit', description: 'Bitcoin Sale', destination: 'ZeroHash', amount: 2400, currency: 'EUR', status: 'pending', provider: 'ZeroHash', aiTag: 'High Value', created_at: new Date().toISOString() },
    { id: 7, type: 'debit', description: 'Coffee Shop', destination: 'Starbucks', amount: 5.50, currency: 'EUR', status: 'completed', provider: 'PayWolt', aiTag: null, created_at: new Date().toISOString() },
    { id: 8, type: 'debit', description: 'Gas Station', destination: 'BP Hellas', amount: 60, currency: 'EUR', status: 'failed', provider: 'Treezor', aiTag: null, created_at: new Date().toISOString() },
  ];

  const [transactions] = useState(mockTransactions);

  const filters = [
    { id: 'all', label: 'Όλα', icon: FileText, color: 'from-blue-400 to-blue-600' },
    { id: 'incoming', label: 'Εισερχόμενα', icon: ArrowDownLeft, color: 'from-green-400 to-green-600' },
    { id: 'outgoing', label: 'Εξερχόμενα', icon: ArrowUpRight, color: 'from-red-400 to-red-600' },
    { id: 'pending', label: 'Εκκρεμή', icon: Clock, color: 'from-orange-400 to-orange-600' },
  ];

  const stats = {
    totalVolume: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
    incoming: transactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
    outgoing: transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
    fees: 23.50,
  };

  const aiInsights = [
    { icon: TrendingUp, text: "Ξοδέψατε €213 σε εστιατόρια αυτή την εβδομάδα 🍝", type: 'info' },
    { icon: RefreshCw, text: "Ανιχνεύθηκε επαναλαμβανόμενη πληρωμή: Netflix (€12.99/μήνα)", type: 'warning' },
    { icon: CheckCircle2, text: "Εξοικονομήσατε 18% περισσότερο από τον προηγούμενο μήνα!", type: 'success' }
  ];

  const getCurrencySymbol = (currency) => {
    const symbols = { EUR: '€', USD: '$', GBP: '£', BTC: '₿', ETH: 'Ξ' };
    return symbols[currency] || currency;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/30', label: 'Ολοκληρώθηκε' };
      case 'pending':
        return { icon: Clock, color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-600/20', border: 'border-orange-500/30', label: 'Εκκρεμεί' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30', label: 'Απέτυχε' };
      default:
        return { icon: AlertCircle, color: 'text-gray-400', bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/30', label: 'Άγνωστο' };
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'credit') return ArrowDownLeft;
    if (type === 'debit') return ArrowUpRight;
    return RefreshCw;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'incoming' && tx.type !== 'credit') return false;
    if (activeFilter === 'outgoing' && tx.type !== 'debit') return false;
    if (activeFilter === 'pending' && tx.status !== 'pending') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(query) ||
        tx.destination?.toLowerCase().includes(query) ||
        tx.provider?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-600/30 blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <BarChart3 className="w-8 h-8 text-slate-950" />
              </motion.div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  Συναλλαγές
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  Όλη η δραστηριότητά σας σε wallets, crypto & κάρτες
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl transition-all flex items-center gap-2 font-bold text-white"
              >
                <Download className="w-5 h-5" />
                Εξαγωγή
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl transition-all flex items-center gap-2 font-bold text-white"
              >
                <Filter className="w-5 h-5" />
                Φίλτρα
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Συνολικός Όγκος', value: `€${stats.totalVolume.toFixed(2)}`, icon: DollarSign, color: 'from-yellow-400 to-amber-600', delay: 0.1 },
            { label: 'Εισερχόμενα', value: `€${stats.incoming.toFixed(2)}`, icon: ArrowDownLeft, color: 'from-green-400 to-green-600', delay: 0.15 },
            { label: 'Εξερχόμενα', value: `€${stats.outgoing.toFixed(2)}`, icon: ArrowUpRight, color: 'from-red-400 to-red-600', delay: 0.2 },
            { label: 'Τέλη', value: `€${stats.fees.toFixed(2)}`, icon: TrendingDown, color: 'from-orange-400 to-orange-600', delay: 0.25 },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: stat.delay, type: "spring" }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-gray-400">{stat.label}</span>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
              className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-slate-950" />
            </motion.div>
            <div>
              <h3 className="text-xl font-black text-white">AI Insights</h3>
              <p className="text-sm text-gray-400">Έξυπνη ανάλυση συναλλαγών</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => {
              const colors = {
                info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                warning: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
                success: 'from-green-500/20 to-emerald-600/20 border-green-500/30'
              };
              const iconColors = {
                info: 'text-blue-400',
                warning: 'text-orange-400',
                success: 'text-green-400'
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`p-5 rounded-xl bg-gradient-to-br ${colors[insight.type]} border cursor-pointer`}
                >
                  <insight.icon className={`w-6 h-6 ${iconColors[insight.type]} mb-3`} />
                  <p className="text-sm text-white font-medium">{insight.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-2 rounded-2xl inline-flex gap-2 shadow-xl">
            {filters.map((filter, idx) => (
              <motion.button
                key={filter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + idx * 0.05 }}
                onClick={() => setActiveFilter(filter.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all text-sm overflow-hidden ${
                  activeFilter === filter.id ? 'text-slate-950' : 'text-gray-300 hover:text-white'
                }`}
              >
                {activeFilter === filter.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className={`absolute inset-0 bg-gradient-to-r ${filter.color} rounded-xl`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <filter.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{filter.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση συναλλαγών..."
              className="w-full backdrop-blur-xl bg-white/95 hover:bg-white text-gray-900 border-0 rounded-xl pl-12 pr-4 py-3 font-medium placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border-b border-yellow-500/20">
                <tr>
                  <th className="text-left p-5 text-sm font-black text-white">Τύπος</th>
                  <th className="text-left p-5 text-sm font-black text-white">Περιγραφή</th>
                  <th className="text-left p-5 text-sm font-black text-white">Provider</th>
                  <th className="text-left p-5 text-sm font-black text-white">Ποσό</th>
                  <th className="text-left p-5 text-sm font-black text-white">Ημερομηνία</th>
                  <th className="text-left p-5 text-sm font-black text-white">Κατάσταση</th>
                  <th className="text-left p-5 text-sm font-black text-white">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => {
                  const TypeIcon = getTypeIcon(tx.type);
                  const statusConfig = getStatusConfig(tx.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + index * 0.03 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      className="border-b border-white/5 cursor-pointer transition-all"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <td className="p-5">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                            tx.type === 'credit'
                              ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30'
                              : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30'
                          }`}
                        >
                          <TypeIcon className={`w-6 h-6 ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`} />
                        </motion.div>
                      </td>
                      <td className="p-5">
                        <div>
                          <p className="font-bold text-white">{tx.description}</p>
                          <p className="text-sm text-gray-400">{tx.destination}</p>
                          {tx.aiTag && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-400/30 text-yellow-400 rounded-full text-xs font-bold"
                            >
                              <Sparkles className="w-3 h-3" />
                              {tx.aiTag}
                            </motion.span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="text-sm font-medium text-gray-300">{tx.provider}</span>
                      </td>
                      <td className="p-5">
                        <span className={`text-xl font-black ${tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                          {tx.type === 'credit' ? '+' : '-'}
                          {getCurrencySymbol(tx.currency)}
                          {parseFloat(tx.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="text-sm font-medium text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString('el-GR')}
                        </span>
                      </td>
                      <td className="p-5">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${statusConfig.bg} border ${statusConfig.border}`}
                        >
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-xs font-bold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </motion.div>
                      </td>
                      <td className="p-5">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        >
                          <Eye className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-7xl mb-4 opacity-20">📭</div>
                <p className="text-gray-400 text-xl font-semibold">Δεν βρέθηκαν συναλλαγές</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}