import { useApp } from '../../context/AppContext'
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react'
import { formatINR, formatDate, MONTHS } from '../../utils/helpers'

const STATUS_MAP = {
  paid:    { label: 'Paid',    badge: 'badge-paid',    Icon: CheckCircle2 },
  partial: { label: 'Partial', badge: 'badge-partial', Icon: Clock },
  due:     { label: 'Due',     badge: 'badge-due',     Icon: AlertCircle },
}

export default function PaymentsScreen() {
  const { currentUser, payments, buildings } = useApp()
  const building = buildings.find(b => b.id === currentUser.buildingId)
  const unit = building?.units.find(u => u.id === currentUser.unitId)

  const myPayments = payments
    .filter(p => p.unitId === currentUser.unitId)
    .sort((a, b) => {
      const ai = MONTHS.indexOf(a.month) + a.year * 12
      const bi = MONTHS.indexOf(b.month) + b.year * 12
      return bi - ai
    })

  const totalPaid = myPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.paidAmount, 0)
  const totalDue  = myPayments.filter(p => p.status !== 'paid').reduce((s, p) => {
    const t = unit ? unit.rent + unit.maintenanceFee : 0
    return s + Math.max(0, t - (p.paidAmount || 0))
  }, 0)

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center py-4">
            <p className="text-xl font-extrabold text-niwas-text">{formatINR(totalPaid)}</p>
            <p className="text-[10px] text-niwas-subtle mt-1 uppercase tracking-wider">Total Paid</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xl font-extrabold text-niwas-muted">{formatINR(Math.max(0, totalDue))}</p>
            <p className="text-[10px] text-niwas-subtle mt-1 uppercase tracking-wider">Outstanding</p>
          </div>
        </div>

        <p className="section-title">Payment History</p>

        {myPayments.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar size={32} className="text-niwas-subtle mx-auto mb-2" />
            <p className="text-sm text-niwas-muted">No payment records yet</p>
            <p className="text-xs text-niwas-subtle mt-1">Contact your admin to record payments</p>
          </div>
        ) : (
          myPayments.map(p => {
            const S = STATUS_MAP[p.status] || STATUS_MAP.due
            const total = unit ? unit.rent + unit.maintenanceFee : 0
            return (
              <div key={p.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-niwas-elevated flex items-center justify-center flex-shrink-0">
                    <S.Icon size={15} className="text-niwas-muted" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-niwas-text">{p.month} {p.year}</p>
                      <span className={S.badge}>{S.label}</span>
                    </div>
                    <p className="text-xs text-niwas-muted mt-0.5">
                      Rent {formatINR(p.rent)} + Maint. {formatINR(p.maintenance)}
                      <span className="text-niwas-subtle"> = {formatINR(total)}</span>
                    </p>
                    {p.status === 'partial' && (
                      <p className="text-xs text-niwas-muted">Paid: {formatINR(p.paidAmount)}</p>
                    )}
                    {p.date && (
                      <p className="text-[11px] text-niwas-subtle mt-0.5 flex items-center gap-1">
                        <Calendar size={9} /> {formatDate(p.date)}
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
