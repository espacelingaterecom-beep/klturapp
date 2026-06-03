import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';

const FloatingMessageButton = () => {
  const location = useLocation();
  const { isAuthenticated, unreadCount } = useAuth();

  // Ne pas afficher si non connecté ou sur la page de messagerie
  if (!isAuthenticated || location.pathname === '/messages') return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[100]"
    >
      <Link
        to="/messages"
        className="flex items-center justify-center w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-2xl hover:bg-[#b5952f] transition-all gold-glow relative"
        title="Messages"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-red-600 text-white text-[10px] font-bold items-center justify-center border-2 border-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </Link>
    </motion.div>
  );
};

export default FloatingMessageButton;
