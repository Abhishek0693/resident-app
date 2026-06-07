import { ArrowLeft, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function TopBar({ title, subtitle, back, onBack, actions }) {
  const { logout } = useApp()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-niwas-bg/95 backdrop-blur-sm border-b border-niwas-border">
      <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
        {back && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-niwas-elevated transition-colors cursor-pointer flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-niwas-text" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-niwas-text truncate tracking-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-niwas-muted truncate">{subtitle}</p>}
        </div>

        {actions}

        {!back && (
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-niwas-elevated transition-colors cursor-pointer flex-shrink-0"
            aria-label="Logout"
          >
            <LogOut size={16} className="text-niwas-subtle" />
          </button>
        )}
      </div>
    </header>
  )
}
