import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, Edit2, Trash2, Zap, DollarSign, Loader2, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    websiteUrl: '',
    amenities: [],
    latitude: 12.9716,
    longitude: 77.5946,
    hourlyRate: 40,
    evHourlyRate: 30,
    evIncentiveDiscount: 20,
    totalSlots: 12,
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/dashboard');
      if (res.data.success) {
        setLocations(res.data.data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching owner locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      description: 'Automated multi-tier smart parking hub with high speed EV charging.',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      websiteUrl: '',
      amenities: [],
      latitude: 12.9716,
      longitude: 77.5946,
      hourlyRate: 40,
      evHourlyRate: 30,
      evIncentiveDiscount: 20,
      totalSlots: 12,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      description: loc.description,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      postalCode: loc.postalCode,
      websiteUrl: loc.websiteUrl || '',
      amenities: loc.amenities || [],
      latitude: loc.latitude,
      longitude: loc.longitude,
      hourlyRate: loc.hourlyRate,
      evHourlyRate: loc.evHourlyRate || 30,
      evIncentiveDiscount: loc.evIncentiveDiscount || 20,
      totalSlots: loc.totalSlots,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.put(`/parking/${editingLocation._id}`, formData);
        alert('Parking facility updated successfully!');
      } else {
        await api.post('/parking', formData);
        alert('New parking facility created with automated slot layout!');
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save location');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parking facility and all associated parking bays?')) return;
    try {
      await api.delete(`/parking/${id}`);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete facility');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Parking Locations</h1>
          <p className="text-xs text-slate-500">Configure facilities, geolocation, and base parking fees</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Facilities Registered</h3>
          <p className="text-xs text-slate-500">Click "+ Add New Facility" to register your first smart garage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      {loc.city}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{loc.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{loc.address}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">₹{loc.hourlyRate}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">/ hr</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{loc.description}</p>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Bays</span>
                    <span className="font-extrabold text-slate-800">{loc.totalSlots}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">EV Rate</span>
                    <span className="font-extrabold text-blue-600">₹{loc.evHourlyRate || loc.hourlyRate - 10}/hr</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">EV Incentive</span>
                    <span className="font-extrabold text-emerald-600">-₹{loc.evIncentiveDiscount || 20}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(loc)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(loc._id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLocation ? 'Edit Parking Facility' : 'Register New Parking Hub'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix Metro Smart Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 52 Outer Ring Road"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Website URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amenities (comma separated)</label>
                <input
                  type="text"
                  placeholder="CCTV, EV Charging, Covered Parking"
                  value={(formData.amenities || []).join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    amenities: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">EV Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.evHourlyRate}
                    onChange={(e) => setFormData({ ...formData, evHourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">EV Discount (₹)</label>
                  <input
                    type="number"
                    value={formData.evIncentiveDiscount}
                    onChange={(e) => setFormData({ ...formData, evIncentiveDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {!editingLocation && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Bays to Generate</label>
                  <input
                    type="number"
                    min="4"
                    max="60"
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    The system will automatically allocate 25% of bays as EV Fast Charging points.
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow"
                >
                  {editingLocation ? 'Save Updates' : 'Create & Generate Bays'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;
