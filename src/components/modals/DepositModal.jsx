// DepositModal.jsx - Production Ready with Full Provider Integration
// Path: /src/components/modals/DepositModal.jsx

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Building2,
  Bitcoin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Info,
  ArrowLeft,
  Sparkles,
  Clock,
  Shield,
  DollarSign,
  Wallet,
  ExternalLink,
  Smartphone,
  Globe,
  Banknote
} from 'lucide-react';
import api, { paymentAPI, walletAPI } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

export default function DepositModal({ isOpen, onClose, wallets = [], onSuccess }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [providers, setProviders] = useState([]);
  const [processingTime, setProcessingTime] = useState(0);
  
  const { showNotification, success, error: showError, info: showInfo } = useNotifications();

  // Payment methods with provider mapping
  const methods = [
    {
      id: 'card',
      name: 'Card Payment',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      fee: '2%',
      minAmount: 10,
      maxAmount: 10000,
      time: 'Instant',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      providers: ['flutterwave', 'paysafe'],
      features: ['Instant transfer', '3D Secure', 'All major cards', 'Mobile payment']
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'SEPA, IBAN, Wire Transfer',
      fee: '€0.50',
      minAmount: 50,
      maxAmount: 50000,
      time: '1-2 business days',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      providers: ['treezor', 'nium'],
      features: ['Low fees', 'SEPA instant', 'High limits', 'Bank-grade security']
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'M-PESA, Orange Money, MTN',
      fee: '1.5%',
      minAmount: 5,
      maxAmount: 5000,
      time: '5-10 minutes',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      providers: ['flutterwave'],
      features: ['Local payment', 'Quick processing', 'SMS confirmation', 'Wide coverage']
    },
    {
      id: 'crypto',
      name: 'Crypto Deposit',
      icon: Bitcoin,
      description: 'BTC, ETH, USDT, USDC',
      fee: 'Network fee only',
      minAmount: 20,
      maxAmount: 100000,
      time: '10-30 minutes',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      providers: ['zerohash'],
      features: ['No limits', 'Fast confirmation', 'Multiple networks', 'Low fees']
    }
  ];

  // Load available providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await paymentAPI.getProviders();
        setProviders(response?.providers || []);
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      }
    };
    fetchProviders();
  }, []);

  // Auto-select first wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      const eurWallet = wallets.find(w => w.currency === 'EUR');
      setSelectedWallet(eurWallet || wallets[0]);
    }
  }, [wallets]);

  // Reset modal state
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setMethod(null);
        setAmount('');
        setError('');
        setPaymentData(null);
        setProcessingTime(0);
      }, 300);
    }
  }, [isOpen]);

  // Processing timer
  useEffect(() => {
    let interval;
    if (step === 3) {
      interval = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const getCurrencySymbol = (currency) => {
    const symbols = { EUR: '€', USD: '$', GBP: '£', NGN: '₦', BTC: '₿', ETH: 'Ξ', USDT: '₮' };
    return symbols[currency] || currency;
  };

  const calculateFee = useCallback(() => {
    const amt = parseFloat(amount) || 0;
    const selectedMethod = methods.find(m => m.id === method);
    
    if (!selectedMethod) return 0;
    
    if (method === 'card') return amt * 0.02;
    if (method === 'bank') return 0.50;
    if (method === 'mobile') return amt * 0.015;
    if (method === 'crypto') return 0.001; // Network fee estimate
    return 0;
  }, [amount, method]);

  const calculateTotal = useCallback(() => {
    const amt = parseFloat(amount) || 0;
    return amt + calculateFee();
  }, [amount, calculateFee]);

  const validateAmount = useCallback(() => {
    const amt = parseFloat(amount) || 0;
    const selectedMethod = methods.find(m => m.id === method);
    
    if (!selectedMethod) return 'Please select a payment method';
    
    if (amt < selectedMethod.minAmount) {
      return `Minimum deposit is ${getCurrencySymbol(selectedWallet?.currency || 'EUR')}${selectedMethod.minAmount}`;
    }
    
    if (amt > selectedMethod.maxAmount) {
      return `Maximum deposit is ${getCurrencySymbol(selectedWallet?.currency || 'EUR')}${selectedMethod.maxAmount}`;
    }
    
    if (amt > 0 && selectedWallet && selectedWallet.limits) {
      if (amt > selectedWallet.limits.dailyDeposit) {
        return `Exceeds daily deposit limit of ${getCurrencySymbol(selectedWallet.currency)}${selectedWallet.limits.dailyDeposit}`;
      }
    }
    
    return null;
  }, [amount, method, selectedWallet]);

  const handleContinue = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setStep(3);

    try {
      const selectedMethod = methods.find(m => m.id === method);
      const provider = selectedMethod.providers[0];
      
      const payload = {
        amount: parseFloat(amount),
        currency: selectedWallet?.currency || 'EUR',
        walletId: selectedWallet?.id,
        method: method,
        provider: provider,
        metadata: {
          fee: calculateFee(),
          total: calculateTotal()
        }
      };

      const response = await paymentAPI.initialize(payload);

      if (response?.data) {
        if (response.data.payment_link) {
          // Redirect to payment page
          window.location.href = response.data.payment_link;
          return;
        }
        
        if (response.data.bankDetails) {
          // Bank transfer details
          setPaymentData({
            type: 'bank',
            ...response.data.bankDetails,
            amount: parseFloat(amount).toFixed(2),
            currency: selectedWallet?.currency || 'EUR'
          });
        } else if (response.data.cryptoAddress) {
          // Crypto address
          setPaymentData({
            type: 'crypto',
            ...response.data.cryptoAddress,
            amount: parseFloat(amount).toFixed(6)
          });
        } else if (response.data.mobileDetails) {
          // Mobile money
          setPaymentData({
            type: 'mobile',
            ...response.data.mobileDetails,
            amount: parseFloat(amount).toFixed(2),
            currency: selectedWallet?.currency || 'EUR'
          });
        }
        
        setStep(4);
        success('Payment initialized successfully');
        
        // Track transaction
        await api.post('/api/transactions/track', {
          type: 'deposit',
          status: 'pending',
          amount: parseFloat(amount),
          method: method,
          provider: provider
        });
      }
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError(err.response?.data?.message || 'Failed to process deposit. Please try again.');
      setStep(2);
      showError('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showInfo('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [showInfo]);

  const resetModal = useCallback(() => {
    setStep(1);
    setMethod(null);
    setAmount('');
    setError('');
    setPaymentData(null);
    setProcessingTime(0);
    onClose();
  }, [onClose]);

  const handleComplete = useCallback(() => {
    if (onSuccess) {
      onSuccess({
        amount: parseFloat(amount),
        method: method,
        walletId: selectedWallet?.id
      });
    }
    resetModal();
  }, [amount, method, selectedWallet, onSuccess, resetModal]);

  if (!isOpen) return null;

  const selectedMethodData = methods.find(m => m.id === method);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 3 ? undefined : resetModal}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text">
                  Deposit Money
                </h2>
                <p className="text-slate-400 text-sm">Add funds to your wallet</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetModal}
              disabled={step === 3 && loading}
              className="p-2 hover:bg-red-500/20 rounded-xl transition-all text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-slate-900/50">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
              <span className={step >= 1 ? 'text-yellow-400' : ''}>Method</span>
              <span className={step >= 2 ? 'text-yellow-400' : ''}>Amount</span>
              <span className={step >= 3 ? 'text-yellow-400' : ''}>Process</span>
              <span className={step >= 4 ? 'text-yellow-400' : ''}>Complete</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            
            {/* Step 1: Select Method */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Choose Payment Method</h3>
                </div>

                {methods.map((m, index) => {
                  const Icon = m.icon;
                  const isAvailable = m.providers.some(p => providers.includes(p));
                  
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: isAvailable ? 1.02 : 1, x: isAvailable ? 4 : 0 }}
                      whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                      onClick={() => {
                        if (isAvailable) {
                          setMethod(m.id);
                          setStep(2);
                        } else {
                          showInfo('This payment method is temporarily unavailable');
                        }
                      }}
                      disabled={!isAvailable}
                      className={`w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 p-5 rounded-2xl text-left group transition-all ${
                        !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${m.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform ${
                          !isAvailable ? 'grayscale' : ''
                        }`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-white">{m.name}</h4>
                            {!isAvailable && (
                              <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">
                                OFFLINE
                              </span>
                            )}
                            {isAvailable && m.providers.map(p => (
                              <span key={p} className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-bold uppercase">
                                {p}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-400 mb-3">{m.description}</p>
                          
                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {m.features.map((feature, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400">
                                {feature}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-slate-400">Fee: <strong className="text-white">{m.fee}</strong></span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-slate-400">Time: <strong className="text-white">{m.time}</strong></span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1.5">
                              <Banknote className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-slate-400">
                                {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{m.minAmount} - {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{m.maxAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ArrowRight className={`w-5 h-5 text-slate-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0 ${
                          !isAvailable ? 'hidden' : ''
                        }`} />
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* Step 2: Enter Amount */}
            {step === 2 && selectedMethodData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Back Button */}
                <motion.button
                  whileHover={{ x: -4 }}
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to methods
                </motion.button>

                {/* Selected Method Badge */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`${selectedMethodData.bgColor} border ${selectedMethodData.borderColor} p-5 rounded-2xl`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedMethodData.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      {(() => {
                        const Icon = selectedMethodData.icon;
                        return <Icon className="w-6 h-6 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-base">{selectedMethodData.name}</p>
                      <p className="text-xs text-slate-400">
                        {selectedMethodData.providers.join(' • ')} • {selectedMethodData.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Fee</p>
                      <p className={`font-bold ${selectedMethodData.textColor}`}>{selectedMethodData.fee}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Wallet Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3">
                    <Wallet className="w-4 h-4 text-yellow-400" />
                    Select Wallet
                  </label>
                  <select
                    value={selectedWallet?.id}
                    onChange={(e) => setSelectedWallet(wallets.find(w => w.id === e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all font-medium"
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id} className="bg-slate-800">
                        {wallet.name || wallet.currency} - {getCurrencySymbol(wallet.currency)}{parseFloat(wallet.balance).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3">
                    <CreditCard className="w-4 h-4 text-yellow-400" />
                    Amount to Deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-slate-500 font-bold">
                      {getCurrencySymbol(selectedWallet?.currency || 'EUR')}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={selectedMethodData.minAmount}
                      max={selectedMethodData.maxAmount}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white text-3xl font-black placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Info className="w-3.5 h-3.5" />
                      Min: {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{selectedMethodData.minAmount}
                    </div>
                    <div className="text-xs text-slate-400">
                      Max: {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{selectedMethodData.maxAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((amt) => (
                    <motion.button
                      key={amt}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAmount(amt.toString())}
                      disabled={amt < selectedMethodData.minAmount || amt > selectedMethodData.maxAmount}
                      className={`py-3 px-3 rounded-xl font-bold transition-all text-sm ${
                        amount === amt.toString()
                          ? 'bg-yellow-500 text-slate-900'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 text-white disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{amt}
                    </motion.button>
                  ))}
                </div>

                {/* Summary */}
                {amount && parseFloat(amount) >= selectedMethodData.minAmount && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-transparent border border-yellow-500/30 p-5 rounded-2xl shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Deposit Amount:</span>
                        <span className="font-bold text-white">
                          {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{parseFloat(amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Processing Fee ({selectedMethodData.fee}):</span>
                        <span className="font-semibold text-slate-300">
                          {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{calculateFee().toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-yellow-500/20 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400 font-bold text-base">Total to Pay:</span>
                          <span className="text-yellow-400 font-black text-3xl">
                            {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-200 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  disabled={!amount || parseFloat(amount) < selectedMethodData.minAmount || loading}
                  className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-slate-900 font-black text-lg py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-16 text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div
                    className="absolute inset-0 bg-yellow-500/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Processing Payment...</h3>
                <p className="text-slate-400 mb-6">Connecting to {selectedMethodData?.providers[0] || 'payment provider'}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-xs text-slate-500 mt-4">Time elapsed: {processingTime}s</p>
              </motion.div>
            )}

            {/* Step 4: Payment Instructions */}
            {step === 4 && paymentData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Success Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {paymentData.type === 'bank' ? 'Bank Transfer Details' : 
                     paymentData.type === 'crypto' ? 'Crypto Deposit Address' :
                     paymentData.type === 'mobile' ? 'Mobile Payment Details' :
                     'Payment Instructions'}
                  </h3>
                  <p className="text-slate-400">
                    Follow the instructions below to complete your deposit
                  </p>
                </div>

                {/* Bank Transfer Details */}
                {paymentData.type === 'bank' && (
                  <>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-5">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                          <Building2 className="w-3.5 h-3.5" />
                          IBAN
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-4 py-3.5 bg-slate-800/50 rounded-xl text-white font-mono text-sm border border-white/5">
                            {paymentData.iban}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(paymentData.iban)}
                            className="p-3.5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                          >
                            {copied ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5 text-slate-400" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                          <Shield className="w-3.5 h-3.5" />
                          BIC/SWIFT
                        </label>
                        <code className="block px-4 py-3.5 bg-slate-800/50 rounded-xl text-white font-mono text-sm border border-white/5">
                          {paymentData.bic}
                        </code>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase mb-2">
                          <Info className="w-3.5 h-3.5" />
                          Reference (Required!)
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-4 py-3.5 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl text-yellow-400 font-mono font-bold text-sm">
                            {paymentData.reference}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(paymentData.reference)}
                            className="p-3.5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                          >
                            <Copy className="w-5 h-5 text-slate-400" />
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                          Amount
                        </label>
                        <div className="px-4 py-3.5 bg-slate-800/50 rounded-xl border border-white/5">
                          <p className="text-2xl font-black text-white">
                            {getCurrencySymbol(paymentData.currency)}{paymentData.amount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl">
                      <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                          <p className="font-bold mb-2">Important Instructions:</p>
                          <ul className="space-y-1.5 text-blue-300">
                            <li>• Always include the reference number</li>
                            <li>• Processing time: 1-2 business days</li>
                            <li>• Email notification upon completion</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Crypto Details */}
                {paymentData.type === 'crypto' && (
                  <>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                      {paymentData.qrCode && (
                        <motion.img
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          src={paymentData.qrCode}
                          alt="QR Code"
                          className="w-52 h-52 mx-auto mb-4 rounded-2xl border-4 border-white/10 shadow-lg"
                        />
                      )}
                      <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-center gap-2">
                        <Bitcoin className="w-3.5 h-3.5" />
                        {paymentData.network}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3.5 bg-slate-800/50 rounded-xl text-white font-mono text-xs break-all border border-white/5">
                          {paymentData.address}
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(paymentData.address)}
                          className="p-3.5 hover:bg-white/10 rounded-xl transition-all flex-shrink-0 border border-white/10"
                        >
                          <Copy className="w-5 h-5 text-slate-400" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-200">
                          <p className="font-bold mb-2">Important:</p>
                          <ul className="space-y-1.5 text-orange-300">
                            <li>• Only send {paymentData.network} tokens</li>
                            <li>• Network confirmations: {paymentData.confirmations || 3}</li>
                            <li>• Processing time: 10-30 minutes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile Money Details */}
                {paymentData.type === 'mobile' && (
                  <>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                          Payment Code
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-4 py-3.5 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl text-green-400 font-mono font-bold text-lg text-center">
                            {paymentData.code}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(paymentData.code)}
                            className="p-3.5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                          >
                            <Copy className="w-5 h-5 text-slate-400" />
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                          Instructions
                        </label>
                        <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                          <p className="text-sm text-white">1. Open your mobile money app</p>
                          <p className="text-sm text-white">2. Select "Send Money"</p>
                          <p className="text-sm text-white">3. Enter code: <strong className="text-green-400">{paymentData.code}</strong></p>
                          <p className="text-sm text-white">4. Confirm amount: <strong>{getCurrencySymbol(paymentData.currency)}{paymentData.amount}</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl">
                      <div className="flex gap-3">
                        <Smartphone className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-200">
                          <p className="font-bold mb-2">SMS Confirmation:</p>
                          <p className="text-green-300">You will receive an SMS confirmation once the payment is processed.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Done Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-slate-900 font-black text-lg py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Done - I've Made the Payment
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(212, 175, 55, 0.3), rgba(212, 175, 55, 0.5));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(212, 175, 55, 0.5), rgba(212, 175, 55, 0.7));
        }
      `}</style>
    </AnimatePresence>
  );
}