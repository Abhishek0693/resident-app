import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Wrench, Plus, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import Modal from '../../components/common/Modal'

const STATUS_BADGE = {
  open:        'badge-due',
  'in-progress': 'badge-partial',
  resolved:    'badge-paid',
}

const CATEGORIES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Pest Control', 'Cleaning', 'Door/Lock', 'Other']

function RequestForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Plumbing', urgency: 'normal' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title) return
    onSave(form)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Category</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Leaking tap in bathroom" required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Describe the issue in detail…" rows={3} />
      </div>
      <div>
        <label className="label">Urgency</label>
        <select value={form.urgency} onChange={e => set('urgency', e.target.value)}>
          <option value="low">Low — Can wait a few days</option>
          <option value="normal">Normal — Fix within 24-48 hours</option>
          <option value="high">High — Urgent, needs immediate attention</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Submit Request</button>
      </div>
    </form>
  )
}

export default function MaintenanceScreen() {
  const { currentUser, residents, addMaintenanceRequest } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  const resident = residents.find(r => r.id === currentUser.residentId)
  const requests = resident?.maintenanceRequests || []

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Open',       value: requests.filter(r => r.status === 'open').length },
            { label: 'In Progress', value: requests.filter(r => r.status === 'in-progress').length },
            { label: 'Resolved',   value: requests.filter(r => r.status === 'resolved').length },
          ].map(s => (
            <div key={s.label} className="card text-center py-3 px-2">
              <p className="text-xl font-extrabold text-niwas-text">{s.value}</p>
              <p className="text-[10px] text-niwas-subtle mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[['all', 'All'], ['open', 'Open'], ['in-progress', 'In Progress'], ['resolved', 'Resolved']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${filter === v ? 'tab-active' : 'tab-inactive'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-niwas-muted">{sorted.length} request{sorted.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary py-2 text-sm flex items-center gap-1.5">
            <Plus size={14} /> New Request
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="card text-center py-10">
            <Wrench size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No maintenance requests</p>
          </div>
        ) : (
          sorted.map(req => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-niwas-text">{req.title}</p>
                  {req.category && <p className="text-[11px] text-niwas-subtle">{req.category}</p>}
                  {req.description && <p className="text-xs text-niwas-muted mt-1 leading-relaxed">{req.description}</p>}
                  <p className="text-[11px] text-niwas-subtle mt-1.5 flex items-center gap-1">
                    <Calendar size={9} /> {formatDate(req.date)}
                    {req.urgency === 'high' && <span className="badge-due ml-1.5">Urgent</span>}
                  </p>
                </div>
                <span className={`${STATUS_BADGE[req.status] || 'badge-info'} flex-shrink-0`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Submit Request">
        <RequestForm onSave={data => addMaintenanceRequest(currentUser.residentId, data)} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
