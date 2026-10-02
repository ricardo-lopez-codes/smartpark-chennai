import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import { formatCurrency } from '../utils/formatters';

export default function ParkingLocations() {
  const [searchParams] = useSearchParams();
  const areaId = searchParams.get('area_id');
  const areaName = searchParams.get('area_name') || 'South Chennai';
  
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedLot } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await api.get('/parking-lots', {
          params: { area_id: areaId, area_name: areaName }
        });
        setLots(res.data);
      } catch (err) {
        console.warn('Error fetching parking lots:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, [areaId, areaName]);

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    navigate(`/datetime-selection?lot_id=${lot.id}`);
  };

  const format12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/book-slot')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">Parking in {areaName}</h1>
          <p className="text-xs text-slate-500 font-medium">Available commercial and public street parking bays</p>
        </div>
      </div>

      {/* Lot List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-200 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {lots.map((lot) => (
            <div
              key={lot.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#FFD21F] transition-all duration-200 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#171717]">{lot.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                      {lot.parking_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    {lot.address}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {formatCurrency(lot.price_per_hour)}
                  </span>
                  <span className="text-xs text-slate-500 block font-medium">/ hour</span>
                </div>
              </div>

              {/* Slot Availability Banner */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Total Slots</span>
                  <span className="font-extrabold text-[#171717] text-sm">{lot.total_slots}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Available</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{lot.available_slots} Slots</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Operating Hours</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {format12Hour(lot.opening_time)} – {format12Hour(lot.closing_time)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500 font-medium">
                  Distance: <span className="text-slate-900 font-bold">{lot.distance_km} km</span>
                </span>

                <button
                  onClick={() => handleSelectLot(lot)}
                  className="px-6 py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  SELECT DATE & TIME
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
