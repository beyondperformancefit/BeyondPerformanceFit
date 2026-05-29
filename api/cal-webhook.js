export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = 'https://xrzujafdaaogyseganns.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const body = req.body;

    // Cal.com sends booking data — grab the attendee email
    const attendeeEmail =
      body?.payload?.attendees?.[0]?.email ||
      body?.payload?.responses?.email?.value ||
      null;

    if (!attendeeEmail) {
      console.error('No email found in Cal.com webhook payload:', JSON.stringify(body));
      return res.status(200).json({ received: true });
    }

    // Update the lead status in Supabase
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(attendeeEmail)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'call booked' })
      }
    );

    if (updateRes.ok) {
      console.log(`Updated status to "call booked" for ${attendeeEmail}`);
    } else {
      console.error('Supabase update failed:', await updateRes.text());
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Cal webhook error:', err);
    return res.status(200).json({ received: true });
  }
}
