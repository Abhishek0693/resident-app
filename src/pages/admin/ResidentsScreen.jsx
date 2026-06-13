import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { User, Phone, Search, Plus, Trash2, Edit2, Building2 } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/helpers'

function ResidentForm({ buildings, editData, onSave, onClose }) {
  const [form, setForm] = useState(editData || {
    name: '', phone: '', email: '', aadhaar: '', buildingId: '', unitId: '', moveInDate: '', paymentTiming: 'after',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedBuilding = buildings.find(b => b.id === form.buildingId)
  const vacantUnits = selectedBuilding?.units.filter(u => u.status === 'vacant' || u.id === editData?.unitId) || []

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.buildingId || !form.unitId) return
    onSave(form)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Full Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rajesh Kumar" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Phone *</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" required />
        </div>
        <div>
          <label className="label">Aadhaar</label>
          <input value={form.aadhaar} onChange={e => set('aadhaar', e.target.value)} placeholder="XXXX-XXXX-XXXX" />
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="resident@email.com" />
      </div>
      <div>
        <label className="label">Building *</label>
        <select value={form.buildingId} onChange={e => { set('buildingId', e.target.value); set('unitId', '') }} required>
          <option value="">Select building</option>
          {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      {form.buildingId && (
        <div>
          <label className="label">Unit *</label>
          <select value={form.unitId} onChange={e => set('unitId', e.target.value)} required>
            <option value="">Select unit</option>
            {vacantUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unitNumber} — Floor {u.floor}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Move-in Date</label>
        <input type="date" value={form.moveInDate} onChange={e => set('moveInDate', e.target.value)} />
      </div>
      <div>
        <label className="label">Payment Timing</label>
        <select value={form.paymentTiming || 'after'} onChange={e => set('paymentTiming', e.target.value)}>
          <option value="after">Pays after month (post-paid)</option>
          <option value="before">Pays before month (pre-paid)</option>
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">{editData ? 'Update' : 'Add Resident'}</button>
      </div>
    </form>
  )
}

function ResidentCard({ resident, unit, building, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-niwas-elevated border border-niwas-border flex items-center justify-center flex-shrink-0">
          <User size={15} className="text-niwas-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-niwas-text truncate">{resident.name}</p>
          <p className="text-xs text-niwas-muted flex items-center gap-1">
            <Phone size={10} /> {resident.phone}
          </p>
          <p className="text-xs text-niwas-subtle mt-0.5 flex items-center gap-1">
            <Building2 size={10} /> {building?.name} · Unit {unit?.unitNumber}
          </p>
          <p className="text-[11px] text-niwas-subtle flex items-center gap-1.5 flex-wrap">
            {resident.moveInDate ? `Since ${formatDate(resident.moveInDate)}` : 'Lease'}
            {resident.propertyType === 'lease' && <span className="badge-partial">Lease</span>}
            <span className="badge-info">{resident.paymentTiming === 'before' ? 'Pre-pay' : 'Post-pay'}</span>
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(resident)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-niwas-elevated cursor-pointer text-niwas-subtle hover:text-niwas-text transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(resident.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-niwas-elevated cursor-pointer text-niwas-subtle hover:text-niwas-muted transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResidentsScreen() {
  const { residents, buildings, addResident, updateResident, removeResident } = useApp()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = residents.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search)
  )

  const handleSave = (form) => {
    editing ? updateResident(editing.id, form) : addResident(form)
    setEditing(null)
  }

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-niwas-subtle pointer-events-none" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" className="pl-10" />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-niwas-muted">{filtered.length} resident{filtered.length !== 1 ? 's' : ''}</p>
          <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary py-2 text-sm flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <User size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No residents found</p>
          </div>
        ) : (
          filtered.map(r => {
            const building = buildings.find(b => b.id === r.buildingId)
            const unit = building?.units.find(u => u.id === r.unitId)
            return (
              <ResidentCard
                key={r.id} resident={r} building={building} unit={unit}
                onEdit={r => { setEditing(r); setShowModal(true) }}
                onDelete={removeResident}
              />
            )
          })
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Resident' : 'Add Resident'}
      >
        <ResidentForm
          buildings={buildings} editData={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}
