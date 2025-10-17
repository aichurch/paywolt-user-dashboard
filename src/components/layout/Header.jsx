import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Menu, Bell, LogOut, Zap, X, Shield, Crown, TrendingUp, Activity, Star, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simulated context hooks (replace with your actual contexts)
const useAuth = () => ({ 
  user: { name: 'Alexandros Papadopoulos', email: 'alex@paywolt.com', tier: 'premium' }, 
  logout: () => console.log('Logout') 
});
const useMode = () => ({ switchToLite: () => console.log('Switch to Lite') });

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { switchToLite } = useMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('excellent');
  const controls = useAnimation();

  // Enhanced scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate header on scroll
  useEffect(() => {
    controls.start({
      backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
      borderBottomWidth: scrolled ? '1px' : '0px',
    });
  }, [scrolled, controls]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Enhanced notifications with categories
  const notifications = [
    { 
      id: 1, 
      text: 'New transaction received', 
      time: '2m ago', 
      unread: true,
      type: 'transaction',
      amount: '+€2,450.00',
      icon: '💰'
    },
    { 
      id: 2, 
      text: 'KYC verification complete', 
      time: '1h ago', 
      unread: true,
      type: 'success',
      icon: '✅'
    },
    { 
      id: 3, 
      text: 'Monthly report available', 
      time: '3h ago', 
      unread: true,
      type: 'info',
      icon: '📊'
    },
    {
      id: 4,
      text: 'Security alert: New login detected',
      time: '5h ago',
      unread: false,
      type: 'warning',
      icon: '🔐'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Profile menu items
  const profileItems = [
    { icon: Crown, label: 'Premium Settings', badge: 'PRO' },
    { icon: Shield, label: 'Security', badge: null },
    { icon: Activity, label: 'Activity Log', badge: null },
    { icon: TrendingUp, label: 'Analytics', badge: 'NEW' },
  ];

  // Network status indicator
  const getNetworkColor = () => {
    switch(networkStatus) {
      case 'excellent': return 'from-green-400 to-emerald-500';
      case 'good': return 'from-yellow-400 to-amber-500';
      case 'poor': return 'from-red-400 to-red-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <motion.header 
      animate={controls}
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-500 ${
        scrolled 
          ? 'bg-slate-950/90 shadow-2xl shadow-black/50' 
          : 'bg-slate-950/80'
      } border-b border-white/5`}
    >
      {/* Premium top bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden lg:block h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
      />
      
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          
          {/* Left: Mobile Menu with pulse effect */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden relative p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-slate-400 hover:text-white transition-all duration-300 border border-white/10 shadow-lg backdrop-blur-sm group"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.button>

          {/* Center: Animated Logo */}
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden flex items-center gap-2"
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 overflow-hidden">
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
              />
              <span className="relative text-slate-900 font-black text-lg">P</span>
            </div>
          </motion.div>

          {/* Right: Enhanced Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            
            {/* Network Status Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${getNetworkColor()}`}
              />
              <span className="text-xs text-slate-400 font-medium">Live</span>
            </motion.div>
            
            {/* Premium Switch to LITE Mode */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={switchToLite}
              className="hidden sm:flex relative items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-white/5 to-white/10 hover:from-yellow-500/20 hover:to-amber-600/20 border border-white/10 hover:border-yellow-500/30 rounded-xl text-slate-300 hover:text-white transition-all duration-300 font-semibold text-xs sm:text-sm shadow-lg backdrop-blur-sm group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-400/20 to-yellow-500/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Zap className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-yellow-400 transition-colors" />
              <span className="relative hidden md:inline">Switch to</span>
              <span className="relative font-bold">LITE</span>
            </motion.button>

            {/* Enhanced Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 hover:from-yellow-500/20 hover:to-amber-600/20 text-yellow-400 transition-all duration-300 border border-yellow-500/20 shadow-lg shadow-yellow-500/10 backdrop-blur-sm group"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 ring-2 ring-slate-950"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {unreadCount}
                    </motion.span>
                  </motion.span>
                )}
              </motion.button>

              {/* Premium Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95, rotateX: -15 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-gradient-to-br from-slate-900 to-slate-950 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      style={{ transformOrigin: "top right" }}
                    >
                      {/* Header with gradient */}
                      <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">Notifications</h3>
                            <motion.span
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="px-2 py-0.5 text-[10px] font-bold text-yellow-400 bg-yellow-400/20 rounded-full border border-yellow-400/30"
                            >
                              LIVE
                            </motion.span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            onClick={() => setShowNotifications(false)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Notifications List with stagger animation */}
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.map((notif, index) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', x: 5 }}
                            className="p-4 border-b border-white/5 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <motion.div 
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                className="text-2xl flex-shrink-0"
                              >
                                {notif.icon}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white mb-1 group-hover:text-yellow-400 transition-colors">
                                  {notif.text}
                                </p>
                                {notif.amount && (
                                  <p className="text-lg font-bold text-green-400 mb-1">{notif.amount}</p>
                                )}
                                <p className="text-xs text-slate-400">{notif.time}</p>
                              </div>
                              {notif.unread && (
                                <motion.div
                                  animate={{ scale: [1, 1.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mt-2 flex-shrink-0"
                                />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Footer with hover effect */}
                      <motion.div 
                        whileHover={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}
                        className="p-3 text-center border-t border-white/10 transition-all"
                      >
                        <button className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors flex items-center gap-1 mx-auto">
                          View All Notifications
                          <motion.span
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            →
                          </motion.span>
                        </button>
                      </motion.div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Premium User Profile with Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfile(!showProfile)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 border border-white/10 backdrop-blur-sm shadow-lg transition-all group"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-black text-sm sm:text-lg shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400/20 overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                    <span className="relative">{getInitials(user?.name)}</span>
                  </motion.div>
                  {/* Animated online indicator */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-950 shadow-lg"
                  />
                </div>
                
                <div className="hidden md:block min-w-0">
                  <p className="font-bold text-white text-sm leading-tight truncate max-w-[120px]">
                    {user?.name || 'User'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <motion.span 
                      whileHover={{ scale: 1.1 }}
                      className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider px-1.5 py-0.5 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded border border-yellow-400/30 shadow-md"
                    >
                      <Star className="inline w-2 h-2 mr-0.5" />
                      PRO
                    </motion.span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400">Premium</span>
                  </div>
                </div>
                
                <ChevronDown className={`hidden sm:block w-3 h-3 text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfile && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowProfile(false)}
                      className="fixed inset-0 z-40"
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-slate-900 to-slate-950 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Profile Header */}
                      <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent border-b border-white/10">
                        <p className="text-sm font-bold text-white mb-1">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="p-2">
                        {profileItems.map((item, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                {item.label}
                              </span>
                            </div>
                            {item.badge && (
                              <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all duration-300 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg backdrop-blur-sm group overflow-hidden"
              aria-label="Logout"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <LogOut className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
              <span className="relative hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Premium animated bottom gradient */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="h-[2px] bg-gradient-to-r from-transparent via-yellow-400 via-amber-500 to-transparent"
        style={{ backgroundSize: '200% 100%' }}
      />
      
      {/* Glow effect on scroll */}
      {scrolled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute inset-x-0 -bottom-20 h-20 bg-gradient-to-t from-transparent to-yellow-500/10 blur-3xl pointer-events-none"
        />
      )}
    </motion.header>
  );
}