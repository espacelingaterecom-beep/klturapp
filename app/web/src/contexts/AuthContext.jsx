import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, subscribeNotifications, fetchUnreadCount } from '@/lib/supabaseClient.js';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refreshUnreadCount = async (userId) => {
    const count = await fetchUnreadCount(userId);
    setUnreadCount(count);
  };

  const updateUser = async (session) => {
    try {
      if (session?.user) {
        const baseUser = {
          id: session.user.id,
          email: session.user.email,
          ...(session.user.user_metadata || {}),
        };

        setCurrentUser(baseUser);
        setIsAuthenticated(true);
        refreshUnreadCount(session.user.id);

        // On récupère les détails du profil en arrière-plan (non-bloquant)
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              setCurrentUser(prev => ({
                ...prev,
                ...profile,
                // On normalise les noms de variables pour le reste de l'app
                isPremium: profile.is_premium === true,
                isAdmin: profile.is_admin === true
              }));
            }
          });
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Auth update error:", e);
    } finally {
      // On débloque l'affichage quoi qu'il arrive
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sécurité : si Supabase est bloqué, on force l'affichage après 10s
    const timer = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const initAuth = async () => {
      const startTime = Date.now();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await updateUser(session);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        const elapsed = Date.now() - startTime;
        const minDuration = 5000; // Minimum 5 secondes d'intro
        const remaining = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
          setLoading(false);
          clearTimeout(timer);
        }, remaining);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUser(session);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Notifications en temps réel pour les messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsub = subscribeNotifications(currentUser.id, ({ message, type }) => {
      const isChatPage = window.location.pathname === '/messages';

      if (type === 'received' && message.is_read === false) {
        // OPTIMISATION : On n'incrémente que si on n'est PAS sur la page de chat.
        // La page de chat gère elle-même le marquage "lu" et le refresh précis.
        if (!isChatPage) {
          setUnreadCount((c) => c + 1);

          // Notification visuelle
          toast("Nouveau message", {
            description: message.content,
            action: {
              label: "Voir",
              onClick: () => window.location.href = '/messages'
            },
          });
        }
      } else if (type === 'sent') {
        if (!isChatPage) {
          toast.success("Message envoyé", {
            description: "Votre message a bien été transmis.",
            duration: 2000,
          });
        }
      }

      // Ajouter à l'historique des notifications
      setNotifications((prev) => [
        {
          id: message.id,
          type,
          content: message.content,
          created_at: message.created_at,
          conversation_id: message.conversation_id
        },
        ...prev,
      ]);
    });

    return () => unsub();
  }, [currentUser?.id]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Flux natif (Android/iOS)
        const user = await GoogleAuth.signIn();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: user.authentication.idToken,
        });
        if (error) throw error;
        return data;
      } else {
        // Flux Web classique
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  };

  const signup = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          name: userData.name,
          user_role: userData.user_role || 'Artiste'
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      login,
      loginWithGoogle,
      signup,
      logout,
      unreadCount,
      setUnreadCount,
      fetchUnreadCount: refreshUnreadCount,
      notifications,
      isPremium: currentUser?.is_premium || currentUser?.isPremium || false,
      isAdmin: currentUser?.is_admin || currentUser?.isAdmin || false
    }}>
      {loading ? (
        <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center animate-heartbeat px-6 text-center">
            <img
              src="https://horizons-cdn.hostinger.com/8cb4c9c6-9962-4ccc-80b1-ea71b7a63684/866a587d484c1eedb4c3fd12c56b7757.png"
              alt="Logo KLTUR RAP"
              className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8"
            />
            <h1 className="text-4xl md:text-7xl font-black text-[#D4AF37] tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              KLTUR RAP
            </h1>
            <p className="text-white text-[10px] md:text-sm font-black tracking-[0.4em] uppercase opacity-90">
              Que pour la culture hip-hop
            </p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
