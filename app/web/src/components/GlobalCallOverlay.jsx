import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, MicOff, VideoOff, Award, ShieldCheck, Trophy } from 'lucide-react';
import { useCall } from '@/contexts/CallContext.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getPublicImageUrl } from '@/lib/supabaseClient.js';

const GlobalCallOverlay = () => {
  const { isCalling, callStatus, callType, otherUser, localStream, remoteStream, answerCall, endCall } = useCall();
  const myVideoRef = useRef(null);
  const otherVideoRef = useRef(null);

  useEffect(() => {
    if (myVideoRef.current && localStream) {
      myVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCalling]);

  useEffect(() => {
    if (otherVideoRef.current && remoteStream) {
      otherVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  if (!isCalling) return null;

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist_premium') return <Trophy className="w-5 h-5 text-[#D4AF37]" />;
    if (user?.subscription_type === 'artist' || user?.is_premium) return <Award className="w-5 h-5 text-[#D4AF37]" />;
    if (user?.subscription_type === 'auditor') return <ShieldCheck className="w-5 h-5 text-blue-400" />;
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 overflow-hidden"
      >
        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-[100px] opacity-20 animate-pulse" />
          <Avatar className="h-40 w-40 border-4 border-[#D4AF37] mx-auto shadow-2xl">
             <AvatarImage src={getPublicImageUrl('avatars', otherUser?.avatar)} />
             <AvatarFallback className="bg-[#111] text-[#D4AF37] text-6xl font-black">
                {otherUser?.username?.[0]}
             </AvatarFallback>
          </Avatar>

          <div className="mt-8">
            <h2 className="text-3xl font-black text-white uppercase flex items-center justify-center gap-3">
               {otherUser?.username || otherUser?.name}
               {getBadge(otherUser)}
            </h2>
            <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-xs mt-2 animate-pulse">
              {callStatus === 'outgoing' ? 'Appel en cours...' :
               callStatus === 'incoming' ? 'Appel entrant...' : 'Connecté'}
            </p>
          </div>
        </div>

        {/* Video Area */}
        {callType === 'video' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl h-[300px] md:h-[400px] mb-12">
            <div className="relative bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
              <div className="absolute bottom-4 left-6 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider">Moi</div>
            </div>
            <div className="relative bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              {callStatus === 'connected' ? (
                <video ref={otherVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10 uppercase font-black text-sm tracking-[0.3em] animate-pulse">
                   <Video className="w-12 h-12 opacity-5" />
                   <span>Connexion...</span>
                </div>
              )}
              <div className="absolute bottom-4 left-6 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider">
                {otherUser?.username}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-8 items-center mt-auto pb-10">
           {callStatus === 'incoming' ? (
             <Button onClick={answerCall} className="h-24 w-24 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-bounce">
                <Phone className="w-10 h-10" />
             </Button>
           ) : (
             <Button variant="outline" size="icon" className="h-16 w-16 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                <MicOff className="w-6 h-6" />
             </Button>
           )}

           <Button onClick={endCall} className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <X className="w-10 h-10" />
           </Button>

           {callStatus !== 'incoming' && (
              <Button variant="outline" size="icon" className="h-16 w-16 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                 <VideoOff className="w-6 h-6" />
              </Button>
           )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalCallOverlay;