const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Uses JSON-mode prompting — no function calling, works on any free Gemini model
export async function askGemini({ message, appContext }) {
  if (!GEMINI_KEY) throw new Error('Gemini API key not configured')

  const now = new Date()
  const currentMonth = now.toLocaleString('en-US', { month: 'long' })
  const currentYear  = now.getFullYear()

  const prompt = `You are an AI assistant for NIWAS, a building management app for ${appContext.buildingName}.
Today: ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
Current month: ${currentMonth} ${currentYear}.

Residents list:
${appContext.residents.map((r, i) => `${i + 1}. ${r.name} — Unit ${r.unitNumber}, ₹${r.rent + r.maintenance}/mo`).join('\n')}

You must respond with ONLY a raw JSON object (no markdown, no explanation outside JSON):
{
  "action": one of ["record_payments","get_collection_summary","list_unpaid","send_rent_reminders","add_notice","chat"],
  "params": {
    // for record_payments: { "resident_names": [...], "month": "June", "year": 2026, "status": "paid", "custom_amount": null }
    // for get_collection_summary / list_unpaid / send_rent_reminders: { "month": "June", "year": 2026 }
    // for add_notice: { "title": "...", "body": "...", "priority": "normal" or "high" }
    // for chat: {}
  },
  "message": "brief friendly reply to show the user"
}

Rules:
- If month/year not mentioned, use ${currentMonth} ${currentYear}.
- "first N residents" means the first N from the list above.
- For resident names, fuzzy match from the list.
- For greetings or questions that don't need an action, use action "chat".

User: ${message}`

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash']

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.message ?? ''
        // Skip to next model if this one isn't available
        if (msg.includes('not found') || msg.includes('quota') || msg.includes('limit: 0')) continue
        throw new Error(msg)
      }
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    } catch (err) {
      if (err instanceof SyntaxError) throw new Error('AI returned invalid JSON — try rephrasing')
      if (models.indexOf(model) === models.length - 1) throw err
    }
  }
  throw new Error('No available Gemini model found')
}
