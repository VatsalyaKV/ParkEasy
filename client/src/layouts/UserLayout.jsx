import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';
import { useAuth } from '../context/AuthContext';

const UserLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8]">
        <div className="text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-[#071416] text-[#58dfcc] grid place-items-center animate-pulse">
            P
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">
            Preparing your parking workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#061012]">
      <Navbar />

      <div className="pe-dashboard">

        <aside className="pe-sidebar">
          <UserSidebar />
        </aside>

        <main className="pe-main">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default UserLayout;