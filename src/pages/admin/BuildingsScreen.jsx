import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Building2, Plus, MapPin, Users, ChevronRight, Layers, Trash2 } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { generateId } from '../../utils/helpers'

function BuildingCard({ building, onClick, onDelete }) {
  const occupied = building.units.filter(u => u.status === 'occupied').length
  const vacant = building.units.filter(u => u.status === 'vacant').length

  return (
    <div
      className="card cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-niwas-elevated border border-niwas-border flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-niwas-text" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-niwas-text text-sm truncate">{building.name}</h3>
          <p className="text-xs text-niwas-muted mt-0.5 flex items-center gap-1 truncate">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{building.address}</span>
          </p>
        </div>
        <ChevronRight size={16} className="text-niwas-subtle flex-shrink-0 mt-1" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <StatCell label="Floors" value={building.floors} />
        <StatCell label="Occupied" value={occupied} highlight />
        <StatCell label="Vacant" value={vacant} />
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(building.id) }}
        className="mt-3 flex items-center gap-1.5 text-[11px] text-niwas-subtle hover:text-niwas-muted transition-colors cursor-pointer"
      >
        <Trash2 size={11} /> Remove building
      </button>
    </div>
  )
}

function StatCell({ label, value, highlight }) {
  return (
    <div className="bg-niwas-elevated rounded-xl p-2.5 text-center">
      <p className="text-[10px] text-niwas-subtle mb-1">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-niwas-text' : 'text-niwas-muted'}`}>{value}</p>
    </div>
  )
}

function AddBuildingForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', address: '', floors: 4, mapUrl: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.address) return
    const units = []
    for (let f = 1; f <= parseInt(form.floors); f++) {
      for (let u = 1; u <= 4; u++) {
        units.push({
          id: generateId(), floor: f, unitNumber: `${f}0${u}`,
          status: 'vacant', residentId: null,
          rent: 15000, advance: 30000, maintenanceFee: 1500,
          electricityAccountNumber: '', vehicles: [],
        })
      }
    }
    onAdd({ ...form, floors: parseInt(form.floors), totalUnits: parseInt(form.floors) * 4, units })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Building Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sunrise Apartments" required />
      </div>
      <div>
        <label className="label">Full Address *</label>
        <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, Area, City, PIN" rows={2} required />
      </div>
      <div>
        <label className="label">Google Maps URL</label>
        <input value={form.mapUrl} onChange={e => set('mapUrl', e.target.value)} placeholder="https://maps.google.com/…" />
      </div>
      <div>
        <label className="label">Number of Floors</label>
        <input type="number" min={1} max={50} value={form.floors} onChange={e => set('floors', e.target.value)} />
      </div>
      <p className="text-xs text-niwas-subtle">4 units per floor will be created automatically.</p>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Add Building</button>
      </div>
    </form>
  )
}

export default function BuildingsScreen({ onSelectBuilding }) {
  const { buildings, addBuilding, deleteBuilding, residents } = useApp()
  const [showAdd, setShowAdd] = useState(false)

  const totalUnits = buildings.reduce((s, b) => s + b.units.length, 0)
  const activeResidents = residents.filter(r => !r.moveOutDate).length

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Buildings', value: buildings.length },
            { label: 'Total Units', value: totalUnits },
            { label: 'Residents', value: activeResidents },
          ].map(s => (
            <div key={s.label} className="card text-center py-3 px-2">
              <p className="text-xl font-extrabold text-niwas-text">{s.value}</p>
              <p className="text-[10px] text-niwas-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {buildings.length === 0 ? (
          <div className="card text-center py-12">
            <Building2 size={36} className="text-niwas-subtle mx-auto mb-3" />
            <p className="text-sm text-niwas-muted font-medium">No buildings yet</p>
            <p className="text-xs text-niwas-subtle mt-1">Add your first building to get started</p>
          </div>
        ) : (
          buildings.map(b => (
            <BuildingCard
              key={b.id} building={b}
              onClick={() => onSelectBuilding(b.id)}
              onDelete={deleteBuilding}
            />
          ))
        )}

        <button onClick={() => setShowAdd(true)} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={16} /> Add Building
        </button>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Building">
        <AddBuildingForm onAdd={addBuilding} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
