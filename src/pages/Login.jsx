import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Eye, EyeOff, Shield, Lock, Mail, AlertCircle, CheckCircle2,
  Fingerprint, Smartphone, Key, Globe, ChevronRight, Loader2,
  WifiOff, AlertTriangle, Info, ArrowRight, Sparkles, Zap,
  CheckCircle, XCircle, User, CreditCard, Star
} from 'lucide-react';
import api from '../services/api';

// Production-ready Login with full backend integration
export default function Login() {
  const navigate = window.__navigate || ((path) => window.location.href = path);
  const { login, checkAuth } = useAuth();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('credentials'); // credentials, 2fa, biometric
  const [showDemo, setShowDemo] = useState(false);
  
  // Security states
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  
  // Connection states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState('checking');
  
  // Refs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const lockoutTimer = useRef(null);
  const sessionId = useRef(null);

  // Generate device fingerprint
  const generateFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const dataURL = canvas.toDataURL();
    
    const fingerprint = btoa(JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: dataURL.slice(-50),
      timestamp: Date.now()
    }));
    
    setDeviceFingerprint(fingerprint);
    return fingerprint;
  }, []);

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await api.get('/health');
      if (response.data?.status === 'operational') {
        setServerStatus('online');
      } else {
        setServerStatus('degraded');
      }
    } catch (error) {
      console.error('Server check failed:', error);
      setServerStatus('offline');
    }
  };

  // Handle lockout
  const handleLockout = useCallback(() => {
    setIsLocked(true);
    const lockoutDuration = Math.min(loginAttempts * 5, 30) * 60 * 1000; // Max 30 minutes
    const unlockTime = Date.now() + lockoutDuration;
    setLockoutTime(unlockTime);
    
    localStorage.setItem('paywolt_lockout', unlockTime.toString());
    
    lockoutTimer.current = setInterval(() => {
      const remaining = unlockTime - Date.now();
      if (remaining <= 0) {
        setIsLocked(false);
        setLockoutTime(null);
        setLoginAttempts(0);
        localStorage.removeItem('paywolt_lockout');
        clearInterval(lockoutTimer.current);
      }
    }, 1000);
  }, [loginAttempts]);

  // Check for existing lockout
  useEffect(() => {
    const storedLockout = localStorage.getItem('paywolt_lockout');
    if (storedLockout) {
      const unlockTime = parseInt(storedLockout);
      if (unlockTime > Date.now()) {
        setIsLocked(true);
        setLockoutTime(unlockTime);
        handleLockout();
      } else {
        localStorage.removeItem('paywolt_lockout');
      }
    }
  }, [handleLockout]);

  // Handle login
  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (isLocked) {
      setError('Account temporarily locked. Please try again later.');
      return;
    }
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Generate session ID
      sessionId.current = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track login attempt
      await api.post('/api/analytics/login-attempt', {
        email,
        device_fingerprint: deviceFingerprint,
        session_id: sessionId.current,
        timestamp: new Date().toISOString()
      }).catch(console.error);
      
      // Attempt login
      const result = await login(email, password, {
        remember_me: rememberMe,
        device_fingerprint: deviceFingerprint,
        session_id: sessionId.current
      });
      
      if (result.success) {
        // Check if 2FA is required
        if (result.requires2FA) {
          setStep('2fa');
          setSuccess('Please enter your 2FA code');
          return;
        }
        
        // Check if biometric setup is available
        if (result.biometricAvailable && !result.biometricSetup) {
          setStep('biometric');
          return;
        }
        
        // Login successful
        setSuccess('Login successful! Redirecting...');
        setLoginAttempts(0);
        localStorage.removeItem('paywolt_login_attempts');
        
        // Track successful login
        await api.post('/api/analytics/login-success', {
          user_id: result.user?.id,
          session_id: sessionId.current
        }).catch(console.error);
        
        // Store remember me token if selected
        if (rememberMe && result.rememberToken) {
          localStorage.setItem('paywolt_remember', result.rememberToken);
        }
        
        // Navigate to dashboard or requested page
        setTimeout(() => {
          const redirectTo = sessionStorage.getItem('paywolt_redirect') || '/dashboard';
          sessionStorage.removeItem('paywolt_redirect');
          navigate(redirectTo);
        }, 1000);
      } else {
        // Login failed
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        localStorage.setItem('paywolt_login_attempts', attempts.toString());
        
        if (attempts >= 5) {
          handleLockout();
          setError('Too many failed attempts. Account locked temporarily.');
        } else if (attempts >= 3) {
          setCaptchaRequired(true);
          setError(result.error || `Invalid credentials. ${5 - attempts} attempts remaining.`);
        } else {
          setError(result.error || 'Invalid email or password');
        }
        
        // Track failed login
        await api.post('/api/analytics/login-failed', {
          email,
          reason: result.error,
          attempts: attempts,
          session_id: sessionId.current
        }).catch(console.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification
  const handle2FAVerification = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/api/auth/verify-2fa', {
        code: twoFactorCode,
        email,
        session_id: sessionId.current
      });
      
      if (response.data?.success) {
        setSuccess('Verification successful! Redirecting...');
        
        // Complete login
        await checkAuth();
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle biometric setup
  const handleBiometricSetup = async (enable) => {
    setLoading(true);
    
    try {
      if (enable && 'credentials' in navigator) {
        // Create biometric credential
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'PayWolt', id: window.location.hostname },
            user: {
              id: new TextEncoder().encode(email),
              name: email,
              displayName: email
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required'
            }
          }
        });
        
        // Save credential to backend
        await api.post('/api/auth/biometric-setup', {
          credential_id: credential.id,
          public_key: credential.response.publicKey
        });
        
        setSuccess('Biometric authentication enabled!');
      }
      
      // Continue to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Biometric setup error:', error);
      setError('Biometric setup failed. You can enable it later in settings.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Load demo credentials
  const loadDemoCredentials = () => {
    setEmail('demo@paywolt.com');
    setPassword('Demo123!@#');
    setShowDemo(true);
    setError('');
    setSuccess('Demo credentials loaded. Click "Sign In" to explore!');
  };

  // Format lockout time
  const formatLockoutTime = () => {
    if (!lockoutTime) return '';
    
    const remaining = Math.max(0, lockoutTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize
  useEffect(() => {
    generateFingerprint();
    checkServerStatus();
    
    // Check for remember me token
    const rememberToken = localStorage.getItem('paywolt_remember');
    if (rememberToken) {
      api.post('/api/auth/verify-remember-token', { token: rememberToken })
        .then(response => {
          if (response.data?.valid) {
            setEmail(response.data.email);
            setRememberMe(true);
            passwordRef.current?.focus();
          }
        })
        .catch(console.error);
    } else {
      emailRef.current?.focus();
    }
    
    // Load saved login attempts
    const savedAttempts = localStorage.getItem('paywolt_login_attempts');
    if (savedAttempts) {
      setLoginAttempts(parseInt(savedAttempts));
    }
  }, [generateFingerprint]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (lockoutTimer.current) {
        clearInterval(lockoutTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(45deg, transparent 48%, rgba(212, 175, 55, 0.1) 50%, transparent 52%)',
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      {/* Animated Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Connection Status Bar */}
      <AnimatePresence>
        {(!isOnline || serverStatus === 'offline') && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm py-3 px-4 z-50"
          >
            <div className="flex items-center justify-center gap-2 text-white text-sm">
              <WifiOff className="w-4 h-4" />
              <span>
                {!isOnline ? 'No internet connection' : 'Server is currently offline'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 md:p-12 w-full max-w-md relative z-10 shadow-2xl"
      >
        {/* Enhanced Logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-12 h-12 text-slate-900" />
            </div>
            <motion.div
              className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-2xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Security badges */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text mb-2">
            Welcome to PayWolt
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Premium Banking & Finance Platform</p>
        </motion.div>

        {/* Server Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            serverStatus === 'online' ? 'bg-green-400' :
            serverStatus === 'degraded' ? 'bg-yellow-400' :
            serverStatus === 'offline' ? 'bg-red-400' :
            'bg-slate-400'
          }`} />
          <span className="text-xs text-slate-500">
            {serverStatus === 'online' ? 'All systems operational' :
             serverStatus === 'degraded' ? 'Degraded performance' :
             serverStatus === 'offline' ? 'Server offline' :
             'Checking status...'}
          </span>
        </motion.div>

        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lockout Timer */}
        {isLocked && lockoutTime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-orange-200 font-semibold">Account Temporarily Locked</p>
                <p className="text-orange-200/80 text-sm">
                  Try again in: {formatLockoutTime()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step-based Forms */}
        <AnimatePresence mode="wait">
          {step === 'credentials' && (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  Email Address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-base outline-none transition-all focus:ring-2 focus:ring-yellow-500/20 placeholder-slate-500"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading || isLocked}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/20 focus:border-yellow-500 rounded-xl px-4 py-3.5 pr-12 text-base outline-none transition-all focus:ring-2 focus:ring-yellow-500/20 placeholder-slate-500"
                    placeholder="Enter your password"
                    required
                    disabled={loading || isLocked}
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-all"
                    disabled={loading || isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-yellow-500 focus:ring-yellow-500/20"
                    disabled={loading || isLocked}
                  />
                  <span className="text-slate-400 group-hover:text-white transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: isLocked || loading ? 1 : 1.02 }}
                whileTap={{ scale: isLocked || loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading || isLocked || !isOnline || serverStatus === 'offline'}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-slate-900 font-black text-lg py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : isLocked ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Account Locked
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Sign In Securely
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* 2FA Verification Step */}
          {step === '2fa' && (
            <motion.div
              key="2fa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Smartphone className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white/10 text-white border border-white/20 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest outline-none transition-all focus:ring-2 focus:ring-yellow-500/20 placeholder-slate-500"
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setTwoFactorCode('');
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
                  disabled={loading}
                >
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handle2FAVerification}
                  disabled={loading || twoFactorCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-slate-900 font-bold transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Biometric Setup Step */}
          {step === 'biometric' && (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Fingerprint className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Enable Biometric Login</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Use your fingerprint or face to sign in faster
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBiometricSetup(true)}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-bold transition-all shadow-lg"
                  disabled={loading}
                >
                  Enable Biometric Login
                </motion.button>
                <button
                  onClick={() => handleBiometricSetup(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
                  disabled={loading}
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        {step === 'credentials' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-4 my-6"
            >
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </motion.div>

            {/* Alternative Login Methods */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <button
                type="button"
                onClick={loadDemoCredentials}
                className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/40 rounded-xl text-purple-300 font-semibold transition-all flex items-center justify-center gap-2"
                disabled={loading || isLocked}
              >
                <Sparkles className="w-5 h-5" />
                Try Demo Account
              </button>

              {/* Create Account Link */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="text-center text-slate-400 text-sm"
              >
                New to PayWolt?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors inline-flex items-center gap-1"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.p>
            </motion.div>
          </>
        )}

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500"
        >
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-400" />
            <span>256-bit SSL</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>PCI DSS</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span>GDPR</span>
          </div>
        </motion.div>

        {/* Demo Credentials Notice */}
        {showDemo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-300 mb-1">Demo Mode Active</p>
                <p className="text-blue-200/80 text-xs">
                  Explore all features with sample data. No real transactions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400/30 rounded-full pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}