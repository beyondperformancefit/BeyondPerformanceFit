export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  const { fullName, email, goal, activity, days, gym, obstacle, ready } = req.body;

  if (!fullName || !email || !goal || !activity || !days || !gym || !obstacle || !ready) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1) Notify Brenden
    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Beyond Performance <onboarding@resend.dev>',
        to: ['beyondperformancefit@gmail.com'],
        subject: `New Coaching Application — ${fullName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#f5f2ed;padding:2rem;border-radius:10px;">
            <h2 style="color:#c8402a;font-size:1.3rem;margin-bottom:1.5rem;">New Coaching Application</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);width:38%;font-size:0.85rem;">Name</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${fullName}</td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;">Email</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);"><a href="mailto:${email}" style="color:#c8402a;">${email}</a></td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;">#1 Goal</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${goal}</td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;">Activity Level</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${activity}</td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;">Days/Week</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${days}</td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;">Gym Access</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${gym}</td></tr>
              <tr><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(245,242,237,0.5);font-size:0.85rem;vertical-align:top;">What's Held Them Back</td><td style="padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.08);">${obstacle}</td></tr>
              <tr><td style="padding:0.6rem 0;color:rgba(245,242,237,0.5);font-size:0.85rem;">Ready to Invest</td><td style="padding:0.6rem 0;">${ready}</td></tr>
            </table>
          </div>
        `
      })
    });

    // 2) Auto-reply to applicant
    const replyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Brenden @ Beyond Performance <beyondperformancefit@gmail.com>',
        to: [email],
        subject: 'Got your application — talk soon.',
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0d0d0d;color:#f5f2ed;padding:2rem 2.5rem;border-radius:10px;">
            <p style="font-family:serif;font-size:1.5rem;font-weight:700;color:#c8402a;margin-bottom:1.5rem;">Beyond Performance.</p>
            <p style="line-height:1.8;margin-bottom:1rem;">Hey ${fullName.split(' ')[0]},</p>
            <p style="line-height:1.8;margin-bottom:1rem;color:rgba(245,242,237,0.8);">Got your application — I appreciate you taking the time to fill it out honestly. I read every one of these personally.</p>
            <p style="line-height:1.8;margin-bottom:1rem;color:rgba(245,242,237,0.8);">I'll be in touch within <strong style="color:#f5f2ed;">48 hours</strong>. If it looks like a good fit, I'll reach out to schedule a free call. No pressure, no pitch — just a conversation to make sure we're aligned before we start.</p>
            <p style="line-height:1.8;margin-bottom:1.5rem;color:rgba(245,242,237,0.8);">In the meantime, if you have questions, reply directly to this email.</p>
            <p style="line-height:1.8;margin-bottom:0.3rem;">Let's get to work.</p>
            <p style="line-height:1.8;color:rgba(245,242,237,0.6);">— Brenden</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:2rem 0;" />
            <p style="font-size:0.78rem;color:rgba(245,242,237,0.25);line-height:1.6;">Beyond Performance · Science-based coaching · Dallas, TX<br/>Questions? <a href="mailto:beyondperformancefit@gmail.com" style="color:#c8402a;">beyondperformancefit@gmail.com</a></p>
          </div>
        `
      })
    });

    if (notifyRes.ok) {
      // Notification sent successfully — return success even if auto-reply failed (domain not verified yet)
      return res.status(200).json({ success: true });
    } else {
      const notifyData = await notifyRes.json().catch(() => ({}));
      console.error('Notify email failed:', notifyData);
      return res.status(500).json({ error: 'Email send failed' });
    }

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
