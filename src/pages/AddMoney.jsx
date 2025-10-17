import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Building2, Bitcoin, Wallet, Smartphone,
  ArrowRight, CheckCircle2, AlertCircle, Loader2, Shield,
  Zap, Globe, Sparkles, ArrowLeft, Info, Lock, Clock,
  TrendingUp, DollarSign, Euro, PoundSterling, Banknote,
  WifiOff, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Gem, Crown, Star, Activity, BarChart3, ChevronDown
} from 'lucide-react';
import api, { walletAPI, paymentAPI, providerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';

// Production-ready AddMoney component with full backend integration
export default function AddMoney() {
  const navigate = window.__navigate || ((path) => window.location.href = path);
  const { user, subscription } = useAuth();
  const { userTier, limits, isLimitReached } = useMode();
  
  // State management
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  
  // Provider status tracking
  const [providerStatus, setProviderStatus] = useState({});
  const [exchangeRates, setExchangeRates] = useState({});
  const [processingTime, setProcessingTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [transactionRef, setTransactionRef] = useState(null);
  
  // Refs for intervals and WebSocket
  const processingInterval = useRef(null);
  const statusCheckInterval = useRef(null);
  const ws = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Enhanced payment methods with provider mapping
  const paymentMethods = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'M-Pesa, MTN, Airtel, Orange Money',
      icon: Smartphone,
      color: 'from-green-500 to-green-600',
      providers: ['flutterwave', 'nium'],
      supportedProviders: ['M-Pesa', 'MTN Money', 'Airtel Money', 'Orange Money', 'Vodafone Cash'],
      fee: '1.5%',
      processingTime: '< 1 min',
      countries: ['KE', 'UG', 'GH', 'TZ', 'NG', 'RW', 'ZM', 'MW', 'CI', 'SN'],
      recommended: true,
      popular: true,
      minAmount: 10,
      maxAmount: 50000,
      requiresPhone: true,
      tierRequirement: 'basic'
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      description: 'Fast & secure with Google Wallet',
      icon: Smartphone,
      color: 'from-blue-500 to-blue-600',
      providers: ['paysafe', 'treezor'],
      supportedProviders: ['Google Pay'],
      fee: '2%',
      processingTime: 'Instant',
      countries: ['US', 'GB', 'IN', 'SG', 'AU', 'CA', 'JP', 'DE', 'FR'],
      logo: '🅖',
      minAmount: 10,
      maxAmount: 10000,
      tierRequirement: 'basic'
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      description: 'Secure payments with Touch/Face ID',
      icon: Smartphone,
      color: 'from-gray-700 to-gray-800',
      providers: ['paysafe', 'treezor'],
      supportedProviders: ['Apple Pay'],
      fee: '2%',
      processingTime: 'Instant',
      countries: ['US', 'GB', 'CA', 'AU', 'JP', 'SG', 'HK', 'IE'],
      logo: '',
      minAmount: 10,
      maxAmount: 10000,
      tierRequirement: 'basic'
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard, Amex, Discover',
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      providers: ['paysafe', 'flutterwave', 'treezor'],
      supportedProviders: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Verve'],
      fee: '2.5%',
      processingTime: 'Instant',
      countries: ['GLOBAL'],
      minAmount: 10,
      maxAmount: 50000,
      requiresCardDetails: true,
      tierRequirement: 'basic'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'SEPA, SWIFT, ACH, Wire Transfer',
      icon: Building2,
      color: 'from-indigo-500 to-indigo-600',
      providers: ['treezor', 'nium'],
      supportedProviders: ['SEPA', 'SWIFT', 'ACH', 'Wire Transfer'],
      fee: '€0.50',
      processingTime: '1-3 days',
      countries: ['EU', 'US', 'GB', 'CH', 'NO', 'IS'],
      minAmount: 50,
      maxAmount: 100000,
      requiresBankDetails: true,
      tierRequirement: 'pro'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'BTC, ETH, USDT, USDC, SOL',
      icon: Bitcoin,
      color: 'from-orange-500 to-orange-600',
      providers: ['zerohash', 'alpaca'],
      supportedProviders: ['Bitcoin', 'Ethereum', 'USDT', 'USDC', 'Solana'],
      fee: 'Network fee',
      processingTime: '10-60 min',
      countries: ['GLOBAL'],
      minAmount: 20,
      maxAmount: 1000000,
      requiresWalletAddress: true,
      tierRequirement: 'premium'
    }
  ];

  // Fetch wallets with retry logic
  const loadWallets = useCallback(async () => {
    try {
      setWalletsLoading(true);
      const response = await walletAPI.getAll();
      const walletData = Array.isArray(response.data?.wallets) 
        ? response.data.wallets 
        : Array.isArray(response.wallets) 
        ? response.wallets 
        : [];
      
      setWallets(walletData);
      
      if (walletData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletData[0]);
      }
      
      // Load exchange rates for wallets
      if (walletData.length > 0) {
        await loadExchangeRates(walletData[0].currency);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => loadWallets(), 2000 * retryCount.current);
      } else {
        setError('Failed to load wallets. Please refresh the page.');
      }
    } finally {
      setWalletsLoading(false);
    }
  }, [selectedWallet]);

  // Load exchange rates
  const loadExchangeRates = async (baseCurrency) => {
    try {
      const response = await api.get('/api/exchange/rates', {
        params: { base: baseCurrency }
      });
      setExchangeRates(response.data.rates || {});
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
  };

  // Check provider status
  const checkProviderStatus = useCallback(async () => {
    try {
      const response = await providerAPI.health.checkAll();
      const status = {};
      
      response.data.providers?.forEach(provider => {
        status[provider.name] = {
          operational: provider.status === 'operational',
          latency: provider.latency,
          lastChecked: new Date()
        };
      });
      
      setProviderStatus(status);
    } catch (error) {
      console.error('Error checking provider status:', error);
    }
  }, []);

  // Initialize WebSocket for real-time updates
  const initializeWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://paywolt-backend.onrender.com';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Payment WebSocket connected');
      if (user?.id) {
        ws.current.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
          token: localStorage.getItem('paywolt_token')
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
      // Reconnect after 5 seconds
      setTimeout(initializeWebSocket, 5000);
    };
  }, [user?.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'payment_update':
        if (data.reference === transactionRef) {
          handlePaymentUpdate(data);
        }
        break;
      case 'payment_success':
        handlePaymentSuccess(data);
        break;
      case 'payment_failed':
        handlePaymentFailed(data);
        break;
      case 'provider_status':
        setProviderStatus(prev => ({
          ...prev,
          [data.provider]: data.status
        }));
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Handle payment update
  const handlePaymentUpdate = (data) => {
    if (data.status === 'completed') {
      setSuccess('Payment successful!');
      setStep(4);
      loadWallets(); // Reload wallets to show updated balance
    } else if (data.status === 'failed') {
      setError(data.message || 'Payment failed');
      setStep(2);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (data) => {
    setSuccess('Payment completed successfully!');
    setStep(4);
    clearInterval(processingInterval.current);
    
    // Track analytics
    await api.post('/api/analytics/payment', {
      type: 'deposit',
      method: method,
      amount: parseFloat(amount),
      currency: selectedWallet?.currency,
      status: 'success',
      processingTime: processingTime
    }).catch(console.error);
    
    // Reload wallets
    await loadWallets();
  };

  // Handle payment failure
  const handlePaymentFailed = (data) => {
    setError(data.message || 'Payment failed. Please try again.');
    setStep(2);
    setLoading(false);
    clearInterval(processingInterval.current);
  };

  // Process payment with enhanced error handling
  const handlePayment = async () => {
    const amt = parseFloat(amount);
    const selectedMethod = paymentMethods.find(pm => pm.id === method);
    
    // Validation
    if (!amt || amt < (selectedMethod?.minAmount || 10)) {
      setError(`Minimum amount is ${getCurrencySymbol(selectedWallet?.currency || 'EUR')}${selectedMethod?.minAmount || 10}`);
      return;
    }

    if (amt > (selectedMethod?.maxAmount || 100000)) {
      setError(`Maximum amount is ${getCurrencySymbol(selectedWallet?.currency || 'EUR')}${selectedMethod?.maxAmount || 100000}`);
      return;
    }

    // Check daily limit
    if (isLimitReached('dailyDeposit', amt)) {
      setError('Daily deposit limit reached. Please try tomorrow or upgrade your plan.');
      return;
    }

    setLoading(true);
    setError('');
    setStep(3);
    setProcessingTime(0);

    // Start processing timer
    processingInterval.current = setInterval(() => {
      setProcessingTime(prev => prev + 1);
    }, 1000);

    try {
      // Generate session ID for tracking
      const sessionId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(sessionId);

      // Select best provider based on method
      const provider = await selectBestProvider(selectedMethod.providers);
      
      // Initialize payment
      const response = await paymentAPI.initialize({
        amount: amt,
        currency: selectedWallet?.currency || 'EUR',
        wallet_id: selectedWallet?.id,
        method: method,
        provider: provider,
        email: email || user?.email || 'user@paywolt.com',
        phone: phone || user?.phone,
        session_id: sessionId,
        redirect_url: `${window.location.origin}/payment/callback`,
        webhook_url: `${import.meta.env.VITE_API_URL}/api/webhooks/payment`,
        metadata: {
          user_id: user?.id,
          tier: userTier,
          source: 'web_app'
        }
      });

      const paymentData = response.data || response;
      setTransactionRef(paymentData.reference);

      if (paymentData.payment_link) {
        // Redirect to payment page
        window.location.href = paymentData.payment_link;
      } else if (paymentData.requires_action) {
        // Handle 3D Secure or additional verification
        handle3DSecure(paymentData);
      } else {
        // Poll for payment status
        startStatusPolling(paymentData.reference);
      }
    } catch (err) {
      console.error('Payment error:', err);
      clearInterval(processingInterval.current);
      
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      setStep(2);
      
      // Track failed payment
      api.post('/api/analytics/payment', {
        type: 'deposit',
        method: method,
        amount: parseFloat(amount),
        currency: selectedWallet?.currency,
        status: 'failed',
        error: errorMessage
      }).catch(console.error);
    } finally {
      setLoading(false);
    }
  };

  // Select best provider based on availability and performance
  const selectBestProvider = async (providers) => {
    if (!providers || providers.length === 0) return null;
    
    // Check provider status
    const availableProviders = providers.filter(
      provider => providerStatus[provider]?.operational !== false
    );
    
    if (availableProviders.length === 0) {
      throw new Error('No payment providers available. Please try again later.');
    }
    
    // Select provider with lowest latency
    return availableProviders.reduce((best, current) => {
      const currentLatency = providerStatus[current]?.latency || 999;
      const bestLatency = providerStatus[best]?.latency || 999;
      return currentLatency < bestLatency ? current : best;
    }, availableProviders[0]);
  };

  // Handle 3D Secure authentication
  const handle3DSecure = (paymentData) => {
    if (paymentData.action_url) {
      // Create iframe for 3DS
      const iframe = document.createElement('iframe');
      iframe.src = paymentData.action_url;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      
      const container = document.getElementById('payment-3ds-container');
      if (container) {
        container.appendChild(iframe);
      }
      
      // Listen for 3DS completion
      window.addEventListener('message', (event) => {
        if (event.data.type === '3DS_COMPLETE') {
          startStatusPolling(paymentData.reference);
        }
      });
    }
  };

  // Poll payment status
  const startStatusPolling = (reference) => {
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max
    
    statusCheckInterval.current = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(statusCheckInterval.current);
        setError('Payment timeout. Please check your transaction history.');
        setStep(2);
        return;
      }
      
      try {
        const response = await paymentAPI.getStatus(reference);
        const status = response.data?.status || response.status;
        
        if (status === 'success' || status === 'completed') {
          clearInterval(statusCheckInterval.current);
          handlePaymentSuccess(response.data);
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(statusCheckInterval.current);
          handlePaymentFailed(response.data);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  // Calculate fees with provider-specific rates
  const calculateFee = useCallback(() => {
    const amt = parseFloat(amount) || 0;
    const selectedMethod = paymentMethods.find(pm => pm.id === method);
    
    if (!selectedMethod) return 0;
    
    if (selectedMethod.fee.includes('%')) {
      const percentage = parseFloat(selectedMethod.fee.replace('%', '')) / 100;
      return amt * percentage;
    } else if (selectedMethod.fee.includes('€')) {
      return parseFloat(selectedMethod.fee.replace('€', ''));
    } else if (selectedMethod.fee === 'Network fee') {
      // Estimate crypto network fees
      if (method === 'crypto') {
        return amt * 0.002; // 0.2% estimate
      }
    }
    
    return 0;
  }, [amount, method]);

  const calculateTotal = useCallback(() => {
    return (parseFloat(amount) || 0) + calculateFee();
  }, [amount, calculateFee]);

  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = { 
      EUR: '€', 
      USD: '$', 
      GBP: '£', 
      NGN: '₦',
      KES: 'KSh',
      GHS: '₵',
      ZAR: 'R',
      BTC: '₿',
      ETH: 'Ξ'
    };
    return symbols[currency] || currency;
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if method is available for user tier
  const isMethodAvailable = (methodItem) => {
    const tierLevels = { basic: 0, pro: 1, premium: 2, enterprise: 3 };
    const requiredLevel = tierLevels[methodItem.tierRequirement] || 0;
    const userLevel = tierLevels[userTier] || 0;
    return userLevel >= requiredLevel;
  };

  // Effects
  useEffect(() => {
    loadWallets();
    checkProviderStatus();
    initializeWebSocket();
    
    // Set up intervals
    const statusInterval = setInterval(checkProviderStatus, 30000); // Check every 30s
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(processingInterval.current);
      clearInterval(statusCheckInterval.current);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [loadWallets, checkProviderStatus, initializeWebSocket]);

  // Update user email/phone from auth context
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, email, phone]);

  const selectedMethod = paymentMethods.find(pm => pm.id === method);

  // Loading state
  if (walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
            />
            <motion.div
              className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-white font-bold text-lg mb-2">Loading wallets...</p>
          <p className="text-slate-400 text-sm">Connecting to payment network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2 sm:mb-3">
            Add Money 💰
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Fund your wallet instantly with multiple payment options
          </p>
        </div>

        {step > 1 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setStep(step - 1);
              setError('');
            }}
            className="p-2.5 sm:p-3 hover:bg-white/10 rounded-xl transition-all border border-white/10 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400 font-semibold">Back</span>
          </motion.button>
        )}
      </motion.div>

      {/* Trust Badges with Live Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-5 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-pulse" />
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white">256-bit Encryption</span>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white">Instant Processing</span>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white">180+ Countries</span>
        </div>
        
        <div className="flex items-center gap-2 relative z-10 ml-auto">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            Object.values(providerStatus).some(p => p.operational) 
              ? 'bg-green-400' 
              : 'bg-yellow-400'
          }`} />
          <span className="text-xs text-slate-400">
            {Object.values(providerStatus).filter(p => p.operational).length}/{Object.keys(providerStatus).length} providers online
          </span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Wallet & Method */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Wallet Selection with Balance Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Select Wallet</h3>
                </div>
                <button
                  onClick={() => loadWallets()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {wallets.map((wallet, index) => {
                  const isSelected = selectedWallet?.id === wallet.id;
                  return (
                    <motion.button
                      key={wallet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + (index * 0.05) }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedWallet(wallet);
                        loadExchangeRates(wallet.currency);
                      }}
                      className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        isSelected
                          ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 shadow-lg shadow-yellow-500/20'
                          : 'border-white/10 hover:border-yellow-500/50 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Background gradient animation */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {wallet.currency}
                            </p>
                            {wallet.is_primary && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-white mb-2">
                          {getCurrencySymbol(wallet.currency)}
                          {parseFloat(wallet.balance || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-slate-500" />
                          <p className="text-[10px] text-slate-500">
                            Last activity: {wallet.last_activity || 'Never'}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {wallets.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-white font-bold text-lg mb-2">No wallets found</p>
                  <p className="text-slate-400 text-sm mb-6">Create your first wallet to start</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/wallets/create')}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-900 font-bold rounded-xl transition-all shadow-lg"
                  >
                    Create Wallet
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Enhanced Payment Methods Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Payment Methods</h3>
                </div>
                <div className="flex items-center gap-2">
                  {userTier && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      userTier === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                      userTier === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                      userTier === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {userTier.toUpperCase()} TIER
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {paymentMethods.map((pm, index) => {
                  const Icon = pm.icon;
                  const isAvailable = isMethodAvailable(pm);
                  const providerOnline = pm.providers.some(p => providerStatus[p]?.operational);
                  
                  return (
                    <motion.button
                      key={pm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + (index * 0.05) }}
                      whileHover={{ scale: isAvailable ? 1.02 : 1, y: isAvailable ? -4 : 0 }}
                      whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                      onClick={() => {
                        if (!isAvailable) {
                          setError(`${pm.name} requires ${pm.tierRequirement.toUpperCase()} tier or higher`);
                          return;
                        }
                        if (!providerOnline) {
                          setError(`${pm.name} is temporarily unavailable. Please try another method.`);
                          return;
                        }
                        setMethod(pm.id);
                        setStep(2);
                      }}
                      disabled={!isAvailable}
                      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 text-left group relative overflow-hidden transition-all ${
                        pm.recommended ? 'ring-2 ring-yellow-500/30' : ''
                      } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-500/50'}`}
                    >
                      {/* Lock overlay for unavailable methods */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                          <div className="text-center">
                            <Lock className="w-8 h-8 text-white/50 mx-auto mb-2" />
                            <p className="text-xs font-bold text-white/70">
                              {pm.tierRequirement.toUpperCase()} TIER
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        {pm.recommended && isAvailable && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + (index * 0.05) }}
                            className="px-3 py-1 bg-yellow-500 text-slate-900 text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-1 shadow-lg"
                          >
                            <Sparkles className="w-3 h-3" />
                            Recommended
                          </motion.div>
                        )}
                        {pm.popular && isAvailable && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + (index * 0.05) }}
                            className="px-3 py-1 bg-green-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg"
                          >
                            🔥 Popular
                          </motion.div>
                        )}
                        {!providerOnline && (
                          <div className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold rounded-full">
                            <WifiOff className="w-3 h-3 inline mr-1" />
                            Offline
                          </div>
                        )}
                      </div>

                      {/* Icon & Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${pm.color} rounded-2xl flex items-center justify-center ${isAvailable ? 'group-hover:scale-110' : ''} transition-transform flex-shrink-0 shadow-lg`}>
                          {pm.logo ? (
                            <span className="text-2xl sm:text-3xl">{pm.logo}</span>
                          ) : (
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                            {pm.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                            {pm.description}
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px]">💰</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Fee</p>
                            <p className="font-semibold text-white">{pm.fee}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Speed</p>
                            <p className="font-semibold text-white line-clamp-1">{pm.processingTime}</p>
                          </div>
                        </div>
                      </div>

                      {/* Providers */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pm.supportedProviders.slice(0, 3).map((provider) => (
                          <span
                            key={provider}
                            className="px-2 py-1 bg-white/10 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-300"
                          >
                            {provider}
                          </span>
                        ))}
                        {pm.supportedProviders.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-300">
                            +{pm.supportedProviders.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Limits */}
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-4">
                        {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{pm.minAmount} - {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{pm.maxAmount.toLocaleString()}
                      </p>

                      {/* CTA */}
                      {isAvailable && (
                        <div className="flex items-center justify-end text-yellow-400 font-semibold text-sm group-hover:gap-2 transition-all">
                          Continue
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
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
                  <p className="text-red-200 text-sm">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Step 2: Enter Amount with Advanced Features */}
        {step === 2 && selectedMethod && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Selected Method Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden bg-gradient-to-br ${selectedMethod.color}/10 border border-white/10 rounded-2xl p-5`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${selectedMethod.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  {selectedMethod.logo ? (
                    <span className="text-3xl">{selectedMethod.logo}</span>
                  ) : (
                    <selectedMethod.icon className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">{selectedMethod.name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{selectedMethod.fee} fee</span>
                    <span>•</span>
                    <span>{selectedMethod.processingTime}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Amount Input Form */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Enter Details</h3>

              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Amount to Add
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl text-slate-500 font-bold">
                      {getCurrencySymbol(selectedWallet?.currency || 'EUR')}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={selectedMethod.minAmount}
                      max={selectedMethod.maxAmount}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 sm:pl-16 pr-4 py-4 sm:py-5 text-white text-2xl sm:text-3xl font-black placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                    {/* Live conversion display */}
                    {exchangeRates.USD && selectedWallet?.currency !== 'USD' && amount && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        ≈ ${(parseFloat(amount) * (exchangeRates.USD || 1)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Info className="w-3 h-3" />
                      <span>
                        Limits: {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{selectedMethod.minAmount} - {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{selectedMethod.maxAmount.toLocaleString()}
                      </span>
                    </div>
                    {limits.dailyDeposit && (
                      <div className="text-xs text-slate-400">
                        Daily limit remaining: {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{limits.dailyDeposit}
                      </div>
                    )}
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
                      className={`py-2 sm:py-3 rounded-xl font-bold text-sm transition-all ${
                        amount === amt.toString()
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 text-white'
                      }`}
                    >
                      {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{amt}
                    </motion.button>
                  ))}
                </div>

                {/* Additional Fields Based on Method */}
                {selectedMethod.requiresPhone && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Phone Number (for Mobile Money)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254700000000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                  </div>
                )}

                {/* Payment Summary */}
                {amount && parseFloat(amount) >= (selectedMethod.minAmount || 10) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-2xl p-5 shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-bold text-white">
                          {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{parseFloat(amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Processing Fee:</span>
                        <span className="font-semibold text-slate-300">
                          {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{calculateFee().toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-yellow-500/20 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400 font-bold text-base sm:text-lg">You'll Pay:</span>
                          <div className="text-right">
                            <span className="text-yellow-400 font-black text-2xl sm:text-3xl">
                              {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{calculateTotal().toFixed(2)}
                            </span>
                            {exchangeRates.USD && selectedWallet?.currency !== 'USD' && (
                              <p className="text-xs text-slate-500">
                                ≈ ${(calculateTotal() * (exchangeRates.USD || 1)).toFixed(2)} USD
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-slate-400">You'll Receive:</span>
                        <span className="font-bold text-green-400">
                          {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{parseFloat(amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

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
                      <p className="text-red-200 text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={!amount || parseFloat(amount) < (selectedMethod.minAmount || 10) || loading}
                  className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-slate-900 font-black text-base sm:text-lg py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Secure Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                {/* Security & Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>PCI-DSS Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Merchant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3DS Container */}
            <div id="payment-3ds-container" className="hidden" />
          </motion.div>
        )}

        {/* Step 3: Processing with Real-time Updates */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12"
          >
            <div className="text-center">
              {/* Animated Logo */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div
                  className="absolute inset-0 bg-yellow-500/20 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 bg-yellow-500/30 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                />
                <div className="absolute inset-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Processing Payment</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Please wait while we securely process your {selectedMethod?.name} payment
              </p>

              {/* Processing Steps */}
              <div className="max-w-md mx-auto space-y-4 mb-8">
                <ProcessingStep 
                  completed={processingTime > 2} 
                  active={processingTime > 0 && processingTime <= 2}
                  text="Connecting to payment provider"
                />
                <ProcessingStep 
                  completed={processingTime > 5} 
                  active={processingTime > 2 && processingTime <= 5}
                  text="Verifying payment details"
                />
                <ProcessingStep 
                  completed={processingTime > 8} 
                  active={processingTime > 5 && processingTime <= 8}
                  text="Processing transaction"
                />
                <ProcessingStep 
                  completed={false} 
                  active={processingTime > 8}
                  text="Updating wallet balance"
                />
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Processing time: {formatTime(processingTime)}</span>
              </div>

              {/* Transaction Reference */}
              {transactionRef && (
                <div className="mt-6 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Transaction Reference</p>
                  <p className="text-sm font-mono text-white">{transactionRef}</p>
                </div>
              )}

              {/* Security Note */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Your payment is protected by bank-level encryption</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-3xl p-8 sm:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Payment Successful!</h3>
            <p className="text-slate-400 mb-8">
              {getCurrencySymbol(selectedWallet?.currency || 'EUR')}{parseFloat(amount).toFixed(2)} has been added to your wallet
            </p>

            {/* Updated Balance Display */}
            <div className="bg-white/5 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-slate-400 mb-2">New Balance</p>
              <p className="text-3xl font-black text-white">
                {getCurrencySymbol(selectedWallet?.currency || 'EUR')}
                {(parseFloat(selectedWallet?.balance || 0) + parseFloat(amount || 0)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>

            {/* Transaction Details */}
            {transactionRef && (
              <div className="text-left max-w-md mx-auto space-y-2 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-white">{transactionRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Method:</span>
                  <span className="text-white">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Processing Time:</span>
                  <span className="text-white">{formatTime(processingTime)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setStep(1);
                  setAmount('');
                  setError('');
                  setSuccess('');
                  setTransactionRef(null);
                }}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all"
              >
                Add More
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white font-bold transition-all shadow-lg"
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Processing Step Component
function ProcessingStep({ completed, active, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        completed ? 'bg-green-500' : 
        active ? 'bg-yellow-500' : 
        'bg-white/10'
      }`}>
        {completed ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : active ? (
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        ) : (
          <div className="w-3 h-3 bg-white/30 rounded-full" />
        )}
      </div>
      <span className={`text-sm transition-all ${
        completed ? 'text-white font-semibold' :
        active ? 'text-yellow-400 font-semibold' :
        'text-slate-500'
      }`}>
        {text}
      </span>
    </div>
  );
}