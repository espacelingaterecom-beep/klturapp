import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, Calendar, Search, X } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

// Mock Data representing YouTube fetched data
const mockVideos = [
  {
    id: "1",
    videoId: "dQw4w9WgXcQ", // using random placeholders, would be real YT IDs
    title: "KLTUR RAP - Interview Exclusive avec Jospin",
    thumbnail: "https://images.unsplash.com/photo-1516280440502-37f8ce82245c?auto=format&fit=crop&q=80&w=800",
    viewCount: "12.4k",
    uploadDate: "Il y a 2 jours",
    duration: "14:20"
  },
  {
    id: "2",
    videoId: "y6120QOlsfU",
    title: "Session Freestyle #1 - Les pépites de Bangui",
    thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800",
    viewCount: "45k",
    uploadDate: "Il y a 1 semaine",
    duration: "08:15"
  },
  {
    id: "3",
    videoId: "L_jWHffIx5E",
    title: "DJ T-Bain Live Mix - Voix Urbaines 2026",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    viewCount: "8.2k",
    uploadDate: "Il y a 3 semaines",
    duration: "55:00"
  },
  {
    id: "4",
    videoId: "kJQP7kiw5Fk",
    title: "Dans les coulisses du concert de Makassy",
    thumbnail: "https://images.unsplash.com/photo-1493225457284-06d22b8ea323?auto=format&fit=crop&q=80&w=800",
    viewCount: "22.1k",
    uploadDate: "Il y a 1 mois",
    duration: "22:10"
  },
  {
    id: "5",
    videoId: "V-_O7nl0Ii0",
    title: "L'évolution du Hip-Hop Centrafricain (Documentaire)",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    viewCount: "115k",
    uploadDate: "Il y a 2 mois",
    duration: "45:30"
  },
  {
    id: "6",
    videoId: "3JZ_D3ELwOQ",
    title: "KLTUR RAP News: Les sorties de la semaine",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800",
    viewCount: "5.4k",
    uploadDate: "Il y a 2 mois",
    duration: "10:05"
  }
];

const VideosPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const filteredVideos = mockVideos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Vidéos - KLTUR RAP</title>
        <meta name="description" content="Visionnez les interviews, freestyles et documentaires de la chaîne officielle KLTUR RAP." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />

        <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">
                  KLTUR <span className="text-[#D4AF37] gold-glow-text">TV</span>
                </h1>
                <p className="text-white/70">
                  Interviews, freestyles et contenus exclusifs de notre chaîne YouTube
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  type="text"
                  placeholder="Rechercher une vidéo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#111111] border-[#333] text-white focus:border-[#D4AF37] rounded-xl"
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-[#222] hover-gold-glow">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-300" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center text-black pl-1 gold-glow">
                          <Play className="w-6 h-6" fill="currentColor" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-white/50 mt-auto">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {video.viewCount} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {video.uploadDate}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-20 text-white/50">
                <p className="text-xl">Aucune vidéo ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-[#050505] border-[#333] shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">Player Vidéo</DialogTitle>
          <div className="relative w-full aspect-video bg-black">
            {selectedVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
            <DialogClose className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-[#D4AF37] hover:text-black text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
          {selectedVideo && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">{selectedVideo.title}</h2>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span>{selectedVideo.viewCount} vues</span>
                <span>•</span>
                <span>{selectedVideo.uploadDate}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideosPage;