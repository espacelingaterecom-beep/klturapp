import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Paperclip, Smile, Award, ChevronLeft, MoreVertical, MessageSquare, ChevronRight, Trash2, AlertTriangle, Phone, Video, X } from 'lucide-react';
import Header from '@/components/Header.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCall } from '@/contexts/CallContext.jsx';
import { supabase, subscribeChat, subscribePresence, markConversationRead, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { toast } from 'sonner';

const MessagesPage = () => {
  const { currentUser, fetchUnreadCount } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*, p1:participant1_id(*), p2:participant2_id(*)')
          .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map(conv => ({
          ...conv,
          expand: {
            participant1Id: conv.p1,
            participant2Id: conv.p2
          }
        }));
        setConversations(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    if (currentUser) fetchConvs();
  }, [currentUser]);

  useEffect(() => {
    if (!activeConv) return;
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConv.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Marquer la conversation comme lue
        await markConversationRead(activeConv.id, currentUser.id);
        await fetchUnreadCount(currentUser.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();

    // Utilisation du nouveau helper pour le Realtime
    const unsubscribe = subscribeChat(activeConv.id, async (newMessage) => {
      setMessages(prev => [...prev, newMessage]);

      // Si on reçoit un message dans la conversation active, on le marque comme lu
      if (newMessage.recipient_id === currentUser.id) {
        await markConversationRead(activeConv.id, currentUser.id);
        await fetchUnreadCount(currentUser.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeConv, currentUser?.id]);

  useEffect(() => {
    if (!activeConv || !currentUser) return;

    const otherUserId = activeConv.participant1_id === currentUser.id ? activeConv.participant2_id : activeConv.participant1_id;

    const unsubscribe = subscribePresence(activeConv.id, currentUser.id, (state) => {
      const onlineUserIds = Object.keys(state);
      setIsOtherUserOnline(onlineUserIds.includes(otherUserId));
    });

    return () => {
      unsubscribe();
    };
  }, [activeConv, currentUser]);

  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) return;

    try {
      const { error } = await supabase.from('conversations').delete().eq('id', activeConv.id);
      if (error) throw error;
      toast.success("Conversation supprimée");
      setConversations(prev => prev.filter(c => c.id !== activeConv.id));
      setActiveConv(null);
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    
    const otherUserId = activeConv.participant1_id === currentUser.id ? activeConv.participant2_id : activeConv.participant1_id;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeConv.id,
          sender_id: currentUser.id,
          recipient_id: otherUserId,
          content: newMessage
        }]);
      
      if (error) throw error;
      setNewMessage('');
      
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConv.id);
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartCall = (type) => {
    const otherUser = activeConv.participant1_id === currentUser.id ? activeConv.expand?.participant2Id : activeConv.expand?.participant1Id;
    if (otherUser) {
      startCall(otherUser, type);
    }
  };

  return (
    <>
      <Helmet><title>Messages - KLTUR RAP</title></Helmet>
      <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
        <Header />

        <main className="flex-grow flex max-w-7xl mx-auto w-full h-[calc(100vh-80px)] border-x border-[#222] bg-[#0a0a0a]">
          {!activeConv ? (
            <div className="w-full flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-6 border-b border-[#222]">
                <h2 className="text-3xl font-black text-white uppercase mb-6 tracking-tight">Mes Discussions</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                  <Input placeholder="Rechercher une conversation..." className="pl-12 bg-[#111] border-[#222] text-white h-12 rounded-xl focus:border-[#D4AF37]" />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 p-10 text-center">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-xs">Aucune conversation pour le moment</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#222]">
                    {conversations.map(conv => {
                      const otherUser = conv.expand?.participant1Id?.id === currentUser.id ? conv.expand?.participant2Id : conv.expand?.participant1Id;
                      return (
                        <div key={conv.id} onClick={() => setActiveConv(conv)} className="p-5 cursor-pointer hover:bg-[#111] transition-all flex items-center gap-4 group">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-[#222] group-hover:border-[#D4AF37]/50 transition-colors">
                              <AvatarImage src={getPublicImageUrl('avatars', otherUser?.avatar)} />
                              <AvatarFallback className="bg-[#222] text-[#D4AF37] font-bold text-lg">{otherUser?.username?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            {otherUser?.is_premium && (
                              <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-[#222]">
                                <Award className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-black text-white text-base group-hover:text-[#D4AF37] transition-colors truncate">{otherUser?.username || otherUser?.name}</h4>
                              <span className="text-[10px] font-bold text-white/30 uppercase">{new Date(conv.last_message_date || conv.updated_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-white/50 truncate font-medium">{conv.last_message || 'Nouvelle conversation...'}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[#D4AF37] transition-all" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full bg-[#050505] animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setActiveConv(null)} className="text-white/50 hover:text-white hover:bg-[#222] rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-[#222]">
                        {(() => {
                          const other = activeConv.expand?.participant1Id?.id === currentUser.id ? activeConv.expand?.participant2Id : activeConv.expand?.participant1Id;
                          return (
                            <>
                              <AvatarImage src={getPublicImageUrl('avatars', other?.avatar)} />
                              <AvatarFallback className="bg-[#222] text-[#D4AF37] font-bold">{other?.username?.charAt(0) || 'U'}</AvatarFallback>
                            </>
                          );
                        })()}
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-black text-white leading-none text-sm uppercase tracking-tight">
                        {(() => {
                          const other = activeConv.expand?.participant1Id?.id === currentUser.id ? activeConv.expand?.participant2Id : activeConv.expand?.participant1Id;
                          return other?.username || other?.name || 'Utilisateur';
                        })()}
                      </h3>
                      <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${isOtherUserOnline ? 'text-[#D4AF37]' : 'text-white/20'}`}>{isOtherUserOnline ? 'En ligne' : 'Hors ligne'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleStartCall('audio')} className="text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleStartCall('video')} className="text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full"><Video className="w-5 h-5" /></Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white/20 hover:text-white rounded-full"><MoreVertical className="w-5 h-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#111] border-[#222] text-white">
                      <DropdownMenuItem onClick={() => navigate(`/profil/${(activeConv.participant1_id === currentUser.id ? activeConv.expand?.participant2Id : activeConv.expand?.participant1Id)?.id}`)} className="cursor-pointer">Voir le profil</DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#222]" />
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-500 cursor-pointer focus:text-red-500"><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/10 text-[10px] font-bold uppercase tracking-[0.3em]">Début de la conversation</div>
                ) : messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-xl ${isMe ? 'bg-[#D4AF37] text-black font-medium rounded-tr-none' : 'bg-[#111] text-white border border-[#222] rounded-tl-none'}`}>
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        </div>
                        <span className="text-[9px] mt-1.5 font-bold text-white/20 uppercase tracking-tighter">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-[#0a0a0a] border-t border-[#222]">
                <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Votre message..." className="w-full bg-[#111] border-[#222] text-white rounded-2xl h-14 px-5 focus:border-[#D4AF37]" />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-[#D4AF37] text-black rounded-2xl h-14 w-14 shadow-lg gold-glow shrink-0"><Send className="w-6 h-6" /></Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MessagesPage;