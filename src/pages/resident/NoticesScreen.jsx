import { useApp } from '../../context/AppContext'
import { Bell, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ResidentNoticesScreen() {
  const { currentUser, buildings } = useApp()
  const building = buildings.find(b => b.id === currentUser.buildingId)
  const notices = [...(building?.notices || [])].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        <div className="card">
          <p className="text-xs text-niwas-muted flex items-center gap-2">
            <Bell size={13} className="flex-shrink-0" />
            {building?.name} — Notice Board
          </p>
        </div>

        {notices.length === 0 ? (
          <div className="card text-center py-10">
            <Bell size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No notices posted</p>
          </div>
        ) : (
          notices.map(n => (
            <div key={n.id} className={`card ${n.priority === 'high' ? 'border-niwas-line' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={n.priority === 'high' ? 'badge-due' : 'badge-info'}>
                  {n.priority === 'high' ? 'Urgent' : n.priority === 'normal' ? 'Notice' : 'Info'}
                </span>
                <span className="text-[11px] text-niwas-subtle flex items-center gap-1">
                  <Calendar size={9} /> {formatDate(n.date)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-niwas-text">{n.title}</h3>
              <p className="text-xs text-niwas-muted mt-1 leading-relaxed">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
