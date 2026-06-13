import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatINR, MONTHS, currentMonth } from '../../utils/helpers'
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'
import Modal from '../../components/common/Modal'

const fmtShort = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

const getRenewalInfo = (renewalDate) => {
  if (!renewalDate) return null
  const renewal = new Date(renewalDate)
  const today = new Date()
  const diff = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24))
  const isOverdue = diff < 0
  const isSoon = diff >= 0 && diff <= 30
  const totalMonths = (renewal.getFullYear() - today.getFullYear()) * 12 + (renewal.getMonth() - today.getMonth())
  const months = Math.max(0, totalMonths)
  const days = Math.max(0, diff - months * 30)
  const timeLeft = months > 0
    ? (days > 0 ? `${months}mo ${days}d` : `${months}mo`)
    : diff > 0 ? `${diff}d` : 'Overdue'
  return { date: fmtShort(renewal), daysLeft: diff, months, timeLeft, isOverdue, isSoon }
}

const effectiveRent = (baseRent, renewalDate, renewedRent) => {
  if (!renewalDate || baseRent === 0) return baseRent
  const isExpired = new Date(renewalDate) < new Date()
  if (!isExpired) return baseRent
  return renewedRent || Math.round(baseRent * 1.05)
}

const renewedAmount = (baseRent, renewedRent) =>
  baseRent > 0 ? (renewedRent || Math.round(baseRent * 1.05)) : 0

const STATUS_MAP = {
  paid:    { label: 'Paid',    badge: 'badge-paid',    icon: CheckCircle2 },
  due:     { label: 'Due',     badge: 'badge-due',     icon: AlertCircle },
  partial: { label: 'Partial', badge: 'badge-partial', icon: Clock },
}

function PaymentModal({ unit, resident, month, year, existing, onSave, onClose }) {
  const total = unit.rent + unit.maintenanceFee
  const [form, setForm] = useState({
    status: existing?.status || 'paid',
    paidAmount: existing?.paidAmount ?? total,
    note: existing?.note || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      unitId: unit.id, residentId: resident?.id, buildingId: unit.buildingId,
      month, year, rent: unit.rent, maintenance: unit.maintenanceFee,
      ...form, paidAmount: Number(form.paidAmount),
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="card bg-niwas-elevated text-center py-4">
        <p className="text-xs text-niwas-muted">Unit {unit.unitNumber} · {resident?.name || 'Vacant'}</p>
        <p className="text-xl font-extrabold text-niwas-text mt-1">{formatINR(total)}</p>
        <p className="text-[11px] text-niwas-subtle">Rent {formatINR(unit.rent)} + Maint. {formatINR(unit.maintenanceFee)}</p>
      </div>
      <div>
        <label className="label">Status</label>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="due">Due</option>
        </select>
      </div>
      <div>
        <label className="label">Amount Paid (₹)</label>
        <input type="number" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} />
      </div>
      <div>
        <label className="label">Note</label>
        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">Save Payment</button>
      </div>
    </form>
  )
}

