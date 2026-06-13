const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY

async function sendEmail({ to, subject, html }) {
  if (!RESEND_KEY) return console.warn('Resend key not set')
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NIWAS <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  } catch (err) {
    console.error('Email send error:', err)
  }
}

export function notifyPaymentReceived({ resident, unit, month, year, amount }) {
  if (!resident.email) return
  sendEmail({
    to: resident.email,
    subject: `Payment Received — ${month} ${year}`,
    html: `<p>Hi <b>${resident.name}</b>,</p>
      <p>✅ Your payment of <b>₹${amount}</b> for <b>${month} ${year}</b> (Unit ${unit.unitNumber}) has been recorded.</p>
      <p>Thank you!<br/>— NIWAS Building Manager</p>`,
  })
}

export function notifyRentDue({ resident, unit, month, year, amount }) {
  if (!resident.email) return
  sendEmail({
    to: resident.email,
    subject: `Rent Due — ${month} ${year}`,
    html: `<p>Hi <b>${resident.name}</b>,</p>
      <p>🔔 Your rent of <b>₹${amount}</b> for <b>${month} ${year}</b> (Unit ${unit.unitNumber}) is due.</p>
      <p>Please pay on time.<br/>— NIWAS Building Manager</p>`,
  })
}

export function notifyNewNotice({ residents, notice }) {
  residents.forEach(resident => {
    if (!resident.email) return
    sendEmail({
      to: resident.email,
      subject: `Notice: ${notice.title}`,
      html: `<p>📢 <b>New Notice</b></p>
        <p><b>${notice.title}</b></p>
        <p>${notice.body || ''}</p>
        <p>— NIWAS Building Manager</p>`,
    })
  })
}
