import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useAuth } from './AuthContext.jsx';
import { toast } from 'sonner';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [peer, setPeer] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // 'outgoing', 'incoming', 'connected'
  const [callType, setCallType] = useState('video');
  const [otherUser, setOtherUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const currentCallRef = useRef(null);
  const activeCallRecordId = useRef(null);

  // Initialize PeerJS
  useEffect(() => {
    if (!currentUser?.id) return;

    const peerId = currentUser.id.replace(/-/g, '');
    const newPeer = new Peer(peerId);

    newPeer.on('call', (incomingCall) => {
      currentCallRef.current = incomingCall;
      setCallStatus('incoming');
      setIsCalling(true);
      // Other user info will be fetched via the signaling record
    });

    setPeer(newPeer);

    // Signaling listener (Realtime)
    const channel = supabase
      .channel('global-calls')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${currentUser.id}`
      }, async (payload) => {
        if (payload.new.status === 'ringing') {
          activeCallRecordId.current = payload.new.id;
          setCallType(payload.new.type);

          // Fetch caller details
          const { data: caller } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.caller_id)
            .single();

          setOtherUser(caller);
          setCallStatus('incoming');
          setIsCalling(true);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls'
      }, (payload) => {
        if (payload.new.id === activeCallRecordId.current && payload.new.status === 'ended') {
          cleanupCall();
        }
      })
      .subscribe();

    return () => {
      newPeer.destroy();
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const startCall = async (targetUser, type = 'video') => {
    setOtherUser(targetUser);
    setCallType(type);
    setIsCalling(true);
    setCallStatus('outgoing');

    try {
      // For mobile: check if we are on Capacitor and request permissions if needed
      if (typeof window !== 'undefined' && window.Capacitor) {
        console.log('Mobile detected, requesting media permissions');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);

      // 1. Create signaling record
      const { data: callRecord, error } = await supabase
        .from('calls')
        .insert([{
          caller_id: currentUser.id,
          receiver_id: targetUser.id,
          type: type,
          status: 'ringing'
        }])
        .select()
        .single();

      if (error) throw error;
      activeCallRecordId.current = callRecord.id;

      // 2. Start PeerJS Call
      if (!peer || peer.destroyed) {
        throw new Error("Le service d'appel n'est pas encore prêt. Veuillez patienter ou rafraîchir.");
      }

      const peerId = targetUser.id.replace(/-/g, '');
      const call = peer.call(peerId, stream);

      if (!call) {
        throw new Error("Impossible d'établir la connexion avec le destinataire.");
      }

      currentCallRef.current = call;

      call.on('stream', (remote) => {
        setRemoteStream(remote);
        setCallStatus('connected');
      });

      call.on('close', cleanupCall);
      call.on('error', (e) => {
        console.error("Peer Call Error:", e);
        cleanupCall();
      });

    } catch (err) {
      console.error("Call Start Error:", err);
      if (err.name === 'NotAllowedError') {
        toast.error("Accès à la caméra/micro refusé par le navigateur.");
      } else if (err.code === 'PGRST116' || err.message?.includes('calls')) {
        toast.error("Erreur technique : La table 'calls' n'est pas encore prête dans Supabase.");
      } else {
        toast.error(`Échec de l'appel : ${err.message || "Erreur inconnue"}`);
      }
      cleanupCall();
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      setLocalStream(stream);

      currentCallRef.current.answer(stream);
      currentCallRef.current.on('stream', (remote) => {
        setRemoteStream(remote);
        setCallStatus('connected');
      });

      // Update signaling
      await supabase
        .from('calls')
        .update({ status: 'connected' })
        .eq('id', activeCallRecordId.current);

    } catch (err) {
      toast.error("Erreur micro/caméra");
      cleanupCall();
    }
  };

  const endCall = async () => {
    if (activeCallRecordId.current) {
      await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('id', activeCallRecordId.current);
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (currentCallRef.current) currentCallRef.current.close();
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    setIsCalling(false);
    setCallStatus(null);
    setLocalStream(null);
    setRemoteStream(null);
    setOtherUser(null);
    activeCallRecordId.current = null;
  };

  return (
    <CallContext.Provider value={{
      isCalling, callStatus, callType, otherUser,
      localStream, remoteStream,
      startCall, answerCall, endCall
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
