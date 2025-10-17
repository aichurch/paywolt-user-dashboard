import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Sparkles, Check, Crown, Diamond, Gem, Star,
  Lock, Unlock, TrendingUp, Shield, Award, Trophy,
  Rocket, Activity, BarChart3, CreditCard, Wallet,
  ChevronRight, X, AlertCircle, CheckCircle
} from 'lucide-react';
import api from '../services/api';

const ModeContext = createContext();

// Custom hook to use mode context
export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
};

// Mode Provider Component - Ultra Premium Version
export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('paywolt_mode') || 'lite';
  });
  const [userTier, setUserTier] = useState(() => {
    return localStorage.getItem('paywolt_tier') || 'basic';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [features, setFeatures] = useState({});
  const [limits, setLimits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Get navigation functions from props or window
  const navigate = window.__navigate || ((path) => window.location.href = path);
  const location = window.location;
  const syncInterval = useRef(null);
  const analyticsRef = useRef(null);

  // Tier configuration with enterprise features
  const tierConfig = {
    basic: {
      name: 'Basic',
      icon: Star,
      color: 'from-slate-400 to-slate-600',
      badge: 'bg-slate-500',
      modes: ['lite'],
      limits: {
        dailyTransactions: 10,
        monthlyVolume: 5000,
        wallets: 1,
        cards: 1,
        beneficiaries: 5
      }
    },
    pro: {
      name: 'Professional',
      icon: Zap,
      color: 'from-blue-400 to-blue-600',
      badge: 'bg-blue-500',
      modes: ['lite', 'pro'],
      limits: {
        dailyTransactions: 100,
        monthlyVolume: 50000,
        wallets: 5,
        cards: 3,
        beneficiaries: 50
      }
    },
    premium: {
      name: 'Premium',
      icon: Crown,
      color: 'from-purple-400 to-purple-600',
      badge: 'bg-purple-500',
      modes: ['lite', 'pro', 'advanced'],
      limits: {
        dailyTransactions: 500,
        monthlyVolume: 250000,
        wallets: 10,
        cards: 5,
        beneficiaries: 200
      }
    },
    enterprise: {
      name: 'Enterprise',
      icon: Diamond,
      color: 'from-yellow-400 to-yellow-600',
      badge: 'bg-yellow-500',
      modes: ['lite', 'pro', 'advanced', 'enterprise'],
      limits: {
        dailyTransactions: -1, // Unlimited
        monthlyVolume: -1,
        wallets: -1,
        cards: 10,
        beneficiaries: -1
      }
    }
  };

  // Enhanced mode features configuration
  const modeFeatures = {
    lite: {
      name: 'LITE Mode',
      icon: Sparkles,
      description: 'Simple, fast & intuitive interface',
      color: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      features: [
        { name: 'Quick transactions', icon: Zap, enabled: true },
        { name: 'Essential features', icon: CheckCircle, enabled: true },
        { name: 'Mobile-first design', icon: Activity, enabled: true },
        { name: 'Fast performance', icon: Rocket, enabled: true },
        { name: 'Basic analytics', icon: BarChart3, enabled: true },
        { name: 'Single wallet', icon: Wallet, enabled: true }
      ],
      restrictions: ['advanced-analytics', 'trading', 'crypto', 'stocks', 'ai-insights']
    },
    pro: {
      name: 'PRO Mode',
      icon: Zap,
      description: 'Advanced features for power users',
      color: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      features: [
        { name: 'Advanced analytics', icon: TrendingUp, enabled: true },
        { name: 'Multiple wallets', icon: Wallet, enabled: true },
        { name: 'Trading features', icon: Activity, enabled: true },
        { name: 'Crypto & stocks', icon: Diamond, enabled: true },
        { name: 'AI insights', icon: Sparkles, enabled: true },
        { name: 'Priority support', icon: Shield, enabled: true },
        { name: 'Custom dashboards', icon: BarChart3, enabled: true },
        { name: 'API access', icon: Zap, enabled: true }
      ],
      restrictions: []
    },
    advanced: {
      name: 'ADVANCED Mode',
      icon: Crown,
      description: 'Professional trading & enterprise tools',
      color: 'from-yellow-400 to-orange-600',
      bgGradient: 'from-yellow-500/10 to-orange-600/10',
      features: [
        { name: 'Algorithmic trading', icon: Activity, enabled: true },
        { name: 'Risk management', icon: Shield, enabled: true },
        { name: 'Portfolio optimization', icon: Trophy, enabled: true },
        { name: 'Real-time market data', icon: TrendingUp, enabled: true },
        { name: 'Advanced AI models', icon: Sparkles, enabled: true },
        { name: 'White-label solutions', icon: Award, enabled: true },
        { name: 'Dedicated account manager', icon: Star, enabled: true },
        { name: 'Custom integrations', icon: Zap, enabled: true }
      ],
      restrictions: []
    },
    enterprise: {
      name: 'ENTERPRISE Mode',
      icon: Diamond,
      description: 'Complete banking & financial ecosystem',
      color: 'from-gradient-to-r from-gold-400 to-gold-600',
      bgGradient: 'from-gold-500/10 to-gold-600/10',
      features: [
        { name: 'Unlimited everything', icon: Crown, enabled: true },
        { name: 'Custom development', icon: Rocket, enabled: true },
        { name: 'SLA guarantee', icon: Shield, enabled: true },
        { name: '24/7 support', icon: Activity, enabled: true },
        { name: 'Compliance tools', icon: CheckCircle, enabled: true },
        { name: 'Multi-entity management', icon: Diamond, enabled: true },
        { name: 'Private infrastructure', icon: Lock, enabled: true },
        { name: 'Custom contracts', icon: Award, enabled: true }
      ],
      restrictions: []
    }
  };

  // Fetch user tier and features from backend
  useEffect(() => {
    const fetchUserConfiguration = async () => {
  // Don't fetch if no token (user not logged in)
  const token = localStorage.getItem('token');
  if (!token) {
    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    const [tierResponse, featuresResponse, limitsResponse] = await Promise.all([
      api.get('/api/user/tier'),
      api.get('/api/user/features'),
      api.get('/api/user/limits')
    ]);

    setUserTier(tierResponse.data.tier || 'basic');
    setFeatures(featuresResponse.data.features || {});
    setLimits(limitsResponse.data.limits || {});
    
    // Store in localStorage for offline access
    localStorage.setItem('paywolt_tier', tierResponse.data.tier);
    localStorage.setItem('paywolt_features', JSON.stringify(featuresResponse.data.features));
    localStorage.setItem('paywolt_limits', JSON.stringify(limitsResponse.data.limits));
  } catch (error) {
    console.error('Error fetching user configuration:', error);
    // Load from localStorage as fallback
    const cachedFeatures = localStorage.getItem('paywolt_features');
    const cachedLimits = localStorage.getItem('paywolt_limits');
    if (cachedFeatures) setFeatures(JSON.parse(cachedFeatures));
    if (cachedLimits) setLimits(JSON.parse(cachedLimits));
  } finally {
    setIsLoading(false);
  }
};

    fetchUserConfiguration();

    // Sync with backend every 5 minutes
    syncInterval.current = setInterval(fetchUserConfiguration, 5 * 60 * 1000);

    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, []);

  // Track mode changes in analytics
  const trackModeChange = useCallback(async (fromMode, toMode) => {
    try {
      await api.post('/api/analytics/mode-change', {
        from: fromMode,
        to: toMode,
        timestamp: new Date().toISOString(),
        path: location.pathname,
        tier: userTier
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [location.pathname, userTier]);

  // Persist mode to localStorage and backend
  useEffect(() => {
    localStorage.setItem('paywolt_mode', mode);
    
    // Update backend preference
    api.post('/api/user/preferences', { mode }).catch(console.error);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('paywolt:modechange', { 
      detail: { mode, tier: userTier, features } 
    }));
  }, [mode, userTier, features]);

  // Check if user can access mode based on tier
  const canAccessMode = useCallback((targetMode) => {
    const tier = tierConfig[userTier];
    return tier?.modes?.includes(targetMode) || false;
  }, [userTier]);

  // Switch mode with validation and transition
  const switchMode = useCallback(async (newMode, withConfirmation = true) => {
    if (mode === newMode) return;

    // Check tier permissions
    if (!canAccessMode(newMode)) {
      setShowUpgradeModal(true);
      return;
    }

    if (withConfirmation) {
      setPendingMode(newMode);
      setShowSwitchModal(true);
    } else {
      await performModeSwitch(newMode);
    }
  }, [mode, canAccessMode]);

  // Perform the actual mode switch with animations
  const performModeSwitch = useCallback(async (newMode) => {
    setIsTransitioning(true);
    setShowSwitchModal(false);

    // Track analytics
    await trackModeChange(mode, newMode);

    // Smooth transition
    setTimeout(() => {
      setMode(newMode);
      
      // Navigate to appropriate dashboard
      const currentPath = location.pathname;
      const modeRoutes = {
        lite: '/lite',
        pro: '/dashboard',
        advanced: '/trading',
        enterprise: '/enterprise'
      };
      
      const targetRoute = modeRoutes[newMode];
      if (targetRoute && !currentPath.startsWith(targetRoute)) {
        navigate(targetRoute, { replace: true });
      }

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
        setPendingMode(null);
      }, 500);
    }, 300);
  }, [navigate, location, mode, trackModeChange]);

  // Upgrade tier
  const upgradeTier = useCallback(async (newTier) => {
    try {
      const response = await api.post('/api/user/upgrade-tier', { tier: newTier });
      if (response.data.success) {
        setUserTier(newTier);
        localStorage.setItem('paywolt_tier', newTier);
        return true;
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      return false;
    }
  }, []);

  // Check feature availability
  const hasFeature = useCallback((feature) => {
    // Check tier limits
    const tier = tierConfig[userTier];
    if (!tier) return false;

    // Check mode restrictions
    const currentModeConfig = modeFeatures[mode];
    if (currentModeConfig?.restrictions?.includes(feature)) return false;

    // Check backend features
    return features[feature] === true;
  }, [mode, userTier, features]);

  // Get current limits
  const getCurrentLimits = useCallback(() => {
    const tierLimits = tierConfig[userTier]?.limits || {};
    return { ...tierLimits, ...limits };
  }, [userTier, limits]);

  // Check if limit is reached
  const isLimitReached = useCallback((limitType, currentValue) => {
    const currentLimits = getCurrentLimits();
    const limit = currentLimits[limitType];
    if (limit === -1) return false; // Unlimited
    return currentValue >= limit;
  }, [getCurrentLimits]);

  // Context value
  const value = {
    // State
    mode,
    userTier,
    isLite: mode === 'lite',
    isPro: mode === 'pro',
    isAdvanced: mode === 'advanced',
    isEnterprise: mode === 'enterprise',
    isTransitioning,
    isLoading,
    
    // Mode management
    switchMode,
    canAccessMode,
    performModeSwitch,
    
    // Tier management
    upgradeTier,
    tierConfig,
    
    // Features & limits
    hasFeature,
    features,
    getCurrentLimits,
    isLimitReached,
    limits,
    
    // Configuration
    modeFeatures,
    
    // Modals
    showSwitchModal,
    setShowSwitchModal,
    showUpgradeModal,
    setShowUpgradeModal,
    pendingMode
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
      
      {/* Mode Switch Modal */}
      <AnimatePresence>
        {showSwitchModal && pendingMode && (
          <ModeSwitchModal
            currentMode={mode}
            targetMode={pendingMode}
            onConfirm={() => performModeSwitch(pendingMode)}
            onCancel={() => {
              setShowSwitchModal(false);
              setPendingMode(null);
            }}
            modeFeatures={modeFeatures}
            userTier={userTier}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal
            currentTier={userTier}
            tierConfig={tierConfig}
            onUpgrade={upgradeTier}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <ModeTransitionOverlay 
            mode={pendingMode || mode} 
            modeFeatures={modeFeatures}
            userTier={userTier}
          />
        )}
      </AnimatePresence>
    </ModeContext.Provider>
  );
};

// Enhanced Mode Switch Modal
function ModeSwitchModal({ currentMode, targetMode, onConfirm, onCancel, modeFeatures, userTier }) {
  const targetFeatures = modeFeatures[targetMode];
  const Icon = targetFeatures.icon;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${targetFeatures.bgGradient} opacity-30`} />
        
        <div className="relative z-10">
          {/* Icon with animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${targetFeatures.color} rounded-3xl flex items-center justify-center shadow-2xl`}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title and description */}
          <h2 className="text-3xl font-black text-white text-center mb-3">
            Switch to {targetFeatures.name}?
          </h2>
          <p className="text-slate-400 text-center mb-8 text-lg">
            {targetFeatures.description}
          </p>

          {/* Features grid */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">
              Included Features:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {targetFeatures.features.slice(0, 8).map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                  className="flex items-center gap-2"
                >
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${targetFeatures.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm text-white/90">{feature.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* User tier badge */}
          <div className="flex justify-center mb-6">
            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Your tier: {userTier.toUpperCase()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3.5 bg-gradient-to-r ${targetFeatures.color} hover:opacity-90 rounded-xl text-white font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Switching...</span>
                </>
              ) : (
                <>
                  <span>Switch Now</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Upgrade Modal Component
function UpgradeModal({ currentTier, tierConfig, onUpgrade, onClose }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedTier) return;
    setIsUpgrading(true);
    const success = await onUpgrade(selectedTier);
    if (success) {
      onClose();
    }
    setIsUpgrading(false);
  };

  const tiers = Object.entries(tierConfig).filter(([key]) => key !== currentTier);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Upgrade Your Plan</h2>
            <p className="text-slate-400">Unlock more features and higher limits</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Current tier */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${tierConfig[currentTier].color} rounded-xl flex items-center justify-center`}>
                {React.createElement(tierConfig[currentTier].icon, { className: "w-6 h-6 text-white" })}
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Plan</p>
                <p className="text-xl font-bold text-white">{tierConfig[currentTier].name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Monthly Volume</p>
              <p className="text-lg font-bold text-white">
                ${tierConfig[currentTier].limits.monthlyVolume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Available tiers */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {tiers.map(([key, tier]) => {
            const TierIcon = tier.icon;
            const isSelected = selectedTier === key;
            
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTier(key)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-white/10 border-white/30' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Popular badge */}
                {key === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
                    <span className="text-xs font-bold text-white">POPULAR</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center`}>
                      <TierIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                      <p className="text-sm text-slate-400">Tier</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily Transactions</span>
                    <span className="text-white font-semibold">
                      {tier.limits.dailyTransactions === -1 ? 'Unlimited' : tier.limits.dailyTransactions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Monthly Volume</span>
                    <span className="text-white font-semibold">
                      {tier.limits.monthlyVolume === -1 ? 'Unlimited' : `$${tier.limits.monthlyVolume.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Wallets</span>
                    <span className="text-white font-semibold">
                      {tier.limits.wallets === -1 ? 'Unlimited' : tier.limits.wallets}
                    </span>
                  </div>
                </div>

                {/* Available modes */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-400 mb-2">Available Modes</p>
                  <div className="flex flex-wrap gap-2">
                    {tier.modes.map(mode => (
                      <span key={mode} className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                        {mode.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade button */}
        <div className="flex justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={isUpgrading}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgrade}
            disabled={!selectedTier || isUpgrading}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpgrading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Upgrading...</span>
              </>
            ) : (
              <>
                <span>Upgrade Now</span>
                <Rocket className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Enhanced Transition Overlay
function ModeTransitionOverlay({ mode, modeFeatures, userTier }) {
  const features = modeFeatures[mode];
  const Icon = features.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      <div className="text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`w-32 h-32 mx-auto mb-8 bg-gradient-to-br ${features.color} rounded-3xl flex items-center justify-center shadow-2xl`}
        >
          <Icon className="w-16 h-16 text-white" />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black mb-3 text-white"
        >
          Switching to {features.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-slate-400 mb-2"
        >
          {features.description}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-slate-500"
        >
          {userTier.toUpperCase()} TIER
        </motion.p>

        {/* Advanced loading animation */}
        <div className="relative w-20 h-20 mx-auto mt-10">
          <motion.div
            className="absolute inset-0 border-4 border-white/10 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-transparent rounded-full"
            style={{
              borderTopColor: mode === 'lite' ? 'rgb(96 165 250)' : 
                              mode === 'pro' ? 'rgb(168 85 247)' :
                              mode === 'advanced' ? 'rgb(251 191 36)' : 'rgb(234 179 8)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-transparent rounded-full"
            style={{
              borderRightColor: mode === 'lite' ? 'rgb(59 130 246)' : 
                               mode === 'pro' ? 'rgb(139 92 246)' :
                               mode === 'advanced' ? 'rgb(245 158 11)' : 'rgb(202 138 4)'
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Hooks
export const useFeature = (feature) => {
  const { hasFeature } = useMode();
  return hasFeature(feature);
};

export const useLimit = (limitType) => {
  const { getCurrentLimits, isLimitReached } = useMode();
  const limits = getCurrentLimits();
  return {
    limit: limits[limitType],
    isUnlimited: limits[limitType] === -1,
    checkReached: (value) => isLimitReached(limitType, value)
  };
};

export const useTier = () => {
  const { userTier, tierConfig, upgradeTier } = useMode();
  return {
    current: userTier,
    config: tierConfig[userTier],
    allTiers: tierConfig,
    upgrade: upgradeTier
  };
};

// HOC to require specific mode
export const withMode = (Component, requiredMode) => {
  return function ModeRestrictedComponent(props) {
    const { mode, switchMode, canAccessMode } = useMode();

    if (mode !== requiredMode) {
      const canAccess = canAccessMode(requiredMode);
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${
              canAccess ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'
            } rounded-2xl flex items-center justify-center`}>
              {canAccess ? <Unlock className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {requiredMode.toUpperCase()} Mode Required
            </h2>
            <p className="text-slate-400 mb-8">
              {canAccess 
                ? `This feature requires ${requiredMode.toUpperCase()} mode. Switch now to access it.`
                : `Your current tier doesn't include ${requiredMode.toUpperCase()} mode. Upgrade to access this feature.`
              }
            </p>
            {canAccess ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => switchMode(requiredMode, false)}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-white font-bold shadow-lg"
              >
                Switch to {requiredMode.toUpperCase()}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('paywolt:upgrade'))}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white font-bold shadow-lg"
              >
                Upgrade Plan
              </motion.button>
            )}
          </motion.div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// HOC to require specific tier
export const withTier = (Component, requiredTier) => {
  return function TierRestrictedComponent(props) {
    const { userTier, setShowUpgradeModal } = useMode();
    
    const tierLevels = { basic: 0, pro: 1, premium: 2, enterprise: 3 };
    const hasAccess = tierLevels[userTier] >= tierLevels[requiredTier];

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {requiredTier.toUpperCase()} Plan Required
            </h2>
            <p className="text-slate-400 mb-8">
              This feature is available for {requiredTier.toUpperCase()} tier and above. 
              Upgrade your plan to unlock this and many more features.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white font-bold shadow-lg"
            >
              Upgrade to {requiredTier.toUpperCase()}
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default ModeContext;