import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Users, MessageSquare, Send, Radio, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Peer from 'peerjs';

const LiveBroadcasterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [liveData, setLiveData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    const initBroadcast = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*, profiles:artist_id(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setLiveData(data);

        // Security check
        if (data.artist_id !== currentUser.id) {
          toast.error("Vous n'êtes pas l'organisateur de ce direct");
          navigate('/live');
          return;
        }

        // Get Camera/Mic
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Initialize PeerJS for viewers to connect
        const peerId = `live-${currentUser.id.replace(/-/g, '')}`;
        console.log('Attempting to open Peer with ID:', peerId);

        const peer = new Peer(peerId, {
          debug: 2
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log('Live Broadcaster Peer is open. ID:', id);
          toast.success("Prêt pour la diffusion !");
        });

        peer.on('error', (err) => {
          console.error('PeerJS Error:', err);
          if (err.type === 'unavailable-id') {
             toast.error("Un live est déjà en cours avec ce compte.");
          }
        });

        peer.on('call', (call) => {
          console.log('Incoming viewer connection...');
          // Answer incoming calls with the broadcast stream
          call.answer(streamRef.current);

          call.on('stream', () => {
             console.log('Streaming to viewer...');
             setViewers(prev => prev + 1);
          });

          call.on('close', () => {
             console.log('Viewer disconnected');
             setViewers(prev => Math.max(0, prev - 1));
          });
        });

      } catch (err) {
        console.error(err);
        toast.error("Échec du lancement de la caméra");
        navigate('/live');
      }
    };

    initBroadcast();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [id, currentUser.id, navigate]);

  const endLive = async () => {
    if (!window.confirm("Voulez-vous vraiment terminer ce direct ?")) return;

    try {
      await supabase
        .from('live_streams')
        .update({ status: 'ended' })
        .eq('id', id);

      toast.success("Direct terminé");
      navigate('/live');
    } catch (err) {
      toast.error("Erreur lors de la fermeture");
    }
  };

  return (
    <>
      <Helmet><title>Diffusion en Direct - KLTUR RAP</title></Helmet>
      <div className="h-screen bg-black flex flex-col md:flex-row overflow-hidden">

        {/* Main Video Section */}
        <div className="flex-grow relative bg-[#050505]">
           <video
             ref={videoRef}
             autoPlay
             muted
             playsInline
             className={`w-full h-full object-cover mirror ${isVideoOff ? 'opacity-0' : 'opacity-100'} transition-opacity`}
           />

           {isVideoOff && (
             <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                <Avatar className="h-40 w-40 border-4 border-[#222]">
                   <AvatarImage src={getPublicImageUrl('avatars', currentUser.avatar)} />
                   <AvatarFallback className="text-4xl">{currentUser.username?.[0]}</AvatarFallback>
                </Avatar>
             </div>
           )}

           {/* Top Overlay */}
           <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20 pointer-events-none">
              <div className="flex items-center gap-4 pointer-events-auto">
                 <div className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-2xl">
                    <Radio className="w-3 h-3 animate-pulse" /> Direct
                 </div>
                 <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-2 border border-white/10">
                    <Users className="w-3 h-3 text-red-500" /> {viewers} Spectateurs
                 </div>
              </div>

              <Button onClick={endLive} variant="destructive" size="sm" className="rounded-full h-10 px-6 font-black uppercase tracking-widest pointer-events-auto shadow-2xl">
                 Terminer
              </Button>
           </div>

           {/* Bottom Controls */}
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
              <Button onClick={() => setIsMuted(!isMuted)} variant="outline" className={`h-16 w-16 rounded-full border-white/10 bg-black/40 backdrop-blur-xl transition-all ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-white'}`}>
                 {isMuted ? <MicOff /> : <Mic />}
              </Button>
              <Button onClick={() => setIsVideoOff(!isVideoOff)} variant="outline" className={`h-16 w-16 rounded-full border-white/10 bg-black/40 backdrop-blur-xl transition-all ${isVideoOff ? 'text-red-500 bg-red-500/10' : 'text-white'}`}>
                 {isVideoOff ? <VideoOff /> : <Video />}
              </Button>
           </div>
        </div>

        {/* Sidebar Chat */}
        <div className="w-full md:w-[400px] h-[350px] md:h-full bg-[#0a0a0a] border-l border-[#222] flex flex-col shrink-0">
           <div className="p-6 border-b border-[#222] flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-red-500" /> Chat en Direct
              </h3>
              <div className="flex gap-2">
                 <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
           </div>

           <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {comments.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">
                   Le chat est vide. Les fans vont bientôt arriver !
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                     <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={getPublicImageUrl('avatars', c.avatar)} />
                        <AvatarFallback>{c.username[0]}</AvatarFallback>
                     </Avatar>
                     <div className="min-w-0">
                        <p className="text-xs">
                           <span className="font-black text-white/40 mr-2">@{c.username}</span>
                           <span className="text-white/80">{c.text}</span>
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>

           <div className="p-6 bg-[#111] border-t border-[#222]">
              <div className="flex gap-3">
                 <Input
                   placeholder="Envoyez un message..."
                   className="bg-black/50 border-[#333] h-12 rounded-xl focus:border-red-500"
                 />
                 <Button className="h-12 w-12 rounded-xl bg-red-600 hover:bg-red-700 p-0 shrink-0">
                    <Send className="w-5 h-5" />
                 </Button>
              </div>
           </div>
        </div>

      </div>
    </>
  );
};

export default LiveBroadcasterPage;