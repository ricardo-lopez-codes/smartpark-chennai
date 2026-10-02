import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Wrench, CheckCircle, XCircle, Search, X, Cpu } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function OwnerSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const { addNotification } = useNotification();

  // New slot form state
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotType, setNewSlotType] = useState('Car');
  const [newZone, setNewZone] = useState('Zone A');
  const [newFloor, setNewFloor] = useState('Ground Floor');
  const [newPrice, setNewPrice] = useState(40);
  const [newSensorId, setNewSensorId] = useState('');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner/parking-lots/1/slots');
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owner/parking-lots/1/slots', {
        slot_number: newSlotNumber,
        slot_type: newSlotType,
        zone: newZone,
        floor: newFloor,
        price_per_hour: parseFloat(newPrice),
        sensor_id: newSensorId || undefined
      });
      addNotification({
        title: 'Slot Created',
        message: `Slot ${newSlotNumber} added successfully.`,
        type: 'success'
      });
      setShowAddModal(false);
      setNewSlotNumber('');
      fetchSlots();
    } catch (err) {
      addNotification({
        title: 'Creation Failed',
        message: err.response?.data?.detail || 'Error creating slot.',
        type: 'error'
      });
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    try {
      await api.put(`/owner/slots/${editingSlot.id}`, {
        slot_number: editingSlot.slot_number,
        slot_type: editingSlot.slot_type,
        zone: editingSlot.zone,
        floor: editingSlot.floor,
        price_per_hour: parseFloat(editingSlot.price_per_hour),
        status: editingSlot.status,
        sensor_id: editingSlot.sensor_id
      });
      addNotification({
        title: 'Slot Updated',
        message: `Slot ${editingSlot.slot_number} updated successfully.`,
        type: 'success'
      });
      setEditingSlot(null);
      fetchSlots();
    } catch (err) {
      addNotification({
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Error updating slot.',
        type: 'error'
      });
    }
  };

  const filteredSlots = slots.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.slot_number.toLowerCase().includes(term) || (s.sensor_id || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Parking Slot Management</h2>
          <p className="text-xs text-slate-500">Configure bays, floor zones, pricing rates, and IoT sensor bindings</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slot or sensor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#171717] focus:outline-none focus:border-[#FFD21F]"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Slot
          </button>
        </div>
      </div>

      {/* Slots Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#FFD21F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading parking bays...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Slot Number</th>
                  <th className="py-3 px-4">Vehicle Type</th>
                  <th className="py-3 px-4">Zone / Floor</th>
                  <th className="py-3 px-4">Rate / Hour</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bound Sensor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSlots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-[#171717]">{s.slot_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.slot_type || 'Car'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{s.zone}, {s.floor}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{s.price_per_hour}/hr</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                        s.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'occupied' ? 'bg-rose-100 text-rose-800' :
                        s.status === 'reserved' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      {s.sensor_id || 'ESP32-MAG-01'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingSlot({ ...s })}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FFD21F] text-slate-800 transition-all"
                        title="Edit Slot"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#171717]">Add New Parking Slot</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Slot Number (e.g. A-31)</label>
                <input
                  type="text"
                  required
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value)}
                  placeholder="A-31"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Vehicle Type</label>
                  <select
                    value={newSlotType}
                    onChange={(e) => setNewSlotType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike (₹20/hr)</option>
                    <option value="EV">EV Charging (₹50/hr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Rate (₹/hour)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Zone</label>
                  <input
                    type="text"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Floor</label>
                  <input
                    type="text"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Sensor ID (Optional)</label>
                <input
                  type="text"
                  value={newSensorId}
                  onChange={(e) => setNewSensorId(e.target.value)}
                  placeholder="ESP32-MAG-01-A-31"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-xs transition-all"
              >
                Create Parking Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#171717]">Edit Slot {editingSlot.slot_number}</h3>
              <button onClick={() => setEditingSlot(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSlot} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Status</label>
                  <select
                    value={editingSlot.status}
                    onChange={(e) => setEditingSlot({ ...editingSlot, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Rate (₹/hour)</label>
                  <input
                    type="number"
                    value={editingSlot.price_per_hour}
                    onChange={(e) => setEditingSlot({ ...editingSlot, price_per_hour: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Zone</label>
                  <input
                    type="text"
                    value={editingSlot.zone}
                    onChange={(e) => setEditingSlot({ ...editingSlot, zone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Floor</label>
                  <input
                    type="text"
                    value={editingSlot.floor}
                    onChange={(e) => setEditingSlot({ ...editingSlot, floor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#171717]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFD21F] hover:bg-[#E5B800] text-[#171717] font-extrabold text-xs shadow-xs transition-all"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
