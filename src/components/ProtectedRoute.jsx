// ProtectedRoute.jsx - Production Ready with Complete Authorization
// Path: /src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, AlertCircle, UserCheck, CreditCard, Loader2 } from 'lucide-react';
import api from '../services/api';

// Main Protected Route Component
export default function ProtectedRoute({ 
  children, 
  requireKYC = false, 
  requireAdmin = false,
  minKYCLevel = 2,
  requireSubscription = false,
  allowedRoles = [],
  customCheck = null 
}) {
  const { isAuthenticated, user, loading, checkAuth } = useAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Verify authentication status on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !loading) {
        await checkAuth();
      }
      setAuthChecking(false);
    };
    verifyAuth();
  }, [isAuthenticated, loading, checkAuth]);

  // Check authorization
  const checkAuthorization = () => {
    if (!isAuthenticated) return { status: 'not-authenticated', message: 'Authentication Required' };
    
    if (requireAdmin && user?.role !== 'admin') {
      return { status: 'not-admin', message: 'Admin Access Required' };
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      return { status: 'not-authorized', message: 'Insufficient Permissions' };
    }
    
    if (requireKYC && (!user?.kycLevel || user.kycLevel < minKYCLevel)) {
      return { status: 'kyc-required', message: `KYC Level ${minKYCLevel} Required` };
    }
    
    if (requireSubscription && !user?.hasActiveSubscription) {
      return { status: 'subscription-required', message: 'Active Subscription Required' };
    }
    
    if (customCheck && !customCheck(user)) {
      return { status: 'custom-failed', message: 'Access Denied' };
    }
    
    return { status: 'authorized', message: 'Access Granted' };
  };

  const authStatus = checkAuthorization();

  // Show unauthorized screen briefly before redirect
  useEffect(() => {
    if (authStatus.status !== 'authorized' && !loading && !authChecking) {
      setShowUnauthorized(true);
      const timer = setTimeout(() => {
        setShowUnauthorized(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authStatus.status, loading, authChecking]);

  // Loading state
  if (loading || authChecking) {
    return <LoadingSkeleton />;
  }

  // Handle different authorization statuses
  switch (authStatus.status) {
    case 'not-authenticated':
      return showUnauthorized ? (
        <UnauthorizedScreen message={authStatus.message} type="auth" />
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      );

    case 'not-admin':
    case 'not-authorized':
      return showUnauthorized ? (
        <UnauthorizedScreen message={authStatus.message} type="permission" />
      ) : (
        <Navigate to="/" replace />
      );

    case 'kyc-required':
      return showUnauthorized ? (
        <UnauthorizedScreen message={authStatus.message} type="kyc" />
      ) : (
        <Navigate to="/settings/kyc" state={{ from: location }} replace />
      );

    case 'subscription-required':
      return showUnauthorized ? (
        <UnauthorizedScreen message={authStatus.message} type="subscription" />
      ) : (
        <Navigate to="/settings/subscription" state={{ from: location }} replace />
      );

    case 'custom-failed':
      return showUnauthorized ? (
        <UnauthorizedScreen message={authStatus.message} type="custom" />
      ) : (
        <Navigate to="/" replace />
      );

    case 'authorized':
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      );

    default:
      return <Navigate to="/" replace />;
  }
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Shield className="w-10 h-10 text-slate-900" />
        </motion.div>

        <motion.h2
          className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verifying Access
        </motion.h2>
        <p className="text-slate-400 text-sm">Checking your credentials...</p>

        <div className="relative w-16 h-16 mx-auto mt-6">
          <motion.div
            className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// Unauthorized Screen Component
function UnauthorizedScreen({ message, type = 'auth' }) {
  const getIcon = () => {
    switch (type) {
      case 'kyc':
        return <UserCheck className="w-12 h-12 text-yellow-400" />;
      case 'subscription':
        return <CreditCard className="w-12 h-12 text-purple-400" />;
      case 'permission':
        return <AlertCircle className="w-12 h-12 text-orange-400" />;
      default:
        return <Lock className="w-12 h-12 text-red-400" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'kyc':
        return 'yellow';
      case 'subscription':
        return 'purple';
      case 'permission':
        return 'orange';
      default:
        return 'red';
    }
  };

  const color = getColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="text-center max-w-md"
      >
        <motion.div
          className={`w-24 h-24 mx-auto mb-6 bg-${color}-500/20 rounded-full flex items-center justify-center border-4 border-${color}-500/30`}
          animate={{
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {getIcon()}
        </motion.div>

        <h2 className="text-3xl font-black text-white mb-3">{message}</h2>
        <p className="text-slate-400 mb-6">
          {type === 'kyc' && 'Please complete your verification to continue.'}
          {type === 'subscription' && 'Upgrade your account to access this feature.'}
          {type === 'permission' && "You don't have permission to access this page."}
          {type === 'auth' && 'Please sign in to continue.'}
          {type === 'custom' && 'This page is restricted.'}
        </p>

        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 bg-${color}-400 rounded-full`}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600"
        >
          <Shield className="w-4 h-4 text-yellow-500/60" />
          <span>Protected by PayWolt Security</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Public Route Component
export function PublicRoute({ children, redirectIfAuthenticated = true }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (isAuthenticated && redirectIfAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Role-Based Route Component
export function RoleBasedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !allowedRoles.includes(user?.role))) {
      setShowUnauthorized(true);
      const timer = setTimeout(() => {
        setShowUnauthorized(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loading, allowedRoles]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return showUnauthorized ? (
      <UnauthorizedScreen message="Authentication Required" type="auth" />
    ) : (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  if (!allowedRoles.includes(user?.role)) {
    return showUnauthorized ? (
      <UnauthorizedScreen message="Insufficient Permissions" type="permission" />
    ) : (
      <Navigate to="/" replace />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Subscription-Based Route Component
export function SubscriptionRoute({ children, requiredPlan = 'pro' }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  const hasRequiredPlan = () => {
    const planHierarchy = ['free', 'pro', 'premium'];
    const userPlanIndex = planHierarchy.indexOf(user?.plan || 'free');
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
    return userPlanIndex >= requiredPlanIndex;
  };

  useEffect(() => {
    if (!loading && (!isAuthenticated || !hasRequiredPlan())) {
      setShowUnauthorized(true);
      const timer = setTimeout(() => {
        setShowUnauthorized(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loading]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return showUnauthorized ? (
      <UnauthorizedScreen message="Authentication Required" type="auth" />
    ) : (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  if (!hasRequiredPlan()) {
    return showUnauthorized ? (
      <UnauthorizedScreen message={`${requiredPlan.toUpperCase()} Plan Required`} type="subscription" />
    ) : (
      <Navigate to="/settings/subscription" state={{ requiredPlan }} replace />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// KYC Route Component
export function KYCRoute({ children, minLevel = 2 }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    const checkKYC = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await api.get('/api/users/kyc/status');
          setKycStatus(response.data);
        } catch (error) {
          console.error('Failed to check KYC status:', error);
        }
      }
    };
    checkKYC();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!loading && kycStatus && kycStatus.level < minLevel) {
      setShowUnauthorized(true);
      const timer = setTimeout(() => {
        setShowUnauthorized(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [kycStatus, loading, minLevel]);

  if (loading || !kycStatus) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return showUnauthorized ? (
      <UnauthorizedScreen message="Authentication Required" type="auth" />
    ) : (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  if (kycStatus.level < minLevel) {
    return showUnauthorized ? (
      <UnauthorizedScreen message={`KYC Level ${minLevel} Required`} type="kyc" />
    ) : (
      <Navigate to="/settings/kyc" state={{ from: location, requiredLevel: minLevel }} replace />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}