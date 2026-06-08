import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Award, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import LoginPromptModal from './LoginPromptModal.jsx';
import EventRegistrationModal from './EventRegistrationModal.jsx';

const EventCard = ({ event }) => {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showReg, setShowReg] = useState(false);

  const getFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLogin(true);
    } else {
      setShowReg(true);
    }
  };

  const handleAddToCalendar = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatCalDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${formatCalDate(startDate)}/${formatCalDate(endDate)}`;

    window.open(googleUrl, '_blank');
    toast.success("Redirection vers Google Calendar...");
  };

  return (
    <>
      <Link to={`/evenements/${event.id}`} className="group block h-full">
        <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] overflow-hidden hover:border-[#D4AF37] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative">
          <div className="aspect-video relative overflow-hidden bg-[#111]">
            {(event.image || event.image_url) && (
              <img 
                src={getFileUrl('covers', event.image || event.image_url)}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute top-3 left-3 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
              {event.event_type || event.eventType}
            </div>

            {/* Quick Calendar Button on Image Overlay */}
            <button
              onClick={handleAddToCalendar}
              className="absolute top-3 right-3 bg-black/60 backdrop-blur hover:bg-[#D4AF37] hover:text-black text-white p-2 rounded-full border border-white/10 transition-all z-10"
              title="Ajouter au calendrier"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">{event.title}</h3>
            
            <div className="space-y-2 mb-4 flex-grow">
              <div className="flex items-center text-sm text-white/60">
                <Calendar className="w-4 h-4 mr-2 text-[#D4AF37]" />
                {new Date(event.date).toLocaleDateString('fr-FR')} {event.time ? `à ${event.time}` : ''}
              </div>
              <div className="flex items-center text-sm text-white/60">
                <MapPin className="w-4 h-4 mr-2 text-[#D4AF37]" />
                <span className="line-clamp-1">{event.location}{event.city ? `, ${event.city}` : ''}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#222] mt-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Par</span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {event.expand?.organizerId?.name || 'Organisateur'}
                  {event.expand?.organizerId?.is_premium && <Award className="w-3 h-3 text-[#D4AF37]" />}
                </span>
              </div>
              <Button onClick={handleRegisterClick} size="sm" className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-bold">
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <LoginPromptModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      {showReg && <EventRegistrationModal isOpen={showReg} onClose={() => setShowReg(false)} event={event} />}
    </>
  );
};

export default EventCard;