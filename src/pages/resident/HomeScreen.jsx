import { useApp } from '../../context/AppContext'
import { Building2, MapPin, Zap, Car, ExternalLink } from 'lucide-react'
import { formatINR, formatDate, currentMonth } from '../../utils/helpers'

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-niwas-border last:border-0">
      <span className="text-xs text-niwas-muted">{label}</span>
      <span className="text-xs font-semibold text-niwas-text">{value}</span>
    </div>
  )
}

export default function HomeScreen() {
  const { currentUser, buildings, residents, payments } = useApp()

  const resident = residents.find(r => r.id === currentUser.residentId)
  const building = buildings.find(b => b.id === currentUser.buildingId)
  const unit = building?.units.find(u => u.id === currentUser.unitId)

  if (!resident || !unit || !building) {
    return (
      <div className="screen px-4 flex items-center justify-center">
        <p className="text-sm text-niwas-muted">No unit assigned. Contact your admin.</p>
      </div>
    )
  }

  const { month, year } = currentMonth()
  const latestPayment = payments.find(p =>
    p.unitId === currentUser.unitId && p.month === month && p.year === year
  )
  const payStatus = latestPayment?.status || 'due'
  const total = unit.rent + unit.maintenanceFee

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Welcome */}
        <div className="card">
          <p className="text-[11px] text-niwas-subtle uppercase tracking-wider mb-1">Welcome back</p>
          <h2 className="text-xl font-extrabold text-niwas-text tracking-tight">{resident.name}</h2>
          <p className="text-xs text-niwas-muted mt-0.5 flex items-center gap-1.5">
            <Building2 size={11} /> {building.name} · Unit {unit.unitNumber}
          </p>
        </div>

        {/* Rent status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-niwas-subtle uppercase tracking-wider mb-1">Rent — {month} {year}</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-niwas-text">
                  {payStatus === 'paid' ? 'Paid' : payStatus === 'partial' ? 'Partial' : 'Due'}
                </p>
                <span className={
                  payStatus === 'paid' ? 'badge-paid' :
                  payStatus === 'partial' ? 'badge-partial' : 'badge-due'
                }>
                  {payStatus === 'paid' ? '✓' : payStatus === 'partial' ? 'Partial' : 'Unpaid'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-niwas-subtle mb-1">Total</p>
              <p className="text-lg font-extrabold text-niwas-text">{formatINR(total)}</p>
            </div>
          </div>
          {payStatus === 'partial' && latestPayment?.paidAmount > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-niwas-border flex items-center justify-between text-xs">
              <span className="text-niwas-muted">Paid</span>
              <span className="font-semibold text-niwas-text">{formatINR(latestPayment.paidAmount)}</span>
              <span className="text-niwas-subtle">Balance: {formatINR(total - latestPayment.paidAmount)}</span>
            </div>
          )}
        </div>

        {/* Unit details */}
        <div className="card">
          <p className="text-[11px] text-niwas-subtle uppercase tracking-wider mb-2">Unit Details</p>
          <Row label="Unit Number"     value={unit.unitNumber} />
          <Row label="Floor"           value={`Floor ${unit.floor}`} />
          <Row label="Monthly Rent"    value={formatINR(unit.rent)} />
          <Row label="Maintenance"     value={formatINR(unit.maintenanceFee)} />
          <Row label="Security Advance" value={formatINR(unit.advance)} />
          <Row label="Move-in Date"    value={formatDate(resident.moveInDate)} />
        </div>

        {/* Electricity */}
        {unit.electricityAccountNumber && (
          <div className="card">
            <p className="text-[11px] text-niwas-subtle uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Zap size={11} /> Electricity Account
            </p>
            <p className="text-xs font-mono text-niwas-text bg-niwas-elevated rounded-xl px-3 py-2">
              {unit.electricityAccountNumber}
            </p>
          </div>
        )}

        {/* Vehicles */}
        {unit.vehicles?.length > 0 && (
          <div className="card">
            <p className="text-[11px] text-niwas-subtle uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Car size={11} /> Vehicles
            </p>
            <div className="space-y-2">
              {unit.vehicles.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-niwas-elevated rounded-xl px-3 py-2.5">
                  <p className="text-xs font-bold text-niwas-text">{v.number}</p>
                  <p className="text-[11px] text-niwas-muted capitalize">{v.type}{v.model ? ` · ${v.model}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="card">
          <p className="text-[11px] text-niwas-subtle uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <MapPin size={11} /> Address
          </p>
          <p className="text-xs text-niwas-muted leading-relaxed">{building.address}</p>
          {building.mapUrl && (
            <a href={building.mapUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 text-xs text-niwas-muted hover:text-niwas-text flex items-center gap-1.5 transition-colors">
              <ExternalLink size={11} /> Open in Maps
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
