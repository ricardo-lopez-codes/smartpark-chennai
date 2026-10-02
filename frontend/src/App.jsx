import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BookingProvider } from './context/BookingContext';

import Header from './components/Header';
import Footer from './components/Footer';
import NotificationToast from './components/NotificationToast';
import DemoControlPanel from './components/DemoControlPanel';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AreaSelection from './pages/AreaSelection';
import ParkingLocations from './pages/ParkingLocations';
import DateTimeSelection from './pages/DateTimeSelection';
import SlotSelection from './pages/SlotSelection';
import PaymentConfirm from './pages/PaymentConfirm';
import BookingConfirmation from './pages/BookingConfirmation';
import ViewBooking from './pages/ViewBooking';
import PastBookings from './pages/PastBookings';
import Account from './pages/Account';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="w-12 h-12 rounded-full border-4 border-[#FFD21F] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <BookingProvider>
            <div className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#171717] font-['Plus_Jakarta_Sans',sans-serif]">
              <Header />
              
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {/* Auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Civilian routes */}
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/book-slot" element={<ProtectedRoute><AreaSelection /></ProtectedRoute>} />
                  <Route path="/parking-locations" element={<ProtectedRoute><ParkingLocations /></ProtectedRoute>} />
                  <Route path="/datetime-selection" element={<ProtectedRoute><DateTimeSelection /></ProtectedRoute>} />
                  <Route path="/slot-selection" element={<ProtectedRoute><SlotSelection /></ProtectedRoute>} />
                  <Route path="/payment-confirm" element={<ProtectedRoute><PaymentConfirm /></ProtectedRoute>} />
                  <Route path="/booking-confirmation/:id" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
                  <Route path="/view-booking/:id" element={<ProtectedRoute><ViewBooking /></ProtectedRoute>} />
                  <Route path="/past-bookings" element={<ProtectedRoute><PastBookings /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />

              {/* Toast Notifications */}
              <NotificationToast />

              {/* Hackathon Demo Control Panel Drawer */}
              <DemoControlPanel />
            </div>
          </BookingProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}
