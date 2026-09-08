import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, message } = await req.json();

    if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Recipient comes from app settings (server-side) — never from the client
    const rows = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'contact_email' });
    let to = rows[0]?.setting_value;
    if (!to) {
      // Fallback: the app's admin
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      to = admins[0]?.email;
    }
    if (!to) return Response.json({ error: 'Contact email not configured' }, { status: 500 });

    const safeName = String(name).slice(0, 100);
    const body =
      `رسالة جديدة من صفحة «تواصل معنا»\n\n` +
      `الاسم: ${safeName}\n` +
      `البريد الإلكتروني: ${email}\n\n` +
      `الرسالة:\n${String(message).slice(0, 5000)}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: `تواصل معنا — ${safeName}`,
      body,
      from_name: 'دار العلوم',
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}