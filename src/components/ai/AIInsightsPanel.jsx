import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function AIInsightsPanel({ wallets = [], transactions = [] }) {
  // Calculate spending by category (mock data for now)
  const insights = {
    totalSpent: 1847.30,
    totalIncome: 4250.00,
    savedAmount: 2402.70,
    topCategory: 'Food & Dining',
    topCategoryAmount: 456.20,
    weeklyChange: 12.5,
    suggestions: [
      {
        type: 'warning',
        icon: AlertCircle,
        text: 'Your dining expenses are 20% higher than last month',
        action: 'View details'
      },
      {
        type: 'success',
        icon: CheckCircle2,
        text: 'Great job! You saved €407 this month',
        action: 'Set new goal'
      },
      {
        type: 'info',
        icon: Sparkles,
        text: 'Consider moving €200 to your EUR savings wallet',
        action: 'Auto-save'
      }
    ],
    categories: [
      { name: 'Food & Dining', amount: 456.20, icon: Coffee, color: 'from-orange-500 to-orange-600', percent: 25 },
      { name: 'Shopping', amount: 385.40, icon: ShoppingBag, color: 'from-purple-500 to-purple-600', percent: 21 },
      { name: 'Transport', amount: 298.50, icon: Car, color: 'from-blue-500 to-blue-600', percent: 16 },
      { name: 'Bills & Utilities', amount: 707.20, icon: Home, color: 'from-red-500 to-red-600', percent: 38 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center animate-glow">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gold-gradient">AI Insights</h2>
          <p className="text-sm text-gray-400">Powered by WoltAI</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-semibold">This Month</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-black text-white mb-1">
            €{insights.totalSpent.toFixed(2)}
          </div>
          <p className="text-xs text-red-400 font-semibold">
            +{insights.weeklyChange}% vs last month
          </p>
        </motion.div>

        {/* Income */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-semibold">Income</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-black text-white mb-1">
            €{insights.totalIncome.toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 font-semibold">
            From 3 sources
          </p>
        </motion.div>

        {/* Saved */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 border border-gold/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-semibold">Saved</span>
            <DollarSign className="w-5 h-5 text-gold" />
          </div>
          <div className="text-3xl font-black text-gold mb-1">
            €{insights.savedAmount.toFixed(2)}
          </div>
          <p className="text-xs text-gold-light font-semibold">
            🎉 Great job!
          </p>
        </motion.div>
      </div>

      {/* AI Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white">Smart Suggestions</h3>
          <span className="text-xs px-3 py-1 bg-gold/20 text-gold rounded-full font-bold">
            AI Powered
          </span>
        </div>

        <div className="space-y-3">
          {insights.suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            const colors = {
              warning: 'border-orange-500/30 bg-orange-500/10',
              success: 'border-green-500/30 bg-green-500/10',
              info: 'border-blue-500/30 bg-blue-500/10'
            };
            const iconColors = {
              warning: 'text-orange-400',
              success: 'text-green-400',
              info: 'text-blue-400'
            };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-xl border ${colors[suggestion.type]} transition-all hover:scale-[1.02] cursor-pointer group`}
              >
                <Icon className={`w-5 h-5 ${iconColors[suggestion.type]} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className="text-sm text-white mb-2">{suggestion.text}</p>
                  <button className="text-xs font-semibold text-gold hover:text-gold-light transition-colors flex items-center gap-1 group-hover:gap-2">
                    {suggestion.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Spending by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-5">Spending Breakdown</h3>

        <div className="space-y-4">
          {insights.categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{category.name}</p>
                      <p className="text-xs text-gray-400">{category.percent}% of total</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white">
                    €{category.amount.toFixed(2)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percent}%` }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${category.color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Top Merchant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="glass-card p-6 border border-gold/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center">
              <Coffee className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Top Merchant</p>
              <p className="text-xl font-bold text-white">{insights.topCategory}</p>
              <p className="text-sm text-gold">€{insights.topCategoryAmount.toFixed(2)} this month</p>
            </div>
          </div>
          <button className="btn-gold btn-sm">
            View All
          </button>
        </div>
      </motion.div>
    </div>
  );
}