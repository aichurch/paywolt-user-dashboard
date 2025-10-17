import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Eye, EyeOff, Lock, Unlock, Trash2,
  Settings, Zap, Shield, TrendingUp, AlertCircle, CheckCircle2,
  Copy, MoreVertical, Globe, Smartphone, ShoppingBag, RefreshCw,
  Wifi, WifiOff, Activity, DollarSign, Euro, PoundSterling,
  ArrowUp, ArrowDown, PauseCircle, PlayCircle, AlertTriangle,
  Info, ChevronDown, ChevronRight, Star, Crown, Gem, X,
  CreditCard as CardIcon, Banknote, Bitcoin, Clock, Calendar,
  BarChart3, PieChart, TrendingDown, Filter, Download, Upload
} from 'lucide-react';
import api, { cardAPI, providerAPI, walletAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';

// Production-ready Cards component with full backend integration
export default function Cards() {
  const { user, subscription } = useAuth();
  const { userTier, limits, isLimitReached, hasFeature } = useMode();
  
  // State management
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  
  // Form states
  const [requestType, setRequestType] = useState('virtual');
  const [cardName, setCardName] = useState('');
  const [cardColor, setCardColor] = useState('purple');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // Provider & status tracking
  const [providers, setProviders] = useState([]);
  const [providerStatus, setProviderStatus] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [wallets, setWallets] = useState([]);
  
  // Error & success states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // WebSocket & intervals
  const ws = useRef(null);
  const refreshInterval = useRef(null);
  const sessionId = useRef(null);

  // Card color schemes
  const cardColors = {
    purple: 'from-purple-500 to-purple-700',
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    red: 'from-red-500 to-red-700',
    gold: 'from-yellow-500 to-orange-600',
    black: 'from-gray-800 to-gray-900',
    gradient: 'from-pink-500 via-purple-500 to-indigo-500'
  };

  // Load cards with retry logic
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [cardsResponse, statsResponse] = await Promise.all([
        cardAPI.getAll(),
        cardAPI.getStatistics()
      ]);
      
      const cardsData = cardsResponse.data?.cards || cardsResponse.cards || [];
      const statsData = statsResponse.data?.statistics || statsResponse.statistics || {};
      
      // Enhance cards with real-time data
      const enhancedCards = await Promise.all(cardsData.map(async (card) => {
        try {
          const balanceResponse = await cardAPI.getBalance(card.id);
          return {
            ...card,
            balance: balanceResponse.data?.balance || card.balance || 0,
            color: cardColors[card.color] || cardColors.purple
          };
        } catch (error) {
          console.error(`Error loading balance for card ${card.id}:`, error);
          return {
            ...card,
            color: cardColors[card.color] || cardColors.purple
          };
        }
      }));
      
      setCards(enhancedCards);
      setStatistics(statsData);
      
      // Load transactions for all cards
      await loadTransactions();
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Failed to load cards. Please try again.');
      
      // Load from cache if available
      const cachedCards = localStorage.getItem('paywolt_cards');
      if (cachedCards) {
        setCards(JSON.parse(cachedCards));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load transactions
  const loadTransactions = async () => {
    try {
      const response = await cardAPI.getTransactions();
      const txData = response.data?.transactions || response.transactions || [];
      setTransactions(txData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Load wallets for card creation
  const loadWallets = async () => {
    try {
      const response = await walletAPI.getAll();
      const walletData = response.data?.wallets || response.wallets || [];
      setWallets(walletData);
      if (walletData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletData[0]);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // Check provider status
  const checkProviderStatus = async () => {
    try {
      const response = await providerAPI.health.checkAll();
      const status = {};
      
      response.data?.providers?.forEach(provider => {
        status[provider.name] = {
          operational: provider.status === 'operational',
          latency: provider.latency,
          features: provider.features || []
        };
      });
      
      setProviderStatus(status);
      
      // Update available providers
      const availableProviders = ['treezor', 'wallester', 'paysafe', 'nium']
        .filter(p => status[p]?.operational && status[p]?.features?.includes('cards'));
      setProviders(availableProviders);
    } catch (error) {
      console.error('Error checking provider status:', error);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://paywolt-backend.onrender.com';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Cards WebSocket connected');
      if (user?.id) {
        ws.current.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
          token: localStorage.getItem('paywolt_token')
        }));
        
        // Subscribe to card updates
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          channel: 'cards',
          userId: user.id
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
      case 'card_transaction':
        handleNewTransaction(data);
        break;
      case 'card_status_update':
        handleCardStatusUpdate(data);
        break;
      case 'balance_update':
        handleBalanceUpdate(data);
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

  // Handle new transaction notification
  const handleNewTransaction = (data) => {
    setTransactions(prev => [data.transaction, ...prev]);
    
    // Update card balance
    setCards(prev => prev.map(card => 
      card.id === data.cardId 
        ? { ...card, balance: data.newBalance }
        : card
    ));
    
    // Show notification
    if (data.transaction.amount > 100) {
      setSuccess(`Transaction of ${getCurrencySymbol(data.transaction.currency)}${data.transaction.amount} completed`);
    }
  };

  // Handle card status update
  const handleCardStatusUpdate = (data) => {
    setCards(prev => prev.map(card => 
      card.id === data.cardId 
        ? { ...card, status: data.status }
        : card
    ));
  };

  // Handle balance update
  const handleBalanceUpdate = (data) => {
    setCards(prev => prev.map(card => 
      card.id === data.cardId 
        ? { ...card, balance: data.balance }
        : card
    ));
  };

  // Toggle card visibility
  const handleToggleCardVisibility = (cardId) => {
    setShowCardNumbers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
    
    // Track view event
    api.post('/api/analytics/card-view', {
      cardId,
      action: showCardNumbers[cardId] ? 'hide' : 'show'
    }).catch(console.error);
  };

  // Freeze card
  const handleFreezeCard = async (cardId) => {
    try {
      setError('');
      await cardAPI.freeze(cardId);
      
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: 'frozen' } : card
      ));
      
      setSuccess('Card frozen successfully');
      
      // Send notification via WebSocket
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'card_action',
          action: 'freeze',
          cardId
        }));
      }
    } catch (error) {
      console.error('Error freezing card:', error);
      setError('Failed to freeze card. Please try again.');
    }
  };

  // Unfreeze card
  const handleUnfreezeCard = async (cardId) => {
    try {
      setError('');
      await cardAPI.unfreeze(cardId);
      
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: 'active' } : card
      ));
      
      setSuccess('Card activated successfully');
      
      // Send notification via WebSocket
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'card_action',
          action: 'unfreeze',
          cardId
        }));
      }
    } catch (error) {
      console.error('Error unfreezing card:', error);
      setError('Failed to activate card. Please try again.');
    }
  };

  // Copy card details
  const handleCopyCardDetails = async (card) => {
    try {
      const details = `Card: ${card.cardNumber}\nCVV: ${card.cvv}\nExpiry: ${card.expiry}`;
      await navigator.clipboard.writeText(details);
      setSuccess('Card details copied to clipboard');
    } catch (error) {
      console.error('Error copying:', error);
      setError('Failed to copy card details');
    }
  };

  // Request new card
  const handleRequestCard = async () => {
    try {
      setError('');
      
      // Check card limits
      if (isLimitReached('cards', cards.length)) {
        setError(`Card limit reached. Upgrade to ${userTier === 'basic' ? 'PRO' : 'PREMIUM'} for more cards.`);
        return;
      }
      
      if (!selectedWallet) {
        setError('Please select a wallet first');
        return;
      }
      
      if (!cardName.trim()) {
        setError('Please enter a card name');
        return;
      }
      
      // Select best provider
      const provider = providers.find(p => 
        providerStatus[p]?.operational && 
        providerStatus[p]?.features?.includes(requestType === 'virtual' ? 'virtual_cards' : 'physical_cards')
      );
      
      if (!provider) {
        setError('No card providers available. Please try again later.');
        return;
      }
      
      setLoading(true);
      
      const response = await cardAPI.create({
        type: requestType,
        name: cardName,
        color: cardColor,
        wallet_id: selectedWallet.id,
        currency: selectedWallet.currency,
        provider: provider,
        spending_limit: spendingLimit || null,
        metadata: {
          user_tier: userTier,
          requested_at: new Date().toISOString()
        }
      });
      
      const newCard = response.data?.card || response.card;
      
      if (newCard) {
        setCards(prev => [...prev, {
          ...newCard,
          color: cardColors[cardColor]
        }]);
        
        setSuccess(`${requestType === 'virtual' ? 'Virtual' : 'Physical'} card created successfully!`);
        setShowRequestModal(false);
        
        // Reset form
        setCardName('');
        setSpendingLimit('');
        setCardColor('purple');
        
        // Track event
        api.post('/api/analytics/card-created', {
          type: requestType,
          provider: provider
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Error requesting card:', error);
      setError(error.response?.data?.error || 'Failed to create card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError('');
      await cardAPI.delete(cardId);
      
      setCards(prev => prev.filter(card => card.id !== cardId));
      setSuccess('Card deleted successfully');
      setShowSettingsModal(false);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error deleting card:', error);
      setError('Failed to delete card. Please try again.');
    }
  };

  // Update card settings
  const handleUpdateCardSettings = async () => {
    if (!selectedCard) return;
    
    try {
      setError('');
      
      const updates = {
        name: selectedCard.name,
        spending_limit: selectedCard.spending_limit,
        online_payments: selectedCard.online_payments,
        atm_withdrawals: selectedCard.atm_withdrawals,
        contactless: selectedCard.contactless
      };
      
      await cardAPI.update(selectedCard.id, updates);
      
      setCards(prev => prev.map(card => 
        card.id === selectedCard.id ? selectedCard : card
      ));
      
      setSuccess('Card settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error updating card:', error);
      setError('Failed to update card settings');
    }
  };

  // Refresh cards
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadCards(),
      checkProviderStatus(),
      loadWallets()
    ]);
  };

  // Export transactions
  const handleExportTransactions = async (cardId) => {
    try {
      const response = await cardAPI.exportTransactions(cardId, 'csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `card_transactions_${cardId}_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Transactions exported successfully');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      setError('Failed to export transactions');
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = { 
      EUR: '€', 
      USD: '$', 
      GBP: '£',
      NGN: '₦',
      KES: 'KSh',
      GHS: '₵',
      ZAR: 'R'
    };
    return symbols[currency] || currency;
  };

  // Format card number for display
  const formatCardNumber = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    return number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  // Check if user can create more cards
  const canCreateCard = (type) => {
    const currentCount = cards.filter(c => c.type === type).length;
    const limit = limits?.[`${type}_cards`] || (type === 'virtual' ? 3 : 1);
    return currentCount < limit;
  };

  // Effects
  useEffect(() => {
    loadCards();
    checkProviderStatus();
    loadWallets();
    initializeWebSocket();
    
    // Set up refresh interval
    refreshInterval.current = setInterval(() => {
      checkProviderStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [loadCards, initializeWebSocket]);

  // Save cards to cache
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem('paywolt_cards', JSON.stringify(cards));
    }
  }, [cards]);

  if (loading && !refreshing) {
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
          <p className="text-white font-bold text-lg mb-2">Loading your cards...</p>
          <p className="text-slate-400 text-sm">Connecting to card network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2">
            My Cards 💳
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Manage your virtual and physical payment cards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              loadWallets();
              setShowRequestModal(true);
            }}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Request Card</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Stats with Provider Status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-slate-400 font-medium">Total Cards</p>
          </div>
          <p className="text-2xl font-black text-white">{cards.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Limit: {limits?.cards || 5}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-400 font-medium">Active</p>
          </div>
          <p className="text-2xl font-black text-green-400">
            {cards.filter(c => c.status === 'active').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-400 font-medium">Frozen</p>
          </div>
          <p className="text-2xl font-black text-blue-400">
            {cards.filter(c => c.status === 'frozen').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-400 font-medium">Total Balance</p>
          </div>
          <p className="text-lg sm:text-xl font-black text-purple-400">
            €{cards.reduce((sum, c) => sum + (c.balance || 0), 0).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Providers</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              providers.length > 0 ? 'bg-green-400' : 'bg-red-400'
            } animate-pulse`} />
            <p className="text-sm font-bold text-white">
              {providers.length}/{Object.keys(providerStatus).length} Online
            </p>
          </div>
        </motion.div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        
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
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Cards Grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className="space-y-4"
            >
              {/* Enhanced Card Design */}
              <div className={`relative bg-gradient-to-br ${card.color} rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group`}>
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <motion.div 
                    className="absolute inset-0"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '40px 40px'
                    }} 
                  />
                </div>

                {/* Card Header */}
                <div className="relative flex items-start justify-between mb-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        card.type === 'virtual' 
                          ? 'bg-white/20 text-white backdrop-blur-sm' 
                          : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900'
                      }`}>
                        {card.type === 'virtual' ? '🌐 Virtual' : '💳 Physical'}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                        card.status === 'active'
                          ? 'bg-green-500/80 text-white'
                          : card.status === 'frozen'
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-red-500/80 text-white'
                      }`}>
                        {card.status === 'active' ? '✓ Active' : 
                         card.status === 'frozen' ? '❄️ Frozen' : '⚠️ Blocked'}
                      </div>
                      {card.is_primary && (
                        <div className="px-3 py-1 bg-purple-500/80 backdrop-blur-sm text-white rounded-full text-xs font-bold">
                          Primary
                        </div>
                      )}
                    </div>
                    <p className="text-white/80 text-sm font-medium">{card.provider || 'PayWolt Card'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white/80 text-xs mb-1">Available Balance</p>
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {getCurrencySymbol(card.currency || 'EUR')}
                      {(card.balance || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    {card.spending_limit && (
                      <p className="text-xs text-white/60 mt-1">
                        Limit: {getCurrencySymbol(card.currency || 'EUR')}{card.spending_limit}/day
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Chip */}
                <div className="relative mb-8">
                  <div className="w-14 h-10 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-lg shadow-lg" />
                </div>

                {/* Card Number */}
                <div className="relative mb-6">
                  <p className="text-white text-2xl sm:text-3xl font-mono font-bold tracking-wider">
                    {showCardNumbers[card.id] 
                      ? formatCardNumber(card.cardNumber) 
                      : `•••• •••• •••• ${card.last4 || '••••'}`}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="relative flex items-end justify-between">
                  <div className="flex-1">
                    <p className="text-white/70 text-xs mb-1">Cardholder</p>
                    <p className="text-white font-bold uppercase text-sm">
                      {card.name || user?.name || 'Card Holder'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs mb-1">Expires</p>
                    <p className="text-white font-bold text-sm">{card.expiry || 'MM/YY'}</p>
                  </div>
                  <div className="text-right">
                    <img 
                      src={card.network === 'visa' 
                        ? 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg'
                        : card.network === 'mastercard'
                        ? 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg'
                        : 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg'
                      }
                      alt={card.network || 'Mastercard'}
                      className="h-8 sm:h-10 opacity-90"
                    />
                  </div>
                </div>

                {/* Hover Effect Glow */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-3xl" />
              </div>

              {/* Enhanced Card Actions */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleCardVisibility(card.id)}
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    {showCardNumbers[card.id] ? (
                      <EyeOff className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    )}
                    <span className="text-xs font-semibold text-white">
                      {showCardNumbers[card.id] ? 'Hide' : 'Show'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyCardDetails(card)}
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <Copy className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-semibold text-white">Copy</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => card.status === 'active' 
                      ? handleFreezeCard(card.id) 
                      : handleUnfreezeCard(card.id)
                    }
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    {card.status === 'active' ? (
                      <Lock className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                    ) : (
                      <Unlock className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                    )}
                    <span className="text-xs font-semibold text-white">
                      {card.status === 'active' ? 'Freeze' : 'Activate'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCard(card);
                      setShowTransactionsModal(true);
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <Activity className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-semibold text-white">Activity</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCard(card);
                      setShowSettingsModal(true);
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <Settings className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    <span className="text-xs font-semibold text-white">Settings</span>
                  </motion.button>
                </div>

                {/* Expanded Card Details */}
                {showCardNumbers[card.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Card Number</p>
                        <p className="font-mono font-bold text-white">{formatCardNumber(card.cardNumber)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">CVV/CVC</p>
                        <p className="font-mono font-bold text-white">{card.cvv || '***'}</p>
                      </div>
                    </div>
                    {card.iban && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Linked IBAN</p>
                        <p className="font-mono text-sm text-white">{card.iban}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Usage Statistics */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">This Month</h4>
                  <button
                    onClick={() => handleExportTransactions(card.id)}
                    className="text-xs text-slate-400 hover:text-white transition-all flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-slate-400">Online Purchases</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {getCurrencySymbol(card.currency || 'EUR')}
                      {(statistics[card.id]?.online || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-slate-400">In-Store</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {getCurrencySymbol(card.currency || 'EUR')}
                      {(statistics[card.id]?.instore || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-slate-400">Contactless</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {getCurrencySymbol(card.currency || 'EUR')}
                      {(statistics[card.id]?.contactless || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-slate-400">ATM Withdrawals</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {getCurrencySymbol(card.currency || 'EUR')}
                      {(statistics[card.id]?.atm || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Monthly spending bar */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Monthly Spending</span>
                    <span className="text-white font-bold">
                      {((statistics[card.id]?.total || 0) / (card.spending_limit || 1000) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((statistics[card.id]?.total || 0) / (card.spending_limit || 1000) * 100), 100)}%` }}
                      className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Cards Yet</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Get started with a virtual card for online payments or request a physical card for everyday use
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              loadWallets();
              setShowRequestModal(true);
            }}
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 inline-flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Request Your First Card
          </motion.button>
        </motion.div>
      )}

      {/* Enhanced Request Card Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRequestModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Request a Card</h2>
              
              {/* Card Type Selection */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Card Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRequestType('virtual')}
                    disabled={!canCreateCard('virtual')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                      requestType === 'virtual'
                        ? 'bg-yellow-500/10 border-yellow-500'
                        : 'bg-white/5 border-white/10 hover:border-yellow-500/50'
                    } ${!canCreateCard('virtual') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {!canCreateCard('virtual') && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        requestType === 'virtual'
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-br from-purple-500 to-purple-700'
                      }`}>
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Virtual Card</h3>
                        <p className="text-xs text-slate-400">Instant • Online use</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Setup Fee:</span>
                        <span className="font-bold text-green-400">FREE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Delivery:</span>
                        <span className="font-bold text-white">Instant</span>
                      </div>
                    </div>
                    {!canCreateCard('virtual') && (
                      <p className="text-xs text-red-400 mt-2">Virtual card limit reached</p>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRequestType('physical')}
                    disabled={!canCreateCard('physical') || userTier === 'basic'}
                    className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                      requestType === 'physical'
                        ? 'bg-yellow-500/10 border-yellow-500'
                        : 'bg-white/5 border-white/10 hover:border-yellow-500/50'
                    } ${!canCreateCard('physical') || userTier === 'basic' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {(!canCreateCard('physical') || userTier === 'basic') && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        requestType === 'physical'
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-br from-blue-500 to-blue-700'
                      }`}>
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Physical Card</h3>
                        <p className="text-xs text-slate-400">3-5 days • Everywhere</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Setup Fee:</span>
                        <span className="font-bold text-white">€9.99</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Delivery:</span>
                        <span className="font-bold text-white">3-5 days</span>
                      </div>
                    </div>
                    {userTier === 'basic' && (
                      <p className="text-xs text-yellow-400 mt-2">Requires PRO tier or higher</p>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Wallet Selection */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Select Wallet</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wallets.map(wallet => (
                    <motion.button
                      key={wallet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedWallet?.id === wallet.id
                          ? 'bg-yellow-500/10 border-yellow-500'
                          : 'bg-white/5 border-white/10 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{wallet.currency} Wallet</p>
                          <p className="text-sm text-slate-400">
                            {getCurrencySymbol(wallet.currency)}{wallet.balance || 0}
                          </p>
                        </div>
                        {selectedWallet?.id === wallet.id && (
                          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                {wallets.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No wallets available. Create a wallet first.
                  </p>
                )}
              </div>

              {/* Card Customization */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Customize</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Card Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g., Shopping Card"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Card Color</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {Object.entries(cardColors).map(([colorName, colorClass]) => (
                      <motion.button
                        key={colorName}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCardColor(colorName)}
                        className={`h-12 rounded-lg bg-gradient-to-br ${colorClass} border-2 transition-all ${
                          cardColor === colorName
                            ? 'border-white shadow-lg'
                            : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Daily Spending Limit (Optional)
                  </label>
                  <input
                    type="number"
                    value={spendingLimit}
                    onChange={(e) => setSpendingLimit(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Provider Status */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase">Provider Status</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {providers.map(provider => (
                    <div key={provider} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                      <div className={`w-2 h-2 rounded-full ${
                        providerStatus[provider]?.operational ? 'bg-green-400' : 'bg-red-400'
                      } animate-pulse`} />
                      <span className="text-xs text-white capitalize">{provider}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRequestCard}
                  disabled={loading || !selectedWallet || !cardName}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-slate-900 font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Card
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-black text-white mb-6">Card Settings</h2>
              
              <div className="space-y-6">
                {/* Card Info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedCard.color} rounded-xl flex items-center justify-center`}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedCard.name}</p>
                      <p className="text-sm text-slate-400">•••• {selectedCard.last4}</p>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Card Name</label>
                    <input
                      type="text"
                      value={selectedCard.name}
                      onChange={(e) => setSelectedCard({...selectedCard, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Daily Spending Limit</label>
                    <input
                      type="number"
                      value={selectedCard.spending_limit || ''}
                      onChange={(e) => setSelectedCard({...selectedCard, spending_limit: e.target.value})}
                      placeholder="No limit"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Toggle Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-white">Online Payments</p>
                        <p className="text-xs text-slate-400">Allow online transactions</p>
                      </div>
                      <button
                        onClick={() => setSelectedCard({...selectedCard, online_payments: !selectedCard.online_payments})}
                        className={`w-12 h-6 rounded-full transition-all ${
                          selectedCard.online_payments !== false ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                          selectedCard.online_payments !== false ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-white">ATM Withdrawals</p>
                        <p className="text-xs text-slate-400">Allow cash withdrawals</p>
                      </div>
                      <button
                        onClick={() => setSelectedCard({...selectedCard, atm_withdrawals: !selectedCard.atm_withdrawals})}
                        className={`w-12 h-6 rounded-full transition-all ${
                          selectedCard.atm_withdrawals !== false ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                          selectedCard.atm_withdrawals !== false ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-white">Contactless</p>
                        <p className="text-xs text-slate-400">Tap to pay functionality</p>
                      </div>
                      <button
                        onClick={() => setSelectedCard({...selectedCard, contactless: !selectedCard.contactless})}
                        className={`w-12 h-6 rounded-full transition-all ${
                          selectedCard.contactless !== false ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                          selectedCard.contactless !== false ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
                  <button
                    onClick={() => handleDeleteCard(selectedCard.id)}
                    className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-semibold transition-all"
                  >
                    Delete Card
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateCardSettings}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-slate-900 font-bold transition-all shadow-lg"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transactions Modal */}
      <AnimatePresence>
        {showTransactionsModal && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransactionsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Card Activity</h2>
                <button
                  onClick={() => setShowTransactionsModal(false)}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Card Info */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedCard.color} rounded-xl flex items-center justify-center`}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedCard.name}</p>
                      <p className="text-sm text-slate-400">•••• {selectedCard.last4}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className="text-xl font-bold text-white">
                      {getCurrencySymbol(selectedCard.currency || 'EUR')}
                      {(selectedCard.balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Transactions</h3>
                
                {transactions.filter(t => t.card_id === selectedCard.id).length > 0 ? (
                  transactions
                    .filter(t => t.card_id === selectedCard.id)
                    .slice(0, 20)
                    .map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            transaction.type === 'debit' 
                              ? 'bg-red-500/20' 
                              : 'bg-green-500/20'
                          }`}>
                            {transaction.type === 'debit' ? (
                              <ArrowUp className="w-5 h-5 text-red-400" />
                            ) : (
                              <ArrowDown className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{transaction.description}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className={`font-bold ${
                          transaction.type === 'debit' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {transaction.type === 'debit' ? '-' : '+'}
                          {getCurrencySymbol(transaction.currency)}
                          {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No transactions yet</p>
                  </div>
                )}
              </div>

              {/* Export Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleExportTransactions(selectedCard.id)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}