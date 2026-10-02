import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Clock, ChevronRight, Car, ArrowRight, Zap, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import api from '../services/api';
import { getGreeting, formatTime } from '../utils/formatters';

export default function Home() {
  const { user } = useAuth();
  const { activeBooking, loadingActive, setSelectedArea } = useBooking();
  const [areas, setAreas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/areas');
        setAreas(res.data);
      } catch (err) {
        console.warn('Failed to load areas:', err);
      }
    };
    fetchAreas();
  }, []);

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    navigate(`/parking-locations?area_id=${area.id}&area_name=${encodeURIComponent(area.name)}`);
  };

  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'Driver';

  const isUpcoming = activeBooking && (
    activeBooking.status === 'UPCOMING' || 
    (activeBooking.start_time && new Date(activeBooking.start_time).getTime() > Date.now())
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Greeting Section */}
      <div className="relative rounded-3xl bg-[#FFD21F] text-[#171717] p-6 sm:p-8 overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-[#FFD21F]" />
            Live Smart Vacancy Detection
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#171717]">
            {getGreeting()}, {firstName} 👋
          </h1>

          <p className="text-slate-900 text-sm font-semibold leading-relaxed">
            Find, reserve, and navigate to live parking spaces across South Chennai.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/book-slot')}
              className="px-6 py-3.5 rounded-2xl bg-[#171717] hover:bg-slate-800 text-white font-extrabold text-sm shadow-md flex items-center gap-2 active:scale-98 transition-all"
            >
              <Car className="w-4 h-4 text-[#FFD21F]" />
              BOOK A PARKING SLOT
            </button>

            <button
              onClick={() => navigate('/book-slot')}
              className="px-5 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-[#171717] font-bold text-sm flex items-center gap-2 border border-slate-300 transition-all shadow-xs"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              Find Parking Near You
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search area, landmark or place (e.g. Anna Nagar, T. Nagar...)"
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-[#171717] placeholder-slate-400 focus:outline-none focus:border-[#FFD21F] focus:ring-2 focus:ring-[#FFD21F]/50 transition-all text-sm shadow-xs font-medium"
        />
      </div>

      {/* ACTIVE / UPCOMING BOOKING CARD */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#171717]" />
          {isUpcoming ? 'UPCOMING BOOKING' : 'ACTIVE BOOKING'}
        </h2>

        {!loadingActive && !activeBooking && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-800">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#171717]">Find your parking space</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Book a slot in seconds and skip the high-congestion queue.</p>
            </div>
            <button
              onClick={() => navigate('/book-slot')}
              className="px-6 py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-xs transition-colors"
            >
              BOOK A PARKING SLOT
            </button>
          </div>
        )}

        {activeBooking && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-sm">
                  {activeBooking.slot_number}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#171717]">{activeBooking.parking_lot_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {activeBooking.area_name} • {activeBooking.parking_address}
                  </p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isUpcoming
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {activeBooking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Date</span>
                <span className="font-extrabold text-slate-900">{activeBooking.booking_date}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block font-bold text-slate-900">Time Window</span>
                <span className="font-bold text-slate-800">{formatTime(activeBooking.start_time)} – {formatTime(activeBooking.paid_end_time)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Slot</span>
                <span className="font-extrabold text-[#171717] text-sm">{activeBooking.slot_number}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Booking ID</span>
                <span className="font-mono text-blue-700 font-extrabold">{activeBooking.booking_id}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/view-booking/${activeBooking.id}`)}
                className="flex-1 py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Clock className="w-4 h-4" />
                View Booking
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.latitude},${activeBooking.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-all"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                Open Directions
              </a>
            </div>
          </div>
        )}
      </div>

      {/* POPULAR AREAS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#171717]">Popular South Chennai Areas</h2>
            <p className="text-xs text-slate-500 font-medium">Select an area to view commercial & GCC street parking lots</p>
          </div>
          <Link to="/book-slot" className="text-xs text-slate-900 hover:underline font-extrabold flex items-center gap-1">
            View All Areas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              onClick={() => handleSelectArea(area)}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FFD21F] hover:shadow-md cursor-pointer transition-all duration-200 group hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-[#FFD21F] group-hover:text-[#171717] transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {area.total_available_slots} Slots
                </span>
              </div>

              <h3 className="font-extrabold text-base text-[#171717] group-hover:text-amber-950 transition-colors">
                {area.name}
              </h3>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
                <span>{area.total_lots} Parking Lots</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
