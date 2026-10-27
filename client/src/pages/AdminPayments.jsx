import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, RefreshCcw, Search } from 'lucide-react';
import api from '../services/api';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/payments');
      if (res.data.success) setPayments(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refund = async (id) => {
    if (!window.confirm('Mark this successful test payment as refunded?')) return;
    try {
      await api.put(`/admin/payments/${id}/refund`);
      await load();
    } catch (error) {
      alert(error.response?.data?.message || 'Refund failed');
    }
  };

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return !q
      || p.transactionId?.toLowerCase().includes(q)
      || p.booking?.bookingReference?.toLowerCase().includes(q)
      || p.user?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Management</h1>
        <p className="text-xs text-slate-400">Test/simulated payment ledger stored in MongoDB</p>
      </div>

      <div className="bg-slate-950 rounded-3xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction, booking or email"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
          />
        </div>
        <button onClick={load} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2">
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-4">Transaction</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Booking</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td className="p-4 font-mono text-slate-300">{p.transactionId}</td>
                    <td className="p-4"><span className="text-white font-semibold">{p.user?.name}</span><br /><span className="text-slate-500">{p.user?.email}</span></td>
                    <td className="p-4 text-slate-300">{p.booking?.bookingReference || '—'}</td>
                    <td className="p-4 text-slate-400">{p.method}</td>
                    <td className="p-4 font-bold text-white">₹{p.amount}</td>
                    <td className="p-4 capitalize text-slate-300">{p.status}</td>
                    <td className="p-4 text-right">
                      {p.status === 'success' && (
                        <button onClick={() => refund(p._id)} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                          Refund
                        </button>
                      )}
                      {p.status !== 'success' && <CreditCard className="w-4 h-4 text-slate-600 ml-auto" />}
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

export default AdminPayments;
