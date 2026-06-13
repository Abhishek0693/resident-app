import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wbifnfazlmxtzlyxclke.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

const BUILDING_ID = 'b2000000-0000-0000-0000-000000000001'

const units = [
  { id: 'c0000000-0000-0000-0000-000000000001', floor: 0, unit_number: 'G01', rent: 0,     advance: 500000, maintenance_fee: 900  },
  { id: 'c0000000-0000-0000-0000-000000000002', floor: 0, unit_number: 'G02', rent: 9300,  advance: 30000,  maintenance_fee: 1100 },
  { id: 'c0000000-0000-0000-0000-000000000003', floor: 1, unit_number: '101', rent: 8750,  advance: 40000,  maintenance_fee: 700  },
  { id: 'c0000000-0000-0000-0000-000000000004', floor: 1, unit_number: '102', rent: 10900, advance: 40000,  maintenance_fee: 1100 },
  { id: 'c0000000-0000-0000-0000-000000000005', floor: 1, unit_number: '103', rent: 9150,  advance: 40000,  maintenance_fee: 500  },
  { id: 'c0000000-0000-0000-0000-000000000006', floor: 2, unit_number: '201', rent: 9500,  advance: 40000,  maintenance_fee: 700  },
  { id: 'c0000000-0000-0000-0000-000000000007', floor: 2, unit_number: '202', rent: 9400,  advance: 30000,  maintenance_fee: 700  },
  { id: 'c0000000-0000-0000-0000-000000000008', floor: 2, unit_number: '203', rent: 0,     advance: 400000, maintenance_fee: 500  },
  { id: 'c0000000-0000-0000-0000-000000000009', floor: 3, unit_number: '301', rent: 9700,  advance: 30000,  maintenance_fee: 900  },
]

const residents = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'Luke',       phone: '9999900008', email: 'luke@niwas.local',       unit_id: 'c0000000-0000-0000-0000-000000000001', move_in_date: '2026-03-03', renewal_date: '2027-03-03', renewed_rent: null,  property_type: 'lease',  payment_timing: 'after',  occupants: 1 },
  { id: 'd0000000-0000-0000-0000-000000000002', name: 'Naresh',     phone: '9999900001', email: 'naresh@niwas.local',     unit_id: 'c0000000-0000-0000-0000-000000000002', move_in_date: '2026-01-01', renewal_date: '2026-12-01', renewed_rent: null,  property_type: 'rental', payment_timing: 'after',  occupants: 2 },
  { id: 'd0000000-0000-0000-0000-000000000003', name: 'Ramya',      phone: '9999900002', email: 'ramya@niwas.local',      unit_id: 'c0000000-0000-0000-0000-000000000003', move_in_date: '2025-08-01', renewal_date: '2026-07-01', renewed_rent: 9400,  property_type: 'rental', payment_timing: 'after',  occupants: 1 },
  { id: 'd0000000-0000-0000-0000-000000000004', name: 'Pavan',      phone: '9999900003', email: 'pavan@niwas.local',      unit_id: 'c0000000-0000-0000-0000-000000000004', move_in_date: '2026-02-01', renewal_date: '2027-01-01', renewed_rent: null,  property_type: 'rental', payment_timing: 'after',  occupants: 2 },
  { id: 'd0000000-0000-0000-0000-000000000005', name: 'Gokul',      phone: '9999900004', email: 'gokul@niwas.local',      unit_id: 'c0000000-0000-0000-0000-000000000005', move_in_date: '2025-03-01', renewal_date: '2026-02-01', renewed_rent: null,  property_type: 'rental', payment_timing: 'before', occupants: 2 },
  { id: 'd0000000-0000-0000-0000-000000000006', name: 'Nitin',      phone: '9999900005', email: 'nitin@niwas.local',      unit_id: 'c0000000-0000-0000-0000-000000000006', move_in_date: '2025-09-01', renewal_date: '2026-08-01', renewed_rent: null,  property_type: 'rental', payment_timing: 'after',  occupants: 1 },
  { id: 'd0000000-0000-0000-0000-000000000007', name: 'Chethan',    phone: '9999900006', email: 'chethan@niwas.local',    unit_id: 'c0000000-0000-0000-0000-000000000007', move_in_date: '2025-08-01', renewal_date: '2026-07-01', renewed_rent: 10000, property_type: 'rental', payment_timing: 'after',  occupants: 1 },
  { id: 'd0000000-0000-0000-0000-000000000008', name: 'ShamSundar', phone: '9999900009', email: 'shamsundar@niwas.local', unit_id: 'c0000000-0000-0000-0000-000000000008', move_in_date: '2025-07-06', renewal_date: '2027-07-05', renewed_rent: null,  property_type: 'lease',  payment_timing: 'after',  occupants: 1 },
  { id: 'd0000000-0000-0000-0000-000000000009', name: 'Ranjith',    phone: '9999900007', email: 'ranjith@niwas.local',    unit_id: 'c0000000-0000-0000-0000-000000000009', move_in_date: '2026-06-01', renewal_date: '2027-05-01', renewed_rent: null,  property_type: 'rental', payment_timing: 'after',  occupants: 2 },
]

