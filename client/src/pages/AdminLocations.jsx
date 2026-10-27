import React, { useState, useEffect } from 'react';
import { Building, MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/locations');
      if (res.data.success) {
        setLocations(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleToggleApproval = async (loc) => {
    try {
      const res = await api.put(`/admin/locations/${loc._id}/toggle-approval`);
      if (res.data.success) {
        setLocations(locations.map((l) => (l._id === loc._id ? { ...l, isApproved: res.data.data.isApproved } : l)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle approval');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Parking Facilities</h1>
          <p className="text-xs text-slate-400">All registered facilities across metropolitan zones</p>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          {locations.length} Connected Hubs
        </span>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Facility</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">City / Area</th>
                  <th className="py-3.5 px-4">Bays</th>
                  <th className="py-3.5 px-4">Rate (₹/hr)</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-white">{loc.name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{loc.owner?.name || 'Owner'}</td>
                    <td className="py-3.5 px-4">{loc.city}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{loc.totalSlots}</td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{loc.hourlyRate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          loc.isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {loc.isApproved ? 'Approved' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleApproval(loc)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          loc.isApproved
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800 hover:bg-amber-900'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {loc.isApproved ? 'Revoke Approval' : 'Approve Hub'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLocations;
