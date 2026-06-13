import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { askGemini } from '../../lib/ai'
import { notifyRentDue } from '../../lib/notifications'

const SUGGESTIONS = [
  'Show June collection',
  "Who hasn't paid?",
  'Send rent reminders',
  'Post maintenance notice',
]

export default function AIChat() {
  const { buildings, residents, payments, addPayment, addNotice } = useApp()
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! I'm your building assistant 👋\nTry: \"Mark Naresh and Ramya as paid for June\" or \"Show June collection\" or \"Send reminders to unpaid residents\"",
  }])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const building = buildings[0]

  const residentContext = () =>
    residents.map(r => {
      const unit = building?.units.find(u => u.id === r.unitId)
      return {
        id: r.id, name: r.name, email: r.email,
        unitId: r.unitId, buildingId: r.buildingId,
        unitNumber: unit?.unitNumber ?? '?',
        rent: unit?.rent ?? 0,
        maintenance: unit?.maintenanceFee ?? 0,
      }
    })

  const fuzzyMatch = (names) => {
    const ctx = residentContext()
    return names.flatMap(name => {
      const n = name.toLowerCase()
      const found = ctx.find(r => r.name.toLowerCase().includes(n) || n.includes(r.name.toLowerCase()))
      return found ? [found] : []
    })
  }

  const getMonthPayments = (month, year) =>
    payments.filter(p => p.month === month && p.year === year)

  const executeFunction = async (name, args) => {
    const now = new Date()
    const curMonth = now.toLocaleString('en-US', { month: 'long' })
    const curYear  = now.getFullYear()
    const month = args.month ?? curMonth
    const year  = args.year  ?? curYear

    if (name === 'record_payments') {
      const matched = fuzzyMatch(args.resident_names ?? [])
      if (!matched.length) return `❌ Could not find: ${args.resident_names?.join(', ')}`
      await Promise.all(matched.map(r =>
        addPayment({
          unitId: r.unitId, residentId: r.id, buildingId: r.buildingId,
          month, year, rent: r.rent, maintenance: r.maintenance,
          status: args.status ?? 'paid',
          paidAmount: args.custom_amount ?? (r.rent + r.maintenance),
        })
      ))
      const lines = matched.map(r => `  • ${r.name} — ₹${(args.custom_amount ?? (r.rent + r.maintenance)).toLocaleString('en-IN')}`)
      return `✅ Recorded as ${args.status ?? 'paid'} for ${month} ${year}:\n${lines.join('\n')}`
    }

    if (name === 'get_collection_summary') {
      const ctx = residentContext()
      const mp  = getMonthPayments(month, year)
      let collected = 0, pending = 0, paid = [], unpaid = []
      ctx.forEach(r => {
        const p = mp.find(x => x.residentId === r.id)
        const total = r.rent + r.maintenance
        if (p && p.status === 'paid') {
          collected += p.paidAmount; paid.push(r.name)
        } else if (p && p.status === 'partial') {
          collected += p.paidAmount; pending += total - p.paidAmount
          paid.push(`${r.name} (partial)`)
        } else {
          pending += total; unpaid.push(r.name)
        }
      })
      return `📊 ${month} ${year} Collection\n` +
        `Collected : ₹${collected.toLocaleString('en-IN')}\n` +
        `Pending   : ₹${pending.toLocaleString('en-IN')}\n` +
        `Total     : ₹${(collected + pending).toLocaleString('en-IN')}\n\n` +
        `Paid (${paid.length}): ${paid.join(', ') || 'None'}\n` +
        `Unpaid (${unpaid.length}): ${unpaid.join(', ') || 'None 🎉'}`
    }

    if (name === 'list_unpaid') {
      const ctx = residentContext()
      const mp  = getMonthPayments(month, year)
      const unpaid = ctx.filter(r => {
        const p = mp.find(x => x.residentId === r.id)
        return !p || p.status === 'due'
      })
      if (!unpaid.length) return `🎉 All residents have paid for ${month} ${year}!`
      const lines = unpaid.map(r => `  • ${r.name} — ₹${(r.rent + r.maintenance).toLocaleString('en-IN')} due`)
      return `⚠️ Unpaid for ${month} ${year} (${unpaid.length}):\n${lines.join('\n')}`
    }

    if (name === 'send_rent_reminders') {
      const ctx = residentContext()
      const mp  = getMonthPayments(month, year)
      const unpaid = ctx.filter(r => {
        const p = mp.find(x => x.residentId === r.id)
        return !p || p.status === 'due'
      })
      if (!unpaid.length) return `🎉 Everyone has paid for ${month} ${year} — no reminders needed!`
      unpaid.forEach(r => {
        const unit = building?.units.find(u => u.id === r.unitId)
        notifyRentDue({ resident: r, unit: { unitNumber: r.unitNumber }, month, year, amount: r.rent + r.maintenance })
      })
      return `📧 Email reminders sent to ${unpaid.length} residents:\n${unpaid.map(r => `  • ${r.name}`).join('\n')}`
    }

    if (name === 'add_notice') {
      if (!building) return '❌ No building found'
      await addNotice(building.id, { title: args.title, body: args.body, priority: args.priority ?? 'normal' })
      return `📢 Notice posted: "${args.title}"`
    }

    return '❓ Unknown action'
  }

  const handleSend = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const ctx = residentContext()
      const result = await askGemini({
        message: msg,
        appContext: { buildingName: building?.name ?? 'Abhi-Rani Apartments', residents: ctx },
      })
      let reply, isResult = false
      if (result.action && result.action !== 'chat') {
        reply = await executeFunction(result.action, result.params ?? {})
        isResult = true
      } else {
        reply = result.message ?? result.text ?? 'Done!'
      }
      setMessages(prev => [...prev, { role: 'assistant', text: reply, isResult }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `❌ ${err.message}`, isError: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-niwas-primary flex items-center justify-center"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.6)' }}
        >
          <Sparkles size={20} className="text-niwas-inverse" />
        </button>
      )}

      {/* Full-screen chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-niwas-bg">

          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-niwas-border bg-niwas-surface shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-niwas-elevated border border-niwas-border flex items-center justify-center">
                <Sparkles size={14} className="text-niwas-text" />
              </div>
              <div>
                <p className="text-sm font-semibold text-niwas-text leading-tight">NIWAS Assistant</p>
                <p className="text-[10px] text-niwas-muted leading-tight">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 -mr-1 text-niwas-muted hover:text-niwas-text">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-niwas-primary text-niwas-inverse rounded-br-sm'
                    : msg.isResult
                      ? 'bg-niwas-elevated border border-niwas-border text-niwas-text rounded-bl-sm font-mono text-xs'
                      : 'bg-niwas-surface border border-niwas-border text-niwas-text rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-niwas-surface border border-niwas-border px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-niwas-muted" />
                  <span className="text-xs text-niwas-muted">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => handleSend(s)}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-niwas-elevated border border-niwas-border text-xs text-niwas-muted hover:text-niwas-text transition-colors">
                {s} <ChevronRight size={10} />
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="px-4 pt-2 pb-8 border-t border-niwas-border bg-niwas-surface flex gap-2 items-end shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Mark Naresh as paid for June…"
              rows={1}
              className="flex-1 bg-niwas-elevated border border-niwas-border rounded-2xl px-3.5 py-2.5 text-sm text-niwas-text placeholder:text-niwas-subtle resize-none outline-none focus:border-niwas-line transition-colors"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-niwas-primary flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
            >
              <Send size={15} className="text-niwas-inverse" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
