import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Shield,
  Bell,
  Palette,
  Link2,
  Code,
  FileText,
  MessageSquare,
  Lock,
  Key,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Moon,
  Wallet,
  CreditCard,
  Download,
  Trash2,
  Terminal,
  Copy,
  AlertCircle,
  Settings,
  Zap,
  Star,
  TrendingUp,
  Award,
  Upload,
  Check
} from 'lucide-react';

export default function UltraPremiumSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [copiedAPI, setCopiedAPI] = useState(false);
  const [particles, setParticles] = useState([]);
  const [notifications, setNotifications] = useState({
    transactions: true,
    marketing: false,
    security: true,
    updates: true
  });

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 3
    }));
    setParticles(newParticles);
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-400 to-blue-600' },
    { id: 'security', label: 'Security', icon: Shield, color: 'from-green-400 to-green-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-purple-400 to-purple-600' },
    { id: 'preferences', label: 'Preferences', icon: Palette, color: 'from-pink-400 to-pink-600' },
    { id: 'linked', label: 'Linked', icon: Link2, color: 'from-yellow-400 to-amber-600' },
    { id: 'api', label: 'API', icon: Code, color: 'from-orange-400 to-red-600' },
  ];

  const copyToClipboard = () => {
    setCopiedAPI(true);
    setTimeout(() => setCopiedAPI(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-600/30 blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Settings className="w-8 h-8 text-slate-950" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                Ρυθμίσεις
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                Διαχειριστείτε το λογαριασμό σας
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl h-fit"
          >
            <div className="space-y-2">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-left overflow-hidden ${
                      activeTab === tab.id ? 'text-slate-950' : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 ${
                      activeTab === tab.id ? 'text-slate-950' : 'text-gray-400'
                    }`} />
                    <span className="text-sm relative z-10">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-6"
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <User className="w-6 h-6 text-blue-400" />
                      Προσωπικές Πληροφορίες
                    </h3>

                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <motion.div
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          className="relative w-28 h-28 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-5xl shadow-2xl cursor-pointer group"
                        >
                          A
                          <motion.div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-8 h-8 text-white" />
                          </motion.div>
                        </motion.div>
                        <div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl mb-2 shadow-lg"
                          >
                            Αλλαγή Avatar
                          </motion.button>
                          <p className="text-xs text-gray-400">PNG ή JPG, max 2MB</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">Όνομα</label>
                          <input
                            type="text"
                            defaultValue="Γιάννης"
                            className="w-full bg-white/95 hover:bg-white text-gray-900 border-0 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-yellow-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">Επώνυμο</label>
                          <input
                            type="text"
                            defaultValue="Παπαδόπουλος"
                            className="w-full bg-white/95 hover:bg-white text-gray-900 border-0 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-yellow-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            defaultValue="giannis@paywolt.com"
                            className="w-full bg-white/95 hover:bg-white text-gray-900 border-0 rounded-xl pl-12 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-yellow-500/50"
                          />
                        </div>
                        <p className="text-sm text-green-400 mt-2 flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Επιβεβαιωμένο
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black py-4 rounded-xl shadow-2xl"
                      >
                        Αποθήκευση
                      </motion.button>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Award className="w-6 h-6 text-yellow-400" />
                      KYC Status
                    </h3>
                    
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-400/30 rounded-2xl mb-6">
                      <span className="text-3xl">⭐⭐</span>
                      <div>
                        <span className="font-black text-white text-lg">Level 2</span>
                        <p className="text-xs text-yellow-400">Επιβεβαιωμένος</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {['Δελτίο Ταυτότητας', 'Απόδειξη Διεύθυνσης'].map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-5 bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-green-400" />
                            </div>
                            <p className="font-bold text-white">{item}</p>
                          </div>
                          <span className="text-green-400 font-black">✓</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-6"
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Αλλαγή Κωδικού</h3>
                        <p className="text-gray-400 text-sm">Ενημερώστε τον κωδικό σας</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Τρέχων Κωδικός</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="w-full bg-white/95 text-gray-900 border-0 rounded-xl px-4 py-3 pr-12 font-medium outline-none focus:ring-2 focus:ring-green-500/50"
                            placeholder="Εισάγετε τον τρέχοντα κωδικό"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Νέος Κωδικός</label>
                        <input
                          type="password"
                          className="w-full bg-white/95 text-gray-900 border-0 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500/50"
                          placeholder="Εισάγετε νέο κωδικό"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-black py-4 rounded-xl shadow-xl"
                      >
                        Αλλαγή Κωδικού
                      </motion.button>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white mb-1">2FA</h3>
                          <p className="text-gray-400 text-sm mb-2">Διπλή επιβεβαίωση</p>
                          {twoFactorEnabled ? (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/30 rounded-xl">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 font-bold text-sm">Ενεργό</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/20 border border-red-500/30 rounded-xl">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 font-bold text-sm">Ανενεργό</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className={`px-6 py-3 rounded-xl font-bold ${
                          twoFactorEnabled
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        }`}
                      >
                        {twoFactorEnabled ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Bell className="w-6 h-6 text-purple-400" />
                      Ειδοποιήσεις
                    </h3>

                    <div className="space-y-3">
                      {[
                        { key: 'transactions', label: 'Συναλλαγές', icon: Wallet },
                        { key: 'security', label: 'Ασφάλεια', icon: Shield },
                        { key: 'updates', label: 'Ενημερώσεις', icon: Zap },
                        { key: 'marketing', label: 'Marketing', icon: Star }
                      ].map((item, idx) => (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-5 backdrop-blur-xl bg-white/5 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <item.icon className="w-5 h-5 text-purple-400" />
                            </div>
                            <h5 className="font-bold text-white">{item.label}</h5>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className={`relative w-16 h-9 rounded-full transition-all ${
                              notifications[item.key] ? 'bg-gradient-to-r from-yellow-400 to-amber-600' : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              layout
                              className={`absolute top-1 w-7 h-7 bg-white rounded-full ${
                                notifications[item.key] ? 'left-8' : 'left-1'
                              }`}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Palette className="w-6 h-6 text-pink-400" />
                      Προτιμήσεις
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-3">Γλώσσα</label>
                        <select className="w-full bg-white/95 text-gray-900 border-0 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-pink-500/50 cursor-pointer">
                          <option>🇬🇧 English</option>
                          <option>🇬🇷 Ελληνικά</option>
                          <option>🇪🇸 Español</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-3">Νόμισμα</label>
                        <select className="w-full bg-white/95 text-gray-900 border-0 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-pink-500/50 cursor-pointer">
                          <option>EUR (€)</option>
                          <option>USD ($)</option>
                          <option>GBP (£)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-400/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Moon className="w-6 h-6 text-yellow-400" />
                          <div>
                            <h4 className="font-bold text-white">Dark Mode</h4>
                            <p className="text-sm text-gray-300">Ενεργό</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className={`relative w-16 h-9 rounded-full ${
                            darkMode ? 'bg-gradient-to-r from-yellow-400 to-amber-600' : 'bg-gray-600'
                          }`}
                        >
                          <motion.div
                            layout
                            className={`absolute top-1 w-7 h-7 bg-white rounded-full ${
                              darkMode ? 'left-8' : 'left-1'
                            }`}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'linked' && (
                <motion.div
                  key="linked"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Link2 className="w-6 h-6 text-yellow-400" />
                      Συνδεδεμένα
                    </h3>

                    <div className="space-y-4">
                      {[
                        { icon: Wallet, title: 'EUR Wallet', color: 'from-blue-400 to-blue-600' },
                        { icon: CreditCard, title: 'Card ****1234', color: 'from-purple-400 to-purple-600' }
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}>
                              <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="font-bold text-white">{item.title}</p>
                          </div>
                          <Check className="w-5 h-5 text-green-400" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                      <Code className="w-6 h-6 text-orange-400" />
                      API Access
                    </h3>

                    <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-xl">
                      <div className="flex items-start gap-3 mb-4">
                        <Terminal className="w-6 h-6 text-orange-400 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-3">API Key</h4>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-4 py-3 bg-black/40 rounded-xl text-yellow-400 font-mono text-sm font-bold">
                              pk_live_••••••••••••••••
                            </code>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={copyToClipboard}
                              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl"
                            >
                              {copiedAPI ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-400" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}