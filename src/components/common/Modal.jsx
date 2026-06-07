import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${sizes[size]} bg-niwas-surface border border-niwas-border
        rounded-t-3xl sm:rounded-2xl shadow-2xl
        max-h-[92dvh] overflow-y-auto
        animate-[slideUp_0.22s_cubic-bezier(0.34,1.2,0.64,1)]
        sm:animate-[fadeScale_0.18s_ease-out]`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4
          bg-niwas-surface border-b border-niwas-border rounded-t-3xl sm:rounded-t-2xl">
          <h2 id="modal-title" className="text-sm font-bold text-niwas-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-niwas-elevated transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} className="text-niwas-muted" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
