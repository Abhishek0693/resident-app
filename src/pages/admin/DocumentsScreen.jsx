import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { FileText, Plus, Trash2, AlertTriangle, Search, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import Modal from '../../components/common/Modal'

const DOC_TYPES = {
  rent_agreement: 'Rent Agreement',
  id_proof: 'ID Proof',
  police_verification: 'Police Verification',
  move_in: 'Move-in Record',
  move_out: 'Move-out Record',
  other: 'Other',
}

const isExpiringSoon = (expiry) => {
  if (!expiry) return false
  const days = (new Date(expiry) - new Date()) / 86400000
  return days < 30 && days > 0
}

const isExpired = (expiry) => expiry && new Date(expiry) < new Date()

function AddDocForm({ residents, onSave, onClose }) {
  const [form, setForm] = useState({ residentId: '', type: 'rent_agreement', name: '', expiry: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.residentId || !form.name) return
    onSave(form.residentId, { type: form.type, name: form.name, expiry: form.expiry || null })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Resident *</label>
        <select value={form.residentId} onChange={e => set('residentId', e.target.value)} required>
          <option value="">Select resident</option>
          {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Document Type *</label>
        <select value={form.type} onChange={e => set('type', e.target.value)}>
          {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Document Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lease Agreement 2024" required />
      </div>
      <div>
        <label className="label">Expiry Date (if applicable)</label>
        <input type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Add Document</button>
      </div>
    </form>
  )
}

export default function DocumentsScreen({ noPadTop }) {
  const { residents, addDocument, deleteDocument } = useApp()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  const allDocs = residents.flatMap(r =>
    (r.documents || []).map(d => ({ ...d, resident: r }))
  )

  const filtered = allDocs.filter(d => {
    const match = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.resident.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'expiring') return match && isExpiringSoon(d.expiry)
    if (filter === 'expired')  return match && isExpired(d.expiry)
    if (filter === 'agreements') return match && d.type === 'rent_agreement'
    return match
  })

  const expiringCount = allDocs.filter(d => isExpiringSoon(d.expiry)).length
  const expiredCount  = allDocs.filter(d => isExpired(d.expiry)).length

  const padClass = noPadTop ? 'px-4 pb-6 space-y-3' : 'screen px-4'

  return (
    <div className={padClass}>
      <div className={`max-w-lg mx-auto space-y-3${noPadTop ? '' : ' pt-5'}`}>
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="card border-niwas-line">
            <p className="text-xs text-niwas-muted flex items-center gap-2">
              <AlertTriangle size={13} />
              {expiredCount > 0 && `${expiredCount} expired`}
              {expiredCount > 0 && expiringCount > 0 && ' · '}
              {expiringCount > 0 && `${expiringCount} expiring within 30 days`}
            </p>
          </div>
        )}

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-niwas-subtle pointer-events-none" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents or residents" className="pl-10" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[['all', 'All'], ['agreements', 'Agreements'], ['expiring', 'Expiring'], ['expired', 'Expired']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${filter === v ? 'tab-active' : 'tab-inactive'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-niwas-muted">{filtered.length} doc{filtered.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary py-2 text-sm flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <FileText size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No documents found</p>
          </div>
        ) : (
          filtered.map(doc => {
            const expired  = isExpired(doc.expiry)
            const expiring = isExpiringSoon(doc.expiry)
            return (
              <div key={doc.id} className={`card ${expired || expiring ? 'border-niwas-line' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-niwas-elevated flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-niwas-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-niwas-text truncate">{doc.name}</p>
                    <p className="text-xs text-niwas-muted">{DOC_TYPES[doc.type]} · {doc.resident.name}</p>
                    {doc.expiry && (
                      <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                        expired ? 'text-niwas-muted' : expiring ? 'text-niwas-muted' : 'text-niwas-subtle'
                      }`}>
                        {(expired || expiring) && <AlertTriangle size={9} />}
                        <Calendar size={9} />
                        {expired
                          ? `Expired: ${formatDate(doc.expiry)}`
                          : expiring
                          ? `Expires: ${formatDate(doc.expiry)}`
                          : `Valid until: ${formatDate(doc.expiry)}`
                        }
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.resident.id, doc.id)}
                    className="text-niwas-subtle hover:text-niwas-muted cursor-pointer transition-colors flex-shrink-0"
                    aria-label="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Document">
        <AddDocForm residents={residents} onSave={addDocument} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
