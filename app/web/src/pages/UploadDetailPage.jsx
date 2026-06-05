import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Download, Eye, Calendar, Award, Heart, MessageCircle, Star, Repeat2, Share2, Facebook, Twitter, Trash2, Edit, CheckCircle, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import LoginPromptModal from '@/components/LoginPromptModal.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAudio } from '@/contexts/AudioContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { Capacitor } from '@capacitor/core';
import { formatRichText } from '@/lib/textFormatter.jsx';

const UploadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { playTrack, currentTrack, isPlaying, downloadForOffline, removeOffline, offlineTracks } = useAudio();

  const [upload, setUpload] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const isDownloaded = upload ? offlineTracks.some(t => t.id === upload.id) : false;

  // Interaction states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [stats, setStats] = useState({ likes: 0, favorites: 0, reposts: 0 });
  const [userInteractions, setUserInteractions] = useState({ 
    liked: false, likeId: null, 
    favorited: false, favId: null,
    reposted: false, repId: null
  });
  
  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(-1);

  const handleCommentChange = async (e) => {
    const val = e.target.value;
    setNewComment(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setMentionIndex(cursorPosition - lastWord.length);

      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar')
        .ilike('username', `${query}%`)
        .limit(5);

      setMentionSuggestions(data || []);
      setHashtagSuggestions([]);
    } else if (lastWord.startsWith('#') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setMentionIndex(cursorPosition - lastWord.length);

      const tags = ['RCA', 'HipHop', 'Bangui', 'KlturRap', 'Nouveauté', 'Clip', 'RapCentrafricain']
        .filter(t => t.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5);

      setHashtagSuggestions(tags);
      setMentionSuggestions([]);
    } else {
      setMentionSuggestions([]);
      setHashtagSuggestions([]);
    }
  };

  const selectMention = (username) => {
    const before = newComment.substring(0, mentionIndex);
    const after = newComment.substring(newComment.indexOf(' ', mentionIndex) === -1 ? newComment.length : newComment.indexOf(' ', mentionIndex));
    setNewComment(`${before}@${username} ${after.trim()}`);
    setMentionSuggestions([]);
  };

  const selectHashtag = (tag) => {
    const before = newComment.substring(0, mentionIndex);
    const after = newComment.substring(newComment.indexOf(' ', mentionIndex) === -1 ? newComment.length : newComment.indexOf(' ', mentionIndex));
    setNewComment(`${before}#${tag} ${after.trim()}`);
    setHashtagSuggestions([]);
  };

  const toggleCommentExpand = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('uploads')
          .select('*, profiles:user_id(*)')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Increment view count
        await supabase
          .from('uploads')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);

        data.view_count = (data.view_count || 0) + 1;

        // Map to keep compatibility with existing components
        const mappedData = {
          ...data,
          expand: {
            userId: data.profiles
          }
        };
        setUpload(mappedData);

        // Fetch interactions counts
        const [likesRes, favsRes, repRes, commentsRes] = await Promise.all([
          supabase.from('likes').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('reposts').select('*', { count: 'exact', head: true }).eq('upload_id', id),
          supabase.from('comments').select('*, profiles:user_id(*)').eq('upload_id', id).order('created_at', { ascending: false })
        ]);

        setStats({
          likes: likesRes.count || 0,
          favorites: favsRes.count || 0,
          reposts: repRes.count || 0
        });

        const mappedComments = (commentsRes.data || []).map(c => ({
          ...c,
          expand: {
            userId: c.profiles
          }
        }));
        setComments(mappedComments);

        // Check user interactions
        if (isAuthenticated) {
          const [myLike, myFav, myRep] = await Promise.all([
            supabase.from('likes').select('id').eq('upload_id', id).eq('user_id', currentUser.id).maybeSingle(),
            supabase.from('favorites').select('id').eq('upload_id', id).eq('user_id', currentUser.id).maybeSingle(),
            supabase.from('reposts').select('id').eq('upload_id', id).eq('user_id', currentUser.id).maybeSingle()
          ]);
          setUserInteractions({
            liked: !!myLike.data, likeId: myLike.data?.id,
            favorited: !!myFav.data, favId: myFav.data?.id,
            reposted: !!myRep.data, repId: myRep.data?.id
          });
        }

        // Related
        if (data.user_id) {
          const { data: relData } = await supabase
            .from('uploads')
            .select('*')
            .eq('user_id', data.user_id)
            .neq('id', id)
            .order('created_at', { ascending: false })
            .limit(4);

          setRelated(relData || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Projet introuvable.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id, isAuthenticated, currentUser]);

  const handleAction = async (type) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      if (type === 'like') {
        if (userInteractions.liked) {
          await supabase.from('likes').delete().eq('id', userInteractions.likeId);
          setUserInteractions(p => ({ ...p, liked: false, likeId: null }));
          setStats(p => ({ ...p, likes: p.likes - 1 }));
        } else {
          const { data, error } = await supabase
            .from('likes')
            .insert([{ upload_id: id, user_id: currentUser.id }])
            .select()
            .single();
          if (error) throw error;
          setUserInteractions(p => ({ ...p, liked: true, likeId: data.id }));
          setStats(p => ({ ...p, likes: p.likes + 1 }));
        }
      } else if (type === 'favorite') {
        if (userInteractions.favorited) {
          await supabase.from('favorites').delete().eq('id', userInteractions.favId);
          setUserInteractions(p => ({ ...p, favorited: false, favId: null }));
          setStats(p => ({ ...p, favorites: p.favorites - 1 }));
        } else {
          const { data, error } = await supabase
            .from('favorites')
            .insert([{ upload_id: id, user_id: currentUser.id }])
            .select()
            .single();
          if (error) throw error;
          setUserInteractions(p => ({ ...p, favorited: true, favId: data.id }));
          setStats(p => ({ ...p, favorites: p.favorites + 1 }));
        }
      } else if (type === 'repost') {
        if (userInteractions.reposted) {
          await supabase.from('reposts').delete().eq('id', userInteractions.repId);
          setUserInteractions(p => ({ ...p, reposted: false, repId: null }));
          setStats(p => ({ ...p, reposts: p.reposts - 1 }));
          toast.success("Retiré de vos reposts");
        } else {
          const { data, error } = await supabase
            .from('reposts')
            .insert([{ upload_id: id, user_id: currentUser.id }])
            .select()
            .single();
          if (error) throw error;
          setUserInteractions(p => ({ ...p, reposted: true, repId: data.id }));
          setStats(p => ({ ...p, reposts: p.reposts + 1 }));
          toast.success("Reposté sur votre profil");
        }
      }
    } catch (err) {
      console.error("Action error details:", err);
      toast.error(`Erreur ${type}: ${err.message || "Action impossible"}`);
    }
  };

  const handlePostComment = async () => {
    if (!isAuthenticated) return setShowLoginPrompt(true);
    if (!newComment.trim()) return;
    
    setPostingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          upload_id: id, user_id: currentUser.id, text: newComment
        }])
        .select('*, profiles:user_id(*)')
        .single();
      
      if (error) throw error;

      const mapped = {
        ...data,
        expand: {
          userId: data.profiles
        }
      };

      setComments([mapped, ...comments]);
      setNewComment('');
      toast.success("Commentaire publié");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la publication");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const handleOfflineAction = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error("Le téléchargement hors ligne est réservé à l'application mobile.");
      return;
    }

    if (isDownloaded) {
      if (window.confirm("Supprimer ce morceau de votre stockage hors ligne ?")) {
        await removeOffline(upload.id);
        toast.success("Supprimé du mode hors ligne");
      }
      return;
    }

    setIsDownloading(true);
    const success = await downloadForOffline({
      id: upload.id,
      title: upload.title,
      artist: artist?.name || 'Artiste Inconnu',
      url: mediaUrl,
      cover: getFileUrl('covers', upload.cover_art)
    });

    if (success) {
      toast.success("Disponible hors ligne !");
    } else {
      toast.error("Échec du téléchargement hors ligne.");
    }
    setIsDownloading(false);
  };

  const handleDownload = async () => {
    if (!upload) return;
    try {
      await supabase
        .from('uploads')
        .update({ download_count: (upload.download_count || 0) + 1 })
        .eq('id', id);

      setUpload(p => ({...p, download_count: (p.download_count || 0) + 1}));
      const fileUrl = getFileUrl('uploads', upload.file_path);
      window.open(fileUrl, '_blank');
    } catch (err) {
      toast.error('Erreur lors du téléchargement.');
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez "${upload?.title}" sur KLTUR RAP !`);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <Header /><main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full"><Skeleton className="h-[600px] w-full bg-[#111] rounded-2xl"/></main><Footer />
      </div>
    );
  }

  if (!upload) return <div className="min-h-screen bg-[#050505]"><Header /><div className="text-white text-center py-20">Introuvable</div><Footer /></div>;

  const artist = upload.expand?.userId;
  const isVideo = upload.type === 'Music Video' && upload.file_path;
  const mediaUrl = isVideo ? getFileUrl('uploads', upload.file_path) : getFileUrl('uploads', upload.file_path);
  const isOwner = currentUser?.id === artist?.id;

  return (
    <>
      <Helmet>
        <title>{upload.title} - KLTUR RAP</title>
      </Helmet>
      
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              {/* Media Player Section */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden shadow-2xl relative">
                {isOwner && (
                  <div className="absolute top-4 right-4 z-20">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/uploads/${id}/modifier`)} className="bg-[#111]/80 backdrop-blur text-white border border-[#333] hover:border-[#D4AF37] font-bold">
                      <Edit className="w-4 h-4 mr-2" /> Modifier
                    </Button>
                  </div>
                )}
                {isVideo ? (
                  <div className="aspect-video bg-black">
                    <video controls src={mediaUrl} className="w-full h-full" poster={getFileUrl('covers', upload.cover_art)}>
                      Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                  </div>
                ) : (
                  <div className="p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                    <div className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none" style={{
                      backgroundImage: `url(${getFileUrl('covers', upload.cover_art)})`,
                      backgroundSize: 'cover', backgroundPosition: 'center'
                    }} />
                    <img src={getFileUrl('covers', upload.cover_art)} alt={upload.title} className="w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl z-10 object-cover border border-[#333]" />
                    <div className="z-10 flex-grow text-center md:text-left w-full">
                      <div className="inline-block px-3 py-1 bg-[#222] text-[#D4AF37] text-xs font-bold rounded uppercase tracking-wider mb-4 border border-[#333]">{upload.type}</div>
                      <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{upload.title}</h1>
                      <Link to={`/profil/${artist?.id}`} className="text-lg text-white/70 hover:text-[#D4AF37] font-medium block mb-6 transition-colors">{artist?.name || 'Artiste Inconnu'}</Link>

                      {mediaUrl && (
                        <Button
                          onClick={() => playTrack({
                            id: upload.id,
                            title: upload.title,
                            artist: artist?.name || 'Artiste Inconnu',
                            url: mediaUrl,
                            cover: getFileUrl('covers', upload.cover_art)
                          }, [
                            {
                              id: upload.id,
                              title: upload.title,
                              artist: artist?.name || 'Artiste Inconnu',
                              url: mediaUrl,
                              cover: getFileUrl('covers', upload.cover_art)
                            },
                            ...related.map(r => ({
                              id: r.id,
                              title: r.title,
                              artist: artist?.name || 'Artiste Inconnu',
                              url: getFileUrl('uploads', r.file_path),
                              cover: getFileUrl('covers', r.cover_art)
                            }))
                          ])}
                          className="w-full md:w-auto h-14 px-10 bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black text-lg uppercase tracking-wider rounded-full gold-glow"
                        >
                          {currentTrack?.id === upload.id && isPlaying ? (
                            <><Pause className="w-6 h-6 mr-2 fill-current" /> Pause</>
                          ) : (
                            <><Play className="w-6 h-6 mr-2 fill-current" /> Écouter maintenant</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Interaction Action Bar */}
                <div className="p-4 bg-[#111] border-t border-[#222] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => handleAction('like')} className={`font-bold hover:bg-transparent ${userInteractions.liked ? 'text-red-500' : 'text-white/70 hover:text-[#D4AF37]'}`}>
                      <Heart className={`w-5 h-5 mr-2 ${userInteractions.liked ? 'fill-current' : ''}`} /> {stats.likes}
                    </Button>
                    <Button variant="ghost" onClick={() => handleAction('favorite')} className={`font-bold hover:bg-transparent ${userInteractions.favorited ? 'text-[#D4AF37]' : 'text-white/70 hover:text-[#D4AF37]'}`}>
                      <Star className={`w-5 h-5 mr-2 ${userInteractions.favorited ? 'fill-current' : ''}`} /> {stats.favorites}
                    </Button>
                    <Button variant="ghost" onClick={() => handleAction('repost')} className={`font-bold hover:bg-transparent ${userInteractions.reposted ? 'text-green-500' : 'text-white/70 hover:text-[#D4AF37]'}`}>
                      <Repeat2 className="w-5 h-5 mr-2" /> {stats.reposts}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-transparent border-[#333] text-white hover:border-[#D4AF37] hover:text-[#D4AF37]">
                          <Share2 className="w-4 h-4 mr-2" /> Partager
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111] border-[#333] text-white">
                        <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer"><Facebook className="w-4 h-4 mr-2"/> Facebook</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer"><Twitter className="w-4 h-4 mr-2"/> Twitter</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">WhatsApp</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer">Copier le lien</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                        <Button onClick={handleDownload} className="bg-white/10 text-white hover:bg-white/20 font-bold border border-[#333]">
                      <Download className="w-4 h-4 mr-2" /> {upload.download_count || 0}
                    </Button>

                    {/* Offline Button */}
                    {Capacitor.isNativePlatform() && (
                      <Button
                        onClick={handleOfflineAction}
                        disabled={isDownloading}
                        className={`font-bold transition-all ${
                          isDownloaded
                            ? 'bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-600/30'
                            : 'bg-[#D4AF37] text-black hover:bg-[#b5952f]'
                        }`}
                      >
                        {isDownloading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : isDownloaded ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <WifiOff className="w-4 h-4 mr-2" />
                        )}
                        {isDownloaded ? 'Hors ligne' : 'Rendre hors ligne'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description & Metadata */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-8">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-[#222] pb-2">Détails du projet</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase mb-1">Vues</p>
                    <p className="text-white font-medium flex items-center gap-1"><Eye className="w-4 h-4"/> {upload.view_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase mb-1">Genre</p>
                    <p className="text-white font-medium">{upload.genre}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase mb-1">Date de sortie</p>
                    <p className="text-white font-medium flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(upload.release_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {upload.is_explicit && (
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase mb-1">Contenu</p>
                      <p className="text-red-400 font-bold border border-red-400 px-2 py-0.5 rounded text-xs inline-block">EXPLICITE</p>
                    </div>
                  )}
                </div>
                {upload.collaborators && (
                  <div className="mb-6 bg-[#111] p-4 rounded-xl border border-[#333]">
                    <p className="text-[#D4AF37] text-xs font-bold uppercase mb-1">En featuring</p>
                    <p className="text-white font-medium">{upload.collaborators}</p>
                  </div>
                )}
                {upload.description ? (
                  <div className="relative">
                    <p className={`text-white/80 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                      {formatRichText(upload.description)}
                    </p>
                    {upload.description.length > 300 && (
                      <button
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="mt-3 text-[#D4AF37] font-black text-[10px] uppercase tracking-widest hover:underline"
                      >
                        {isDescExpanded ? 'Voir moins' : 'Lire la suite'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-white/40 italic">Aucune description fournie.</p>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#D4AF37]" /> Commentaires ({comments.length})
                </h3>
                
                <div className="flex gap-4 mb-8">
                  <Avatar className="w-10 h-10 border border-[#333]">
                    <AvatarImage src={currentUser?.avatar ? getFileUrl('avatars', currentUser.avatar) : ''} />
                    <AvatarFallback className="bg-[#222] text-[#D4AF37] font-bold">{currentUser?.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow relative">
                    <Textarea 
                      value={newComment} onChange={handleCommentChange} onClick={() => !isAuthenticated && setShowLoginPrompt(true)}
                      placeholder="Ajouter un commentaire..." className="bg-[#111] border-[#333] text-white focus:border-[#D4AF37] resize-none min-h-[80px] mb-2"
                    />

                    {mentionSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
                        {mentionSuggestions.map(user => (
                          <button
                            key={user.id}
                            onClick={() => selectMention(user.username)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left"
                          >
                            <Avatar className="h-6 w-6 border border-white/10">
                              <AvatarImage src={getFileUrl('avatars', user.avatar)} />
                              <AvatarFallback>{user.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm">@{user.username}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {hashtagSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 w-64 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
                        {hashtagSuggestions.map(tag => (
                          <button
                            key={tag}
                            onClick={() => selectHashtag(tag)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left font-bold text-sm"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={handlePostComment} disabled={postingComment || !newComment.trim()} className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold px-6">
                        Poster
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-white/40 text-center italic py-4">Soyez le premier à commenter !</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-4 group">
                        <Avatar className="w-10 h-10 border border-[#333]">
                          <AvatarImage src={c.expand?.userId?.avatar ? getFileUrl('avatars', c.expand.userId.avatar) : ''} />
                          <AvatarFallback className="bg-[#222] text-[#D4AF37] text-xs font-bold">{c.expand?.userId?.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm flex items-center gap-1">
                              {c.expand?.userId?.username || c.expand?.userId?.name}
                              {c.expand?.userId?.is_premium && <Award className="w-3 h-3 text-[#D4AF37]" />}
                            </span>
                            <span className="text-xs text-white/40">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                            {currentUser?.id === c.user_id && (
                              <button onClick={() => handleDeleteComment(c.id)} className="ml-auto text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <p className={`text-white/80 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200 ${!expandedComments[c.id] ? 'line-clamp-3' : ''}`}>
                              {formatRichText(c.text)}
                            </p>
                            {c.text.length > 200 && (
                              <button
                                onClick={() => toggleCommentExpand(c.id)}
                                className="mt-1 text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest hover:underline"
                              >
                                {expandedComments[c.id] ? 'Voir moins' : 'Voir plus'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Artist Card */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-[#333]">
                  <AvatarImage src={artist?.avatar ? getFileUrl('avatars', artist.avatar) : getFileUrl('avatars', artist?.profilePhoto)} />
                  <AvatarFallback className="bg-[#111] text-[#D4AF37] text-2xl font-bold">{artist?.username?.charAt(0) || artist?.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">{artist?.username || artist?.name || 'Artiste Inconnu'}</h3>
                  {artist?.is_premium && <Award className="w-5 h-5 text-[#D4AF37]" title="Certifié" />}
                </div>
                <p className="text-white/50 text-sm mb-6">{artist?.user_role || 'Artiste'}</p>
                <Button asChild className="w-full bg-white text-black hover:bg-white/90 font-bold">
                  <Link to={`/profil/${artist?.id}`}>Voir le profil complet</Link>
                </Button>
              </div>

              {/* Related Uploads */}
              {related.length > 0 && (
                <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Du même artiste</h3>
                  <div className="space-y-4">
                    {related.map(rel => (
                      <Link key={rel.id} to={`/uploads/${rel.id}`} className="flex items-center gap-3 group">
                        <img src={getFileUrl('covers', rel.cover_art)} alt={rel.title} className="w-16 h-16 rounded-md object-cover border border-[#333] group-hover:border-[#D4AF37] transition-colors" />
                        <div>
                          <h4 className="text-white font-medium text-sm line-clamp-1 group-hover:text-[#D4AF37] transition-colors">{rel.title}</h4>
                          <p className="text-white/40 text-xs">{rel.type}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default UploadDetailPage;