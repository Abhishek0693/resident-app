# NIWAS — Smart Building Manager
## Project Context for Claude

---

## What This App Is

**NIWAS** is a mobile-first SaaS web app for managing residential apartment buildings in India.
Built with React + Vite + Tailwind CSS. Designed to be wrapped in React Native later.
Data is persisted in **browser LocalStorage** (no backend yet).

Dev server: `npm run dev` → runs on `http://localhost:3001`
Build: `npm run build`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite 6 |
| Styling | Tailwind CSS 3 with custom `niwas-*` tokens |
| Icons | Lucide React |
| State | React Context (`AppContext`) + `useLocalStorage` hook |
| Navigation | In-app tab state (no React Router — intentionally RN-ready) |
| Font | Plus Jakarta Sans (Google Fonts) |

---

## Design System — Monochrome

All colors are from the custom `niwas` palette. **Never use Tailwind's default colors** (blue, indigo, teal, etc.).

```js
niwas: {
  bg:       '#080808',   // page background
  surface:  '#101010',   // modal/sheet background
  card:     '#181818',   // card background
  elevated: '#222222',   // inputs, pills, inner surfaces
  border:   '#2C2C2C',   // default border
  line:     '#383838',   // stronger divider / alert border
  text:     '#F0F0F0',   // primary text
  muted:    '#888888',   // secondary text
  subtle:   '#444444',   // tertiary / placeholder text
  primary:  '#FFFFFF',   // active state, primary CTA background
  inverse:  '#080808',   // text on primary (white button → black text)
}
```

**Status badges — monochrome only:**
- `.badge-paid` → white pill, black text (inverted, high contrast)
- `.badge-due` → ghost/border only, muted text
- `.badge-partial` → elevated gray bg, white text

**Reusable CSS classes (defined in `src/index.css`):**
- `.btn-primary` — white bg, black text, active:scale
- `.btn-secondary` — transparent bg, border, hover:elevated
- `.card` — niwas-card bg, border, rounded-2xl, p-4
- `.screen` — min-h-dvh, pb-24, pt-56px (exact TopBar height)
- `.label` — 11px, uppercase, tracking-widest
- `.tab-active` / `.tab-inactive` — shared pill tab states
- `.badge-paid` / `.badge-due` / `.badge-partial` / `.badge-info`
- `.scrollbar-hide` — hides scrollbar on pill tab rows

**Layout rules:**
- TopBar height: `h-14` = 56px → screens use `padding-top: 56px`
- BottomNav height: `h-16` = 64px → screens use `pb-24`
- All content max-width: `max-w-lg mx-auto`
- Standard content padding: `px-4 pt-5`
- Card spacing within screens: `space-y-3`

---

## Folder Structure

```
src/
├── App.jsx                          # Root router (Login / AdminDashboard / ResidentDashboard)
├── index.css                        # All Tailwind + custom component classes
├── main.jsx
├── context/
│   └── AppContext.jsx               # Single context: auth + all CRUD operations
├── hooks/
│   └── useLocalStorage.js           # Persistent state hook
├── utils/
│   └── helpers.js                   # formatINR, formatDate, generateId, SEED_DATA, MONTHS
├── components/
│   └── common/
│       ├── TopBar.jsx               # Fixed header (title, subtitle, back button, logout)
│       ├── BottomNav.jsx            # Fixed bottom tab bar (4 tabs each role)
│       └── Modal.jsx                # Sheet/dialog (slides up on mobile, fades on desktop)
├── pages/
│   ├── Login.jsx                    # Email/password + demo quick-login
│   ├── admin/
│   │   ├── AdminDashboard.jsx       # Shell: tab routing + Documents sub-tab strip
│   │   ├── BuildingsScreen.jsx      # Building list + add building
│   │   ├── BuildingDetail.jsx       # Floor grid + unit cells + building costs editor
│   │   ├── UnitDetail.jsx           # Unit fees, electricity, vehicles
│   │   ├── ResidentsScreen.jsx      # Resident list + add/edit/remove
│   │   ├── FinancialsScreen.jsx     # Monthly payment status grid + record payment
│   │   ├── DocumentsScreen.jsx      # Doc list, expiry alerts, filter tabs
│   │   └── NoticesScreen.jsx        # Post/delete notices, priority badges
│   └── resident/
│       ├── ResidentDashboard.jsx    # Shell: tab routing
│       ├── HomeScreen.jsx           # Unit info, rent status, vehicles, address
│       ├── PaymentsScreen.jsx       # Payment history (read-only)
│       ├── MaintenanceScreen.jsx    # Submit + view maintenance requests
│       ├── NoticesScreen.jsx        # Read-only notice board
│       └── DocumentsScreen.jsx     # View own documents
```

---

## Data Models (LocalStorage keys)

