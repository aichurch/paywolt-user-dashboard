// src/pages/SendMoney.jsx
// Ultra-Premium Send Money — Production Ready (English UI & code)
// - Auth: reads JWT from localStorage ("token") set by your AuthContext
// - Backend: GET /api/wallets, POST /api/wallets/transfer
// - Env: VITE_API_URL (required), VITE_WS_URL (optional)
// - Fully responsive, glassmorphism UI with framer-motion animations

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, User, Mail, Phone, Wallet, ArrowRight,
  CheckCircle2, AlertCircle, Loader2, Hash, Sparkles,
  Clock, Shield, TrendingUp, Lock, ChevronRight,
  Download, Share2, Info, X, Activity, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';
const WS_URL = import.meta.env.VITE_WS_URL || '';

const recipientTypes = [
  {
    id: 'paywolt_id',
    name: 'PayWolt ID',
    icon: Hash,
    placeholder: '@123456',
    description: 'Instant P2P transfer via handle',
    color: 'from-yellow-400 to-amber-600',
    bgColor: 'from-yellow-500/20 to-amber-600/20',
    fee: 0,
    speed: 'Instant',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    placeholder: 'user@example.com',
    description: 'Send by email',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'from-blue-500/20 to-blue-600/20',
    fee: 0,
    speed: 'Instant',
  },
  {
    id: 'phone',
    name: 'Phone',
    icon: Phone,
    placeholder: '+30 6xxxxxxxxx',
    description: 'Send by phone number',
    color: 'from-green-400 to-green-600',
    bgColor: 'from-green-500/20 to-green-600/20',
    fee: 0,
    speed: 'Instant',
  },
];

function currencySymbol(currency) {
  const map = { EUR: '€', USD: '$', GBP: '£' };
  return map[currency] || currency || '';
}

