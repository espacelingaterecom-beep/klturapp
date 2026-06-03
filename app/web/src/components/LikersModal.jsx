import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';

const LikersModal = ({ isOpen, onClose, postId }) => {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      const fetchLikers = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('likes')
            .select('user_id, profiles:user_id(id, username, name, avatar, profilePhoto, is_premium)')
            .eq('post_id', postId);

          if (error) throw error;
          setLikers(data || []);
        } catch (err) {
          console.error("Error fetching likers:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLikers();
    }
  }, [isOpen, postId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-[#222] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">Personnes qui ont aimé</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : likers.length === 0 ? (
            <p className="text-white/40 text-center italic text-sm">Personne n'a encore aimé cette publication.</p>
          ) : (
            likers.map((like) => (
              <Link
                key={like.user_id}
                to={`/profil/${like.profiles?.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <Avatar className="h-10 w-10 border border-[#222]">
                  <AvatarImage src={getPublicImageUrl('avatars', like.profiles?.avatar || like.profiles?.profilePhoto)} />
                  <AvatarFallback className="bg-[#111] text-[#D4AF37] font-bold">
                    {like.profiles?.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h4 className="font-bold text-sm group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                    {like.profiles?.username}
                    {like.profiles?.is_premium && <Award className="w-3 h-3 text-[#D4AF37]" />}
                  </h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {like.profiles?.name || 'Artiste'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LikersModal;
