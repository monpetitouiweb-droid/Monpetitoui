const { Stripe } = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DESTINO = process.env.ORDER_EMAIL || "monpetitoui.web@gmail.com";
const REMITENTE = process.env.MAIL_FROM || "Mon Petit Oui <onboarding@resend.dev>";
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_ENVIOS = 3;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const sid = String(b.session_id || "");
    const filename = String(b.filename || "formulario.docx").replace(/[^\w.\- ()]/g, "_").slice(0, 120);
    const content = String(b.content || "");

    if (!/^cs_(test|live)_\w+$/.test(sid) || !/\.(docx?|pdf)$/i.test(filename) || !content) {
      return res.status(400).json({ error: "Datos no válidos" });
    }
    if (Buffer.byteLength(content, "base64") > MAX_BYTES) {
      return res.status(413).json({ error: "El archivo pesa más de 3 MB" });
    }

    // Solo se envía el formulario si el pago consta como completado en Stripe.
    const session = await stripe.checkout.sessions.retrieve(sid);
    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "El pago aún no consta como completado" });
    }
    const m = session.metadata || {};
    const enviados = Number(m.form_sent || 0);
    if (enviados >= MAX_ENVIOS) {
      return res.status(429).json({ error: "Ya se ha enviado el formulario" });
    }

    const emailCliente = (session.customer_details && session.customer_details.email) || session.customer_email || "";
    const importe = ((session.amount_total || 0) / 100).toFixed(2).replace(".", ",");
    const texto = [
      "Nuevo pedido pagado en Mon Petit Oui",
      "",
      `Diseño: ${m.design || "-"}`,
      `Páginas extra: ${m.pages || "0"}`,
      `Idiomas extra: ${m.languages || "0"}`,
      `Música: ${m.music === "si" ? "sí" + (m.song ? " · " + m.song : "") : "no"}`,
      `Importe: ${importe} €`,
      `Cliente: ${emailCliente || "(sin email)"}`,
      `Referencia: ${session.client_reference_id || "-"}`,
      `Pago en Stripe: ${session.payment_intent || session.id}`,
      "",
      `El formulario relleno va adjunto (${filename}).`,
    ].join("\n");

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [DESTINO],
        reply_to: emailCliente || undefined,
        subject: `Pedido pagado · ${m.design || "web"} · ${importe} €`,
        text: texto,
        attachments: [{ filename, content }],
      }),
    });
    if (!r.ok) {
      console.error("Resend:", await r.text());
      return res.status(502).json({ error: "No se ha podido enviar el correo" });
    }

    try {
      await stripe.checkout.sessions.update(sid, { metadata: { form_sent: String(enviados + 1) } });
    } catch (e) {
      console.error("No se pudo anotar el envío:", e.message);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Error al enviar el formulario" });
  }
};