const MONTHS = ['January','February','March','April','May']

async function seed() {
  console.log('🌱 Seeding Supabase...')

  // Clear all existing data (buildings cascade to everything)
  const { error: delErr } = await supabase.from('buildings').delete().neq('id', 'ffffffff-ffff-ffff-ffff-ffffffffffff')
  if (delErr) console.warn('Clear warning:', delErr.message)

  const { error: bErr } = await supabase.from('buildings').insert({
    id: BUILDING_ID, name: 'Abhi-Rani Apartments',
    address: 'No.03, 8th A Cross Road, 8th Main, Shanti Layout, Ramamurthy Nagar, Bangalore',
    floors: 4, total_units: 9,
  })
  if (bErr) { console.error('Building error:', bErr.message); return }
  console.log('✅ Building inserted')

  // Units
  const { error: uErr } = await supabase.from('units').insert(
    units.map(u => ({ ...u, building_id: BUILDING_ID, status: 'occupied' }))
  )
  if (uErr) { console.error('Units error:', uErr.message); return }
  console.log('✅ Units inserted')

  // Residents
  const { error: rErr } = await supabase.from('residents').insert(
    residents.map(r => ({ ...r, building_id: BUILDING_ID }))
  )
  if (rErr) { console.error('Residents error:', rErr.message); return }
  console.log('✅ Residents inserted')

  // Payments Jan-May 2026
  const payments = []
  residents.forEach(r => {
    const unit = units.find(u => u.id === r.unit_id)
    MONTHS.forEach(month => {
      const isPrev = r.name === 'Ranjith'
      payments.push({
        unit_id: r.unit_id, resident_id: r.id, building_id: BUILDING_ID,
        month, year: 2026,
        rent: unit.rent, maintenance: unit.maintenance_fee,
        status: 'paid',
        paid_amount: isPrev ? 11100 : (r.name === 'Gokul' && month === 'January' ? 9650 : (r.name === 'Gokul' ? 10107 : unit.rent + unit.maintenance_fee)),
        paid_by: isPrev ? 'Darwin' : null,
        date: `2026-${String(MONTHS.indexOf(month) + 1).padStart(2,'0')}-05`,
      })
    })
    // Gokul June payment
    if (r.name === 'Gokul') {
      payments.push({
        unit_id: r.unit_id, resident_id: r.id, building_id: BUILDING_ID,
        month: 'June', year: 2026,
        rent: unit.rent, maintenance: unit.maintenance_fee,
        status: 'paid', paid_amount: 10700, paid_by: null, date: '2026-06-01',
      })
    }
  })

  const { error: pErr } = await supabase.from('payments').insert(payments)
  if (pErr) { console.error('Payments error:', pErr.message); return }
  console.log(`✅ ${payments.length} payments inserted`)

  console.log('🎉 Seed complete!')
}

seed()
