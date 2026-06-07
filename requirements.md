# NIWAS — Smart Building Manager
## Product Requirements Document

---

## 1. Overview

**Product Name:** NIWAS  
**Tagline:** Smart Building Manager  
**Type:** Mobile-first SaaS web app (React + Tailwind CSS), designed to be wrapped in React Native for native deployment  
**Target Market:** Residential apartment owners, property managers, housing societies — India  
**Currency:** INR (₹)  
**Data Persistence:** Browser LocalStorage (MVP); pluggable to REST API / Firebase  

---

## 2. User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | Building owner / property manager | Full access: buildings, residents, financials, docs, notices |
| **Resident** | Flat tenant | Read-only unit info, payment history, maintenance requests, notices, own documents |

---

## 3. Authentication

- Email + password login
- Role-based redirect post-login (Admin → Admin Dashboard, Resident → Resident Dashboard)
- No self-registration (admin creates resident accounts)
- Demo quick-login buttons for both roles
- Resident account credentials: email from profile, password = phone number (changeable later)

---

## 4. Feature Modules

### 4.1 Building Setup (Admin)

| Feature | Details |
|---------|---------|
| Add / Remove buildings | Name, address, number of floors |
| Google Maps address | Free-text address + optional Google Maps URL |
| Auto unit generation | 4 units per floor created on building setup |
| Floor plan grid | Visual grid per floor showing unit status (Occupied / Vacant / Maintenance) |
| Unit status management | Admin can change unit status from the floor grid |
| Multi-building support | Admin can manage multiple buildings from one account |

### 4.2 Unit Configuration (Admin)

| Feature | Details |
|---------|---------|
| Fee structure | Monthly rent (₹), security advance (₹), maintenance fee (₹) — editable per unit |
| Electricity account | BESCOM / MSEB etc. account number per unit |
| Vehicle registration | Type (Car / Bike / Scooter / EV), registration number, model — multiple per unit |
| Resident assignment | Linked to resident record; auto-updates unit status |

### 4.3 Resident Management (Admin)

| Field | Details |
|-------|---------|
| Name, Phone | Required |
| Email | Used as login username |
| Aadhaar / ID | Masked display |
| Building + Unit | Dropdown selection; filters to vacant units only |
| Move-in Date | Date picker |
| Add / Edit / Remove | Full CRUD; removing unlinks from unit and marks it vacant |
| Search | By name or phone number |

### 4.4 Financial Dashboard (Admin)

| Feature | Details |
|---------|---------|
| Month × Year selector | Tabs for months, dropdown for year |
| Per-building filter | Switch between buildings |
| Payment status grid | Each occupied unit shown with Paid / Partial / Due status (color-coded) |
| Record payment | Admin marks a unit's payment: status + amount paid + optional note |
| Collection progress bar | Visual % of monthly rent collected |
| Summary counters | Paid / Partial / Due counts at top |
| Building-wide costs | Water, Cleaning, Security — editable monthly amounts |

**Color coding:**
- Paid → Teal / Green
- Partial → Amber / Yellow
- Due → Red

### 4.5 Documents & Notices (Admin)

#### Documents
| Feature | Details |
|---------|---------|
| Add documents | Link to a resident; types: Rent Agreement, ID Proof, Police Verification, Move-in/out Record, Other |
| Expiry tracking | Date field; auto-highlights expiring (<30 days) and expired docs |
| Alert banner | Shows count of expiring + expired docs at top of screen |
| Filter | All / Agreements / Expiring / Expired |
| Delete | Soft-delete from resident record |

#### Notices
| Feature | Details |
|---------|---------|
| Post notices | Title, content, priority (Low / Normal / High / Urgent) |
| Building-scoped | Each notice belongs to a specific building |
| Chronological sort | Newest first |
| Delete | Remove notice from building |
| Priority styling | Urgent notices get red border, Normal get blue badge |

### 4.6 Resident Portal

#### Home Screen
- Welcome card with name, building, unit number
- Current month rent status (Paid / Partial / Due) with color
- Unit detail: rent, maintenance fee, advance, move-in date
- Electricity account number
- Registered vehicles list
- Building address + Google Maps link

