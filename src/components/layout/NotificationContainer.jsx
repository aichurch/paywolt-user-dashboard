// ============================================
// PayWolt - NotificationContainer Component
// Displays live notifications (production-ready)
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { notificationColors } from '../hooks/useNotifications';

export default function NotificationContainer({ notifications }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-[360px] max-w-[90vw]">
      <AnimatePresence initial={false}>
        {notifications.map((n) => {
          const colors = notificationColors[n.type] || notificationColors.info;

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`rounded-xl shadow-lg border ${colors.border} ${colors.bg} backdrop-blur-lg px-4 py-3 flex items-start justify-between`}
            >
              <div className="flex flex-col">
                <div className={`text-sm font-medium ${colors.text}`}>{n.message}</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={() => n.onClose()}
                className="text-gray-400 hover:text-gray-200 ml-3 text-sm transition"
                aria-label="Close notification"
              >
                ✖
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
