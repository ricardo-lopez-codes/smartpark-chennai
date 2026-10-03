import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { wsService } from '../services/websocket';
import { useNotification } from './NotificationContext';
import { getLocalDateISO } from '../utils/formatters';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  
  // Slot booking flow selection state
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  
  // Date & Time selection state
  const getTodayISO = () => getLocalDateISO();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [demoMode, setDemoMode] = useState(true);
  const { addNotification } = useNotification();

  const fetchActiveBooking = useCallback(async () => {
    try {
      const res = await api.get('/bookings/active');
      setActiveBooking(res.data);
    } catch (err) {
      console.warn('Error fetching active booking:', err);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveBooking();
    const interval = setInterval(fetchActiveBooking, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveBooking]);

  // Connect to Real-time IoT WebSocket
  useEffect(() => {
    wsService.connect();
    const unsubscribe = wsService.subscribe((event) => {
      if (event.type === 'SLOT_UPDATE') {
        console.log('[IoT WebSocket] Slot state changed:', event.data);
        if (selectedLot && event.data.parking_lot_id === selectedLot.id) {
          if (event.data.status === 'occupied') {
            addNotification({
              title: 'IoT Sensor Update',
              message: `Slot ${event.data.slot_number} occupied (Vehicle detected).`,
              type: 'info'
            });
          } else if (event.data.status === 'available') {
            addNotification({
              title: 'IoT Sensor Update',
              message: `Slot ${event.data.slot_number} is now vacant.`,
              type: 'success'
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [selectedLot, addNotification]);

  const clearSelection = () => {
    setSelectedLot(null);
    setSelectedSlot(null);
    setSelectedDate(getTodayISO());
    setSelectedTime('10:00');
    setSelectedDuration(2);
  };

  return (
    <BookingContext.Provider value={{
      activeBooking,
      setActiveBooking,
      loadingActive,
      fetchActiveBooking,
      selectedArea,
      setSelectedArea,
      selectedLot,
      setSelectedLot,
      selectedDate,
      setSelectedDate,
      selectedTime,
      setSelectedTime,
      selectedDuration,
      setSelectedDuration,
      selectedSlot,
      setSelectedSlot,
      clearSelection,
      demoMode,
      setDemoMode
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
