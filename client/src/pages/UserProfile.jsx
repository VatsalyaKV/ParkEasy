import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Car, Phone, Mail, Plus, Trash2, CheckCircle2, Zap, Leaf, Shield, Loader2 } from 'lucide-react';
import api from '../services/api';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // New vehicle form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    make: '',
    model: '',
    type: 'Car',
    color: 'White',
    isEV: false,
  });

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await api.put('/users/profile', { name, phone });
      if (res.data.success) {
        updateUser({ name, phone });
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/vehicles', newVehicle);
      if (res.data.success) {
        setVehicles([res.data.data, ...vehicles]);
        setShowAddForm(false);
        setNewVehicle({ licensePlate: '', make: '', model: '', type: 'Car', color: 'White', isEV: false });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle from your profile?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter((v) => v._id !== id));
    } catch (err) {
      alert('Could not remove vehicle');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/vehicles/${id}/default`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Driver Profile & Garage</h1>
        <p className="text-xs text-slate-500">Manage account details and registered vehicle fleet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-3">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-brand-500 shadow-md"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  Role: {user?.role}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Eco Points Balance</span>
                  <p className="text-xl font-black text-emerald-900">{user?.ecoPoints || 0} pts</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          </div>
        </div>

        {/* Garage Management */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered Vehicles</h3>
                <p className="text-xs text-slate-500">Quickly select registered vehicles during booking</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'Cancel' : 'Add Vehicle'}</span>
              </button>
            </div>

            {/* Add vehicle form */}
            {showAddForm && (
              <form onSubmit={handleAddVehicle} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Add New Vehicle</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">License Plate</label>
                    <input
                      type="text"
                      required
                      placeholder="KA-01-AB-1234"
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-brand-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Make & Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MG ZS EV"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value, make: e.target.value.split(' ')[0] || 'Car' })}
                      className="w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={newVehicle.isEV}
                      onChange={(e) => setNewVehicle({ ...newVehicle, isEV: e.target.checked, type: e.target.checked ? 'EV' : 'Car' })}
                      className="accent-brand-600"
                    />
                    <span>Electric Vehicle (EV)</span>
                  </label>
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs"
                  >
                    Save to Garage
                  </button>
                </div>
              </form>
            )}

            {/* Vehicle List */}
            {loadingVehicles ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No vehicles in your garage yet. Click "+ Add Vehicle" above.
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div
                    key={v._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">{v.licensePlate}</span>
                        {v.isEV && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> EV
                          </span>
                        )}
                        {v.isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{v.make} {v.model} ({v.type})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!v.isDefault && (
                        <button
                          onClick={() => handleSetDefault(v._id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVehicle(v._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
