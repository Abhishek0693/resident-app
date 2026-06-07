import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Bell, Plus, Trash2, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import Modal from '../../components/common/Modal'

const PRIORITY_BADGE = {
  high:   'badge-due',
  normal: 'badge-info',
  low:    'badge-info',
}

function AddNoticeForm({ buildings, onSave, onClose }) {
  const [form, setForm] = useState({ buildingId: buildings[0]?.id || '', title: '', content: '', priority: 'normal' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.content || !form.buildingId) return
    onSave(form.buildingId, { title: form.title, content: form.content, priority: form.priority })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Building *</label>
        <select value={form.buildingId} onChange={e => set('buildingId', e.target.value)} required>
          {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notice title" required />
      </div>
      <div>
        <label className="label">Content *</label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write notice content…" rows={4} required />
      </div>
      <div>
        <label className="label">Priority</label>
        <select value={form.priority} onChange={e => set('priority', e.target.value)}>
          <option value="low">Low — Informational</option>
          <option value="normal">Normal — Notice</option>
          <option value="high">High — Urgent</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Post Notice</button>
      </div>
    </form>
  )
}

export default function NoticesScreen({ noPadTop }) {
  const { buildings, addNotice, deleteNotice } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState('all')

  const allNotices = buildings.flatMap(b =>
    (b.notices || []).map(n => ({ ...n, buildingId: b.id, buildingName: b.name }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date))

  const filtered = selectedBuilding === 'all'
    ? allNotices
    : allNotices.filter(n => n.buildingId === selectedBuilding)

  const padClass = noPadTop ? 'px-4 pb-6' : 'screen px-4'

  return (
    <div className={padClass}>
      <div className={`max-w-lg mx-auto space-y-3${noPadTop ? '' : ' pt-5'}`}>
        {/* Building filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedBuilding('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
              ${selectedBuilding === 'all' ? 'tab-active' : 'tab-inactive'}`}
          >
            All
          </button>
          {buildings.map(b => (
            <button key={b.id} onClick={() => setSelectedBuilding(b.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${selectedBuilding === b.id ? 'tab-active' : 'tab-inactive'}`}>
              {b.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-niwas-muted">{filtered.length} notice{filtered.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary py-2 text-sm flex items-center gap-1.5">
            <Plus size={14} /> Post
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <Bell size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No notices posted</p>
          </div>
        ) : (
          filtered.map(notice => (
            <div key={notice.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={PRIORITY_BADGE[notice.priority]}>{
                      notice.priority === 'high' ? 'Urgent' : notice.priority === 'normal' ? 'Notice' : 'Info'
                    }</span>
                    <span className="text-[11px] text-niwas-subtle">{notice.buildingName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-niwas-text">{notice.title}</h3>
                  <p className="text-xs text-niwas-muted mt-1 leading-relaxed">{notice.content}</p>
                  <p className="text-[11px] text-niwas-subtle mt-2 flex items-center gap-1">
                    <Calendar size={9} /> {formatDate(notice.date)}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotice(notice.buildingId, notice.id)}
                  className="text-niwas-subtle hover:text-niwas-muted cursor-pointer transition-colors flex-shrink-0"
                  aria-label="Delete notice"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Post Notice">
        <AddNoticeForm buildings={buildings} onSave={addNotice} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
