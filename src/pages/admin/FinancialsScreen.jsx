import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatINR, MONTHS, currentMonth } from '../../utils/helpers'
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'
import Modal from '../../components/common/Modal'

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
  const occupiedUnits = building?.units.filter(u => u.status === 'occupied') || []

  const getPayment = (unitId) =>
    payments.find(p => p.unitId === unitId && p.month === month && p.year === year)

  const statPaid    = occupiedUnits.filter(u => getPayment(u.id)?.status === 'paid').length
  const statPartial = occupiedUnits.filter(u => getPayment(u.id)?.status === 'partial').length
  const statDue     = occupiedUnits.filter(u => !getPayment(u.id) || getPayment(u.id)?.status === 'due').length

  const totalExpected  = occupiedUnits.reduce((s, u) => s + u.rent + u.maintenanceFee, 0)
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
        </div>

        {/* Unit list */}
        <div className="space-y-2">
          {occupiedUnits.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-niwas-muted">No occupied units</p>
            </div>
          ) : (
            occupiedUnits.map(unit => {
              const payment = getPayment(unit.id)
              const status  = payment?.status || 'due'
              const resident = residents.find(r => r.id === unit.residentId)
              const S = STATUS_MAP[status]

              return (
                <div key={unit.id} className="card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-niwas-text truncate">{resident?.name || `Unit ${unit.unitNumber}`}</p>
                    <p className="text-xs text-niwas-muted">Unit {unit.unitNumber} · {formatINR(unit.rent + unit.maintenanceFee)}</p>
                    {payment?.paidAmount > 0 && status === 'partial' && (
                      <p className="text-[11px] text-niwas-muted">Paid: {formatINR(payment.paidAmount)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={S.badge}>{S.label}</span>
                    <button
                      onClick={() => setPayModal({ unit: { ...unit, buildingId: building?.id }, resident })}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-niwas-elevated hover:bg-niwas-line cursor-pointer transition-colors"
                      aria-label="Record payment"
                    >
                      <Plus size={14} className="text-niwas-muted" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
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
