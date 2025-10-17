// AuthContext.jsx - Production Ready with Full Backend Integration
// Path: /src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();
  const refreshTokenIntervalRef = useRef(null);

  // Session configuration
  const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 60 * 1000; // 1 minute warning
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Setup session timeout
  useEffect(() => {
    if (user) {
      setupSessionTimeout();
      setupTokenRefresh();
    } else {
      clearSessionTimeout();
      clearTokenRefresh();
    }

    return () => {
      clearSessionTimeout();
      clearTokenRefresh();
    };
  }, [user]);

  // Setup activity listeners
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
      
      const handleActivity = () => {
        const now = Date.now();
        if (now - lastActivity > 1000) { // Throttle to once per second
          setLastActivity(now);
          setupSessionTimeout();
        }
      };

      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [user, lastActivity]);

  // Clear session timeout
  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  }, [sessionTimeout]);

  // Setup session timeout
  const setupSessionTimeout = useCallback(() => {
    clearSessionTimeout();

    const timeout = setTimeout(() => {
      // Show warning before logout
      const warningTimeout = setTimeout(() => {
        logout('session_expired');
      }, WARNING_TIME);

      // Optional: Show warning notification
      if (window.confirm('Your session will expire in 1 minute. Do you want to stay logged in?')) {
        clearTimeout(warningTimeout);
        setupSessionTimeout();
      }
    }, SESSION_DURATION - WARNING_TIME);

    setSessionTimeout(timeout);
  }, [clearSessionTimeout]);

  // Setup token refresh
  const setupTokenRefresh = useCallback(() => {
    clearTokenRefresh();

    refreshTokenIntervalRef.current = setInterval(async () => {
      try {
        const response = await authAPI.refreshToken();
        if (response?.token) {
          localStorage.setItem('token', response.token);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, []);

  // Clear token refresh
  const clearTokenRefresh = useCallback(() => {
    if (refreshTokenIntervalRef.current) {
      clearInterval(refreshTokenIntervalRef.current);
      refreshTokenIntervalRef.current = null;
    }
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return false;
    }

    try {
      const response = await authAPI.me();
      const userData = response.user || response.data?.user || response;
      
      // Validate user data
      if (!userData || !userData.id) {
        throw new Error('Invalid user data');
      }

      // Enhanced user object
      const enhancedUser = {
        ...userData,
        isAdmin: userData.role === 'admin',
        isPremium: ['pro', 'premium'].includes(userData.plan || userData.tier),
        hasActiveSubscription: userData.subscriptionStatus === 'active',
        kycLevel: userData.kycLevel || 0,
        kycVerified: (userData.kycLevel || 0) >= 2,
        permissions: userData.permissions || [],
        limits: userData.limits || {
          dailyDeposit: 10000,
          dailyWithdraw: 5000,
          monthlyTransfer: 50000
        }
      };

      setUser(enhancedUser);
      localStorage.setItem('user', JSON.stringify(enhancedUser));
      setError(null);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError('Session expired');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password, twoFactorCode = null) => {
    setLoading(true);
    setError(null);

    try {
      const payload = { email, password };
      if (twoFactorCode) {
        payload.twoFactorCode = twoFactorCode;
      }

      const response = await authAPI.login(payload);
      
      // Handle 2FA requirement
      if (response.requires2FA) {
        setLoading(false);
        return {
          success: false,
          requires2FA: true,
          tempToken: response.tempToken
        };
      }

      const { token, user: userData } = response;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }

      // Store token and enhanced user
      localStorage.setItem('token', token);
      
      const enhancedUser = {
        ...userData,
        isAdmin: userData.role === 'admin',
        isPremium: ['pro', 'premium'].includes(userData.plan || userData.tier),
        hasActiveSubscription: userData.subscriptionStatus === 'active',
        kycLevel: userData.kycLevel || 0,
        kycVerified: (userData.kycLevel || 0) >= 2
      };
      
      localStorage.setItem('user', JSON.stringify(enhancedUser));
      setUser(enhancedUser);

      // Check mode preference and redirect
      const mode = localStorage.getItem('paywolt_mode') || 'lite';
      const destination = mode === 'lite' ? '/lite' : '/';
      
      // Track login
      try {
        await api.post('/api/analytics/track', {
          event: 'user_login',
          properties: { method: 'email', mode }
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      // Small delay for smooth transition
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 100);

      return { success: true, user: enhancedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Login failed. Please try again.';
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Please fill in all required fields');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Remove confirmPassword before sending
      const { confirmPassword, ...registrationData } = userData;

      const response = await authAPI.register(registrationData);
      const { token, user: newUser } = response;
      
      if (!token || !newUser) {
        throw new Error('Invalid response from server');
      }

      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      // Track registration
      try {
        await api.post('/api/analytics/track', {
          event: 'user_registered',
          properties: { method: 'email' }
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      // Redirect to onboarding or dashboard
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 100);

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Registration failed. Please try again.';
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(async (reason = 'manual') => {
    try {
      // Call logout API
      if (reason !== 'session_expired' && reason !== 'token_invalid') {
        await authAPI.logout().catch(err => console.error('Logout API error:', err));
      }

      // Track logout
      try {
        await api.post('/api/analytics/track', {
          event: 'user_logout',
          properties: { reason }
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('paywolt_mode');
      setUser(null);
      setError(null);

      // Clear timeouts
      clearSessionTimeout();
      clearTokenRefresh();

      // Redirect based on reason
      if (reason === 'session_expired') {
        navigate('/login?message=session_expired', { replace: true });
      } else if (reason === 'token_invalid') {
        navigate('/login?message=token_invalid', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [navigate, clearSessionTimeout, clearTokenRefresh]);

  // Update user data
  const updateUser = useCallback((updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.user || response.data?.user || response;
      
      const enhancedUser = {
        ...userData,
        isAdmin: userData.role === 'admin',
        isPremium: ['pro', 'premium'].includes(userData.plan || userData.tier),
        hasActiveSubscription: userData.subscriptionStatus === 'active',
        kycLevel: userData.kycLevel || 0,
        kycVerified: (userData.kycLevel || 0) >= 2
      };
      
      setUser(enhancedUser);
      localStorage.setItem('user', JSON.stringify(enhancedUser));
      
      return { success: true, user: enhancedUser };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  // Check if user has role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  // Get user KYC status
  const getKYCStatus = useCallback(() => {
    if (!user) return { level: 0, verified: false };
    return {
      level: user.kycLevel || 0,
      verified: user.kycVerified || false,
      pending: user.kycStatus === 'pending',
      rejected: user.kycStatus === 'rejected',
      canDeposit: (user.kycLevel || 0) >= 1,
      canWithdraw: (user.kycLevel || 0) >= 2,
      canTrade: (user.kycLevel || 0) >= 3
    };
  }, [user]);

  // Get subscription info
  const getSubscriptionInfo = useCallback(() => {
    if (!user) return { plan: 'free', active: false };
    return {
      plan: user.plan || user.tier || 'free',
      active: user.hasActiveSubscription || false,
      isPremium: user.isPremium || false,
      expiresAt: user.subscriptionExpiresAt,
      features: user.features || []
    };
  }, [user]);

  // Context value
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    
    // Auth methods
    login,
    register,
    logout,
    checkAuth,
    
    // User methods
    updateUser,
    refreshUser,
    
    // Permission methods
    hasPermission,
    hasRole,
    getKYCStatus,
    getSubscriptionInfo,
    
    // Session info
    sessionActive: !!user && !!sessionTimeout,
    lastActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC for components that require authentication
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate('/login', { replace: true });
      }
    }, [loading, isAuthenticated, navigate]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Authenticating...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};

// Custom hooks
export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

export const useRole = (role) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

export const useKYC = () => {
  const { getKYCStatus } = useAuth();
  return getKYCStatus();
};

export const useSubscription = () => {
  const { getSubscriptionInfo } = useAuth();
  return getSubscriptionInfo();
};

export default AuthContext;