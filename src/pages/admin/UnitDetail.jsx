import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatINR } from '../../utils/helpers'
import { User, Car, Zap, Edit2, Check, X, Plus, Trash2 } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { generateId } from '../../utils/helpers'

function EditableRow({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')

  if (!editing) return (
    <div className="flex items-center justify-between py-2.5 border-b border-niwas-border last:border-0">
      <span className="text-xs text-niwas-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-niwas-text">{value || '—'}</span>
        <button onClick={() => setEditing(true)} className="text-niwas-subtle hover:text-niwas-text cursor-pointer transition-colors"><Edit2 size={12} /></button>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-niwas-border last:border-0">
      <input value={val} onChange={e => setVal(e.target.value)} className="flex-1 py-1 text-xs" />
      <button onClick={() => { onSave(val); setEditing(false) }} className="text-niwas-text cursor-pointer"><Check size={14} /></button>
      <button onClick={() => setEditing(false)} className="text-niwas-subtle cursor-pointer"><X size={14} /></button>
    </div>
  )
}

function VehicleForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ type: 'car', number: '', model: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.number) return
    onAdd({ id: generateId(), ...form })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Vehicle Type</label>
        <select value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="car">Car</option>
          <option value="bike">Motorcycle / Bike</option>
          <option value="scooter">Scooter</option>
          <option value="ev">EV / Electric</option>
        </select>
      </div>
      <div>
        <label className="label">Registration Number *</label>
        <input value={form.number} onChange={e => set('number', e.target.value.toUpperCase())} placeholder="KA01AB1234" required />
      </div>
      <div>
        <label className="label">Model</label>
        <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Honda Activa" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Add Vehicle</button>
      </div>
    </form>
  )
}

export default function UnitDetail({ buildingId, unitId, onBack }) {
  const { buildings, updateUnit, residents } = useApp()
  const [showVehicle, setShowVehicle] = useState(false)

  const building = buildings.find(b => b.id === buildingId)
  const unit = building?.units.find(u => u.id === unitId)
  if (!unit) return null

  const resident = residents.find(r => r.id === unit.residentId)

  const saveField = (field) => (value) =>
    updateUnit(buildingId, unitId, { [field]: isNaN(Number(value)) ? value : Number(value) })

  const addVehicle = (v) =>
    updateUnit(buildingId, unitId, { vehicles: [...(unit.vehicles || []), v] })

  const removeVehicle = (id) =>
    updateUnit(buildingId, unitId, { vehicles: unit.vehicles.filter(v => v.id !== id) })

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Unit header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-niwas-subtle uppercase tracking-wider">Unit</p>
              <p className="text-3xl font-extrabold text-niwas-text tracking-tight">{unit.unitNumber}</p>
              <p className="text-xs text-niwas-muted">Floor {unit.floor}</p>
            </div>
            <select
              value={unit.status}
              onChange={e => updateUnit(buildingId, unitId, { status: e.target.value })}
              className="w-auto text-xs"
            >
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Resident */}
        {resident && (
          <div className="card">
            <h3 className="text-xs font-semibold text-niwas-muted uppercase tracking-wider flex items-center gap-2 mb-3">
              <User size={13} /> Resident
            </h3>
            <p className="text-sm font-bold text-niwas-text">{resident.name}</p>
            <p className="text-xs text-niwas-muted mt-0.5">{resident.phone}</p>
            <p className="text-xs text-niwas-muted">{resident.email}</p>
            <p className="text-xs text-niwas-subtle mt-0.5">Aadhaar: {resident.aadhaar}</p>
          </div>
        )}

        {/* Fees */}
        <div className="card">
          <h3 className="text-xs font-semibold text-niwas-muted uppercase tracking-wider mb-2">Fee Structure</h3>
          <EditableRow label="Monthly Rent" value={formatINR(unit.rent)} onSave={saveField('rent')} />
          <EditableRow label="Security Advance" value={formatINR(unit.advance)} onSave={saveField('advance')} />
          <EditableRow label="Maintenance Fee" value={formatINR(unit.maintenanceFee)} onSave={saveField('maintenanceFee')} />
        </div>

        {/* Electricity */}
        <div className="card">
          <h3 className="text-xs font-semibold text-niwas-muted uppercase tracking-wider flex items-center gap-2 mb-2">
            <Zap size={12} /> Electricity Account
          </h3>
          <EditableRow label="Account Number" value={unit.electricityAccountNumber} onSave={saveField('electricityAccountNumber')} />
        </div>

        {/* Vehicles */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-niwas-muted uppercase tracking-wider flex items-center gap-2">
              <Car size={12} /> Vehicles
            </h3>
            <button onClick={() => setShowVehicle(true)} className="text-niwas-subtle hover:text-niwas-text cursor-pointer transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {(!unit.vehicles || unit.vehicles.length === 0) ? (
            <p className="text-xs text-niwas-subtle text-center py-3">No vehicles registered</p>
          ) : (
            <div className="space-y-2">
              {unit.vehicles.map(v => (
                <div key={v.id || v.number} className="flex items-center justify-between bg-niwas-elevated rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-niwas-text">{v.number}</p>
                    <p className="text-[11px] text-niwas-muted capitalize">{v.type}{v.model ? ` · ${v.model}` : ''}</p>
                  </div>
                  <button onClick={() => removeVehicle(v.id)} className="text-niwas-subtle hover:text-niwas-muted cursor-pointer transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showVehicle} onClose={() => setShowVehicle(false)} title="Register Vehicle">
        <VehicleForm onAdd={addVehicle} onClose={() => setShowVehicle(false)} />
      </Modal>
    </div>
  )
}
