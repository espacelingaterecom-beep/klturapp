import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';

const FloatingMessageButton = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', currentUser.id)
          .eq('is_read', false);

        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (err) {
        console.error("Unread count fetch error:", err);
      }
    };

    fetchUnreadCount();

    // S'abonner aux nouveaux messages en temps réel
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUser.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated) return null;

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
