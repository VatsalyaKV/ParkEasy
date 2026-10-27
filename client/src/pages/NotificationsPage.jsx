import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, Leaf, Calendar, Info, Loader2 } from 'lucide-react';
import api from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'handover':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'ecopark':
        return <Leaf className="w-4 h-4 text-emerald-500" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-brand-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500">System updates, handover requests, and booking reminders</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No notifications</h4>
          <p className="text-xs text-slate-500">You are completely up to date!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-4 ${
                n.isRead ? 'bg-white border-slate-200' : 'bg-brand-50/40 border-brand-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                  {getTypeIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-700 shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
