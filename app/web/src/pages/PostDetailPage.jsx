import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Share2, Facebook, Twitter, Trash2, Award, ChevronLeft, Eye, ShieldCheck, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LikersModal from '@/components/LikersModal.jsx';
import LoginPromptModal from '@/components/LoginPromptModal.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { formatRichText } from '@/lib/textFormatter.jsx';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);

  const [repostsCount, setRepostsCount] = useState(0);
  const [isReposted, setIsReposted] = useState(false);
  const [repostId, setRepostId] = useState(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist_premium') {
      return <Trophy className="w-3.5 h-3.5 text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]" title="Artiste Élite" />;
    }
    if (user?.subscription_type === 'artist' || (user?.is_premium && !user?.subscription_type)) {
      return <Award className="w-3.5 h-3.5 text-[#D4AF37]" title="Artiste Certifié" />;
    }
    if (user?.subscription_type === 'auditor') {
      return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" title="Auditeur Premium" />;
    }
    return null;
  };

  const [showLikersModal, setShowLikersModal] = useState(false);
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

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, profiles:user_id(*)')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Increment view count via RPC for logging
        await supabase.rpc('increment_post_view_count', {
          post_id: id,
          viewer_id: currentUser?.id || null
        });

        data.view_count = (data.view_count || 0) + 1;

        setPost(data);
        setLikesCount(data.likes_count || 0);
        setRepostsCount(data.reposts_count || 0);

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, profiles:user_id(*)')
          .eq('post_id', id)
          .order('created_at', { ascending: false });

        if (!commentsError) setComments(commentsData || []);

        // Check user interactions
        if (isAuthenticated && currentUser) {
          const [likeData, repData] = await Promise.all([
            supabase.from('likes').select('id').eq('post_id', id).eq('user_id', currentUser.id).maybeSingle(),
            supabase.from('reposts').select('id').eq('post_id', id).eq('user_id', currentUser.id).maybeSingle()
          ]);

          if (likeData.data) {
            setIsLiked(true);
            setLikeId(likeData.data.id);
          }
          if (repData.data) {
            setIsReposted(true);
            setRepostId(repData.data.id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Publication introuvable.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [id, isAuthenticated, currentUser]);

  const handleLike = async () => {
    if (!isAuthenticated) return setShowLoginPrompt(true);

    try {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().eq('id', likeId);
        if (error) throw error;

        setIsLiked(false);
        setLikeId(null);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { data, error } = await supabase
          .from('likes')
          .insert({ post_id: id, user_id: currentUser.id })
          .select()
          .single();

        if (error) throw error;
        setIsLiked(true);
        setLikeId(data.id);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Like error details:", err);
      toast.error(`Erreur Like: ${err.message || "Action impossible"}`);
    }
  };

  const handleRepost = async () => {
    if (!isAuthenticated) return setShowLoginPrompt(true);

    try {
      if (isReposted) {
        const { error } = await supabase.from('reposts').delete().eq('id', repostId);
        if (error) throw error;

        setIsReposted(false);
        setRepostId(null);
        setRepostsCount(prev => Math.max(0, prev - 1));
        toast.success("Retiré de votre profil");
      } else {
        const { data, error } = await supabase
          .from('reposts')
          .insert({ post_id: id, user_id: currentUser.id })
          .select()
          .single();

        if (error) throw error;
        setIsReposted(true);
        setRepostId(data.id);
        setRepostsCount(prev => prev + 1);
        toast.success("Reposté sur votre profil !");
      }
    } catch (err) {
      console.error("Repost error details:", err);
      toast.error(`Erreur Repost: ${err.message || "Action impossible"}`);
    }
  };

  const handlePostComment = async () => {
    if (!isAuthenticated) return setShowLoginPrompt(true);
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: currentUser.id,
          text: newComment
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setNewComment('');
      toast.success("Commentaire publié");
    } catch (err) {
      console.error("Comment error details:", err);
      toast.error(`Erreur Commentaire: ${err.message || "Action impossible"}`);
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez cette publication sur KLTUR RAP !`);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (loading) return <div className="min-h-screen bg-black"><Header /><main className="max-w-4xl mx-auto py-20 px-4"><Skeleton className="h-[600px] w-full bg-[#111] rounded-3xl"/></main></div>;
  if (!post) return <div className="min-h-screen bg-black text-white"><Header /><div className="text-center py-40">Publication introuvable</div></div>;

  const artist = post.profiles;
  const isVideo = post.media_type === 'video';
  const mediaUrl = getPublicImageUrl('posts', post.content_url);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Helmet><title>Post de {artist?.username || 'Artiste'} - KLTUR RAP</title></Helmet>
      <Header />
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <LikersModal isOpen={showLikersModal} onClose={() => setShowLikersModal(false)} postId={id} />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] mb-6 transition-colors font-bold uppercase text-xs tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 bg-[#0a0a0a] rounded-3xl border border-[#222] overflow-hidden shadow-2xl">
            {/* Media Area */}
            <div className="lg:col-span-3 bg-black flex items-center justify-center relative min-h-[400px]">
              {isVideo ? (
                <video src={mediaUrl} controls className="max-h-[80vh] w-full" autoPlay loop muted />
              ) : (
                <img src={mediaUrl} alt="Post content" className="max-h-[80vh] w-full object-contain" />
              )}
            </div>

            {/* Interactions Area */}
            <div className="lg:col-span-2 flex flex-col h-full border-l border-[#222]">
              {/* Post Header */}
              <div className="p-6 border-b border-[#222] flex items-center justify-between">
                <Link to={`/profil/${artist?.id}`} className="flex items-center gap-3 group">
                  <Avatar className="h-10 w-10 border border-[#333]">
                    <AvatarImage src={getPublicImageUrl('avatars', artist?.avatar || artist?.profilePhoto)} />
                    <AvatarFallback className="bg-[#111] text-[#D4AF37] font-black">{artist?.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-white group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                      {artist?.username || artist?.name}
                      {getBadge(artist)}
                    </h2>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
              </div>

              {/* Caption & Comments */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 max-h-[400px] lg:max-h-none">
                {post.caption && (
                  <div className="pb-6 border-b border-[#222]">
                    <p className="text-white/90 leading-relaxed">{formatRichText(post.caption)}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-white/30 text-center italic py-10 text-sm">Aucun commentaire pour le moment.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={getPublicImageUrl('avatars', comment.profiles?.avatar || comment.profiles?.profilePhoto)} />
                          <AvatarFallback className="bg-[#111] text-[#D4AF37] text-xs font-bold">{comment.profiles?.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="bg-[#111] p-3 rounded-2xl rounded-tl-none border border-[#222] flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-[#D4AF37] flex items-center gap-1">
                              {comment.profiles?.username}
                              {getBadge(comment.profiles)}
                            </span>
                            <span className="text-[10px] text-white/30">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="relative">
                            <p className={`text-sm text-white/80 whitespace-pre-wrap transition-all duration-200 ${!expandedComments[comment.id] ? 'line-clamp-3' : ''}`}>
                              {formatRichText(comment.text)}
                            </p>
                            {comment.text.length > 150 && (
                              <button
                                onClick={() => toggleCommentExpand(comment.id)}
                                className="mt-1 text-[#D4AF37] font-bold text-[9px] uppercase tracking-widest hover:underline"
                              >
                                {expandedComments[comment.id] ? 'Voir moins' : 'Voir plus'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-[#0a0a0a] border-t border-[#222]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setShowLikersModal(true)}>
                      <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className={`transition-all hover:scale-110 ${isLiked ? 'text-red-500' : 'text-white/60 hover:text-white'}`}>
                        <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm font-bold">{comments.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Eye className="w-6 h-6" />
                      <span className="text-sm font-bold">{post?.view_count || 0}</span>
                    </div>
                    <button
                      onClick={handleRepost}
                      className={`transition-all hover:scale-110 flex items-center gap-1.5 ${isReposted ? 'text-green-500' : 'text-white/60 hover:text-white'}`}
                    >
                      <Repeat2 className="w-6 h-6" />
                      <span className="text-sm font-bold">{repostsCount}</span>
                    </button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-white/60 hover:text-[#D4AF37] transition-colors"><Share2 className="w-6 h-6" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#111] border-[#222] text-white">
                      <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">Facebook</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">Twitter</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer font-bold text-[#D4AF37]">Copier le lien</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex gap-2 relative">
                  {mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
                      {mentionSuggestions.map(user => (
                        <button
                          key={user.id}
                          onClick={() => selectMention(user.username)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-left"
                        >
                          <Avatar className="h-6 w-6 border border-white/10">
                            <AvatarImage src={getPublicImageUrl('avatars', user.avatar)} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm">@{user.username}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {hashtagSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-[#111] border border-[#222] rounded-xl shadow-2xl z-50 mb-2 overflow-hidden">
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
                  <Textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Votre avis..."
                    className="bg-[#111] border-[#222] focus:border-[#D4AF37] resize-none h-12 min-h-0 py-3"
                  />
                  <Button onClick={handlePostComment} disabled={postingComment || !newComment.trim()} className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
                    Poster
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetailPage;
