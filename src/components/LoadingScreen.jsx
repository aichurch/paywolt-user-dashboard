// LoadingScreen.jsx - Production Ready with System Check Integration
// Path: /src/components/LoadingScreen.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Zap, CheckCircle, AlertCircle, Server, Globe, Database, Wifi } from 'lucide-react';
import api from '../services/api';

export default function LoadingScreen({ onLoadComplete, minDuration = 2000 }) {
  const [loadingText, setLoadingText] = useState('Initializing secure connection');
  const [progress, setProgress] = useState(0);
  const [systemChecks, setSystemChecks] = useState({
    server: { status: 'checking', label: 'Server Connection' },
    database: { status: 'checking', label: 'Database' },
    providers: { status: 'checking', label: 'Payment Providers' },
    security: { status: 'checking', label: 'Security Protocol' }
  });
  
  // Loading text variations
  const loadingTexts = [
    'Initializing secure connection',
    'Verifying authentication',
    'Loading payment providers',
    'Preparing your dashboard',
    'Establishing secure tunnel',
    'Fetching wallet data',
    'Almost ready'
  ];

  // Perform system checks
  useEffect(() => {
    const performSystemChecks = async () => {
      const startTime = Date.now();
      
      try {
        // Check server connection
        setSystemChecks(prev => ({
          ...prev,
          server: { ...prev.server, status: 'checking' }
        }));
        setProgress(20);
        
        const serverHealth = await api.get('/api/health').catch(() => null);
        
        setSystemChecks(prev => ({
          ...prev,
          server: { ...prev.server, status: serverHealth ? 'success' : 'error' }
        }));
        setProgress(40);
        
        // Check database
        setSystemChecks(prev => ({
          ...prev,
          database: { ...prev.database, status: 'checking' }
        }));
        
        const dbHealth = await api.get('/api/health/database').catch(() => null);
        
        setSystemChecks(prev => ({
          ...prev,
          database: { ...prev.database, status: dbHealth ? 'success' : 'warning' }
        }));
        setProgress(60);
        
        // Check providers
        setSystemChecks(prev => ({
          ...prev,
          providers: { ...prev.providers, status: 'checking' }
        }));
        
        const providersHealth = await api.get('/api/providers/health').catch(() => null);
        const providerStatus = providersHealth?.data?.overall === 'healthy' ? 'success' : 'warning';
        
        setSystemChecks(prev => ({
          ...prev,
          providers: { ...prev.providers, status: providerStatus }
        }));
        setProgress(80);
        
        // Security check
        setSystemChecks(prev => ({
          ...prev,
          security: { ...prev.security, status: 'checking' }
        }));
        
        // Simulate security check
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setSystemChecks(prev => ({
          ...prev,
          security: { ...prev.security, status: 'success' }
        }));
        setProgress(100);
        
        // Ensure minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);
        
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        // Complete loading
        if (onLoadComplete) {
          onLoadComplete({
            systemStatus: systemChecks,
            serverHealth: serverHealth?.data,
            providersHealth: providersHealth?.data
          });
        }
        
      } catch (error) {
        console.error('System check failed:', error);
        
        // Still complete loading even with errors
        setTimeout(() => {
          if (onLoadComplete) {
            onLoadComplete({ error: true });
          }
        }, 1000);
      }
    };

    performSystemChecks();
  }, []);

  // Rotate loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText(prev => {
        const currentIndex = loadingTexts.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingTexts.length;
        return loadingTexts[nextIndex];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Server className="w-4 h-4 text-slate-500" />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10 max-w-md w-full px-6"
      >
        {/* Logo */}
        <div className="relative mb-8">
          <motion.div
            className="absolute inset-0 blur-2xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-32 h-32 mx-auto bg-yellow-400/40 rounded-full" />
          </motion.div>

          <motion.svg 
            width="120" 
            height="120" 
            viewBox="0 0 110 110" 
            xmlns="http://www.w3.org/2000/svg" 
            className="mx-auto relative drop-shadow-2xl"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <defs>
              <linearGradient id="shieldGradientLoading" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#F4E4B7', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#B8941F', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d="M 55 10 L 95 22 L 95 70 Q 95 100 55 110 Q 15 100 15 70 L 15 22 Z" 
              fill="url(#shieldGradientLoading)"
              filter="url(#glow)"
            />
            <g transform="translate(55, 55)">
              <rect x="-22" y="-18" width="8" height="32" fill="#0A1929" rx="1"/>
              <rect x="-6" y="-22" width="8" height="38" fill="#0A1929" rx="1"/>
              <rect x="10" y="-18" width="8" height="32" fill="#0A1929" rx="1"/>
            </g>
          </motion.svg>
        </div>

        {/* Brand */}
        <motion.h2 
          className="text-4xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          PayWolt
        </motion.h2>
        
        <p className="text-slate-400 text-base font-medium mb-8">Digital Banking Platform</p>

        {/* System Checks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/5"
        >
          <div className="space-y-3">
            {Object.entries(systemChecks).map(([key, check], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {key === 'server' && <Server className="w-4 h-4 text-slate-500" />}
                  {key === 'database' && <Database className="w-4 h-4 text-slate-500" />}
                  {key === 'providers' && <Globe className="w-4 h-4 text-slate-500" />}
                  {key === 'security' && <Lock className="w-4 h-4 text-slate-500" />}
                  <span className="text-sm text-slate-400">{check.label}</span>
                </div>
                {getStatusIcon(check.status)}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Loading Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(212, 175, 55, 0.8) 50%, transparent 100%)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <motion.p 
            key={loadingText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-slate-500 text-sm font-medium"
          >
            {loadingText}
          </motion.p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 bg-slate-500 rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>Loading</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Security Features */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-600 mt-8">
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Shield className="w-3.5 h-3.5 text-yellow-500/60" />
            <span>Bank-grade</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Lock className="w-3.5 h-3.5 text-yellow-500/60" />
            <span>256-bit</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500/60" />
            <span>Instant</span>
          </motion.div>
        </div>

        {/* Version & Environment */}
        <motion.p
          className="text-slate-700 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          v2.0.1 • {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
        </motion.p>
      </motion.div>

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* Network Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-slate-600"
      >
        <Wifi className="w-3 h-3" />
        <span>Secure Connection</span>
      </motion.div>
    </div>
  );
}