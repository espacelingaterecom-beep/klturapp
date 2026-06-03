import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Award, ChevronDown, Search, Music, Users, Newspaper, Calendar, MessageSquare, Shield, WifiOff } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, getPublicImageUrl } from '@/lib/supabaseClient.js';
import { useDebounce } from '@/hooks/use-debounce.js';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Sécurisation des rôles
  const isAdmin = currentUser?.is_admin === true || currentUser?.isAdmin === true;
  const isUserPremium = currentUser?.is_premium === true || currentUser?.isPremium === true;

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ artists: [], uploads: [], events: [], news: [] });
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const publicNavItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Artistes', path: '/artistes' },
    { name: 'Galerie', path: '/galerie' },
    { name: 'Équipe', path: '/equipe' },
    ...(!isUserPremium ? [{ name: 'Premium', path: '/premium' }] : [])
  ];

  const artistNavItems = isAuthenticated ? [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Publier', path: '/creer-post' },
    { name: 'Télécharger', path: '/upload' },
    { name: 'Messages', path: '/messages' }
  ] : [];

  const navItems = [...publicNavItems, ...artistNavItems];
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults({ artists: [], uploads: [], events: [], news: [] });
        return;
      }
      setIsSearching(true);
      try {
        const [artistsRes, uploadsRes, eventsRes, newsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .or(`name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%,user_role.ilike.%${debouncedSearch}%`)
            .order('is_premium', { ascending: false })
            .limit(4),
          supabase
            .from('uploads')
            .select('*, profiles:user_id(*)')
            .or(`title.ilike.%${debouncedSearch}%,genre.ilike.%${debouncedSearch}%`)
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('events')
            .select('*')
            .or(`title.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`)
            .limit(4),
          supabase
            .from('news')
            .select('*')
            .or(`title.ilike.%${debouncedSearch}%`)
            .limit(4)
        ]);

        setSearchResults({
          artists: artistsRes.data || [],
          uploads: (uploadsRes.data || []).map(u => ({ ...u, expand: { userId: u.profiles } })),
          events: eventsRes.data || [],
          news: newsRes.data || []
        });
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSearch = () => {
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src="https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png"
              alt="Logo"
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-black text-[#D4AF37] tracking-tight hidden sm:block uppercase">
              KLTUR RAP
            </span>
          </Link>

          {/* Global Search Bar */}
          <div className="relative flex-grow max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Rechercher artistes, musiques..."
                className="w-full pl-10 bg-[#111] border-[#333] text-white focus:border-[#D4AF37] h-10 rounded-full"
              />
            </div>

            {showResults && debouncedSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-white/50 text-sm">Recherche en cours...</div>
                ) : (
                  <>
                    {searchResults.artists.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Users className="w-3 h-3"/> Artistes</h4>
                        {searchResults.artists.map(artist => (
                          <Link key={artist.id} to={`/profil/${artist.id}`} onClick={closeSearch} className="flex items-center gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors group">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#222] text-[#D4AF37] text-xs font-bold">{artist.username?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-white group-hover:text-[#D4AF37]">{artist.username || artist.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.uploads.length > 0 && (
                      <div className="p-2 border-t border-[#222]">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-2 flex items-center gap-2"><Music className="w-3 h-3"/> Musiques</h4>
                        {searchResults.uploads.map(upload => (
                          <Link key={upload.id} to={`/uploads/${upload.id}`} onClick={closeSearch} className="flex items-center gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors group">
                             <img src={getPublicImageUrl('covers', upload.cover_art)} className="w-8 h-8 rounded object-cover" alt="" />
                             <span className="text-sm text-white group-hover:text-[#D4AF37] truncate">{upload.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.artists.length === 0 && searchResults.uploads.length === 0 && (
                      <div className="p-6 text-center text-white/50 text-sm">Aucun résultat trouvé</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold uppercase transition-all duration-300 flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'text-[#D4AF37] gold-glow-text'
                    : 'text-white hover:text-[#D4AF37]'
                }`}
              >
                {item.name}
                {item.name === 'Messages' && unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <Link to="/connexion" className="text-xs font-bold bg-[#D4AF37] text-black px-5 py-2 rounded-lg hover:bg-[#b5952f] transition-all uppercase">
                Connexion
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none group">
                  <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-[#D4AF37] transition-colors">
                    <AvatarFallback className="bg-[#222] text-[#D4AF37] font-bold">
                      {currentUser?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#111] border-[#333] text-white rounded-xl">
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#222] focus:text-[#D4AF37]">
                      <Link to="/admin" className="flex items-center gap-2 font-bold text-[#D4AF37]">
                        <Shield className="h-4 w-4" /> Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#222] focus:text-white">
                    <Link to={currentUser?.id ? `/profil/${currentUser.id}` : '#'} className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4" /> Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#222] focus:text-white">
                    <Link to="/modifier-profil" className="flex items-center gap-2 font-medium">
                      <Settings className="h-4 w-4" /> Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#222] focus:text-white">
                    <Link to="/ma-musique" className="flex items-center gap-2 font-medium">
                      <WifiOff className="h-4 w-4" /> Mode Hors ligne
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-900/20 focus:text-red-400 text-red-400 font-bold">
                    <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button className="text-white p-2"><Menu className="h-7 w-7" /></button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0a0a0a] border-l border-[#222] text-white">
              <SheetTitle className="text-[#D4AF37] font-black uppercase text-left mb-8 border-b border-[#222] pb-4">Menu</SheetTitle>
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Navigation</p>
                  <div className="flex flex-col gap-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-bold uppercase flex items-center justify-between"
                      >
                        {item.name}
                        {item.name === 'Messages' && unreadCount > 0 && (
                          <span className="bg-red-600 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    ))}
                    {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} className="text-[#D4AF37] font-bold uppercase flex items-center gap-2"><Shield className="w-5 h-5"/> Administration</Link>}
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="pt-6 border-t border-[#222] space-y-4">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Mon Compte</p>
                    <div className="flex flex-col gap-4">
                      <Link to={`/profil/${currentUser?.id}`} onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase flex items-center gap-3">
                        <User className="w-5 h-5 text-[#D4AF37]" /> Mon Profil
                      </Link>
                      <Link to="/modifier-profil" onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase flex items-center gap-3">
                        <Settings className="w-5 h-5 text-[#D4AF37]" /> Paramètres
                      </Link>
                      <Link to="/ma-musique" onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase flex items-center gap-3">
                        <WifiOff className="w-5 h-5 text-[#D4AF37]" /> Hors ligne
                      </Link>
                      <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-lg font-bold uppercase flex items-center gap-3 text-red-500 text-left">
                        <LogOut className="w-5 h-5" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