**`niwas_buildings`** — array of Building objects
```ts
{
  id, name, address, mapUrl?,
  floors, totalUnits,
  buildingCosts: { water, cleaning, security },  // ₹/month
  notices: Notice[],
  units: Unit[]
}
```

**Unit** (nested inside building.units)
```ts
{
  id, floor, unitNumber,
  status: 'occupied' | 'vacant' | 'maintenance',
  residentId: string | null,
  rent, advance, maintenanceFee,  // ₹
  electricityAccountNumber,
  vehicles: { id, type, number, model }[]
}
```

**`niwas_residents`** — array
```ts
{
  id, name, phone, email, aadhaar,
  buildingId, unitId,
  moveInDate, moveOutDate?,
  documents: { id, type, name, expiry?, uploaded }[],
  maintenanceRequests: { id, title, description, category, urgency, status, date }[]
}
```

**`niwas_payments`** — array
```ts
{
  id, unitId, residentId, buildingId,
  month, year,           // e.g. "June", 2024
  rent, maintenance,
  status: 'paid' | 'partial' | 'due',
  paidAmount, date, note?
}
```

**`niwas_users`** — array (for login)
```ts
{
  id, name, email, password, role: 'admin' | 'resident',
  buildingId, unitId?, residentId?
}
```

**`niwas_user`** — current logged-in user object (or null)

---

## Business Logic (AppContext)

All state mutations are in `src/context/AppContext.jsx`:

| Function | What it does |
|----------|-------------|
| `login(email, password)` | Finds user in `niwas_users`, sets `niwas_user` |
| `logout()` | Clears `niwas_user` |
| `addBuilding(data)` | Creates building with auto-ID, empty notices/units |
| `updateBuilding(id, data)` | Partial update |
| `deleteBuilding(id)` | Removes from array |
| `addUnit(buildingId, data)` | Pushes unit into building.units |
| `updateUnit(buildingId, unitId, data)` | Nested partial update |
| `addResident(data)` | Creates resident, marks unit occupied, creates login user |
| `updateResident(id, data)` | Partial update |
| `removeResident(id)` | Deletes resident, marks unit vacant, removes login user |
| `addPayment(data)` | Upserts payment (replaces existing same month/year/unit) |
| `addNotice(buildingId, data)` | Prepends notice to building.notices |
| `deleteNotice(buildingId, noticeId)` | Filters out notice |
| `addMaintenanceRequest(residentId, data)` | Appends to resident.maintenanceRequests |
| `updateMaintenanceRequest(residentId, reqId, data)` | Updates status etc. |
| `addDocument(residentId, data)` | Appends to resident.documents |
| `deleteDocument(residentId, docId)` | Filters out document |

---

## Roles & Access

| Feature | Admin | Resident |
|---------|-------|---------|
| View/add/edit buildings | ✓ | — |
| Floor plan + unit grid | ✓ | — |
| Edit unit fees/vehicles | ✓ | — |
| Add/remove residents | ✓ | — |
| Record payments | ✓ | — |
| View payment history | ✓ | Read-only own |
| Post/delete notices | ✓ | Read-only |
| Add/delete documents | ✓ | Read-only own |
| Submit maintenance requests | — | ✓ |

Admin login: `admin@niwas.app` / `admin123`
Resident login: `resident1@example.com` / `res123` (through `resident12@example.com`)

---

## Key Implementation Decisions

- **No React Router** — navigation is tab state in dashboard shells. Intentional for React Native portability.
- **Seed data** is in `src/utils/helpers.js` → `SEED_DATA`. It seeds 1 building (Sunrise Apartments), 16 units, 12 residents, and payments for June 2024.
- **Admin creating a resident** auto-creates a login user with password = phone number.
- **Documents sub-tab** in admin: there's a second fixed strip at `top-14` (below TopBar). Content gets `paddingTop: 56px` to account for it. Both `DocumentsScreen` and `NoticesScreen` accept `noPadTop` prop when rendered under this strip.
- **Unit status** `maintenance` means the unit is blocked — not available for resident assignment.
- **Payment upsert**: recording the same month/year/unit replaces the existing record.

---

## Seed Data Summary

- 1 building: **Sunrise Apartments**, Koramangala, Bengaluru
- 4 floors × 4 units = 16 units
- Units 1–12: occupied; Unit 14: maintenance; Units 13, 15, 16: vacant
- 12 residents (Rajesh Kumar, Priya Sharma, etc.)
- Payments for June 2024: units 1–8 paid, unit 9 partial, units 10–12 due
- 2 notices: Water Maintenance (high), Society Meeting (normal)

---

## What's NOT Built Yet (Roadmap)

- Firebase / Supabase backend
- PDF rent agreement generation
- UPI payment link (Razorpay)
- Push notifications
- React Native wrapper (Expo)
- WhatsApp rent reminders
- Multi-admin per building
- Bulk payment CSV upload
- Visitor log / gate management