export default function SendMoney() {
  const { user, isAuthenticated } = useAuth(); // if not wrapped with withAuth, ensure route guards elsewhere
  const [step, setStep] = useState(1);

  // Wallets
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);

  // Form
  const [recipientType, setRecipientType] = useState('paywolt_id');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Result
  const [transactionId, setTransactionId] = useState('');
  const [reference, setReference] = useState('');

  const selectedWallet = useMemo(
    () => wallets.find(w => w.id === selectedWalletId) || wallets[0],
    [wallets, selectedWalletId]
  );

  // Fetch wallets
  const fetchWallets = useCallback(async () => {
    try {
      setLoadingWallets(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/wallets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to load wallets: ${res.status} ${t}`);
      }
      const data = await res.json();
      const list = (data.wallets || []).map(w => ({
        id: w.id,
        currency: w.currencyCode || w.currency_code || 'EUR',
        balance: Number(w.balance ?? 0),
        available: Number(w.availableBalance ?? 0),
        pending: Number(w.pendingBalance ?? 0),
        isPrimary: !!w.isPrimary,
      }));
      setWallets(list);
      if (list.length > 0) setSelectedWalletId(list[0].id);
    } catch (e) {
      console.error(e);
      setError('Unable to load wallets. Please try again.');
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  useEffect(() => {
    if (!API_BASE) {
      setError('Missing VITE_API_URL configuration.');
      return;
    }
    fetchWallets();
  }, [fetchWallets]);

  const onFindRecipient = useCallback(() => {
    setError('');
    // We don’t need to resolve recipient up-front because backend accepts @handle/email/phone directly.
    if (!recipient.trim()) {
      setError('Please enter recipient identifier.');
      return;
    }
    // Quick client-side format hints only (backend validates strictly)
    if (recipientType === 'paywolt_id' && !recipient.startsWith('@')) {
      setError('PayWolt ID must start with @ (e.g., @943084).');
      return;
    }
    setStep(2);
  }, [recipient, recipientType]);

  const validateAmount = useCallback(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return 'Enter a valid amount.';
    if (!selectedWallet) return 'Select a wallet.';
    if (val > (selectedWallet?.available ?? 0)) {
      return 'Insufficient balance in the selected wallet.';
    }
    return '';
  }, [amount, selectedWallet]);

  const handleConfirm = useCallback(() => {
    const amtErr = validateAmount();
    if (amtErr) {
      setError(amtErr);
      return;
    }
    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }
    setError('');
    setStep(3);
  }, [validateAmount, pin]);

  const handleSend = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated (missing token).');

      if (!selectedWallet) throw new Error('No wallet selected.');
      const body = {
        recipient: recipient.trim(),
        amount: parseFloat(amount),
        currency: selectedWallet.currency,
        note: note?.trim() || '',
        pin: pin
      };

      const res = await fetch(`${API_BASE}/api/wallets/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const msg =
          data?.error ||
          data?.message ||
          `Transfer failed (${res.status}).`;
        throw new Error(msg);
      }

      // success
      setTransactionId(String(data.transactionId || ''));
      setReference(String(data.reference || ''));
      setSuccess('Transfer completed successfully.');
      setStep(4);

      // refresh wallets after success
      fetchWallets();
      setPin('');
    } catch (e) {
      console.error(e);
      const message = String(e?.message || 'Transfer failed. Please try again.');
      setError(
        message.includes('PIN')
          ? 'Invalid PIN. Please try again.'
          : message
      );
    } finally {
      setLoading(false);
    }
  }, [amount, note, pin, recipient, selectedWallet, fetchWallets]);

  const resetAll = useCallback(() => {
    setStep(1);
    setRecipient('');
    setRecipientType('paywolt_id');
    setAmount('');
    setNote('');
    setPin('');
    setError('');
    setSuccess('');
    setTransactionId('');
    setReference('');
  }, []);

  const stepVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: {
      opacity: 1, x: 0, scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    },
    exit: {
      opacity: 0, x: -50, scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Send className="w-8 h-8 text-slate-950" />
            </motion.div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                Send Money
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                Transfer funds instantly to anyone — @handle, email, or phone
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, text: 'Bank-grade Security', color: 'text-green-400' },
              { icon: Clock, text: 'Instant Delivery', color: 'text-yellow-400' },
              { icon: Sparkles, text: 'Low Fees', color: 'text-blue-400' },
              { icon: TrendingUp, text: 'Worldwide Ready', color: 'text-purple-400' }
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-center gap-3">
                <b.icon className={`w-5 h-5 ${b.color}`} />
                <span className="font-semibold text-white text-sm">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Recipient', icon: User },
              { num: 2, label: 'Amount', icon: Wallet },
              { num: 3, label: 'Confirm', icon: Lock },
              { num: 4, label: 'Complete', icon: CheckCircle2 },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 transition-all ${
                      step >= s.num
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-400 text-slate-950'
                        : 'bg-white/5 border-white/20 text-gray-500'
                    }`}
                    whileHover={{ scale: 1.08 }}
                  >
                    {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
                  </motion.div>
                  <span className={`text-xs mt-2 font-semibold ${step >= s.num ? 'text-yellow-400' : 'text-gray-500'}`}>{s.label}</span>
                </div>
                {idx < 3 && <div className={`h-0.5 flex-1 ${step > s.num ? 'bg-yellow-400' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl mb-6"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-200 text-sm flex-1">{success}</p>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 1: Recipient */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              {/* Recipient method */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Choose Transfer Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recipientTypes.map((type, idx) => {
                    const Icon = type.icon;
                    const active = recipientType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        onClick={() => { setRecipientType(type.id); setRecipient(''); setError(''); }}
                        whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}
                        className={`relative p-6 rounded-2xl transition-all overflow-hidden ${
                          active
                            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-400'
                            : 'backdrop-blur-xl bg-white/5 border border-white/10 hover:border-yellow-400/50'
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-lg font-black text-white mb-2">{type.name}</h4>
                          <p className="text-sm text-gray-400">{type.description}</p>
                          <div className="flex items-center justify-between text-xs mt-3">
                            <span className="text-gray-500">Fee: {type.fee === 0 ? 'Free' : type.fee}</span>
                            <span className="text-gray-500">{type.speed}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl"
              >
                <h3 className="text-2xl font-black text-white mb-6">Enter {recipientTypes.find(t => t.id === recipientType)?.name}</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                      Recipient {recipientTypes.find(t => t.id === recipientType)?.name}
                    </label>
                    <div className="relative group">
                      {(() => {
                        const Icon = recipientTypes.find(t => t.id === recipientType)?.icon || User;
                        return <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-yellow-400 transition-colors" />;
                      })()}
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onFindRecipient(); }}
                        placeholder={recipientTypes.find(t => t.id === recipientType)?.placeholder}
                        className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                      />
                      {recipient && (
                        <button onClick={() => setRecipient('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {recipientType === 'paywolt_id' && 'Format: @943084'}
                      {recipientType === 'email' && 'Format: user@example.com'}
                      {recipientType === 'phone' && 'Format: +3069xxxxxxx'}
                    </p>
                  </div>

                  <motion.button
                    onClick={onFindRecipient}
                    disabled={!recipient.trim() || loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="relative w-full group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-5 rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="relative flex items-center justify-center gap-2 text-lg">
                      {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Checking…</>) : (<><Search className="w-5 h-5" /> Continue <ChevronRight className="w-5 h-5" /></>)}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Amount */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-colors font-semibold">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {/* Recipient summary */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-950 shadow-2xl">
                    {recipient?.[0] === '@' ? recipient?.[1]?.toUpperCase() || 'U' : (recipient?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-white">Recipient</h3>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg text-gray-300">
                        <Hash className="w-4 h-4 text-yellow-400" />
                        {recipient}
                      </span>
                      <span className="flex items-center gap-1.5 bg-blue-500/20 px-3 py-1 rounded-lg text-blue-400">
                        <Activity className="w-4 h-4" />
                        Method: {recipientTypes.find(r => r.id === recipientType)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Wallets */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-blue-400" />
                  Choose Wallet
                </h3>

                {loadingWallets ? (
                  <div className="text-gray-400">Loading wallets…</div>
                ) : wallets.length === 0 ? (
                  <div className="text-gray-400">No wallets found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {wallets.map((w, idx) => (
                      <motion.button
                        key={w.id}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => setSelectedWalletId(w.id)}
                        whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                          selectedWallet?.id === w.id
                            ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-amber-600/20'
                            : 'border-white/10 hover:border-yellow-400/50 bg-white/5'
                        }`}
                      >
                        <div className="relative">
                          <p className="text-sm font-bold text-gray-400 mb-2">{w.currency} Wallet</p>
                          <p className="text-3xl font-black text-white">
                            {currencySymbol(w.currency)}{(w.balance ?? 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Available: {currencySymbol(w.currency)}{(w.available ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Amount card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-6">Enter Amount</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Amount</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-400 group-focus-within:text-yellow-400 transition-colors">
                        {currencySymbol(selectedWallet?.currency || 'EUR')}
                      </span>
                      <input
                        type="number" step="0.01" min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-16 pr-4 py-6 text-4xl font-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                      <Wallet className="w-4 h-4" />
                      Available:&nbsp;
                      {currencySymbol(selectedWallet?.currency || 'EUR')}
                      {(selectedWallet?.available ?? 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-3">
                    {[10, 50, 100, 500].map((amt) => (
                      <motion.button
                        key={amt}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setAmount(String(amt))}
                        className="py-3 bg-white/10 hover:bg-gradient-to-br hover:from-yellow-500/20 hover:to-amber-600/20 border border-white/10 hover:border-yellow-400/50 rounded-xl text-white font-black transition-all"
                      >
                        {currencySymbol(selectedWallet?.currency || 'EUR')}{amt}
                      </motion.button>
                    ))}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Note (optional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a message…"
                      className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 font-medium placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                    />
                  </div>

                  {/* Summary */}
                  {!!amount && parseFloat(amount) > 0 && (
                    <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-400/30 rounded-2xl p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-300">Amount:</span>
                          <span className="font-black text-white">
                            {currencySymbol(selectedWallet?.currency || 'EUR')}
                            {Number(amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-300">Fees:</span>
                          <span className="text-green-400 font-black flex items-center gap-1">
                            <Sparkles className="w-4 h-4" /> FREE
                          </span>
                        </div>
                        <div className="border-t border-yellow-400/20 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-400 font-black text-xl">Total:</span>
                            <span className="text-yellow-400 font-black text-4xl">
                              {currencySymbol(selectedWallet?.currency || 'EUR')}
                              {Number(amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleConfirm}
                    disabled={!amount || Number(amount) <= 0}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="relative w-full group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-5 rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="relative flex items-center justify-center gap-2 text-lg">
                      Continue
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Confirm with PIN */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="max-w-lg mx-auto">
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-12 shadow-2xl text-center">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }} className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Lock className="w-12 h-12 text-slate-950" />
                  </div>
                </motion.div>

                <h3 className="text-3xl font-black text-white mb-3">Confirm Transaction</h3>
                <p className="text-gray-400 mb-8">Enter your 4-digit PIN to proceed</p>

                <div className="space-y-6">
                  <div>
                    <input
                      type="password" maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-6 text-white text-center text-5xl font-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500/50 tracking-widest"
                    />
                  </div>

                  {/* Summary */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">To:</span>
                        <span className="text-white font-bold">{recipient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-black text-xl">
                          {currencySymbol(selectedWallet?.currency || 'EUR')}
                          {Number(amount || 0).toFixed(2)}
                        </span>
                      </div>
                      {!!note && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Note:</span>
                          <span className="text-white">{note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-200 text-sm">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={() => setStep(2)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="py-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleSend}
                      disabled={pin.length !== 4 || loading}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="relative group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-4 rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>) : 'Confirm'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-12 shadow-2xl text-center overflow-hidden relative">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-50 animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                    <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
                  </div>
                </motion.div>

                <motion.h3 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
                  Transfer Successful 🎉
                </motion.h3>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="text-gray-300 text-xl mb-8">
                  {currencySymbol(selectedWallet?.currency || 'EUR')}
                  {Number(amount || 0).toFixed(2)} sent to <span className="text-white font-semibold">{recipient}</span>
                </motion.p>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Transaction ID</p>
                      <p className="text-white font-mono font-bold">{transactionId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Reference</p>
                      <p className="text-white font-mono font-bold">{reference || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">From Wallet</p>
                      <p className="text-white font-bold">{selectedWallet?.currency} Wallet</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Time</p>
                      <p className="text-white font-bold">{new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => window.print()}
                    className="py-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Receipt
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/transaction/${transactionId || reference || ''}`;
                      if (navigator.share) {
                        navigator.share({ title: 'PayWolt Transfer', text: 'Payment completed', url: shareUrl }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareUrl).then(() => setSuccess('Transaction link copied!'));
                      }
                    }}
                    className="py-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={resetAll}
                    className="relative group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-4 rounded-xl shadow-2xl"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      New Transfer
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
