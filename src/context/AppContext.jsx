import { createContext, useContext, useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId, SEED_DATA } from '../utils/helpers'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useLocalStorage('niwas_user', null)
  const [buildings, setBuildings] = useLocalStorage('niwas_buildings', SEED_DATA.buildings)
  const [residents, setResidents] = useLocalStorage('niwas_residents', SEED_DATA.residents)
  const [payments, setPayments] = useLocalStorage('niwas_payments', SEED_DATA.payments)
  const [users, setUsers] = useLocalStorage('niwas_users', SEED_DATA.users)

  const login = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password)
    if (user) { setCurrentUser(user); return { success: true, user } }
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => setCurrentUser(null)

  // ─── Buildings ───────────────────────────────────────────────
  const addBuilding = (data) => {
    const building = {
      id: generateId(), notices: [], units: [], buildingCosts: { water: 0, cleaning: 0, security: 0 },
      ...data,
    }
    setBuildings(prev => [...prev, building])
    return building
  }

  const updateBuilding = (id, data) =>
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))

  const deleteBuilding = (id) => setBuildings(prev => prev.filter(b => b.id !== id))

  // ─── Units ───────────────────────────────────────────────────
  const updateUnit = (buildingId, unitId, data) =>
    setBuildings(prev => prev.map(b =>
      b.id === buildingId
        ? { ...b, units: b.units.map(u => u.id === unitId ? { ...u, ...data } : u) }
        : b
    ))

  const addUnit = (buildingId, unitData) => {
    const unit = { id: generateId(), vehicles: [], ...unitData }
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, units: [...b.units, unit] } : b
    ))
    return unit
  }

  // ─── Residents ───────────────────────────────────────────────
  const addResident = (data) => {
    const resident = { id: generateId(), documents: [], maintenanceRequests: [], payments: [], ...data }
    setResidents(prev => [...prev, resident])
    updateUnit(data.buildingId, data.unitId, { residentId: resident.id, status: 'occupied' })
    const user = {
      id: generateId(), name: data.name, email: data.email,
      password: data.phone, role: 'resident',
      buildingId: data.buildingId, unitId: data.unitId, residentId: resident.id,
    }
    setUsers(prev => [...prev, user])
    return resident
  }

  const updateResident = (id, data) =>
    setResidents(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))

  const removeResident = (id) => {
    const resident = residents.find(r => r.id === id)
    if (resident) {
      updateUnit(resident.buildingId, resident.unitId, { residentId: null, status: 'vacant' })
      setUsers(prev => prev.filter(u => u.residentId !== id))
    }
    setResidents(prev => prev.filter(r => r.id !== id))
  }

  // ─── Payments ────────────────────────────────────────────────
  const addPayment = (data) => {
    const payment = { id: generateId(), date: new Date().toISOString().slice(0, 10), ...data }
    setPayments(prev => {
      const existing = prev.findIndex(p =>
        p.unitId === data.unitId && p.month === data.month && p.year === data.year)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], ...payment }
        return updated
      }
      return [...prev, payment]
    })
    return payment
  }

  // ─── Notices ─────────────────────────────────────────────────
  const addNotice = (buildingId, data) => {
    const notice = { id: generateId(), date: new Date().toISOString().slice(0, 10), ...data }
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, notices: [notice, ...b.notices] } : b
    ))
    return notice
  }

  const deleteNotice = (buildingId, noticeId) =>
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, notices: b.notices.filter(n => n.id !== noticeId) } : b
    ))

  // ─── Maintenance Requests ────────────────────────────────────
  const addMaintenanceRequest = (residentId, data) => {
    const req = { id: generateId(), date: new Date().toISOString().slice(0, 10), status: 'open', ...data }
    setResidents(prev => prev.map(r =>
      r.id === residentId ? { ...r, maintenanceRequests: [...r.maintenanceRequests, req] } : r
    ))
    return req
  }

  const updateMaintenanceRequest = (residentId, reqId, data) =>
    setResidents(prev => prev.map(r =>
      r.id === residentId
        ? { ...r, maintenanceRequests: r.maintenanceRequests.map(m => m.id === reqId ? { ...m, ...data } : m) }
        : r
    ))

  // ─── Documents ───────────────────────────────────────────────
  const addDocument = (residentId, data) => {
    const doc = { id: generateId(), uploaded: new Date().toISOString().slice(0, 10), ...data }
    setResidents(prev => prev.map(r =>
      r.id === residentId ? { ...r, documents: [...r.documents, doc] } : r
    ))
    return doc
  }

  const deleteDocument = (residentId, docId) =>
    setResidents(prev => prev.map(r =>
      r.id === residentId ? { ...r, documents: r.documents.filter(d => d.id !== docId) } : r
    ))

  const value = {
    currentUser, login, logout,
    buildings, addBuilding, updateBuilding, deleteBuilding,
    residents, addResident, updateResident, removeResident,
    payments, addPayment,
    users,
    addUnit, updateUnit,
    addNotice, deleteNotice,
    addMaintenanceRequest, updateMaintenanceRequest,
    addDocument, deleteDocument,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
