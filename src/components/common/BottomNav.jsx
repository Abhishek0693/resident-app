import { Building2, Users, BarChart3, FileText, Home, Wrench, CreditCard, Bell } from 'lucide-react'

const ADMIN_TABS = [
  { id: 'dashboard', icon: Building2, label: 'Buildings' },
  { id: 'residents', icon: Users, label: 'Residents' },
  { id: 'financials', icon: BarChart3, label: 'Finance' },
  { id: 'documents', icon: FileText, label: 'Docs' },
]

const RESIDENT_TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'payments', icon: CreditCard, label: 'Payments' },
  { id: 'maintenance', icon: Wrench, label: 'Requests' },
  { id: 'notices', icon: Bell, label: 'Notices' },
]

export default function BottomNav({ role, active, onNavigate }) {
  const tabs = role === 'admin' ? ADMIN_TABS : RESIDENT_TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-niwas-bg/95 backdrop-blur-sm border-t border-niwas-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center max-w-lg mx-auto h-16">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full
                transition-colors duration-150 cursor-pointer
                ${isActive ? 'text-niwas-primary' : 'text-niwas-subtle hover:text-niwas-muted'}`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
