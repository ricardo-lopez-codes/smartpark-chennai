import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BookingProvider } from './context/BookingContext';

import Header from './components/Header';
import Footer from './components/Footer';
import NotificationToast from './components/NotificationToast';
import DemoControlPanel from './components/DemoControlPanel';

// Civilian Pages
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

// Owner Portal Components & Pages
import ProtectedOwnerRoute from './components/owner/ProtectedOwnerRoute';
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerOverview from './pages/owner/OwnerOverview';
import OwnerLiveParking from './pages/owner/OwnerLiveParking';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerCalendar from './pages/owner/OwnerCalendar';
import OwnerRevenue from './pages/owner/OwnerRevenue';
import OwnerSlots from './pages/owner/OwnerSlots';
import OwnerAnalytics from './pages/owner/OwnerAnalytics';
import OwnerNotifications from './pages/owner/OwnerNotifications';
import OwnerLotSettings from './pages/owner/OwnerLotSettings';
import OwnerAccount from './pages/owner/OwnerAccount';

const ProtectedCivilianRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="w-12 h-12 rounded-full border-4 border-[#FFD21F] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'owner') return <Navigate to="/owner" replace />;
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <>
      {isOwnerRoute ? (
        <ProtectedOwnerRoute>
          <OwnerLayout>
            <Routes>
              <Route path="/owner" element={<OwnerOverview />} />
              <Route path="/owner/live-parking" element={<OwnerLiveParking />} />
              <Route path="/owner/bookings" element={<OwnerBookings />} />
              <Route path="/owner/calendar" element={<OwnerCalendar />} />
              <Route path="/owner/revenue" element={<OwnerRevenue />} />
              <Route path="/owner/slots" element={<OwnerSlots />} />
              <Route path="/owner/analytics" element={<OwnerAnalytics />} />
              <Route path="/owner/notifications" element={<OwnerNotifications />} />
              <Route path="/owner/settings" element={<OwnerLotSettings />} />
              <Route path="/owner/account" element={<OwnerAccount />} />
            </Routes>
          </OwnerLayout>
          <NotificationToast />
        </ProtectedOwnerRoute>
      ) : (
        <div className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#171717] font-['Plus_Jakarta_Sans',sans-serif]">
          <Header />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Civilian routes */}
              <Route path="/" element={<ProtectedCivilianRoute><Home /></ProtectedCivilianRoute>} />
              <Route path="/book-slot" element={<ProtectedCivilianRoute><AreaSelection /></ProtectedCivilianRoute>} />
              <Route path="/parking-locations" element={<ProtectedCivilianRoute><ParkingLocations /></ProtectedCivilianRoute>} />
              <Route path="/datetime-selection" element={<ProtectedCivilianRoute><DateTimeSelection /></ProtectedCivilianRoute>} />
              <Route path="/slot-selection" element={<ProtectedCivilianRoute><SlotSelection /></ProtectedCivilianRoute>} />
              <Route path="/payment-confirm" element={<ProtectedCivilianRoute><PaymentConfirm /></ProtectedCivilianRoute>} />
              <Route path="/booking-confirmation/:id" element={<ProtectedCivilianRoute><BookingConfirmation /></ProtectedCivilianRoute>} />
              <Route path="/view-booking/:id" element={<ProtectedCivilianRoute><ViewBooking /></ProtectedCivilianRoute>} />
              <Route path="/past-bookings" element={<ProtectedCivilianRoute><PastBookings /></ProtectedCivilianRoute>} />
              <Route path="/account" element={<ProtectedCivilianRoute><Account /></ProtectedCivilianRoute>} />
              <Route path="/settings" element={<ProtectedCivilianRoute><Settings /></ProtectedCivilianRoute>} />

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
      )}
    </>
  );
};

export default function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <BookingProvider>
            <AppContent />
          </BookingProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}
