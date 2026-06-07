export const formatINR = (amount) => {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const currentMonth = () => {
  const d = new Date()
  return { month: MONTHS[d.getMonth()], year: d.getFullYear() }
}

export const getPaymentStatus = (unit, payments, month, year) => {
  const p = payments?.find(p => p.unitId === unit.id && p.month === month && p.year === year)
  if (!p) return 'due'
  return p.status
}

export const SEED_DATA = {
  buildings: [
    {
      id: 'b1',
      name: 'Sunrise Apartments',
      address: 'Plot 12, Koramangala 4th Block, Bengaluru, Karnataka 560034',
      mapUrl: 'https://maps.google.com/?q=Koramangala+Bengaluru',
      floors: 4,
      totalUnits: 16,
      buildingCosts: { water: 8000, cleaning: 5000, security: 12000 },
      notices: [
        {
          id: 'n1', title: 'Water Supply Maintenance',
          content: 'Water supply will be interrupted on 10th June from 9AM–12PM for annual maintenance.',
          date: '2024-06-07', priority: 'high',
        },
        {
          id: 'n2', title: 'Society Meeting',
          content: 'Monthly society meeting scheduled for 15th June at 6PM in the common hall.',
          date: '2024-06-05', priority: 'normal',
        },
      ],
      units: Array.from({ length: 16 }, (_, i) => ({
        id: `u${i + 1}`,
        floor: Math.floor(i / 4) + 1,
        unitNumber: `${Math.floor(i / 4) + 1}0${(i % 4) + 1}`,
        status: i < 12 ? 'occupied' : i === 13 ? 'maintenance' : 'vacant',
        residentId: i < 12 ? `r${i + 1}` : null,
        rent: 15000 + (i % 4) * 2000,
        advance: 30000 + (i % 4) * 4000,
        maintenanceFee: 1500,
        electricityAccountNumber: `BES-2024-${1000 + i}`,
        vehicles: i < 3 ? [{ id: `v${i + 1}`, type: 'car', number: `KA01AB${1000 + i}`, model: 'Swift' }] : [],
      })),
    },
  ],
  residents: Array.from({ length: 12 }, (_, i) => ({
    id: `r${i + 1}`,
    name: ['Rajesh Kumar', 'Priya Sharma', 'Arun Nair', 'Sunita Reddy', 'Vikram Singh',
      'Meena Krishnan', 'Ravi Patel', 'Anita Desai', 'Sanjay Gupta', 'Kavitha Menon',
      'Deepak Joshi', 'Leela Bhat'][i],
    phone: `98765${43210 + i}`,
    email: `resident${i + 1}@example.com`,
    aadhaar: `XXXX-XXXX-${1000 + i}`,
    buildingId: 'b1',
    unitId: `u${i + 1}`,
    moveInDate: `2023-${String((i % 12) + 1).padStart(2,'0')}-01`,
    moveOutDate: null,
    documents: [
      { id: `d${i}1`, type: 'rent_agreement', name: 'Rent Agreement', expiry: `2025-${String((i % 12) + 1).padStart(2,'0')}-01`, uploaded: `2024-01-01` },
      { id: `d${i}2`, type: 'id_proof', name: 'Aadhaar Card', expiry: null, uploaded: `2024-01-01` },
    ],
    maintenanceRequests: i < 3 ? [
      { id: `mr${i}1`, title: 'Leaking tap', description: 'Bathroom tap is dripping', status: 'open', date: '2024-06-01' },
    ] : [],
    payments: [],
  })),
  payments: Array.from({ length: 12 }, (_, i) => ({
    id: `p${i + 1}`,
    unitId: `u${i + 1}`,
    residentId: `r${i + 1}`,
    buildingId: 'b1',
    month: 'June',
    year: 2024,
    rent: 15000 + (i % 4) * 2000,
    maintenance: 1500,
    status: i < 8 ? 'paid' : i === 8 ? 'partial' : 'due',
    paidAmount: i < 8 ? (15000 + (i % 4) * 2000 + 1500) : i === 8 ? 10000 : 0,
    date: i < 8 ? '2024-06-03' : null,
  })),
  users: [
    { id: 'admin1', name: 'Admin User', email: 'admin@niwas.app', password: 'admin123', role: 'admin', buildingId: 'b1' },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `u${i + 1}`,
      name: ['Rajesh Kumar', 'Priya Sharma', 'Arun Nair', 'Sunita Reddy', 'Vikram Singh',
        'Meena Krishnan', 'Ravi Patel', 'Anita Desai', 'Sanjay Gupta', 'Kavitha Menon',
        'Deepak Joshi', 'Leela Bhat'][i],
      email: `resident${i + 1}@example.com`,
      password: 'res123',
      role: 'resident',
      buildingId: 'b1',
      unitId: `u${i + 1}`,
      residentId: `r${i + 1}`,
    })),
  ],
}