export default function FinancialsScreen() {
  const { buildings, residents, payments, addPayment } = useApp()
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]?.id || '')
  const [month, setMonth] = useState(currentMonth().month)
  const [year, setYear] = useState(currentMonth().year)
  const [payModal, setPayModal] = useState(null)

  const building = buildings.find(b => b.id === selectedBuilding)
  const occupiedUnits = (building?.units.filter(u => u.status === 'occupied') || [])
    .sort((a, b) => {
      const aLease = residents.find(r => r.id === a.residentId)?.propertyType === 'lease' ? 1 : 0
      const bLease = residents.find(r => r.id === b.residentId)?.propertyType === 'lease' ? 1 : 0
      return aLease - bLease
    })

  const getPayment = (unitId) =>
    payments.find(p => p.unitId === unitId && p.month === month && p.year === year)

  const statPaid    = occupiedUnits.filter(u => getPayment(u.id)?.status === 'paid').length
  const statPartial = occupiedUnits.filter(u => getPayment(u.id)?.status === 'partial').length
  const statDue     = occupiedUnits.filter(u => !getPayment(u.id) || getPayment(u.id)?.status === 'due').length

  const totalRentExpected = occupiedUnits.reduce((s, u) => {
    const res = residents.find(r => r.id === u.residentId)
    return s + effectiveRent(u.rent, res?.renewalDate, res?.renewedRent)
  }, 0)
  const totalMaintExpected = occupiedUnits.reduce((s, u) => s + u.maintenanceFee, 0)
  const totalExpected = totalRentExpected + totalMaintExpected
  const totalCollected = payments
    .filter(p => p.month === month && p.year === year && p.buildingId === selectedBuilding)
    .reduce((s, p) => s + (p.paidAmount || 0), 0)

  const pct = totalExpected > 0 ? Math.min(100, (totalCollected / totalExpected) * 100) : 0

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Building + Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Building</label>
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Month tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {MONTHS.map(m => (
            <button key={m} onClick={() => setMonth(m)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                ${month === m ? 'tab-active' : 'tab-inactive'}`}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Paid',    value: statPaid,    cls: 'text-niwas-text' },
            { label: 'Partial', value: statPartial, cls: 'text-niwas-muted' },
            { label: 'Due',     value: statDue,     cls: 'text-niwas-subtle' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3 px-2">
              <p className={`text-xl font-extrabold ${s.cls}`}>{s.value}</p>
              <p className="text-[10px] text-niwas-subtle mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-niwas-text">Collection — {month} {year}</p>
            <p className="text-sm font-bold text-niwas-text">{formatINR(totalCollected)}</p>
          </div>
          <div className="w-full bg-niwas-elevated rounded-full h-1.5">
            <div
              className="bg-niwas-primary h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-niwas-subtle mt-1.5 text-right">of {formatINR(totalExpected)} expected</p>
          <div className="flex justify-between mt-3 pt-3 border-t border-niwas-border">
            <div className="text-center">
              <p className="text-[10px] text-niwas-subtle uppercase tracking-widest">Rent</p>
              <p className="text-xs font-bold text-niwas-text mt-0.5">{formatINR(totalRentExpected)}</p>
            </div>
            <div className="w-px bg-niwas-border" />
            <div className="text-center">
              <p className="text-[10px] text-niwas-subtle uppercase tracking-widest">Maintenance</p>
              <p className="text-xs font-bold text-niwas-text mt-0.5">{formatINR(totalMaintExpected)}</p>
            </div>
            <div className="w-px bg-niwas-border" />
            <div className="text-center">
              <p className="text-[10px] text-niwas-subtle uppercase tracking-widest">Total</p>
              <p className="text-xs font-bold text-niwas-text mt-0.5">{formatINR(totalExpected)}</p>
            </div>
          </div>
        </div>

        {/* Unit table */}
        {/* cols: # | Tenant | Advance | Rent | Maint | Total | Renews | Status | + */}
        <div className="card p-0 overflow-x-auto">
          <div style={{ minWidth: '844px' }}>
          {/* Header */}
          <div className="grid text-[10px] font-semibold uppercase tracking-widest text-niwas-subtle border-b-2 border-niwas-line"
               style={{ gridTemplateColumns: '20px 88px 64px 64px 56px 64px 76px 64px 64px 48px 28px' }}>
            {[
              { label: '#',        cls: '' },
              { label: 'Tenant',   cls: '' },
              { label: 'Advance',  cls: 'text-right' },
              { label: 'Rent',     cls: 'text-right' },
              { label: 'Maint',    cls: 'text-right' },
              { label: 'Total',    cls: 'text-right' },
              { label: 'Renews',   cls: 'text-center' },
              { label: 'Renewed',   cls: 'text-right' },
              { label: 'New Total', cls: 'text-right' },
              { label: 'Status',    cls: 'text-center' },
              { label: '',         cls: '', last: true },
            ].map(({ label, cls, last }, i) => (
              <span key={i} className={`${cls} px-2 py-2.5 ${!last ? 'border-r border-niwas-border' : ''}`}>{label}</span>
            ))}
          </div>

          {occupiedUnits.length === 0 ? (
            <p className="text-sm text-niwas-muted text-center py-8">No occupied units</p>
          ) : (
            occupiedUnits.map((unit, idx) => {
              const payment = getPayment(unit.id)
              const status  = payment?.status || 'due'
              const resident = residents.find(r => r.id === unit.residentId)
              const S = STATUS_MAP[status]
              const isLast = idx === occupiedUnits.length - 1

              const renewInfo = getRenewalInfo(resident?.renewalDate)
              const rent = effectiveRent(unit.rent, resident?.renewalDate, resident?.renewedRent)
              const isRevised = rent !== unit.rent

              const cell = 'border-r border-niwas-border flex items-center'
              const cellLast = 'flex items-center'
              return (
                <div
                  key={unit.id}
                  className="grid items-stretch border-b border-niwas-border"
                  style={{ gridTemplateColumns: '20px 88px 64px 64px 56px 64px 76px 64px 64px 48px 28px' }}
                >
                  {/* # */}
                  <div className={`${cell} px-2 py-3`}>
                    <span className="text-[11px] font-bold text-niwas-subtle">{idx + 1}</span>
                  </div>

                  {/* Tenant */}
                  <div className={`${cell} px-2 py-3 min-w-0`}>
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-bold text-niwas-text truncate">
                        {payment?.paidBy || resident?.name || `Unit ${unit.unitNumber}`}
                      </p>
                      {payment?.paidBy && payment.paidBy !== resident?.name ? (
                        <p className="text-[10px] text-niwas-subtle truncate">prev · U{unit.unitNumber}</p>
                      ) : (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-niwas-subtle">U{unit.unitNumber}</span>
                          {resident?.propertyType === 'lease' && <span className="badge-partial">Lease</span>}
                          <span className="badge-info">{resident?.paymentTiming === 'before' ? 'Pre' : 'Post'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advance */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <span className="text-[11px] text-niwas-muted">{unit.advance > 0 ? formatINR(unit.advance) : '—'}</span>
                  </div>

                  {/* Rent */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <div className="text-right">
                      {isRevised && (
                        <p className="text-[10px] text-niwas-subtle line-through leading-none">{formatINR(unit.rent)}</p>
                      )}
                      <span className={`text-[11px] font-medium ${isRevised ? 'text-white' : 'text-niwas-muted'}`}>
                        {rent > 0 ? formatINR(rent) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Maint */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <span className="text-[11px] text-niwas-muted">{formatINR(unit.maintenanceFee)}</span>
                  </div>

                  {/* Total */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <span className="text-[11px] font-semibold text-niwas-text">{formatINR(rent + unit.maintenanceFee)}</span>
                  </div>

                  {/* Renews */}
                  <div className={`${cell} px-2 py-3 justify-center`}>
                    {renewInfo ? (
                      <div className="text-center">
                        <p className={`text-[11px] font-medium ${renewInfo.isOverdue ? 'text-white' : renewInfo.isSoon ? 'text-niwas-text' : 'text-niwas-muted'}`}>
                          {renewInfo.date}
                        </p>
                        <p className={`text-[10px] ${renewInfo.isOverdue ? 'text-niwas-subtle' : renewInfo.isSoon ? 'text-niwas-muted' : 'text-niwas-subtle'}`}>
                          {renewInfo.isOverdue ? '+5% applied' : renewInfo.timeLeft + ' left'}
                        </p>
                      </div>
                    ) : <span className="text-[11px] text-niwas-subtle">—</span>}
                  </div>

                  {/* Renewed rent */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <span className="text-[11px] text-niwas-subtle">
                      {unit.rent > 0 ? formatINR(renewedAmount(unit.rent, resident?.renewedRent)) : '—'}
                    </span>
                  </div>

                  {/* New Total (renewed rent + maint) */}
                  <div className={`${cell} px-2 py-3 justify-end`}>
                    <span className="text-[11px] font-semibold text-niwas-muted">
                      {unit.rent > 0 ? formatINR(renewedAmount(unit.rent, resident?.renewedRent) + unit.maintenanceFee) : formatINR(unit.maintenanceFee)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className={`${cell} px-2 py-3 justify-center`}>
                    <span className={S.badge}>{S.label}</span>
                  </div>

                  {/* Action */}
                  <div className={`${cellLast} px-1 py-3 justify-center`}>
                    <button
                      onClick={() => setPayModal({ unit: { ...unit, rent, buildingId: building?.id }, resident })}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-niwas-elevated hover:bg-niwas-line cursor-pointer transition-colors"
                      aria-label="Record payment"
                    >
                      <Plus size={13} className="text-niwas-muted" />
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {/* Totals footer */}
          {occupiedUnits.length > 0 && (() => {
            const totRent  = occupiedUnits.reduce((s, u) => {
              const res = residents.find(r => r.id === u.residentId)
              return s + effectiveRent(u.rent, res?.renewalDate, res?.renewedRent)
            }, 0)
            const totMaint = occupiedUnits.reduce((s, u) => s + u.maintenanceFee, 0)
            const totRenewed = occupiedUnits.reduce((s, u) => {
              const res = residents.find(r => r.id === u.residentId)
              return s + (u.rent > 0 ? renewedAmount(u.rent, res?.renewedRent) : 0)
            }, 0)
            const totNewTotal = occupiedUnits.reduce((s, u) => {
              const res = residents.find(r => r.id === u.residentId)
              return s + (u.rent > 0 ? renewedAmount(u.rent, res?.renewedRent) : 0) + u.maintenanceFee
            }, 0)
            return (
              <div className="grid items-stretch border-t-2 border-niwas-line bg-niwas-elevated rounded-b-2xl"
                   style={{ gridTemplateColumns: '20px 88px 64px 64px 56px 64px 76px 64px 64px 48px 28px' }}>
                {[
                  <span />,
                  <span className="text-[10px] font-bold text-niwas-muted uppercase tracking-widest">Total</span>,
                  <span />,
                  <span className="text-[11px] font-bold text-niwas-text text-right">{formatINR(totRent)}</span>,
                  <span className="text-[11px] font-bold text-niwas-text text-right">{formatINR(totMaint)}</span>,
                  <span className="text-[11px] font-extrabold text-niwas-text text-right">{formatINR(totRent + totMaint)}</span>,
                  <span />,
                  <span className="text-[11px] font-bold text-niwas-muted text-right">{formatINR(totRenewed)}</span>,
                  <span className="text-[11px] font-extrabold text-niwas-text text-right">{formatINR(totNewTotal)}</span>,
                  <span />, <span />,
                ].map((child, i, arr) => (
                  <div key={i} className={`flex items-center px-2 py-2.5 ${i < arr.length - 1 ? 'border-r border-niwas-border' : ''} ${[3,4,5,7,8].includes(i) ? 'justify-end' : ''}`}>
                    {child}
                  </div>
                ))}
              </div>
            )
          })()}
          </div>
        </div>
      </div>

      {payModal && (
        <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Record Payment">
          <PaymentModal
            unit={payModal.unit} resident={payModal.resident}
            month={month} year={year}
            existing={getPayment(payModal.unit.id)}
            onSave={addPayment}
            onClose={() => setPayModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
