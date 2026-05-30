import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Filter, Calendar } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import EventCard from '@/components/EventCard.jsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient.js';
import { useDebounce } from '@/hooks/use-debounce.js';

const EvenementsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('events')
          .select('*, profiles:organizer_id(*)')
          .order('date', { ascending: true });

        if (debouncedSearch) {
          query = query.or(`title.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`);
        }

        if (typeFilter !== 'all') {
          query = query.eq('event_type', typeFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map data to maintain compatibility with EventCard
        const mappedEvents = data.map(event => ({
          ...event,
          expand: {
            organizerId: event.profiles
          }
        }));

        // Sort premium organizers first
        const sorted = [...mappedEvents].sort((a, b) => {
          const aPrem = a.expand?.organizerId?.is_premium ? 1 : 0;
          const bPrem = b.expand?.organizerId?.is_premium ? 1 : 0;
          if (aPrem !== bPrem) return bPrem - aPrem;
          return new Date(a.date) - new Date(b.date);
        });

        setEvents(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [debouncedSearch, typeFilter]);

  return (
    <>
      <Helmet><title>Événements - KLTUR RAP</title></Helmet>
      <div className="min-h-screen flex flex-col bg-[#050505]">
        <Header />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
              Les <span className="text-[#D4AF37]">Événements</span>
            </h1>
            <p className="text-white/60 text-lg">Ne manquez aucun concert, battle ou atelier.</p>
          </div>

          <div className="bg-[#0a0a0a] rounded-2xl border border-[#222] p-4 mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un événement, un lieu..." 
                className="pl-10 bg-[#111] border-[#333] text-white focus:border-[#D4AF37]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-[#111] border-[#333] text-white">
                <Filter className="w-4 h-4 mr-2" /> <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] text-white">
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Concert">Concert</SelectItem>
                <SelectItem value="Atelier">Atelier</SelectItem>
                <SelectItem value="Compétition">Compétition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80 rounded-2xl bg-[#111]" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-[#222]">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Aucun événement</h3>
              <p className="text-white/50">Aucun événement ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default EvenementsPage;