#### Payments Screen
- Total Paid and Outstanding summary
- Full payment history (month-wise, newest first)
- Per-entry: month/year, rent + maintenance breakdown, status badge, paid amount, date

#### Maintenance Requests
- Submit request: category, title, description, urgency
- Status tracking: Open / In Progress / Resolved
- Filter by status
- Stats counter (Open / In Progress / Resolved)

#### Notice Board
- Building notices (read-only)
- Sorted newest first
- Priority-styled cards (Urgent in red)

#### Documents
- View own uploaded documents
- Expiry alerts (expiring soon / expired)
- Document type label + upload date

---

## 5. SaaS Architecture

| Concern | Approach |
|---------|---------|
| Multi-tenancy | Buildings isolated by `buildingId`; residents scoped to their building |
| Role-based access | Admin gets all CRUD; resident gets read-only + maintenance submit |
| Data model | `buildings`, `residents`, `payments`, `users` — all in LocalStorage (MVP) |
| Scalability | All context/hooks abstracted; easy swap to API layer |
| React Native readiness | No DOM-specific code in business logic; UI components use flex layout |

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS 3 (custom design tokens) |
| Icons | Lucide React |
| State | React Context + useLocalStorage hook |
| Routing | In-app tab-based navigation (no React Router — RN-ready) |
| Fonts | Plus Jakarta Sans (Google Fonts) |
| Build | Vite 6 |

---

## 7. Design System

| Token | Value |
|-------|-------|
| Primary | `#14B8A6` (Teal 500) |
| Background | `#0A1628` (Deep navy) |
| Surface | `#111D35` |
| Card | `#162040` |
| Border | `#253A5C` |
| Text | `#E2E8F0` |
| Muted | `#94A3B8` |
| Font | Plus Jakarta Sans |
| Style | Dark, professional, mobile-first |
| Min touch target | 44×44px (Apple HIG) |
| Breakpoints | 375 / 768 / 1024 (mobile-first) |

---

## 8. Data Models

### Building
```ts
{
  id: string
  name: string
  address: string
  mapUrl?: string
  floors: number
  totalUnits: number
  buildingCosts: { water: number; cleaning: number; security: number }
  notices: Notice[]
  units: Unit[]
}
```

### Unit
```ts
{
  id: string
  floor: number
  unitNumber: string
  status: 'occupied' | 'vacant' | 'maintenance'
  residentId: string | null
  rent: number
  advance: number
  maintenanceFee: number
  electricityAccountNumber: string
  vehicles: Vehicle[]
}
```

### Resident
```ts
{
  id: string
  name: string
  phone: string
  email: string
  aadhaar: string
  buildingId: string
  unitId: string
  moveInDate: string
  moveOutDate: string | null
  documents: Document[]
  maintenanceRequests: MaintenanceRequest[]
}
```

### Payment
```ts
{
  id: string
  unitId: string
  residentId: string
  buildingId: string
  month: string
  year: number
  rent: number
  maintenance: number
  status: 'paid' | 'partial' | 'due'
  paidAmount: number
  date: string
  note?: string
}
```

### Notice
```ts
{
  id: string
  title: string
  content: string
  date: string
  priority: 'low' | 'normal' | 'high'
}
```

### Document
```ts
{
  id: string
  type: 'rent_agreement' | 'id_proof' | 'police_verification' | 'move_in' | 'move_out' | 'other'
  name: string
  expiry: string | null
  uploaded: string
}
```

---

## 9. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@niwas.app | admin123 |
| Resident | resident1@example.com | res123 |

---

## 10. Future Roadmap

- [ ] Firebase / Supabase backend integration
- [ ] PDF rent agreement generation
- [ ] UPI payment link integration (Razorpay / PayU)
- [ ] Push notifications (FCM)
- [ ] React Native wrapper (Expo)
- [ ] WhatsApp rent reminders (Twilio / WATI)
- [ ] Multi-admin support per building
- [ ] Bulk payment upload (CSV)
- [ ] Visitor log / gate management
- [ ] Society meeting minutes & voting
