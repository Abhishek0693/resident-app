import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateId, SEED_DATA } from '../utils/helpers'
import { notifyPaymentReceived, notifyNewNotice } from '../lib/notifications'

const AppContext = createContext(null)

// ─── helpers ─────────────────────────────────────────────────────────────────

// Map camelCase unit fields to snake_case DB columns
const unitToDb = (u) => ({
  building_id: u.buildingId,
  floor: u.floor,
  unit_number: u.unitNumber,
  status: u.status ?? 'vacant',
  rent: u.rent ?? 0,
  advance: u.advance ?? 0,
  maintenance_fee: u.maintenanceFee ?? 0,
  electricity_account_number: u.electricityAccountNumber ?? null,
})

const unitFromDb = (u) => ({
  id: u.id,
  buildingId: u.building_id,
  floor: u.floor,
  unitNumber: u.unit_number,
  status: u.status,
  rent: u.rent,
  advance: u.advance,
  maintenanceFee: u.maintenance_fee,
  electricityAccountNumber: u.electricity_account_number,
  residentId: u.resident_id ?? null,
  vehicles: [],
})

const residentToDb = (r) => ({
  name: r.name,
  phone: r.phone ?? null,
  email: r.email ?? null,
  aadhaar: r.aadhaar ?? null,
  building_id: r.buildingId,
  unit_id: r.unitId,
  move_in_date: r.moveInDate ?? null,
  renewal_date: r.renewalDate ?? null,
  renewed_rent: r.renewedRent ?? null,
  property_type: r.propertyType ?? 'rental',
  payment_timing: r.paymentTiming ?? 'after',
  occupants: r.occupants ?? 1,
})

const residentFromDb = (r) => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  aadhaar: r.aadhaar,
  buildingId: r.building_id,
  unitId: r.unit_id,
  moveInDate: r.move_in_date,
  renewalDate: r.renewal_date,
  renewedRent: r.renewed_rent,
  propertyType: r.property_type,
  paymentTiming: r.payment_timing,
  occupants: r.occupants,
  documents: r.documents ?? [],
  maintenanceRequests: r.maintenance_requests ?? [],
})

