import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = `/admin/users?role=user`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(query);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.put(`/admin/users/${user._id}/toggle-status`);
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, isActive: res.data.data.isActive } : u)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Platform Users</h1>
          <p className="text-xs text-slate-400">Driver accounts, registration details, and security suspensions</p>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          {users.length} Motorists Registered
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
          {['all', 'active', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user name or email..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Users Table */}
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
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Eco Points</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-500">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{u.ecoPoints || 0} pts</td>
                    <td className="py-3.5 px-4 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          u.isActive
                            ? 'bg-red-950/60 text-red-400 border border-red-800 hover:bg-red-900'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
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

export default AdminUsers;
