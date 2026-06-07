import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Music, Play, Eye, Download, UserPlus, MessageSquare, Edit2, Globe, Youtube, Facebook, Instagram, Twitter, Image as ImageIcon, Heart, Repeat2, Video, MessageCircle, Ghost, Apple, Music2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LikersModal from '@/components/LikersModal.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { formatRichText } from '@/lib/textFormatter.jsx';

const PublicArtistProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [artist, setArtist] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [ytVideos, setYtVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, total: 0, followers: 0, posts: 0, reposts: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showLikersModal, setShowLikersModal] = useState(false);

  const isOwner = currentUser?.id === artist?.id;

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        // Check if userId is a valid UUID or a username
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

        let userQuery = supabase.from('profiles').select('*');
        if (isUUID) {
          userQuery = userQuery.eq('id', userId);
        } else {
          userQuery = userQuery.eq('username', userId);
        }

        const { data: userData, error: userError } = await userQuery.single();

        if (userError) throw userError;
        setArtist(userData);
        const actualId = userData.id;

        // Fetch Uploads, Followers, Posts and Reposts
        const [uploadsResult, followersResult, postsResult, repostsResult] = await Promise.all([
          supabase
            .from('uploads')
            .select('*', { count: 'exact' })
            .eq('user_id', actualId)
            .order('created_at', { ascending: false }),
          supabase
            .from('followers')
            .select('*', { count: 'exact' })
            .eq('following_id', actualId),
          supabase
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('user_id', actualId)
            .order('created_at', { ascending: false }),
          supabase
            .from('reposts')
            .select('*, posts(*, profiles:user_id(*)), uploads(*, profiles:user_id(*))', { count: 'exact' })
            .eq('user_id', actualId)
            .order('created_at', { ascending: false })
        ]);
        
        if (uploadsResult.error) throw uploadsResult.error;
        if (followersResult.error) throw followersResult.error;
        if (postsResult.error) throw postsResult.error;
        if (repostsResult.error) throw repostsResult.error;

        setUploads(uploadsResult.data || []);
        setPosts(postsResult.data || []);
        setReposts(repostsResult.data || []);

        // Fetch YouTube videos if admin
        if (userData.is_admin) {
          const { data: ytData } = await supabase
            .from('news')
            .select('*')
            .ilike('source_url', '%youtube.com%')
            .order('created_at', { ascending: false })
            .limit(12);
          setYtVideos(ytData || []);
        }

        const views = (uploadsResult.data || []).reduce((acc, curr) => acc + (curr.view_count || 0), 0);
        setStats({
          total: uploadsResult.count || 0,
          views,
          followers: followersResult.count || 0,
          posts: postsResult.count || 0,
          reposts: repostsResult.count || 0
        });

        if (isAuthenticated && currentUser?.id !== actualId) {
          const { data: myFollow, error: followError } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', actualId)
            .maybeSingle();

          if (myFollow) {
            setIsFollowing(true);
            setFollowId(myFollow.id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Artiste introuvable.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
    window.scrollTo(0, 0);
  }, [userId, isAuthenticated, currentUser]);

  const handleFollow = async () => {
    if (!isAuthenticated) return toast.error("Connectez-vous pour suivre");
    if (!artist) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('id', followId);

        if (error) throw error;
        setIsFollowing(false);
        setStats(p => ({...p, followers: Math.max(0, p.followers - 1)}));
        toast.success("Désabonné");
      } else {
        const { data, error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: artist.id
          })
          .select()
          .single();

        if (error) throw error;

        setIsFollowing(true);
        setFollowId(data.id);
        setStats(p => ({...p, followers: p.followers + 1}));
        toast.success("Abonné !");
      }
    } catch (err) {
      console.error("Action error details:", err);
      toast.error(`Erreur: ${err.message || "Action impossible"}`);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated || !currentUser || !artist) return toast.error("Connectez-vous pour envoyer un message");

    try {
      // 1. Chercher si une conversation existe déjà
      const { data: existing, error } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${artist.id}),and(participant1_id.eq.${artist.id},participant2_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (error) throw error;

      if (existing) {
        navigate('/messages');
      } else {
        // 2. Créer une nouvelle conversation si inexistante
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert([{ participant1_id: currentUser.id, participant2_id: artist.id, last_message: 'Nouvelle conversation' }])
          .select()
          .single();

        if (createError) throw createError;
        navigate('/messages');
      }
    } catch (err) {
      console.error("Message error:", err);
      toast.error(`Erreur Message: ${err.message || "Problème de connexion"}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505]"><Header /><main className="flex-grow py-20 px-4 max-w-4xl mx-auto w-full text-center"><Skeleton className="w-32 h-32 rounded-full mx-auto mb-6 bg-[#111]" /></main><Footer /></div>;
  if (!artist) return <div className="min-h-screen bg-[#050505]"><Header /><div className="text-white text-center py-20">Artiste introuvable</div><Footer /></div>;

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const getBannerStyle = () => {
    if (artist?.banner_style === 'gradient') return { background: 'linear-gradient(to right, #000000, #D4AF37)' };
    if (artist?.banner_style === 'solid') return { background: '#111111' };
    if (artist?.banner_image) {
      return { backgroundImage: `url(${getFileUrl('covers', artist.banner_image)})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: '#111111' };
  };

  const getBadge = (user) => {
    if (user?.subscription_type === 'artist' || user?.is_premium && !user?.subscription_type) {
      return <Award className="w-6 h-6 text-[#D4AF37]" title="Artiste Certifié" />;
    }
    if (user?.subscription_type === 'auditor') {
      return <ShieldCheck className="w-6 h-6 text-blue-400" title="Auditeur Premium" />;
    }
    return null;
  };

  const getSocialIcon = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <Facebook className="w-5 h-5" />;
    if (p.includes('instagram')) return <Instagram className="w-5 h-5" />;
    if (p.includes('twitter') || p === 'x') return <Twitter className="w-5 h-5" />;
    if (p.includes('youtube')) return <Youtube className="w-5 h-5" />;
    if (p.includes('spotify') || p.includes('music')) return <Music2 className="w-5 h-5" />;
    if (p.includes('apple')) return <Apple className="w-5 h-5" />;
    if (p.includes('whatsapp')) return <MessageCircle className="w-5 h-5" />;
    if (p.includes('tiktok') || p.includes('snapchat')) return <Ghost className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  return (
    <>
      <Helmet><title>{artist?.username || artist?.name || 'Artiste'} - KLTUR RAP</title></Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />
        <LikersModal isOpen={showLikersModal} onClose={() => setShowLikersModal(false)} postId={selectedPostId} />

        <main className="flex-grow pb-12 w-full">
          {/* Banner */}
          <div className="w-full h-[250px] md:h-[350px] relative" style={getBannerStyle()}>
            <div className="absolute inset-0 bg-black/40" />
            {artist?.banner_text && (
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-lg">{artist.banner_text}</h2>
              </div>
            )}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
            <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-8 mb-12 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-[#222] bg-[#111]">
                  <AvatarImage src={artist?.avatar ? getFileUrl('avatars', artist.avatar) : getFileUrl('avatars', artist?.profilePhoto)} />
                  <AvatarFallback className="text-[#D4AF37] text-5xl font-black">{artist?.username?.charAt(0) || artist?.name?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>

                <div className="flex-grow text-center md:text-left mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">{artist?.username || artist?.name}</h1>
                    {getBadge(artist)}
                  </div>
                  <p className="text-[#D4AF37] font-bold uppercase tracking-wider text-sm mb-4">{artist?.user_role || 'Artiste'}</p>
                  
                  {artist?.bio && (
                    <div className="mb-6 relative">
                      <p className={`text-white/80 max-w-2xl leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                        {formatRichText(artist.bio)}
                      </p>
                      {artist.bio.length > 200 && (
                        <button
                          onClick={() => setIsBioExpanded(!isBioExpanded)}
                          className="mt-2 text-[#D4AF37] font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                          {isBioExpanded ? 'Voir moins' : 'Lire la bio complète'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                    {isOwner ? (
                      <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
                        <Link to="/modifier-profil"><Edit2 className="w-4 h-4 mr-2" /> Éditer le profil</Link>
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className={isFollowing ? "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold" : "bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold"}>
                          <UserPlus className="w-4 h-4 mr-2" /> {isFollowing ? 'Abonné' : 'Suivre'}
                        </Button>
                        <Button onClick={handleMessage} variant="outline" className="border-[#333] text-white hover:bg-[#111] font-bold">
                          <MessageSquare className="w-4 h-4 mr-2" /> Message
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Socials */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {artist?.website && (
                      <a href={artist.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all" title="Site Web">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {artist?.social_links && Object.entries(artist.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                      return (
                        <a
                          key={platform}
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
                          title={platform}
                        >
                          {getSocialIcon(platform)}
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 bg-[#111] p-6 rounded-xl border border-[#333]">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                    <p className="text-xs text-white/50 uppercase font-bold">Projets</p>
                  </div>
                  <div className="w-px bg-[#333]" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{stats.posts}</p>
                    <p className="text-xs text-white/50 uppercase font-bold">Posts</p>
                  </div>
                  <div className="w-px bg-[#333]" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{stats.followers}</p>
                    <p className="text-xs text-white/50 uppercase font-bold">Abonnés</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="discography" className="w-full">
              <TabsList className="bg-[#0a0a0a] border border-[#222] mb-8 p-1">
                <TabsTrigger value="discography" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold uppercase tracking-wider text-xs py-3 px-6">
                  <Music className="w-4 h-4 mr-2" /> Discographie
                </TabsTrigger>
                <TabsTrigger value="publications" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold uppercase tracking-wider text-xs py-3 px-6">
                  <ImageIcon className="w-4 h-4 mr-2" /> Publications
                </TabsTrigger>
                <TabsTrigger value="reposts" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black font-bold uppercase tracking-wider text-xs py-3 px-6">
                  <Repeat2 className="w-4 h-4 mr-2" /> Reposts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discography">
                {uploads.length === 0 ? (
                  <p className="text-white/50 text-center py-10 bg-[#0a0a0a] rounded-xl border border-[#222]">Cet artiste n'a pas encore publié de projets publics.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {uploads.map(upload => (
                      <Link key={upload.id} to={`/uploads/${upload.id}`} className="group block">
                        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all hover:-translate-y-1 h-full flex flex-col">
                          <div className="aspect-square relative overflow-hidden bg-[#111]">
                            {upload.cover_art && <img src={getFileUrl('covers', upload.cover_art)} alt={upload.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black pl-1 gold-glow transform scale-90 group-hover:scale-100 transition-transform"><Play className="w-5 h-5" fill="currentColor" /></div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">{upload.type}</div>
                          </div>
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-white text-sm md:text-base line-clamp-1 mb-1 group-hover:text-[#D4AF37] transition-colors">{upload.title}</h3>
                              <p className="text-xs text-white/50">{upload.genre}</p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] md:text-xs text-white/40 font-medium mt-3 pt-3 border-t border-[#222]">
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {upload.view_count || 0}</span>
                              <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5"/> {upload.download_count || 0}</span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="publications">
                {posts.length === 0 ? (
                  <p className="text-white/50 text-center py-10 bg-[#0a0a0a] rounded-xl border border-[#222]">Cet artiste n'a pas encore fait de publications.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {posts.map(post => (
                      <Link key={post.id} to={`/posts/${post.id}`} className="block group">
                        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all relative aspect-square">
                          {post.media_type === 'video' ? (
                            <video src={getFileUrl('posts', post.content_url)} className="w-full h-full object-cover" />
                          ) : (
                            <img src={getFileUrl('posts', post.content_url)} alt={post.caption} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-white text-xs line-clamp-3">{post.caption}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-white/70 font-bold uppercase">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedPostId(post.id);
                                  setShowLikersModal(true);
                                }}
                                className="flex items-center gap-1 hover:scale-110 transition-transform"
                              >
                                <Heart className="w-3 h-3 fill-red-500 text-red-500" /> {post.likes_count || 0}
                              </button>
                              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments_count || 0}</span>
                              <span className="ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reposts">
                {reposts.length === 0 ? (
                  <p className="text-white/50 text-center py-10 bg-[#0a0a0a] rounded-xl border border-[#222]">Cet artiste n'a pas encore repartagé de contenu.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {reposts.map(item => {
                      const original = item.posts || item.uploads;
                      if (!original) return null;
                      const author = original.profiles;
                      const isPost = !!item.posts;
                      const mediaUrl = isPost ? getFileUrl('posts', original.content_url) : getFileUrl('covers', original.cover_art);

                      return (
                        <Link key={item.id} to={isPost ? `/posts/${original.id}` : `/uploads/${original.id}`} className="block group">
                          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222] hover:border-[#D4AF37] transition-all relative aspect-square">
                            <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur-sm flex items-center gap-1.5 border border-[#D4AF37]/30">
                               <Repeat2 className="w-3 h-3" /> Repartagé de {author?.username || 'Artiste'}
                            </div>

                            {isPost && original.media_type === 'video' ? (
                              <video src={mediaUrl} className="w-full h-full object-cover" />
                            ) : (
                              <img src={mediaUrl} alt={original.title || original.caption} className="w-full h-full object-cover" />
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                              <p className="text-white text-xs line-clamp-2">{original.caption || original.title}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-white/70 font-bold uppercase">
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PublicArtistProfilePage;