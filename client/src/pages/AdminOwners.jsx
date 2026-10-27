import React, { useState, useEffect } from 'react';
import { Briefcase, Search, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      let query = `/admin/users?role=owner`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setOwners(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleToggleStatus = async (owner) => {
    try {
      const res = await api.put(`/admin/users/${owner._id}/toggle-status`);
      if (res.data.success) {
        setOwners(owners.map((o) => (o._id === owner._id ? { ...o, isActive: res.data.data.isActive } : o)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update owner status');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Parking Facility Owners</h1>
          <p className="text-xs text-slate-400">Commercial operators managing parking locations and bay grids</p>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          {owners.length} Commercial Partners
        </span>
      </div>

      {/* Owners Table */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Operator Name</th>
                  <th className="py-3.5 px-4">Official Email</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Partner Since</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {owners.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        {o.name.charAt(0)}
                      </div>
                      <span>{o.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{o.email}</td>
                    <td className="py-3.5 px-4">{o.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-[11px]">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {o.isActive ? 'Verified & Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(o)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          o.isActive
                            ? 'bg-red-950/60 text-red-400 border border-red-800 hover:bg-red-900'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {o.isActive ? 'Suspend Operator' : 'Approve Operator'}
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

export default AdminOwners;
