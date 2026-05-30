import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Edit2, Upload as UploadIcon, Award, Play, Download, Trash2, Eye, Image as ImageIcon, Globe, Youtube, Facebook, Instagram, Twitter, Video, MessageCircle, Ghost, Music } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';
import BannerEditModal from '@/components/BannerEditModal.jsx';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, views: 0, followers: 0 });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [userProfile, setUserProfile] = useState(currentUser);

  // On utilise directement les droits du currentUser fournis par l'AuthContext
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
        // Fetch Uploads and Followers in parallel
        const [uploadsResult, followersResult] = await Promise.all([
          supabase
            .from('uploads')
            .select('*', { count: 'exact' })
            .eq('user_id', currentUser.id),
          supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', currentUser.id)
        ]);

        if (uploadsResult.error) throw uploadsResult.error;
        
        const uploadsData = uploadsResult.data || [];
        setUploads(uploadsData);
        
        const totalViews = uploadsData.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
        setStats({
          total: uploadsResult.count || 0,
          views: totalViews,
          followers: followersResult.count || 0
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
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUploads(prev => prev.filter(item => item.id !== id));
      toast.success('Projet supprimé.');
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const getBannerStyle = () => {
    if (userProfile?.banner_style === 'gradient') return { background: 'linear-gradient(to right, #000000, #D4AF37)' };
    if (userProfile?.banner_style === 'solid') return { background: '#111111' };
    if (userProfile?.banner_image) {
      return { backgroundImage: `url(${getPublicImageUrl('covers', userProfile.banner_image)})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: '#111111' }; // default
  };

  return (
    <>
      <Helmet><title>Dashboard - KLTUR RAP</title></Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow pb-12 w-full">
          {/* Banner Section */}
          <div className="w-full h-[200px] md:h-[300px] relative group" style={getBannerStyle()}>
            <div className="absolute inset-0 bg-black/40" />
            {userProfile?.bannerText && (
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-lg">{userProfile.bannerText}</h2>
              </div>
            )}
            <Button 
              onClick={() => setShowBannerModal(true)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Modifier la bannière
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
            {/* Profile Header */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-8 mb-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar className="h-32 w-32 border-4 border-[#222] bg-[#111]">
                  <AvatarImage src={userProfile?.avatar ? getPublicImageUrl('avatars', userProfile.avatar) : getPublicImageUrl('avatars', userProfile?.profilePhoto)} />
                  <AvatarFallback className="text-[#D4AF37] text-4xl font-black">{userProfile?.username?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-grow text-center md:text-left mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">{userProfile?.username || userProfile?.name}</h1>
                    {isPremium && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-sm font-bold rounded-full uppercase tracking-wider w-fit mx-auto md:mx-0">
                        <Award className="w-4 h-4" /> Certifié
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 mb-6 font-medium">{userProfile?.email}</p>
                  
                  {/* Socials */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                    {userProfile?.website && (
                      <a href={userProfile.website} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all" title="Site Web">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {userProfile?.social_links && Object.entries(userProfile.social_links).map(([platform, url]) => {
                      if (!url) return null;

                      let Icon = Globe;
                      let color = "hover:text-[#D4AF37]";

                      switch(platform) {
                        case 'facebook': Icon = Facebook; color = "hover:text-[#1877F2]"; break;
                        case 'instagram': Icon = Instagram; color = "hover:text-[#E1306C]"; break;
                        case 'twitter': Icon = Twitter; color = "hover:text-[#1DA1F2]"; break;
                        case 'youtube': Icon = Youtube; color = "hover:text-[#FF0000]"; break;
                        case 'tiktok': Icon = Video; color = "hover:text-[#000000]"; break;
                        case 'snapchat': Icon = Ghost; color = "hover:text-[#FFFC00]"; break;
                        case 'whatsapp': Icon = MessageCircle; color = "hover:text-[#25D366]"; break;
                        case 'vimeo': Icon = Video; color = "hover:text-[#1AB7EA]"; break;
                        case 'spotify': Icon = Music; color = "hover:text-[#1DB954]"; break;
                        case 'apple_music': Icon = Music; color = "hover:text-[#FA243C]"; break;
                        case 'deezer': Icon = Music; color = "hover:text-[#FF0000]"; break;
                        case 'boom_music': Icon = Music; color = "hover:text-[#FFD700]"; break;
                        case 'amazon_music': Icon = Music; color = "hover:text-[#00A8E1]"; break;
                        case 'soundcloud': Icon = Music; color = "hover:text-[#FF3300]"; break;
                      }

                      return (
                        <a key={platform} href={url} target="_blank" rel="noreferrer" className={`w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-white/50 ${color} transition-all`} title={platform.replace('_', ' ')}>
                          <Icon className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <Button asChild variant="outline" className="border-[#333] text-white hover:bg-[#222] hover:text-white font-bold">
                      <Link to="/modifier-profil"><Edit2 className="w-4 h-4 mr-2" /> Éditer le profil</Link>
                    </Button>
                    {!isPremium && (
                      <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
                        <Link to="/premium">Devenir Premium</Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Stats Block */}
                <div className="grid grid-cols-3 gap-4 w-full md:w-auto bg-[#111] p-6 rounded-xl border border-[#333] mt-4 md:mt-0">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{stats.total}</p>
                    <p className="text-xs text-white/50 uppercase font-bold mt-1">Projets</p>
                  </div>
                  <div className="text-center border-l border-r border-[#333] px-4">
                    <p className="text-3xl font-black text-white">{stats.views}</p>
                    <p className="text-xs text-white/50 uppercase font-bold mt-1">Vues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{stats.followers}</p>
                    <p className="text-xs text-white/50 uppercase font-bold mt-1">Abonnés</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploads Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mes Projets</h2>
              <Button asChild className="bg-white text-black hover:bg-white/90 font-bold">
                <Link to="/upload"><UploadIcon className="w-4 h-4 mr-2"/> Nouveau Projet</Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl bg-[#111]" />)}
              </div>
            ) : uploads.length === 0 ? (
              <div className="bg-[#0a0a0a] rounded-xl border border-[#222] p-12 text-center">
                <UploadIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Aucun projet</h3>
                <p className="text-white/50 mb-6">Vous n'avez pas encore partagé de contenu.</p>
                <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
                  <Link to="/upload">Uploader mon premier projet</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.map(upload => (
                  <motion.div key={upload.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden group hover:border-[#D4AF37]/50 transition-colors flex flex-col">
                    <div className="aspect-video relative overflow-hidden bg-[#111]">
                      {upload.cover_art && <img src={getPublicImageUrl('covers', upload.cover_art)} alt={upload.title} className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm">{upload.type}</div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{upload.title}</h3>
                      <p className="text-sm text-white/50 mb-4">{upload.genre}</p>
                      <div className="flex items-center gap-4 text-sm text-white/60 font-medium mt-auto pb-4 mb-4 border-b border-[#222]">
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4"/> {upload.view_count || 0}</span>
                        <span className="flex items-center gap-1.5"><Download className="w-4 h-4"/> {upload.download_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button asChild variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 px-2 font-bold">
                          <Link to={`/analytics/${upload.id}`}>Analytiques</Link>
                        </Button>
                        <div className="flex gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 border-[#333] bg-transparent text-white/70 hover:text-white hover:bg-[#222]">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => handleDelete(upload.id)} className="h-8 w-8 border-[#333] bg-transparent text-red-400 hover:text-red-500 hover:bg-red-950/30">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
      <BannerEditModal isOpen={showBannerModal} onClose={() => setShowBannerModal(false)} onUpdate={setUserProfile} />
    </>
  );
};

export default DashboardPage;