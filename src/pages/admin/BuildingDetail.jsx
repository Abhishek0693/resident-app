import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { MapPin, ExternalLink, Edit2, Check, X, Droplets, Shield, Brush } from 'lucide-react'
import { formatINR } from '../../utils/helpers'
import UnitDetail from './UnitDetail'

const STATUS_STYLES = {
  occupied: 'bg-niwas-elevated border-niwas-line text-niwas-text',
  vacant:   'bg-niwas-card border-niwas-border text-niwas-subtle',
  maintenance: 'bg-niwas-elevated border-white/20 text-niwas-muted',
}

function UnitCell({ unit, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-xl p-2 text-center transition-all duration-150 active:scale-95 cursor-pointer
        ${STATUS_STYLES[unit.status]}`}
      aria-label={`Unit ${unit.unitNumber} — ${unit.status}`}
    >
      <p className="text-xs font-bold leading-none">{unit.unitNumber}</p>
      <p className="text-[9px] mt-1 capitalize opacity-60">{unit.status}</p>
    </button>
  )
}

function CostEditor({ costs, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(costs)

  if (!editing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-niwas-text">Building Costs</h3>
          <button onClick={() => setEditing(true)} className="text-niwas-subtle hover:text-niwas-text cursor-pointer transition-colors" aria-label="Edit costs">
            <Edit2 size={14} />
          </button>
        </div>
        <div className="space-y-2">
          <CostRow icon={<Droplets size={13} />} label="Water" value={formatINR(costs.water)} />
          <CostRow icon={<Brush size={13} />} label="Cleaning" value={formatINR(costs.cleaning)} />
          <CostRow icon={<Shield size={13} />} label="Security" value={formatINR(costs.security)} />
          <div className="border-t border-niwas-border pt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-niwas-text">Total / month</span>
            <span className="text-sm font-bold text-niwas-text">{formatINR((costs.water || 0) + (costs.cleaning || 0) + (costs.security || 0))}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-niwas-text">Edit Building Costs</h3>
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="text-niwas-subtle hover:text-niwas-muted cursor-pointer"><X size={15} /></button>
          <button onClick={() => { onSave(form); setEditing(false) }} className="text-niwas-text hover:text-white cursor-pointer"><Check size={15} /></button>
        </div>
      </div>
      {['water', 'cleaning', 'security'].map(k => (
        <div key={k} className="mb-3">
          <label className="label capitalize">{k} (₹/month)</label>
          <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: parseInt(e.target.value) || 0 }))} />
        </div>
      ))}
    </div>
  )
}

function CostRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-niwas-muted">{icon}{label}</span>
      <span className="font-semibold text-niwas-text">{value}</span>
    </div>
  )
}

export default function BuildingDetail({ buildingId, onBack }) {
  const { buildings, updateBuilding } = useApp()
  const [selectedUnitId, setSelectedUnitId] = useState(null)

  const building = buildings.find(b => b.id === buildingId)
  if (!building) return null

  if (selectedUnitId) {
    return <UnitDetail buildingId={buildingId} unitId={selectedUnitId} onBack={() => setSelectedUnitId(null)} />
  }

  const floorNums = [...new Set(building.units.map(u => u.floor))].sort()

  const counts = {
    occupied: building.units.filter(u => u.status === 'occupied').length,
    vacant: building.units.filter(u => u.status === 'vacant').length,
    maintenance: building.units.filter(u => u.status === 'maintenance').length,
  }

  return (
    <div className="screen px-4">
      <div className="max-w-lg mx-auto space-y-3 pt-5">
        {/* Address */}
        <div className="card">
          <p className="text-xs text-niwas-muted flex items-start gap-2 leading-relaxed">
            <MapPin size={13} className="flex-shrink-0 mt-0.5" />
            {building.address}
          </p>
          {building.mapUrl && (
            <a href={building.mapUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 text-xs text-niwas-muted hover:text-niwas-text flex items-center gap-1.5 transition-colors">
              <ExternalLink size={11} /> Open in Maps
            </a>
          )}
        </div>

        {/* Unit count summary */}
        <div className="grid grid-cols-3 gap-2">
          {[['Occupied', counts.occupied], ['Vacant', counts.vacant], ['Maintenance', counts.maintenance]].map(([l, v]) => (
            <div key={l} className="card text-center py-2.5 px-2">
              <p className="text-base font-bold text-niwas-text">{v}</p>
              <p className="text-[10px] text-niwas-subtle">{l}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-niwas-muted px-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-niwas-line bg-niwas-elevated inline-block" />Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-niwas-border bg-niwas-card inline-block" />Vacant</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-white/20 bg-niwas-elevated inline-block" />Maintenance</span>
        </div>

        {/* Floor grids */}
        {floorNums.map(floor => {
          const floorUnits = building.units.filter(u => u.floor === floor)
          return (
            <div key={floor} className="card">
              <p className="text-[11px] font-semibold text-niwas-subtle mb-2.5 uppercase tracking-wider">Floor {floor}</p>
              <div className="grid grid-cols-4 gap-2">
                {floorUnits.map(unit => (
                  <UnitCell key={unit.id} unit={unit} onClick={() => setSelectedUnitId(unit.id)} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Building costs */}
        <CostEditor
          costs={building.buildingCosts}
          onSave={costs => updateBuilding(buildingId, { buildingCosts: costs })}
        />
      </div>
    </div>
  )
}