const paymentFromDb = (p) => ({
  id: p.id,
  unitId: p.unit_id,
  residentId: p.resident_id,
  buildingId: p.building_id,
  month: p.month,
  year: p.year,
  rent: p.rent,
  maintenance: p.maintenance,
  status: p.status,
  paidAmount: p.paid_amount,
  paidBy: p.paid_by,
  note: p.note,
  date: p.date,
})

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('niwas_user')) } catch { return null }
  })
  const [buildings,  setBuildings]  = useState([])
  const [residents,  setResidents]  = useState([])
  const [payments,   setPayments]   = useState([])
  const [loading,    setLoading]    = useState(true)

  // ─── Boot: load all data ────────────────────────────────────────────────────
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [bRes, uRes, rRes, pRes, dRes, mRes] = await Promise.all([
        supabase.from('buildings').select('*'),
        supabase.from('units').select('*'),
        supabase.from('residents').select('*'),
        supabase.from('payments').select('*').order('year').order('month'),
        supabase.from('documents').select('*'),
        supabase.from('maintenance_requests').select('*'),
      ])

      const units = (uRes.data ?? []).map(unitFromDb)
      const docs  = dRes.data ?? []
      const reqs  = mRes.data ?? []

      const fullResidents = (rRes.data ?? []).map(r => ({
        ...residentFromDb(r),
        documents:           docs.filter(d => d.resident_id === r.id).map(d => ({
          id: d.id, type: d.type, name: d.name, expiry: d.expiry, uploaded: d.uploaded, filePath: d.file_path,
        })),
        maintenanceRequests: reqs.filter(m => m.resident_id === r.id).map(m => ({
          id: m.id, title: m.title, description: m.description, category: m.category,
          urgency: m.urgency, status: m.status, date: m.date,
        })),
      }))

      const fullBuildings = (bRes.data ?? []).map(b => ({
        id: b.id, name: b.name, address: b.address, mapUrl: b.map_url,
        floors: b.floors, totalUnits: b.total_units,
        buildingCosts: { water: b.water_cost, cleaning: b.cleaning_cost, security: b.security_cost },
        notices: [],
        units: units.filter(u => u.buildingId === b.id).map(u => ({
          ...u,
          residentId: fullResidents.find(r => r.unitId === u.id)?.id ?? null,
        })),
      }))

      // Load notices per building
      const nRes = await supabase.from('notices').select('*').order('created_at', { ascending: false })
      const notices = nRes.data ?? []
      fullBuildings.forEach(b => {
        b.notices = notices.filter(n => n.building_id === b.id).map(n => ({
          id: n.id, title: n.title, body: n.body, priority: n.priority, date: n.date,
        }))
      })

      setBuildings(fullBuildings)
      setResidents(fullResidents)
      setPayments((pRes.data ?? []).map(paymentFromDb))
    } catch (err) {
      console.error('loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    // Fetch resident profile linked to this auth user
    const { data: resident } = await supabase
      .from('residents').select('*').eq('email', email).single()
    const user = {
      id: data.user.id, name: resident?.name ?? email, email,
      role: resident ? 'resident' : 'admin',
      buildingId: resident?.building_id, unitId: resident?.unit_id, residentId: resident?.id,
    }
    setCurrentUser(user)
    localStorage.setItem('niwas_user', JSON.stringify(user))
    return { success: true, user }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    localStorage.removeItem('niwas_user')
  }

  // ─── Buildings ──────────────────────────────────────────────────────────────
  const addBuilding = async (data) => {
    const { data: b, error } = await supabase.from('buildings').insert({
      name: data.name, address: data.address, map_url: data.mapUrl,
      floors: data.floors, total_units: data.totalUnits ?? 0,
      water_cost: data.buildingCosts?.water ?? 0,
      cleaning_cost: data.buildingCosts?.cleaning ?? 0,
      security_cost: data.buildingCosts?.security ?? 0,
    }).select().single()
    if (error) { console.error(error); return }
    const building = { ...b, notices: [], units: [], buildingCosts: { water: b.water_cost, cleaning: b.cleaning_cost, security: b.security_cost } }
    setBuildings(prev => [...prev, building])
    return building
  }

  const updateBuilding = async (id, data) => {
    const { error } = await supabase.from('buildings').update({
      name: data.name, address: data.address, map_url: data.mapUrl,
      water_cost: data.buildingCosts?.water, cleaning_cost: data.buildingCosts?.cleaning, security_cost: data.buildingCosts?.security,
    }).eq('id', id)
    if (!error) setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
  }

  const deleteBuilding = async (id) => {
    await supabase.from('buildings').delete().eq('id', id)
    setBuildings(prev => prev.filter(b => b.id !== id))
  }

  // ─── Units ──────────────────────────────────────────────────────────────────
  const addUnit = async (buildingId, unitData) => {
    const { data: u, error } = await supabase.from('units').insert(unitToDb({ ...unitData, buildingId })).select().single()
    if (error) { console.error(error); return }
    const unit = unitFromDb(u)
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, units: [...b.units, unit] } : b))
    return unit
  }

  const updateUnit = async (buildingId, unitId, data) => {
    const patch = {}
    if (data.status !== undefined)       patch.status = data.status
    if (data.rent !== undefined)         patch.rent   = data.rent
    if (data.advance !== undefined)      patch.advance = data.advance
    if (data.maintenanceFee !== undefined) patch.maintenance_fee = data.maintenanceFee
    if (data.electricityAccountNumber !== undefined) patch.electricity_account_number = data.electricityAccountNumber
    if (Object.keys(patch).length) await supabase.from('units').update(patch).eq('id', unitId)
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, units: b.units.map(u => u.id === unitId ? { ...u, ...data } : u) } : b
    ))
  }

  // ─── Residents ──────────────────────────────────────────────────────────────
  const addResident = async (data) => {
    const { data: r, error } = await supabase.from('residents').insert(residentToDb(data)).select().single()
    if (error) { console.error(error); return }
    const resident = { ...residentFromDb(r), documents: [], maintenanceRequests: [] }
    await updateUnit(data.buildingId, data.unitId, { residentId: resident.id, status: 'occupied' })

    // Create Supabase Auth user (password = phone number)
    await supabase.auth.admin?.createUser({ email: data.email, password: data.phone, email_confirm: true })
      .catch(() => {}) // admin API only works server-side; resident self-signup handled separately

    setResidents(prev => [...prev, resident])
    return resident
  }

  const updateResident = async (id, data) => {
    const patch = residentToDb(data)
    await supabase.from('residents').update(patch).eq('id', id)
    setResidents(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  }

  const removeResident = async (id) => {
    const resident = residents.find(r => r.id === id)
    if (resident) await updateUnit(resident.buildingId, resident.unitId, { residentId: null, status: 'vacant' })
    await supabase.from('residents').delete().eq('id', id)
    setResidents(prev => prev.filter(r => r.id !== id))
  }

  // ─── Payments ───────────────────────────────────────────────────────────────
  const addPayment = async (data) => {
    const row = {
      unit_id: data.unitId, resident_id: data.residentId, building_id: data.buildingId,
      month: data.month, year: data.year, rent: data.rent, maintenance: data.maintenance,
      status: data.status, paid_amount: data.paidAmount, paid_by: data.paidBy ?? null,
      note: data.note ?? null, date: new Date().toISOString().slice(0, 10),
    }
    const { data: p, error } = await supabase.from('payments').upsert(row, {
      onConflict: 'unit_id,month,year',
    }).select().single()
    if (error) { console.error(error); return }
    const payment = paymentFromDb(p)
    setPayments(prev => {
      const idx = prev.findIndex(x => x.unitId === data.unitId && x.month === data.month && x.year === data.year)
      if (idx >= 0) { const u = [...prev]; u[idx] = payment; return u }
      return [...prev, payment]
    })
    // Send payment notification
    if (data.status === 'paid' || data.status === 'partial') {
      const resident = residents.find(r => r.id === data.residentId)
      const building = buildings.find(b => b.id === data.buildingId)
      const unit = building?.units.find(u => u.id === data.unitId)
      if (resident && unit) notifyPaymentReceived({ resident, unit, month: data.month, year: data.year, amount: data.paidAmount })
    }
    return payment
  }

  // ─── Notices ────────────────────────────────────────────────────────────────
  const addNotice = async (buildingId, data) => {
    const { data: n, error } = await supabase.from('notices').insert({
      building_id: buildingId, title: data.title, body: data.body,
      priority: data.priority ?? 'normal', date: new Date().toISOString().slice(0, 10),
    }).select().single()
    if (error) { console.error(error); return }
    const notice = { id: n.id, title: n.title, body: n.body, priority: n.priority, date: n.date }
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, notices: [notice, ...b.notices] } : b))
    const buildingResidents = residents.filter(r => r.buildingId === buildingId)
    notifyNewNotice({ residents: buildingResidents, notice })
    return notice
  }

  const deleteNotice = async (buildingId, noticeId) => {
    await supabase.from('notices').delete().eq('id', noticeId)
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, notices: b.notices.filter(n => n.id !== noticeId) } : b
    ))
  }

  // ─── Maintenance Requests ────────────────────────────────────────────────────
  const addMaintenanceRequest = async (residentId, data) => {
    const { data: m, error } = await supabase.from('maintenance_requests').insert({
      resident_id: residentId, title: data.title, description: data.description,
      category: data.category, urgency: data.urgency ?? 'normal',
      status: 'open', date: new Date().toISOString().slice(0, 10),
    }).select().single()
    if (error) { console.error(error); return }
    const req = { id: m.id, title: m.title, description: m.description, category: m.category, urgency: m.urgency, status: m.status, date: m.date }
    setResidents(prev => prev.map(r => r.id === residentId ? { ...r, maintenanceRequests: [...r.maintenanceRequests, req] } : r))
    return req
  }

  const updateMaintenanceRequest = async (residentId, reqId, data) => {
    await supabase.from('maintenance_requests').update({ status: data.status, ...data }).eq('id', reqId)
    setResidents(prev => prev.map(r =>
      r.id === residentId
        ? { ...r, maintenanceRequests: r.maintenanceRequests.map(m => m.id === reqId ? { ...m, ...data } : m) }
        : r
    ))
  }

  // ─── Documents ──────────────────────────────────────────────────────────────
  const addDocument = async (residentId, data) => {
    const { data: d, error } = await supabase.from('documents').insert({
      resident_id: residentId, type: data.type, name: data.name,
      expiry: data.expiry ?? null, file_path: data.filePath ?? null,
      uploaded: new Date().toISOString().slice(0, 10),
    }).select().single()
    if (error) { console.error(error); return }
    const doc = { id: d.id, type: d.type, name: d.name, expiry: d.expiry, uploaded: d.uploaded, filePath: d.file_path }
    setResidents(prev => prev.map(r => r.id === residentId ? { ...r, documents: [...r.documents, doc] } : r))
    return doc
  }

  const deleteDocument = async (residentId, docId) => {
    await supabase.from('documents').delete().eq('id', docId)
    setResidents(prev => prev.map(r =>
      r.id === residentId ? { ...r, documents: r.documents.filter(d => d.id !== docId) } : r
    ))
  }

  const value = {
    currentUser, login, logout, loading,
    buildings, addBuilding, updateBuilding, deleteBuilding,
    residents, addResident, updateResident, removeResident,
    payments, addPayment,
    addUnit, updateUnit,
    addNotice, deleteNotice,
    addMaintenanceRequest, updateMaintenanceRequest,
    addDocument, deleteDocument,
    reload: loadAll,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
