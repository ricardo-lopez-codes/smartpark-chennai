import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';

export default function AreaSelection() {
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { setSelectedArea } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/areas');
        setAreas(res.data);
      } catch (err) {
        console.warn('Error fetching areas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    navigate(`/parking-locations?area_id=${area.id}&area_name=${encodeURIComponent(area.name)}`);
  };

  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header Title */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717]">Where do you want to park?</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Select a high-demand South Chennai commercial or public transit hub.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search areas (e.g., Anna Nagar, T. Nagar, Marina...)"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/50 transition-all text-sm font-medium shadow-xs"
        />
      </div>

      {/* Popular Areas Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          South Chennai Popular Areas
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-slate-200 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredAreas.map((area) => (
              <div
                key={area.id}
                onClick={() => handleSelectArea(area)}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FFD21F] hover:shadow-md cursor-pointer transition-all duration-200 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-[#FFD21F] group-hover:text-[#171717] transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#171717] text-base group-hover:text-amber-950 transition-colors">
                      {area.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {area.total_lots} Lots • <span className="text-emerald-700 font-bold">{area.total_available_slots} Vacant</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
