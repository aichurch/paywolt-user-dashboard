// ============================================
// PayWolt - useNotifications Hook (v2.0)
// Multi-language notifications with auto-localization
// ============================================

import { useState, useCallback, useRef } from 'react';
import { useGeoLocalization } from './useGeoLocalization';

// Simple i18n dictionary
const i18n = {
  en: {
    completed: '✅ {type} of {currency}{amount} completed successfully',
    pending: '⏳ {type} of {currency}{amount} is being processed',
    failed: '❌ {type} of {currency}{amount} failed',
    healthy: '✅ {provider} is online and operational',
    degraded: '⚠️ {provider} is experiencing issues',
    error: '🔴 {provider} is offline',
  },
  el: {
    completed: '✅ Η {type} συναλλαγή {currency}{amount} ολοκληρώθηκε επιτυχώς',
    pending: '⏳ Η {type} συναλλαγή {currency}{amount} βρίσκεται σε εξέλιξη',
    failed: '❌ Η {type} συναλλαγή {currency}{amount} απέτυχε',
    healthy: '✅ Ο πάροχος {provider} λειτουργεί κανονικά',
    degraded: '⚠️ Ο πάροχος {provider} αντιμετωπίζει καθυστερήσεις',
    error: '🔴 Ο πάροχος {provider} είναι εκτός λειτουργίας',
  },
};

// ============================================
// Hook Definition
// ============================================
export const useNotifications = () => {
  const { language } = useGeoLocalization();
  const lang = language?.startsWith('el') ? 'el' : 'en';

  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef({});

  const showNotification = useCallback((message, type = 'info', duration = 5000, options = {}) => {
    const id = Date.now() + Math.random();

    const newNotification = {
      id,
      message,
      type,
      timestamp: new Date().toISOString(),
      duration,
      ...options
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, 5);
    });

    if (!options.persistent && duration > 0) {
      timeoutRefs.current[id] = setTimeout(() => {
        removeNotification(id);
        delete timeoutRefs.current[id];
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = {};
    setNotifications([]);
  }, []);

  // Transaction notification
  const showTransactionNotification = useCallback(
    (transaction) => {
      const { type, amount, currency = '€', status } = transaction;

      const tpl = i18n[lang][status] || i18n[lang].pending;
      const message = tpl
        .replace('{type}', type)
        .replace('{currency}', currency)
        .replace('{amount}', amount);

      const notificationType =
        status === 'completed'
          ? 'success'
          : status === 'failed'
          ? 'error'
          : 'info';

      return showNotification(message, notificationType);
    },
    [showNotification, lang]
  );

  // Provider status notification
  const showProviderNotification = useCallback(
    (provider, status) => {
      const tpl = i18n[lang][status] || `${provider}: ${status}`;
      const message = tpl.replace('{provider}', provider);

      const types = {
        healthy: 'success',
        degraded: 'warning',
        error: 'error'
      };

      return showNotification(message, types[status] || 'info');
    },
    [showNotification, lang]
  );

  // Generic types
  const success = useCallback((message, options) => showNotification(message, 'success', 5000, options), [showNotification]);
  const error = useCallback((message, options) => showNotification(message, 'error', 7000, { ...options, persistent: true }), [showNotification]);
  const warning = useCallback((message, options) => showNotification(message, 'warning', 6000, options), [showNotification]);
  const info = useCallback((message, options) => showNotification(message, 'info', 4000, options), [showNotification]);

  return {
    notifications: notifications.map(n => ({ ...n, onClose: () => removeNotification(n.id) })),
    showNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
    showTransactionNotification,
    showProviderNotification
  };
};

// ============================================
// Style helpers (same as before)
// ============================================
export const notificationColors = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-500' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-500' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-500' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-500' }
};
