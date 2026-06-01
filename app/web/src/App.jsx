import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AudioProvider } from './contexts/AudioContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import FloatingMessageButton from './components/FloatingMessageButton.jsx';
import GlobalPlayer from './components/GlobalPlayer.jsx';
import IOSInstallPrompt from './components/IOSInstallPrompt.jsx';

// Public Pages
import HomePage from './pages/HomePage.jsx';
import EcouterPage from './pages/EcouterPage.jsx';
import EvenementsPage from './pages/EvenementsPage.jsx';
import ArtistesPage from './pages/ArtistesPage.jsx';
import ActualitesPage from './pages/ActualitesPage.jsx';
import VideosPage from './pages/VideosPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import VolunteerPage from './pages/VolunteerPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import SupabaseTest from './pages/SupabaseTest.jsx';

// Auth & Premium Pages
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import PremiumPage from './pages/PremiumPage.jsx';
import PublicArtistProfilePage from './pages/PublicArtistProfilePage.jsx';

// Upload & Gallery Pages
import UploadsGalleryPage from './pages/UploadsGalleryPage.jsx';
import UploadDetailPage from './pages/UploadDetailPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';

// Legal Pages
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import TermsOfUsePage from './pages/TermsOfUsePage.jsx';
import LegalNoticePage from './pages/LegalNoticePage.jsx';

// Protected User Pages
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectAnalyticsPage from './pages/ProjectAnalyticsPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import MessagesPage from './pages/MessagesPage.jsx';

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <ScrollToTop />
          <Toaster position="top-right" theme="dark" toastOptions={{
            style: { background: '#111', border: '1px solid #333', color: '#fff' }
          }}/>
          <FloatingMessageButton />
          <GlobalPlayer />
          <IOSInstallPrompt />
          <Routes>
            {/* Main Info Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/ecouter" element={<EcouterPage />} />
            <Route path="/evenements" element={<EvenementsPage />} />
            <Route path="/evenements/:id" element={<EventDetailPage />} />
            <Route path="/artistes" element={<ArtistesPage />} />
            <Route path="/actualites" element={<ActualitesPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/equipe" element={<TeamPage />} />
            <Route path="/rejoindre" element={<VolunteerPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/test-supabase" element={<SupabaseTest />} />

            {/* Auth & Premium */}
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/inscription" element={<SignupPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/profil/:userId" element={<PublicArtistProfilePage />} />

            {/* Uploads Directory */}
            <Route path="/galerie-uploads" element={<UploadsGalleryPage />} />
            <Route path="/uploads/:id" element={<UploadDetailPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />

            {/* Legal Pages */}
            <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/conditions-utilisation" element={<TermsOfUsePage />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/analytics/:id" element={<ProtectedRoute><ProjectAnalyticsPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/creer-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/modifier-profil" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
                <div className="text-center">
                  <h1 className="text-6xl font-bold mb-4 text-[#D4AF37]">404</h1>
                  <p className="text-xl mb-8">Page non trouvée.</p>
                  <a href="/" className="text-[#D4AF37] hover:underline font-bold">Retour à l'accueil</a>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
