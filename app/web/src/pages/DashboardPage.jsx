import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Edit2, Upload as UploadIcon, Award, Play, Download, Trash2, Eye,
  Image as ImageIcon, Globe, Youtube, Facebook, Instagram, Twitter,
  Video, MessageCircle, Ghost, Music, BarChart3, TrendingUp, Users,
  Plus, MessageSquare, ChevronRight, Settings, Info, Share2, Star,
  LayoutDashboard, ListMusic, PieChart, MessageSquareQuote, ShieldAlert,
  Wallet, Landmark, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, AreaChart, Area, XAxis, CartesianGrid } from 'recharts';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';
import BannerEditModal from '@/components/BannerEditModal.jsx';
import { formatRichText } from '@/lib/textFormatter.jsx';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, content, analytics, comments, revenues

  const [uploads, setUploads] = useState([]);
  const [latestUpload, setLatestUpload] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    views: 0,
    premiumViews: 0,
    followers: 0,
    likes: 0,
    downloads: 0,
    totalPlatformPremiumUsers: 0,
    totalPlatformPremiumStreams: 0
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutPhone, setCashoutPhone] = useState('');
  const [cashoutName, setCashoutName] = useState('');
  const [isCashoutSubmitting, setIsCashoutSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(currentUser);
  const [expandedComments, setExpandedComments] = useState({});

  const toggleCommentExpand = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const isPremium = userProfile?.is_premium || userProfile?.isPremium || false;

  useEffect(() => {
    if (currentUser) {
      setUserProfile(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.id) return;

      setLoading(true);
      try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        // First fetch projects and posts IDs to filter logs
        const { data: myProjects } = await supabase.from('uploads').select('id').eq('user_id', currentUser.id);
        const { data: myPosts } = await supabase.from('posts').select('id').eq('user_id', currentUser.id);

        const projectIds = (myProjects || []).map(p => p.id);
        const postIds = (myPosts || []).map(p => p.id);

        const [uploadsResult, followersResult, commentsResult, premiumUsersResult, totalStreamsResult, payoutsResult, recentLikesResult, recentFollowersResult, recentViewsResult] = await Promise.all([
          supabase
            .from('uploads')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', currentUser.id),
          supabase
            .from('comments')
            .select('*, profiles:user_id(*), uploads(*)')
            .eq('uploads.user_id', currentUser.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('subscription_type', 'auditor'),
          supabase
            .from('uploads')
            .select('premium_view_count'),
          supabase
            .from('payout_requests')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('likes')
            .select('created_at, uploads!inner(user_id)')
            .eq('uploads.user_id', currentUser.id)
            .gte('created_at', last7Days.toISOString()),
          supabase
            .from('followers')
            .select('created_at')
            .eq('following_id', currentUser.id)
            .gte('created_at', last7Days.toISOString()),
          supabase
            .from('views_log')
            .select('created_at, content_id')
            .gte('created_at', last7Days.toISOString())
            .or(`content_id.in.(${[...projectIds, ...postIds].join(',')})`)
        ]);

        if (uploadsResult.error) throw uploadsResult.error;
        
        const uploadsData = uploadsResult.data || [];
        setUploads(uploadsData);
        setLatestUpload(uploadsData[0] || null);

        const validComments = (commentsResult.data || []).filter(c => c.uploads);
        setAllComments(validComments);
        setRecentComments(validComments.slice(0, 5));
        setPayoutHistory(payoutsResult.data || []);

        const totalViews = uploadsData.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
        const totalPremiumViews = uploadsData.reduce((acc, curr) => acc + (curr.premium_view_count || 0), 0);
        const totalLikes = uploadsData.reduce((acc, curr) => acc + (curr.likes_count || 0), 0);
        const totalDownloads = uploadsData.reduce((acc, curr) => acc + (curr.download_count || 0), 0);

        // Generate Real Performance Data (Last 7 Days)
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = days[date.getDay()];
          const dateStr = date.toISOString().split('T')[0];

          const dayLikes = (recentLikesResult.data || []).filter(l => l.created_at.startsWith(dateStr)).length;
          const dayFollows = (recentFollowersResult.data || []).filter(f => f.created_at.startsWith(dateStr)).length;
          const dayViews = (recentViewsResult.data || []).filter(v => v.created_at.startsWith(dateStr)).length;

          chartData.push({
            name: dayName,
            v: (dayLikes * 10) + (dayFollows * 5) + dayViews,
            likes: dayLikes,
            follows: dayFollows,
            views: dayViews
          });
        }
        setPerformanceData(chartData);

        // Calculate global platform stats for revenue
        const platformPremiumStreams = (totalStreamsResult.data || []).reduce((acc, curr) => acc + (curr.premium_view_count || 0), 0);
        const premiumUsersCount = (premiumUsersResult.count || 0);

        setStats({
          total: uploadsResult.count || 0,
          views: totalViews,
          premiumViews: totalPremiumViews,
          followers: followersResult.count || 0,
          likes: totalLikes,
          downloads: totalDownloads,
          totalPlatformPremiumUsers: premiumUsersCount,
          totalPlatformPremiumStreams: platformPremiumStreams || 1 // Avoid division by zero
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser?.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce projet ?')) return;
    try {
      const { error } = await supabase.from('uploads').delete().eq('id', id);
      if (error) throw error;
      setUploads(prev => prev.filter(item => item.id !== id));
      toast.success('Projet supprimé.');
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const handleReply = (comment) => {
    toast.info(`Réponse à @${comment.profiles?.username} bientôt disponible.`);
  };

  const handleCashout = async () => {
    const estimatedGains = Math.round((stats.premiumViews / stats.totalPlatformPremiumStreams) * (0.6 * stats.totalPlatformPremiumUsers * 5000));

    if (estimatedGains < 5000) {
      toast.error("Le montant minimum de retrait est de 5000 FCFA.");
      return;
    }

    if (!cashoutPhone.match(/^[0-9]{8,15}$/)) {
      toast.error("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    if (!cashoutName.trim()) {
      toast.error("Veuillez entrer le nom enregistré sur le compte Orange Money.");
      return;
    }

    setIsCashoutSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .insert([{
          user_id: currentUser.id,
          amount: estimatedGains,
          phone_number: cashoutPhone,
          account_name: cashoutName.trim(),
          method: 'Orange Money',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Demande de retrait envoyée !");
      setPayoutHistory([data, ...payoutHistory]);
      setShowCashoutModal(false);
      setCashoutPhone('');
      setCashoutName('');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi de la demande.");
    } finally {
      setIsCashoutSubmitting(false);
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }) => {
    const isLocked = !isPremium && (id === 'analytics' || id === 'revenues');

    return (
      <button
        onClick={() => {
          if (isLocked) {
            toast.error("Cette fonctionnalité nécessite un compte Premium.");
            navigate('/premium');
            return;
          }
          setActiveTab(id);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
          activeTab === id
            ? 'bg-[#D4AF37] text-black shadow-lg gold-glow'
            : 'text-white/40 hover:text-white hover:bg-white/5'
        } ${isLocked ? 'opacity-50 grayscale' : ''}`}
      >
        <Icon className="w-5 h-5" />
        <span className="hidden lg:block">{label}</span>
        {isLocked && <ShieldAlert className="w-3 h-3 ml-auto text-[#D4AF37]" />}
      </button>
    );
  };

  return (
    <>
      <Helmet><title>Studio - KLTUR RAP</title></Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505] text-white">
        <Header />

        <div className="flex flex-grow h-[calc(100vh-80px)] overflow-hidden">
          {/* LEFT SIDEBAR (Studio Style) */}
          <aside className="w-20 lg:w-64 bg-[#0a0a0a] border-r border-[#222] p-4 flex flex-col gap-2 shrink-0">
            <div className="mb-8 px-2 hidden lg:block">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Menu Studio</p>
            </div>

            <SidebarItem id="overview" icon={LayoutDashboard} label="Tableau de bord" />
            <SidebarItem id="content" icon={ListMusic} label="Contenu" />

            <div className="relative group">
              <SidebarItem id="analytics" icon={PieChart} label="Données analytiques" />
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
                  <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                </div>
              )}
            </div>

            <SidebarItem id="comments" icon={MessageSquareQuote} label="Commentaires" />

            <div className="relative group">
              <SidebarItem id="revenues" icon={Wallet} label="Revenus" />
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
                  <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-[#222] space-y-2">
              <button
                onClick={() => navigate('/modifier-profil')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-[#D4AF37] transition-all font-bold text-sm"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden lg:block">Paramètres</span>
              </button>
              <button
                onClick={() => navigate(`/profil/${currentUser?.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-[#D4AF37] transition-all font-bold text-sm"
              >
                <Globe className="w-5 h-5" />
                <span className="hidden lg:block">Voir ma page</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-grow overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-transparent to-transparent">

            {loading ? (
              <div className="max-w-6xl mx-auto space-y-10">
                <Skeleton className="h-12 w-64 bg-[#111]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <Skeleton className="h-80 bg-[#111] rounded-2xl" />
                   <Skeleton className="h-80 bg-[#111] rounded-2xl" />
                   <Skeleton className="h-80 bg-[#111] rounded-2xl" />
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-6xl mx-auto space-y-10"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Aperçu de la chaîne</h2>
                      <div className="flex gap-4">
                        <Button variant="outline" className="border-[#333] font-bold" onClick={() => setShowBannerModal(true)}>Customiser</Button>
                        <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black uppercase shadow-lg">
                          <Link to="/upload"><Plus className="w-4 h-4 mr-2" /> Créer</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                      {/* Latest Upload Card */}
                      <Card className="bg-[#0a0a0a] border-[#222] text-white shadow-2xl overflow-hidden group">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-sm font-black uppercase text-white/40 tracking-widest">Dernière publication</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {latestUpload ? (
                            <div className="space-y-6">
                              <div className="aspect-video relative rounded-xl overflow-hidden border border-[#222]">
                                <img src={getPublicImageUrl('covers', latestUpload.cover_art)} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                  <p className="font-bold text-sm truncate">{latestUpload.title}</p>
                                  <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Publié le {new Date(latestUpload.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>

                              <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/60">
                                <div className="flex items-center justify-between">
                                  <span>Classement par vues</span>
                                  <span className="text-white">1 / {uploads.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Vues</span>
                                  <span className="text-white">{latestUpload.view_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Taux de clic</span>
                                  <span className="text-white">8.4%</span>
                                </div>
                              </div>

                              <Button asChild variant="secondary" className="w-full bg-[#111] hover:bg-[#1a1a1a] text-[#D4AF37] border border-[#222] font-black uppercase text-[10px] h-12 tracking-widest">
                                <Link to={`/analytics/${latestUpload.id}`}>Accéder aux stats du son</Link>
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-10 opacity-20">Aucun contenu</div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Channel Analytics Card */}
                      <Card className="bg-[#0a0a0a] border-[#222] text-white shadow-2xl overflow-hidden">
                        <CardHeader>
                          <CardTitle className="text-sm font-black uppercase text-white/40 tracking-widest">Statistiques globales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          <div className="pb-6 border-b border-[#222]">
                            <p className="text-white/40 text-xs font-bold uppercase mb-1">Abonnés actuels</p>
                            <h2 className="text-5xl font-black tracking-tighter">{stats.followers}</h2>
                            <p className="text-green-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase">
                              <TrendingUp className="w-3 h-3" /> +12% ce mois-ci
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/40 uppercase">Vues (28 jrs)</p>
                                <p className="text-2xl font-black">{stats.views}</p>
                              </div>
                              <div className="w-20 h-10">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={performanceData}>
                                    <Area type="monotone" dataKey="v" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.1} strokeWidth={2} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/40 uppercase">Downloads (28 jrs)</p>
                                <p className="text-2xl font-black">{stats.downloads}</p>
                              </div>
                              <div className="w-20 h-10">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={performanceData}>
                                    <Area type="monotone" dataKey="d" stroke="#fff" fill="#fff" fillOpacity={0.1} strokeWidth={2} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          <Button onClick={() => setActiveTab('analytics')} variant="ghost" className="w-full text-white/40 hover:text-white font-black uppercase text-[10px] h-10 tracking-widest">
                            Consulter l'analyse de la chaîne
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Actions Card */}
                      <Card className="bg-[#0a0a0a] border-[#222] text-white shadow-2xl">
                        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Actions Rapides</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                          <Link to="/upload" className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111] hover:bg-[#1a1a1a] border border-[#222] group transition-all">
                            <UploadIcon className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Uploader</span>
                          </Link>
                          <Link to="/creer-post" className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111] hover:bg-[#1a1a1a] border border-[#222] group transition-all">
                            <ImageIcon className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Nouveau Post</span>
                          </Link>
                          <Link to="/modifier-profil" className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111] hover:bg-[#1a1a1a] border border-[#222] group transition-all">
                            <Edit2 className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Editer Profil</span>
                          </Link>
                          <Link to="/messages" className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111] hover:bg-[#1a1a1a] border border-[#222] group transition-all">
                            <MessageSquare className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Messages</span>
                          </Link>
                        </CardContent>
                      </Card>

                    </div>

                    {/* Recent Comments Card */}
                    <Card className="bg-[#0a0a0a] border-[#222] text-white shadow-2xl">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Commentaires récents</CardTitle>
                        <button onClick={() => setActiveTab('comments')} className="text-[9px] font-black uppercase text-[#D4AF37] hover:underline">Tout voir</button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {recentComments.length === 0 ? (
                            <div className="col-span-2 text-center py-10 opacity-20 italic">Aucun nouveau commentaire</div>
                          ) : (
                            recentComments.map(c => (
                              <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-[#111] border border-[#222] group hover:border-[#D4AF37]/30 transition-all">
                                <Avatar className="h-10 w-10 shrink-0 border border-[#333]">
                                  <AvatarImage src={getPublicImageUrl('avatars', c.profiles?.avatar)} />
                                  <AvatarFallback className="bg-black text-[#D4AF37] font-black">{c.profiles?.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-grow">
                                  <div className="flex justify-between items-start">
                                    <p className="text-[10px] font-black text-white/40 uppercase mb-1">
                                      @{c.profiles?.username} <span className="mx-2">•</span> {c.uploads?.title}
                                    </p>
                                    <span className="text-[8px] text-white/20">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="relative">
                                    <p className={`text-xs text-white/80 italic whitespace-pre-wrap transition-all duration-200 ${!expandedComments[c.id] ? 'line-clamp-2' : ''}`}>
                                      "{formatRichText(c.text)}"
                                    </p>
                                    {c.text.length > 100 && (
                                      <button
                                        onClick={() => toggleCommentExpand(c.id)}
                                        className="mt-1 text-[#D4AF37] font-bold text-[8px] uppercase tracking-widest hover:underline"
                                      >
                                        {expandedComments[c.id] ? 'Voir moins' : 'Lire la suite'}
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex gap-4 mt-3">
                                     <button onClick={() => handleReply(c)} className="text-[9px] font-black uppercase text-[#D4AF37] hover:underline">Répondre</button>
                                     <button className="text-[9px] font-black uppercase text-white/20 hover:text-white">Marquer comme lu</button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'content' && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-6xl mx-auto space-y-6"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Contenu de la chaîne</h2>
                      <div className="flex gap-3">
                         <Input placeholder="Filtrer les vidéos..." className="bg-[#111] border-[#222] h-10 w-64" />
                         <Button asChild className="bg-[#D4AF37] text-black font-bold h-10 uppercase text-xs">
                           <Link to="/upload">Uploader</Link>
                         </Button>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#111] text-[10px] font-black uppercase text-white/40 border-b border-[#222]">
                            <tr>
                              <th className="px-6 py-4">Projet</th>
                              <th className="px-6 py-4">Visibilité</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4 text-center">Vues</th>
                              <th className="px-6 py-4 text-center">Downloads</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222]">
                            {uploads.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="text-center py-20 opacity-20 italic">Aucun contenu trouvé</td>
                              </tr>
                            ) : uploads.map(u => (
                              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <img src={getPublicImageUrl('covers', u.cover_art)} className="h-10 w-16 object-cover rounded border border-[#333]" alt="" />
                                    <div className="min-w-0">
                                      <span className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate block max-w-[200px]">{u.title}</span>
                                      <span className="text-[10px] text-white/30 uppercase font-black">{u.genre}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                                    <Globe className="w-3 h-3" /> Publique
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm font-black text-center">{u.view_count || 0}</td>
                                <td className="px-6 py-4 text-sm font-black text-center">{u.download_count || 0}</td>
                                <td className="px-6 py-4 text-right">
                                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 hover:text-[#D4AF37]"><Link to={`/analytics/${u.id}`}><BarChart3 className="w-4 h-4"/></Link></Button>
                                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 hover:text-white">
                                        <Link to={`/uploads/${u.id}/modifier`}><Edit2 className="w-4 h-4"/></Link>
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={() => handleDelete(u.id)} className="h-8 w-8 hover:text-red-500"><Trash2 className="w-4 h-4"/></Button>
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                   <motion.div
                     key="analytics"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="max-w-6xl mx-auto space-y-10"
                   >
                     <h2 className="text-3xl font-black uppercase tracking-tighter">Analyse de la chaîne</h2>

                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-[#0a0a0a] border-[#222] text-white">
                           <CardContent className="pt-6">
                              <p className="text-[10px] font-black uppercase text-white/40 mb-2">Vues totales</p>
                              <p className="text-3xl font-black">{stats.views}</p>
                           </CardContent>
                        </Card>
                        <Card className="bg-[#0a0a0a] border-[#222] text-white">
                           <CardContent className="pt-6">
                              <p className="text-[10px] font-black uppercase text-white/40 mb-2">Téléchargements</p>
                              <p className="text-3xl font-black">{stats.downloads}</p>
                           </CardContent>
                        </Card>
                        <Card className="bg-[#0a0a0a] border-[#222] text-white">
                           <CardContent className="pt-6">
                              <p className="text-[10px] font-black uppercase text-white/40 mb-2">Likes</p>
                              <p className="text-3xl font-black">{stats.likes}</p>
                           </CardContent>
                        </Card>
                        <Card className="bg-[#0a0a0a] border-[#222] text-white">
                           <CardContent className="pt-6">
                              <p className="text-[10px] font-black uppercase text-white/40 mb-2">Abonnés</p>
                              <p className="text-3xl font-black">{stats.followers}</p>
                           </CardContent>
                        </Card>
                     </div>

                     <Card className="bg-[#0a0a0a] border-[#222] text-white overflow-hidden shadow-2xl">
                        <CardHeader>
                           <CardTitle className="text-lg uppercase font-black">Performance sur les 7 derniers jours</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={performanceData}>
                                 <defs>
                                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                 <XAxis dataKey="name" stroke="#444" fontSize={10} fontWeight="bold" />
                                 <YAxis stroke="#444" fontSize={10} fontWeight="bold" />
                                 <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                                 <Area type="monotone" dataKey="likes" name="Nouveaux Likes" stroke="#D4AF37" fillOpacity={1} fill="url(#colorV)" strokeWidth={3} />
                                 <Area type="monotone" dataKey="views" name="Vues" stroke="#fff" fillOpacity={0.1} fill="#fff" strokeWidth={2} />
                                 <Area type="monotone" dataKey="follows" name="Nouveaux Abonnés" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </CardContent>
                     </Card>
                   </motion.div>
                )}

                {activeTab === 'comments' && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-4xl mx-auto space-y-6"
                  >
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Commentaires de la chaîne</h2>

                    <div className="space-y-4">
                       {allComments.length === 0 ? (
                         <div className="text-center py-20 opacity-20 italic">Aucun commentaire trouvé sur votre contenu.</div>
                       ) : allComments.map(c => (
                         <Card key={c.id} className="bg-[#0a0a0a] border-[#222] text-white hover:border-[#D4AF37]/50 transition-all overflow-hidden group">
                           <CardContent className="p-6">
                              <div className="flex gap-4">
                                 <Avatar className="h-12 w-12 border border-[#222]">
                                    <AvatarImage src={getPublicImageUrl('avatars', c.profiles?.avatar)} />
                                    <AvatarFallback className="bg-black text-[#D4AF37] font-black">{c.profiles?.username?.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center mb-2">
                                       <div>
                                          <span className="font-black text-white mr-2">@{c.profiles?.username}</span>
                                          <span className="text-[10px] text-white/30 uppercase font-black">{new Date(c.created_at).toLocaleDateString()}</span>
                                       </div>
                                       <span className="text-[8px] font-black uppercase text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">Sur "{c.uploads?.title}"</span>
                                    </div>
                                    <div className="relative mb-4">
                                      <p className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap transition-all duration-200 ${!expandedComments[c.id] ? 'line-clamp-3' : ''}`}>
                                        {formatRichText(c.text)}
                                      </p>
                                      {c.text.length > 150 && (
                                        <button
                                          onClick={() => toggleCommentExpand(c.id)}
                                          className="mt-1 text-[#D4AF37] font-bold text-[9px] uppercase tracking-widest hover:underline"
                                        >
                                          {expandedComments[c.id] ? 'Voir moins' : 'Voir plus'}
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-6">
                                       <button onClick={() => handleReply(c)} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-[#D4AF37] transition-colors">
                                          <MessageSquare className="w-3 h-3" /> Répondre
                                       </button>
                                       <button className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-red-500 transition-colors">
                                          <Trash2 className="w-3 h-3" /> Supprimer
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </CardContent>
                         </Card>
                       ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'revenues' && (
                  <motion.div
                    key="revenues"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-6xl mx-auto space-y-10"
                  >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Mes Revenus</h2>
                        <p className="text-white/40 text-sm font-medium mt-1">Estimation des gains basés sur vos écoutes Premium</p>
                      </div>
                      <div className="bg-[#111] border border-[#222] px-6 py-4 rounded-2xl flex items-center gap-4">
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Valeur d'une écoute</p>
                        <p className="text-xl font-black text-[#D4AF37]">
                          {Math.round((stats.totalPlatformPremiumUsers * 1500) / stats.totalPlatformPremiumStreams)} <span className="text-xs uppercase">CFA</span>
                        </p>
                      </div>
                    </div>

                    {/* GAINS CARD */}
                    <Card className="bg-[#0a0a0a] border-[#D4AF37]/30 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
                      <CardContent className="p-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                               <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] mb-4">Total de vos revenus estimés</p>
                               <div className="flex items-baseline gap-4 mb-2">
                                  <h2 className="text-6xl font-black tracking-tighter text-[#D4AF37]">
                                    {Math.round((stats.premiumViews / stats.totalPlatformPremiumStreams) * (stats.totalPlatformPremiumUsers * 1500)).toLocaleString()}
                                  </h2>
                                  <span className="text-2xl font-black uppercase tracking-widest text-white/20">FCFA</span>
                               </div>
                               <p className="text-white/60 text-sm font-medium flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-500" /> +8% par rapport au mois dernier
                                </p>
                                <div className="mt-8">
                                  <Button
                                    onClick={() => setShowCashoutModal(true)}
                                    className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black uppercase px-10 h-14 rounded-2xl gold-glow"
                                  >
                                    <Wallet className="w-5 h-5 mr-2" /> Demander un retrait
                                  </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                               <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                  <p className="text-[10px] font-black uppercase text-white/30 mb-2">Écoutes Premium</p>
                                  <p className="text-2xl font-black">{stats.premiumViews}</p>
                               </div>
                               <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                  <p className="text-[10px] font-black uppercase text-white/30 mb-2">Part Artiste (50%)</p>
                                  <p className="text-2xl font-black text-[#D4AF37]">Active</p>
                               </div>
                            </div>
                         </div>
                      </CardContent>
                    </Card>

                    {/* DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <Card className="bg-[#0a0a0a] border-[#222] text-white">
                          <CardHeader>
                             <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#D4AF37]" /> Pool Premium
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-2xl font-black">{stats.totalPlatformPremiumUsers}</p>
                             <p className="text-xs text-white/40 mt-1 uppercase font-bold">Auditeurs Premium</p>
                             <p className="mt-4 text-[10px] text-white/20 font-medium italic">Base de calcul : {stats.totalPlatformPremiumUsers.toLocaleString()} x 1500 CFA</p>
                          </CardContent>
                       </Card>

                       <Card className="bg-[#0a0a0a] border-[#222] text-white">
                          <CardHeader>
                             <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-[#D4AF37]" /> Fond de distribution
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-2xl font-black">{(stats.totalPlatformPremiumUsers * 1500).toLocaleString()}</p>
                             <p className="text-xs text-white/40 mt-1 uppercase font-bold text-green-500">50% reversé aux artistes</p>
                          </CardContent>
                       </Card>

                       <Card className="bg-[#0a0a0a] border-[#222] text-white">
                          <CardHeader>
                             <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#D4AF37]" /> Prochain Paiement
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-2xl font-black">28 Juin 2026</p>
                             <p className="text-xs text-white/40 mt-1 uppercase font-bold">Via Orange / Moov Money</p>
                          </CardContent>
                       </Card>
                    </div>

                    {/* INFO BOX */}
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-8 rounded-3xl flex gap-6 items-start">
                       <Info className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                       <div>
                          <h4 className="font-black text-white uppercase tracking-wider mb-2">Comment sont calculés vos revenus ?</h4>
                          <p className="text-white/60 text-sm leading-relaxed max-w-3xl">
                             Votre rémunération dépend du volume total d'abonnements <strong>Auditeur Premium</strong> sur la plateforme.
                             Nous prélevons <strong>50% (soit 1500 FCFA par abonné)</strong> que nous redistribuons équitablement entre tous les artistes.
                             Votre part est proportionnelle à vos écoutes par rapport au total des écoutes de la plateforme.
                             <br /><br />
                             Note : Les abonnements <strong>Artistes</strong> (Standard et Premium) servent au fonctionnement technique de l'application et à la mise en avant de vos projets.
                          </p>
                       </div>
                    </div>

                    {/* PAYOUT HISTORY */}
                    <div className="space-y-6">
                       <h3 className="text-xl font-black uppercase tracking-tighter">Historique des retraits</h3>
                       <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden">
                          <table className="w-full text-left">
                             <thead className="bg-[#111] text-[10px] font-black uppercase text-white/40 border-b border-[#222]">
                                <tr>
                                   <th className="px-6 py-4">Date</th>
                                   <th className="px-6 py-4">Montant</th>
                                   <th className="px-6 py-4">Méthode</th>
                                   <th className="px-6 py-4">Statut</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-[#222]">
                                {payoutHistory.length === 0 ? (
                                   <tr>
                                      <td colSpan="4" className="px-6 py-10 text-center text-white/20 italic text-sm">Aucun retrait effectué.</td>
                                   </tr>
                                ) : payoutHistory.map(p => (
                                   <tr key={p.id} className="text-sm">
                                      <td className="px-6 py-4 text-white/60">{new Date(p.created_at).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 font-bold text-[#D4AF37]">{p.amount.toLocaleString()} FCFA</td>
                                      <td className="px-6 py-4 text-white/60">
                                         {p.method} <br />
                                         <span className="text-[10px] text-white/40 uppercase font-black">{p.phone_number}</span> <br />
                                         <span className="text-[10px] text-[#D4AF37] font-bold italic">{p.account_name}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                            p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                            p.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                            'bg-red-500/10 text-red-500'
                                         }`}>
                                            {p.status === 'pending' ? 'En attente' : p.status === 'completed' ? 'Payé' : 'Annulé'}
                                         </span>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
      <BannerEditModal isOpen={showBannerModal} onClose={() => setShowBannerModal(false)} onUpdate={setUserProfile} />

      {/* Cashout Modal */}
      <Dialog open={showCashoutModal} onOpenChange={setShowCashoutModal}>
        <DialogContent className="bg-[#0a0a0a] border-[#222] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-[#D4AF37]">Retrait Orange Money</DialogTitle>
            <DialogDescription className="text-white/40">
              Veuillez saisir votre numéro de téléphone pour recevoir vos gains.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
             <div className="bg-[#111] p-4 rounded-xl border border-[#222] flex items-center justify-between">
                <span className="text-sm font-bold text-white/60 uppercase">Montant à retirer</span>
                <span className="text-xl font-black text-[#D4AF37]">
                  {Math.round((stats.premiumViews / stats.totalPlatformPremiumStreams) * (stats.totalPlatformPremiumUsers * 1500)).toLocaleString()} FCFA
                </span>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase text-white/40">Nom & Prénom (Compte Orange Money)</Label>
                   <Input
                      value={cashoutName}
                      onChange={(e) => setCashoutName(e.target.value)}
                      className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37]"
                      placeholder="Ex: Jean Dupont"
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase text-white/40">Numéro Orange Money</Label>
                   <div className="relative">
                      <Input
                         value={cashoutPhone}
                         onChange={(e) => setCashoutPhone(e.target.value)}
                         className="bg-[#111] border-[#222] h-12 focus:border-[#D4AF37] pl-10"
                         placeholder="00236..."
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg" className="w-5 h-5" alt="Orange" />
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-[10px] text-white/20 italic">Vérifiez bien vos informations avant de valider. Tout retrait envoyé sur un mauvais compte ne pourra être récupéré.</p>
          </div>

          <DialogFooter>
             <Button variant="ghost" onClick={() => setShowCashoutModal(false)} className="text-white/40">Annuler</Button>
             <Button
               onClick={handleCashout}
               disabled={isCashoutSubmitting}
               className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-black uppercase px-8"
             >
               {isCashoutSubmitting ? 'Traitement...' : 'Confirmer le retrait'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
