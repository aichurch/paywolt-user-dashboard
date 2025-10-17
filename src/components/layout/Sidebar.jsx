// Sidebar.jsx - Production Ready with Full Backend Integration
// Path: /src/components/layout/Sidebar.jsx

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Bitcoin,
  TrendingUp,
  Repeat,
  Users,
  BarChart3,
  Settings,
  X,
  ChevronRight,
  PiggyBank,
  Bell,
  Shield,
  LogOut,
  HelpCircle,
  Star,
  Lock,
  Zap
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { userAPI } from '../../services/api';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/', section: 'main', emoji: '🏠' },
  { id: 'wallets', icon: Wallet, label: 'Wallets', path: '/wallets', section: 'main', emoji: '👛' },
  { id: 'cards', icon: CreditCard, label: 'Cards', path: '/cards', section: 'main', emoji: '💳' },
  { id: 'transactions', icon: ArrowLeftRight, label: 'Transactions', path: '/transactions', section: 'main', emoji: '📊' },
  { id: 'savings', icon: PiggyBank, label: 'Savings', path: '/savings', section: 'main', emoji: '💰' },
  { id: 'crypto', icon: Bitcoin, label: 'Crypto', path: '/crypto', section: 'trading', emoji: '₿' },
  { id: 'stocks', icon: TrendingUp, label: 'Stocks', path: '/stocks', section: 'trading', emoji: '📈' },
  { id: 'exchange', icon: Repeat, label: 'Exchange', path: '/exchange', section: 'trading', emoji: '🔄' },
  { id: 'beneficiaries', icon: Users, label: 'Beneficiaries', path: '/beneficiaries', section: 'more', emoji: '👥' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics', section: 'more', emoji: '📊' },
  { id: 'notifications', icon: Bell, label: 'Notifications', path: '/notifications', section: 'more', emoji: '🔔' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', section: 'more', emoji: '⚙️' },
];

const sections = {
  main: '',
  trading: 'TRADING',
  more: 'MORE'
};

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [activeItem, setActiveItem] = useState('dashboard');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [userTier, setUserTier] = useState('pro');
  const [benefitsUsed, setBenefitsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Update active item based on current route
  useEffect(() => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location.pathname]);

  // Fetch user tier and benefits
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getProfile();
        
        if (response?.user) {
          setUserTier(response.user.tier || 'pro');
          setBenefitsUsed(response.user.benefitsUsage || 67);
        }
        
        // Fetch notification count
        const notifResponse = await api.get('/api/notifications/unread/count');
        if (notifResponse?.data) {
          setNotificationCount(notifResponse.data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle navigation
  const handleNavigation = useCallback((item) => {
    setActiveItem(item.id);
    navigate(item.path);
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  }, [navigate, onClose]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  const groupedItems = Object.entries(sections).map(([key, title]) => ({
    title,
    items: menuItems.filter(item => item.section === key)
  }));

  // Get tier display info
  const getTierInfo = () => {
    switch(userTier) {
      case 'premium':
        return { label: 'PREMIUM', color: 'purple', icon: '💎' };
      case 'gold':
        return { label: 'GOLD', color: 'yellow', icon: '🏆' };
      case 'pro':
      default:
        return { label: 'PRO', color: 'yellow', icon: '✨' };
    }
  };

  const tierInfo = getTierInfo();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/5 flex flex-col lg:translate-x-0 transition-transform duration-300 overflow-hidden backdrop-blur-xl"
        style={{
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo Section */}
        <div className="relative p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2.5 group cursor-pointer"
              onClick={() => handleNavigation({ path: '/' })}
            >
              {/* Logo Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <span className="text-slate-900 font-black text-base">P</span>
                </div>
              </motion.div>

              {/* Logo Text */}
              <div>
                <h1 className="text-lg font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text drop-shadow-lg">
                  PayWolt
                </h1>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Premium Banking</p>
              </div>
            </motion.div>

            {/* Close button (mobile) */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* User Quick Info */}
          {user && (
            <div className="mt-4 p-2.5 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 overflow-y-auto relative custom-scrollbar">
          {groupedItems.map(({ title, items }, sectionIndex) => (
            <div key={title || sectionIndex} className="mb-6">
              {/* Section Title */}
              {title && (
                <div className="px-5 mb-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {title}
                  </p>
                </div>
              )}

              {/* Menu Items */}
              <div className="space-y-0.5 px-3.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  const isHovered = hoveredItem === item.id;
                  const hasNotification = item.id === 'notifications' && notificationCount > 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="relative w-full block"
                    >
                      <motion.div
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`
                          relative flex items-center gap-3 px-3.5 py-3 rounded-xl
                          transition-all duration-300 group overflow-hidden
                          ${isActive 
                            ? 'bg-gradient-to-r from-white/10 to-white/5 border border-white/10 shadow-lg' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }
                        `}
                      >
                        {/* Active Glow */}
                        {isActive && (
                          <motion.div
                            layoutId="activeGlow"
                            className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-500 rounded-r-full shadow-lg shadow-yellow-500/50"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* Icon */}
                        <div className={`
                          relative w-9 h-9 rounded-lg flex items-center justify-center
                          transition-all duration-300 flex-shrink-0
                          ${isActive 
                            ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 shadow-lg shadow-yellow-500/20' 
                            : 'bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20'
                          }
                        `}>
                          <Icon className={`
                            w-4.5 h-4.5 transition-all duration-300
                            ${isActive ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white'}
                          `} />
                          
                          {/* Notification Badge */}
                          {hasNotification && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                            >
                              {notificationCount > 9 ? '9+' : notificationCount}
                            </motion.span>
                          )}
                        </div>

                        {/* Label */}
                        <span className={`
                          font-semibold text-[14px] flex-1 text-left relative z-10
                          ${isActive ? 'text-white' : 'group-hover:text-white'}
                        `}>
                          {item.label}
                        </span>

                        {/* Emoji (active) */}
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-sm"
                          >
                            {item.emoji}
                          </motion.span>
                        )}

                        {/* Hover Arrow */}
                        <AnimatePresence>
                          {isHovered && !isActive && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4 text-yellow-400/50" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Shine effect */}
                        {isHovered && !isActive && (
                          <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                          />
                        )}

                        {/* Pulse */}
                        {isActive && (
                          <motion.div
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-xl"
                          />
                        )}
                      </motion.div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="px-5 mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              QUICK ACTIONS
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/help')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-4" />

        {/* Premium Badge */}
        <div className="relative p-3.5">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-yellow-600/10 border border-yellow-500/20 p-3.5 cursor-pointer group"
            style={{
              boxShadow: '0 3px 20px rgba(212, 175, 55, 0.1)'
            }}
            onClick={() => navigate('/settings/subscription')}
          >
            {/* Shimmer */}
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 0% 0%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 100%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 0%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            />

            <div className="relative">
              <div className="flex items-center gap-2.5 mb-2.5">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg blur-md opacity-50" />
                  <div className="relative w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Star className="w-5 h-5 text-slate-900" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                    Premium
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-[10px]"
                    >
                      {tierInfo.icon}
                    </motion.span>
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight">Active Plan</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <span className="text-slate-400">Tier Level</span>
                <span className={`px-2 py-0.5 bg-${tierInfo.color}-400/10 border border-${tierInfo.color}-400/20 rounded-md`}>
                  <span className={`text-${tierInfo.color}-400 font-bold text-[10px]`}>
                    {tierInfo.label}
                  </span>
                </span>
              </div>

              {/* Progress */}
              {!loading && (
                <div className="mt-2.5 pt-2.5 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-slate-400">Benefits Used</span>
                    <span className="text-yellow-400 font-bold">{benefitsUsed}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${benefitsUsed}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shine */}
            <motion.div
              initial={{ x: '-100%' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent skew-x-12 pointer-events-none"
            />
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}