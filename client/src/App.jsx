import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import OwnerLayout from './layouts/OwnerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Discovery & Booking Pages
import SearchParking from './pages/SearchParking';
import ParkingDetails from './pages/ParkingDetails';
import SlotSelection from './pages/SlotSelection';
import Reservation from './pages/Reservation';
import BookingConfirmation from './pages/BookingConfirmation';
import QRCodePassPage from './pages/QRCodePassPage';

// Flagship Innovation Pages
import HandoverPage from './pages/HandoverPage';
import SmartArrivalPage from './pages/SmartArrivalPage';
import EcoParkPage from './pages/EcoParkPage';

// User Portal Pages
import UserDashboard from './pages/UserDashboard';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import NotificationsPage from './pages/NotificationsPage';
import UserProfile from './pages/UserProfile';

// Owner Portal Pages
import OwnerDashboard from './pages/OwnerDashboard';
import ManageLocations from './pages/ManageLocations';
import ManageSlots from './pages/ManageSlots';
import ManagePricing from './pages/ManagePricing';
import OwnerReservations from './pages/OwnerReservations';
import OwnerUsers from './pages/OwnerUsers';
import OwnerRevenue from './pages/OwnerRevenue';

// Admin Portal Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOwners from './pages/AdminOwners';
import AdminLocations from './pages/AdminLocations';
import AdminBookings from './pages/AdminBookings';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminPayments from './pages/AdminPayments';

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Discovery & Booking Flow */}
        <Route path="/search" element={<SearchParking />} />
        <Route path="/parking/:id" element={<ParkingDetails />} />
        <Route path="/parking/:id/slots" element={<SlotSelection />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
        <Route path="/gate-pass/:id" element={<QRCodePassPage />} />

        {/* Flagship Innovation Hubs */}
        <Route path="/handover" element={<HandoverPage />} />
        <Route path="/smart-arrival" element={<SmartArrivalPage />} />
        <Route path="/ecopark" element={<EcoParkPage />} />
      </Route>

      {/* Driver / User Portal */}
      <Route element={<UserLayout />}>
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/booking-details/:id" element={<BookingDetails />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Parking Owner Portal */}
      <Route element={<OwnerLayout />}>
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/locations" element={<ManageLocations />} />
        <Route path="/owner/slots" element={<ManageSlots />} />
        <Route path="/owner/pricing" element={<ManagePricing />} />
        <Route path="/owner/reservations" element={<OwnerReservations />} />
        <Route path="/owner/users" element={<OwnerUsers />} />
        <Route path="/owner/revenue" element={<OwnerRevenue />} />
      </Route>

      {/* Platform Admin Portal */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/owners" element={<AdminOwners />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
