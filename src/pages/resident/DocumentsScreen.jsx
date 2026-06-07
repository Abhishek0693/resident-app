import { useApp } from '../../context/AppContext'
import { FileText, Calendar, AlertTriangle } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

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

export default function ResidentDocumentsScreen() {
  const { currentUser, residents } = useApp()
  const resident = residents.find(r => r.id === currentUser.residentId)
  const documents = resident?.documents || []

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        <p className="section-title">My Documents</p>

        {documents.length === 0 ? (
          <div className="card text-center py-10">
            <FileText size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No documents on file</p>
            <p className="text-xs text-niwas-subtle mt-1">Your admin will upload documents for you</p>
          </div>
        ) : (
          documents.map(doc => {
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
                    <p className="text-xs text-niwas-muted">{DOC_TYPES[doc.type] || doc.type}</p>
                    <p className="text-[11px] text-niwas-subtle mt-0.5">Uploaded: {formatDate(doc.uploaded)}</p>
                    {doc.expiry && (
                      <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                        expired || expiring ? 'text-niwas-muted' : 'text-niwas-subtle'
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
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
