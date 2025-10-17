import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Check } from 'lucide-react';

const ModeContext = createContext();

// Custom hook to use mode context
export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
};

// Mode Provider Component
export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('paywolt_mode') || 'lite';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Persist mode to localStorage
  useEffect(() => {
    localStorage.setItem('paywolt_mode', mode);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('paywolt:modechange', { 
      detail: { mode } 
    }));
  }, [mode]);

  // Mode features configuration
  const modeFeatures = {
    lite: {
      name: 'LITE Mode',
      icon: Sparkles,
      description: 'Simple and fast',
      color: 'from-blue-400 to-blue-600',
      features: [
        'Quick transactions',
        'Essential features',
        'Mobile-first design',
        'Fast performance'
      ],
      limitations: [
        'Basic analytics',
        'Limited charts',
        'Standard support'
      ]
    },
    pro: {
      name: 'PRO Mode',
      icon: Zap,
      description: 'Advanced and powerful',
      color: 'from-yellow-400 to-yellow-600',
      features: [
        'Advanced analytics',
        'Multiple wallets',
        'Detailed charts',
        'Trading features',
        'Priority support',
        'AI insights'
      ],
      limitations: []
    }
  };

  // Switch mode with transition
  const switchMode = useCallback((newMode, withConfirmation = true) => {
    if (mode === newMode) return;

    if (withConfirmation) {
      setPendingMode(newMode);
      setShowSwitchModal(true);
    } else {
      performModeSwitch(newMode);
    }
  }, [mode]);

  // Perform the actual mode switch
  const performModeSwitch = useCallback((newMode) => {
    setIsTransitioning(true);
    setShowSwitchModal(false);

    // Smooth transition
    setTimeout(() => {
      setMode(newMode);
      
      // Navigate to appropriate dashboard
      const currentPath = location.pathname;
      
      if (newMode === 'lite' && !currentPath.startsWith('/lite')) {
        navigate('/lite', { replace: true });
      } else if (newMode === 'pro' && currentPath.startsWith('/lite')) {
        navigate('/', { replace: true });
      }

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }, [navigate, location]);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    const newMode = mode === 'lite' ? 'pro' : 'lite';
    switchMode(newMode, true);
  }, [mode, switchMode]);

  // Switch to LITE mode
  const switchToLite = useCallback((withConfirmation = true) => {
    switchMode('lite', withConfirmation);
  }, [switchMode]);

  // Switch to PRO mode
  const switchToPro = useCallback((withConfirmation = true) => {
    switchMode('pro', withConfirmation);
  }, [switchMode]);

  // Get current mode features
  const getCurrentFeatures = useCallback(() => {
    return modeFeatures[mode];
  }, [mode]);

  // Check if feature is available in current mode
  const hasFeature = useCallback((feature) => {
    const features = {
      lite: ['transactions', 'wallets', 'basic-analytics', 'send', 'receive'],
      pro: ['transactions', 'wallets', 'basic-analytics', 'send', 'receive', 
            'advanced-analytics', 'trading', 'crypto', 'stocks', 'ai-insights', 
            'multiple-cards', 'beneficiaries', 'savings']
    };
    return features[mode]?.includes(feature) || false;
  }, [mode]);

  // Context value
  const value = {
    // State
    mode,
    isLite: mode === 'lite',
    isPro: mode === 'pro',
    isTransitioning,
    
    // Mode switching
    toggleMode,
    switchToLite,
    switchToPro,
    switchMode,
    
    // Features
    getCurrentFeatures,
    hasFeature,
    modeFeatures,
    
    // Modal control
    showSwitchModal,
    setShowSwitchModal,
    pendingMode
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
      
      {/* Mode Switch Confirmation Modal */}
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
          />
        )}
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <ModeTransitionOverlay mode={pendingMode || mode} modeFeatures={modeFeatures} />
        )}
      </AnimatePresence>
    </ModeContext.Provider>
  );
};

// Mode Switch Confirmation Modal
function ModeSwitchModal({ currentMode, targetMode, onConfirm, onCancel, modeFeatures }) {
  const targetFeatures = modeFeatures[targetMode];
  const Icon = targetFeatures.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${targetFeatures.color} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white text-center mb-2">
          Switch to {targetFeatures.name}?
        </h2>
        <p className="text-slate-400 text-center mb-6">
          {targetFeatures.description}
        </p>

        {/* Features List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Features:</p>
          <div className="space-y-2">
            {targetFeatures.features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
                className="flex items-center gap-2 text-sm text-white"
              >
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 bg-gradient-to-r ${targetFeatures.color} hover:opacity-90 rounded-xl text-white font-bold transition-all shadow-lg`}
          >
            Switch Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Mode Transition Overlay
function ModeTransitionOverlay({ mode, modeFeatures }) {
  const features = modeFeatures[mode];
  const Icon = features.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      <div className="text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${features.color} rounded-2xl flex items-center justify-center shadow-2xl`}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-3xl font-black mb-2 bg-gradient-to-r ${features.color} text-transparent bg-clip-text`}
        >
          Switching to {features.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400"
        >
          {features.description}
        </motion.p>

        {/* Loading Spinner */}
        <div className="relative w-16 h-16 mx-auto mt-8">
          <motion.div
            className="absolute inset-0 border-4 border-white/10 rounded-full"
          />
          <motion.div
            className={`absolute inset-0 border-4 border-transparent rounded-full`}
            style={{
              borderTopColor: mode === 'lite' ? 'rgb(96 165 250)' : 'rgb(250 204 21)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Hook to check if feature is available
export const useFeature = (feature) => {
  const { hasFeature } = useMode();
  return hasFeature(feature);
};

// HOC to require specific mode
export const withMode = (Component, requiredMode) => {
  return function ModeRestrictedComponent(props) {
    const { mode, switchMode } = useMode();

    if (mode !== requiredMode) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {requiredMode === 'pro' ? 'PRO Mode Required' : 'LITE Mode Required'}
            </h2>
            <p className="text-slate-400 mb-6">
              This feature is only available in {requiredMode.toUpperCase()} mode.
            </p>
            <button
              onClick={() => switchMode(requiredMode, false)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-white font-bold"
            >
              Switch to {requiredMode.toUpperCase()}
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default ModeContext;