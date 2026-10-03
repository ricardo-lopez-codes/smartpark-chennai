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

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-amber-50 text-amber-900 font-extrabold px-2 py-0.5 rounded-lg border border-amber-200">
                      🚗 ₹{lot.car_price_per_hour || lot.price_per_hour}/hr
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-900 font-extrabold px-2 py-0.5 rounded-lg border border-blue-200">
                      🏍️ ₹{lot.bike_price_per_hour || 20}/hr
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Hourly Rates</span>
                </div>
              </div>

              {/* Slot Availability & Vehicle Capacity Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block font-medium text-[11px] mb-0.5">🚗 Car Slots</span>
                  <span className="font-black text-[#171717] text-sm block">
                    {lot.car_slots || 15} <span className="text-xs text-slate-500 font-normal">Slots</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800">
                    ₹{lot.car_price_per_hour || lot.price_per_hour}/hr
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block font-medium text-[11px] mb-0.5">🏍️ Bike Slots</span>
                  <span className="font-black text-[#171717] text-sm block">
                    {lot.bike_slots || 10} <span className="text-xs text-slate-500 font-normal">Slots</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800">
                    ₹{lot.bike_price_per_hour || 20}/hr
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block font-medium text-[11px] mb-0.5">Available Slots</span>
                  <span className="font-black text-emerald-700 text-sm block">{lot.available_slots} Slots</span>
                  <span className="text-[10px] text-slate-500 font-medium">Total Capacity: {lot.total_slots || ((lot.car_slots || 15) + (lot.bike_slots || 10))}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block font-medium text-[11px] mb-0.5">Operating Hours</span>
                  <span className="font-bold text-slate-800 text-xs block mt-0.5">
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
