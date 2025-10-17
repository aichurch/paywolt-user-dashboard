import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Building2,
  Wallet,
  Bitcoin,
  Sparkles,
  TrendingUp,
  ArrowDownLeft,
  Lock,
  Copy,
  ExternalLink,
  Settings,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  Zap,
  Star,
  Globe
} from 'lucide-react';

export default function UltraPremiumWallets() {
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [particles, setParticles] = useState([]);
  const [copiedIBAN, setCopiedIBAN] = useState(null);

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

  const mockWallets = [
    {
      id: 1,
      type: 'iban',
      currency: 'EUR',
      balance: 5420.50,
      provider: 'Treezor',
      interestRate: 1.5,
      iban: 'GR16 0110 1050 0000 1054 7023 795',
      earned: null
    },
    {
      id: 2,
      type: 'ewallet',
      currency: 'USD',
      balance: 2890.25,
      provider: 'PayWolt',
      interestRate: null,
      iban: null,
      earned: null
    },
    {
      id: 3,
      type: 'crypto',
      currency: 'BTC',
      balance: 0.0547,
      provider: 'ZeroHash',
      interestRate: null,
      iban: null,
      earned: null
    },
    {
      id: 4,
      type: 'savings',
      currency: 'EUR',
      balance: 1500,
      provider: 'PayWolt Savings',
      interestRate: 2.5,
      iban: null,
      lockedUntil: new Date('2025-12-30'),
      earned: 12.50
    },
    {
      id: 5,
      type: 'ewallet',
      currency: 'GBP',
      balance: 1250,
      provider: 'PayWolt',
      interestRate: null,
      iban: null,
      earned: null
    },
  ];

  const [wallets] = useState(mockWallets);

  const tabs = [
    { id: 'all', label: 'Όλα', icon: Wallet, color: 'from-blue-400 to-blue-600' },
    { id: 'iban', label: 'IBAN', icon: Building2, color: 'from-purple-400 to-purple-600' },
    { id: 'ewallet', label: 'E-Wallet', icon: Wallet, color: 'from-blue-400 to-blue-600' },
    { id: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'from-orange-400 to-orange-600' },
    { id: 'savings', label: 'Αποταμίευση', icon: Lock, color: 'from-green-400 to-green-600' }
  ];

  const aiInsights = [
    { type: 'success', icon: TrendingUp, text: 'Κερδίσατε €12.50 σε τόκους αυτόν το μήνα', action: 'Προβολή' },
    { type: 'info', icon: Sparkles, text: 'Το AI προτείνει να μετακινήσετε €200 στο savings vault', action: 'Αυτόματη αποταμίευση' },
    { type: 'warning', icon: AlertCircle, text: 'Το USD wallet προσφέρει 1.5% τόκο μηνιαίως', action: 'Μάθετε περισσότερα' }
  ];

  const getCurrencySymbol = (currency) => {
    const symbols = { EUR: '€', USD: '$', GBP: '£', BTC: '₿', ETH: 'Ξ', USDT: '₮' };
    return symbols[currency] || currency;
  };

  const getCurrencyFlag = (currency) => {
    const flags = { EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', BTC: '₿', ETH: 'Ξ' };
    return flags[currency] || '💰';
  };

  const getWalletIcon = (type) => {
    switch (type) {
      case 'iban': return Building2;
      case 'ewallet': return Wallet;
      case 'crypto': return Bitcoin;
      case 'savings': return Lock;
      default: return Wallet;
    }
  };

  const getWalletColor = (type) => {
    switch (type) {
      case 'iban': return 'from-purple-400 to-purple-600';
      case 'ewallet': return 'from-blue-400 to-blue-600';
      case 'crypto': return 'from-orange-400 to-orange-600';
      case 'savings': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const filteredWallets = activeTab === 'all' 
    ? wallets 
    : wallets.filter(w => w.type === activeTab);

  const copyIBAN = (iban, id) => {
    navigator.clipboard.writeText(iban);
    setCopiedIBAN(id);
    setTimeout(() => setCopiedIBAN(null), 2000);
  };

  const totalBalance = wallets
    .filter(w => ['EUR', 'USD', 'GBP'].includes(w.currency))
    .reduce((sum, w) => {
      let eurValue = w.balance;
      if (w.currency === 'USD') eurValue = w.balance * 0.92;
      if (w.currency === 'GBP') eurValue = w.balance * 1.17;
      return sum + eurValue;
    }, 0);

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
                <Wallet className="w-8 h-8 text-slate-950" />
              </motion.div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  Τα Πορτοφόλια μου
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  Διαχείριση νομισμάτων, crypto & αποταμιεύσεων
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBalances(!showBalances)}
                className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl transition-all flex items-center gap-2 font-bold text-white"
              >
                {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                {showBalances ? 'Απόκρυψη' : 'Εμφάνιση'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Νέο Πορτοφόλι
              </motion.button>
            </div>
          </div>

          {/* Total Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-bold mb-2">Συνολικό Υπόλοιπο (EUR)</p>
                <div className="text-5xl font-black text-white">
                  {showBalances ? `€${totalBalance.toFixed(2)}` : '••••••••'}
                </div>
                <p className="text-sm text-gray-400 mt-2">Σε όλα τα πορτοφόλια</p>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { icon: Shield, label: 'Ασφαλής', color: 'text-green-400' },
                  { icon: Zap, label: 'Ενεργός', color: 'text-yellow-400' },
                  { icon: Star, label: 'Premium', color: 'text-purple-400' }
                ].map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1, type: "spring" }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <badge.icon className={`w-6 h-6 ${badge.color}`} />
                    </div>
                    <span className="text-xs text-gray-400 font-bold">{badge.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-2 rounded-2xl inline-flex gap-2 shadow-xl mb-8"
        >
          {tabs.map((tab, idx) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all text-sm overflow-hidden ${
                activeTab === tab.id ? 'text-slate-950' : 'text-gray-300 hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeWalletTab"
                  className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnimatePresence mode="popLayout">
            {filteredWallets.map((wallet, index) => {
              const WalletIcon = getWalletIcon(wallet.type);
              const walletColor = getWalletColor(wallet.type);

              return (
                <motion.div
                  key={wallet.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ delay: index * 0.05, type: "spring" }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5 }}
                  />

                  {/* Header */}
                  <div className="relative flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 bg-gradient-to-br ${walletColor} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <WalletIcon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-3xl">{getCurrencyFlag(wallet.currency)}</span>
                          <h3 className="text-2xl font-black text-white">{wallet.currency}</h3>
                        </div>
                        <p className="text-sm text-gray-400 font-semibold">{wallet.provider}</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Settings className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  </div>

                  {/* Balance */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 font-bold mb-2">Διαθέσιμο Υπόλοιπο</p>
                    <div className="text-4xl font-black text-white">
                      {showBalances ? (
                        <>
                          {getCurrencySymbol(wallet.currency)}
                          {wallet.currency === 'BTC' ? wallet.balance.toFixed(4) : parseFloat(wallet.balance).toFixed(2)}
                        </>
                      ) : (
                        '••••••'
                      )}
                    </div>
                  </div>

                  {/* IBAN */}
                  {wallet.type === 'iban' && wallet.iban && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 backdrop-blur-xl bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase">IBAN</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyIBAN(wallet.iban, wallet.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          {copiedIBAN === wallet.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </motion.button>
                      </div>
                      <code className="text-sm text-white font-mono font-bold">{wallet.iban}</code>
                    </motion.div>
                  )}

                  {/* Interest Rate */}
                  {wallet.interestRate && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 flex items-center gap-2 p-4 bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl"
                    >
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-bold text-green-400">
                        {wallet.interestRate}% Επιτόκιο
                      </span>
                      {wallet.earned && (
                        <span className="ml-auto text-sm font-black text-green-400">
                          +{getCurrencySymbol(wallet.currency)}{wallet.earned.toFixed(2)}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Locked */}
                  {wallet.lockedUntil && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 flex items-center gap-2 p-4 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-400/30 rounded-xl"
                    >
                      <Lock className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-400">
                        Κλειδωμένο έως {new Date(wallet.lockedUntil).toLocaleDateString('el-GR')}
                      </span>
                      <Clock className="w-4 h-4 text-yellow-400 ml-auto" />
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/30 hover:to-amber-600/30 border border-yellow-400/30 rounded-xl text-yellow-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Κατάθεση
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Αποστολή
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 px-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {wallet.type === 'crypto' ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Μετατροπή
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Λεπτομέρειες
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <span className="text-xs text-gray-400 font-bold">Ενεργό</span>
                    </div>
                    <span className="text-xs text-gray-500 font-bold uppercase">{wallet.type}</span>
                  </div>
                </motion.div>
              );
            })}

            {/* Add New Wallet */}
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border-2 border-dashed border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-full flex items-center justify-center mb-5 group-hover:from-yellow-400/30 group-hover:to-amber-600/30 transition-all"
              >
                <Plus className="w-10 h-10 text-yellow-400" />
              </motion.div>
              <h3 className="font-black text-white text-2xl mb-2">Νέο Πορτοφόλι</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Υποστήριξη για 40+ νομίσματα, crypto & savings vaults
              </p>
            </motion.button>
          </AnimatePresence>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
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
              <h3 className="text-2xl font-black text-white">AI Wallet Insights</h3>
              <p className="text-sm text-gray-400">Έξυπνες προτάσεις από WoltAI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => {
              const colors = {
                success: 'from-green-500/20 to-emerald-600/20 border-green-500/30',
                info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                warning: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
              };
              const iconColors = {
                success: 'text-green-400',
                info: 'text-blue-400',
                warning: 'text-orange-400'
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`p-6 rounded-xl bg-gradient-to-br ${colors[insight.type]} border cursor-pointer group`}
                >
                  <insight.icon className={`w-6 h-6 ${iconColors[insight.type]} mb-3`} />
                  <p className="text-sm text-white font-medium mb-3">{insight.text}</p>
                  <button className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 group-hover:gap-2">
                    {insight.action}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}