import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Phone, CheckCircle2, AlertCircle, Eye, EyeOff,
  Sparkles, Shield, Wallet, Zap, Star, ArrowRight, Check, Globe,
  CreditCard, Fingerprint, Key, Gift, Trophy, Diamond, Crown,
  Activity, BarChart3, TrendingUp, Clock, Calendar, Info, X,
  AlertTriangle, Loader2, ChevronRight, FileText, ShieldCheck
} from 'lucide-react';
import api, { authAPI, walletAPI, analyticsAPI } from '../services/api';

// Production-ready Register with full backend integration
export default function Register() {
  const navigate = window.__navigate || ((path) => window.location.href = path);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    referralCode: ''
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Verification, 3: Success
  
  // Agreements
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToGDPR, setAgreedToGDPR] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  
  // Registration data
  const [generatedId, setGeneratedId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState('');
  const [wallets, setWallets] = useState([]);
  
  // Validation states
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailValid, setEmailValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [focusedField, setFocusedField] = useState('');
  
  // Server & connectivity
  const [serverStatus, setServerStatus] = useState('checking');
  const [countries, setCountries] = useState([]);
  const [ipCountry, setIpCountry] = useState('');
  
  // Refs
  const sessionId = useRef(null);
  const deviceFingerprint = useRef('');
  const registrationStartTime = useRef(Date.now());

  // Generate device fingerprint
  const generateFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    
    const fingerprint = btoa(JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.slice(0, 50),
      canvas: canvas.toDataURL().slice(-50),
      timestamp: Date.now()
    }));
    
    deviceFingerprint.current = fingerprint;
    return fingerprint;
  }, []);

  // Load countries list
  const loadCountries = async () => {
    try {
      const response = await api.get('/api/data/countries');
      setCountries(response.data?.countries || []);
      
      // Detect user's country from IP
      const ipResponse = await api.get('/api/data/ip-location');
      if (ipResponse.data?.country_code) {
        setIpCountry(ipResponse.data.country_code);
        setFormData(prev => ({ ...prev, country: ipResponse.data.country_code }));
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback countries
      setCountries([
        { code: 'GR', name: 'Greece', flag: '🇬🇷' },
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'FR', name: 'France', flag: '🇫🇷' }
      ]);
    }
  };

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await api.get('/api/health');
      setServerStatus(response.data?.status === 'operational' ? 'online' : 'degraded');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    const password = formData.password;
    
    // Length
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    
    // Character types
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    // No common patterns
    if (!/(.)\1{2,}/.test(password)) strength += 5; // No repeated chars
    if (!/12345|qwerty|password/i.test(password)) strength += 5; // No common passwords
    
    setPasswordStrength(Math.min(strength, 100));
  }, [formData.password]);

  // Validate email
  const validateEmail = (email) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailValid(valid);
    return valid;
  };

  // Validate phone
  const validatePhone = (phone) => {
    if (!phone) return true; // Optional field
    const valid = /^\+?[\d\s()-]{10,}$/.test(phone.replace(/\s/g, ''));
    setPhoneValid(valid);
    return valid;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation
    if (name === 'email') validateEmail(value);
    if (name === 'phone') validatePhone(value);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 40) {
      errors.password = 'Password is too weak. Add uppercase, numbers, and symbols';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.country) {
      errors.country = 'Please select your country';
    }
    
    if (!agreedToTerms) {
      errors.terms = 'You must accept the Terms & Conditions';
    }
    
    if (!agreedToGDPR) {
      errors.gdpr = 'You must consent to GDPR data processing';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle registration
  const handleRegister = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      setError('Please correct the errors below');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Generate session ID
      sessionId.current = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track registration attempt
      await analyticsAPI.track('registration_attempt', {
        session_id: sessionId.current,
        device_fingerprint: deviceFingerprint.current,
        country: formData.country
      });
      
      // Register user
      const response = await authAPI.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        country: formData.country,
        referral_code: formData.referralCode || null,
        terms_accepted: agreedToTerms,
        gdpr_accepted: agreedToGDPR,
        marketing_accepted: agreedToMarketing,
        device_fingerprint: deviceFingerprint.current,
        session_id: sessionId.current,
        registration_source: 'web',
        ip_country: ipCountry
      });
      
      if (response.data?.success) {
        const userData = response.data.user;
        setUserId(userData.id);
        setGeneratedId(userData.paywolt_id || `@${userData.id}`);
        
        // Create default wallets
        await createDefaultWallets(userData.id);
        
        // Track successful registration
        await analyticsAPI.track('registration_success', {
          user_id: userData.id,
          session_id: sessionId.current,
          duration: Date.now() - registrationStartTime.current
        });
        
        // Send verification email
        await authAPI.sendVerificationEmail(userData.email);
        
        // Move to verification step
        setStep(2);
      } else {
        throw new Error(response.data?.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.status === 409) {
        setError('An account with this email already exists');
      } else if (err.response?.data?.field) {
        setFieldErrors({ [err.response.data.field]: err.response.data.error });
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      }
      
      // Track failed registration
      await analyticsAPI.track('registration_failed', {
        error: err.response?.data?.error,
        session_id: sessionId.current
      });
    } finally {
      setLoading(false);
    }
  };

  // Create default wallets
  const createDefaultWallets = async (userId) => {
    try {
      const currencies = ['EUR', 'USD', 'GBP'];
      const walletPromises = currencies.map(currency =>
        walletAPI.create({
          currency,
          user_id: userId,
          name: `${currency} Wallet`,
          is_primary: currency === 'EUR'
        })
      );
      
      const results = await Promise.all(walletPromises);
      setWallets(results.map(r => r.data?.wallet).filter(Boolean));
    } catch (error) {
      console.error('Error creating wallets:', error);
    }
  };

  // Handle email verification
  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyEmail({
        email: formData.email,
        code: verificationCode,
        user_id: userId
      });
      
      if (response.data?.success) {
        // Track verification
        await analyticsAPI.track('email_verified', {
          user_id: userId,
          session_id: sessionId.current
        });
        
        setSuccess(true);
        setStep(3);
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      await authAPI.sendVerificationEmail(formData.email);
      setError('');
    } catch (error) {
      console.error('Error resending email:', error);
      setError('Failed to resend email. Please try again.');
    }
  };

  // Get password strength display
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (!formData.password) return '';
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Excellent';
  };

  // Initialize
  useEffect(() => {
    generateFingerprint();
    checkServerStatus();
    loadCountries();
  }, [generateFingerprint]);

  // Success Screen
  if (step === 3 && success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-3xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
            }}
            style={{
              background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)'
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
            {/* Success content */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mx-auto w-32 h-32 mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-8"
            >
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
                Welcome to PayWolt! 🎉
              </h2>
              <p className="text-xl text-gray-300 mb-2">
                Your account has been created successfully
              </p>
              <p className="text-sm text-gray-400">
                Experience premium banking with PayWolt
              </p>
            </motion.div>

            {/* PayWolt ID Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="relative backdrop-blur-xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-yellow-500/30 rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                    Your PayWolt ID
                  </p>
                </div>
                <motion.p 
                  className="text-4xl sm:text-5xl font-black text-center mb-3 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  {generatedId}
                </motion.p>
                <p className="text-sm text-gray-300 text-center">
                  Share this ID to receive money from other PayWolt users
                </p>
              </div>
            </motion.div>

            {/* Created Wallets */}
            {wallets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-bold text-blue-400">Your Wallets</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {wallets.map((wallet, idx) => (
                    <motion.div
                      key={wallet.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + idx * 0.1 }}
                      className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                    >
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-gray-300">{wallet.currency}</span>
                      {wallet.is_primary && (
                        <Crown className="w-3 h-3 text-yellow-400" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <CreditCard className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-sm font-bold text-white">Virtual Cards</p>
                <p className="text-xs text-gray-400">Create instantly</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Globe className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-sm font-bold text-white">Global Transfers</p>
                <p className="text-xs text-gray-400">180+ countries</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-sm font-bold text-white">Investments</p>
                <p className="text-xs text-gray-400">Stocks & Crypto</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Shield className="w-8 h-8 text-yellow-400 mb-2" />
                <p className="text-sm font-bold text-white">Secure Banking</p>
                <p className="text-xs text-gray-400">256-bit encryption</p>
              </div>
            </motion.div>

            {/* KYC Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-400">Next Step: KYC Verification</p>
                    <p className="text-xs text-gray-400">Verify your identity to unlock all features</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400" />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="flex-1 relative group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-4 px-6 rounded-xl shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/kyc')}
                className="flex-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
              >
                Start KYC Verification
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Registration Form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Server Status */}
      {serverStatus === 'offline' && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm py-3 px-4 z-50">
          <div className="flex items-center justify-center gap-2 text-white text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Server is currently offline. Please try again later.</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl overflow-hidden">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="relative"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-slate-900" />
              </div>
              <motion.div
                className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              Join the premium banking experience
            </p>
          </motion.div>

          {step === 1 ? (
            // Registration Form
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      focusedField === 'firstName' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField('')}
                      className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                      placeholder="John"
                      required
                    />
                    {fieldErrors.firstName && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      focusedField === 'lastName' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField('')}
                      className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                      placeholder="Doe"
                      required
                    />
                    {fieldErrors.lastName && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    focusedField === 'email' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                    placeholder="john@example.com"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.email}
                    </p>
                  )}
                  {emailValid && formData.email && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Valid email address
                    </p>
                  )}
                </div>
              </div>

              {/* Phone and Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      focusedField === 'phone' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField('')}
                      className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                      placeholder="+1234567890"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      focusedField === 'country' ? 'text-yellow-400' : 'text-gray-400'
                    }`} />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('country')}
                      onBlur={() => setFocusedField('')}
                      className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all appearance-none"
                      required
                    >
                      <option value="" className="bg-slate-900">Select country</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.code} className="bg-slate-900">
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.country && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.country}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    focusedField === 'password' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
                  )}
                </div>
                
                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Password strength</span>
                      <span className={`text-xs font-bold ${
                        passwordStrength < 30 ? 'text-red-400' :
                        passwordStrength < 60 ? 'text-yellow-400' :
                        passwordStrength < 80 ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getPasswordStrengthColor()} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    focusedField === 'confirmPassword' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField('')}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <Gift className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    focusedField === 'referralCode' ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('referralCode')}
                    onBlur={() => setFocusedField('')}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all uppercase"
                    placeholder="FRIEND123"
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                    I agree to the{' '}
                    <button type="button" onClick={() => navigate('/terms')} className="text-yellow-400 hover:text-yellow-300 font-semibold">
                      Terms & Conditions
                    </button>
                    {' '}and{' '}
                    <button type="button" onClick={() => navigate('/privacy')} className="text-yellow-400 hover:text-yellow-300 font-semibold">
                      Privacy Policy
                    </button>
                    {' '}*
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    id="gdpr"
                    checked={agreedToGDPR}
                    onChange={(e) => setAgreedToGDPR(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                  />
                  <label htmlFor="gdpr" className="text-sm text-gray-300 cursor-pointer">
                    I consent to the processing of my personal data in accordance with{' '}
                    <span className="text-yellow-400 font-semibold">GDPR</span> *
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={agreedToMarketing}
                    onChange={(e) => setAgreedToMarketing(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                  />
                  <label htmlFor="marketing" className="text-sm text-gray-300 cursor-pointer">
                    I'd like to receive marketing communications and special offers
                  </label>
                </div>

                {(fieldErrors.terms || fieldErrors.gdpr) && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.terms || fieldErrors.gdpr}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || serverStatus === 'offline'}
                className="relative w-full group overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-4 rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="relative flex items-center justify-center gap-2 text-lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          ) : step === 2 ? (
            // Email Verification
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
                <p className="text-gray-400">
                  We've sent a verification code to<br />
                  <span className="font-semibold text-white">{formData.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 text-center">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-widest outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500 transition-all"
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resendVerificationEmail}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
                  disabled={loading}
                >
                  Resend Code
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerification}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-slate-900 font-bold transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </motion.button>
              </div>
            </div>
          ) : null}

          {/* Login Link */}
          {step === 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center text-gray-400 text-sm mt-6"
            >
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
              >
                Sign In
              </button>
            </motion.p>
          )}

          {/* Security Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-500"
          >
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span>256-bit SSL</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>PCI DSS</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>GDPR</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}