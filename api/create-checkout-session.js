const { Stripe } = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Los precios se calculan aquí, en el servidor, nunca con datos del navegador.
const BASE = 150;
const PAGINA_EXTRA = 40;
const IDIOMA_EXTRA = 50;
const DISENOS = ["Sombras", "Tinta", "Hilo", "Japón", "Cera", "Bordado", "Mediterráneo"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const diseno = String(b.design || "");
    const paginas = Number(b.pages);
    const idiomas = Number(b.languages);
    if (
      !DISENOS.includes(diseno) ||
      !Number.isInteger(paginas) || paginas < 0 || paginas > 10 ||
      !Number.isInteger(idiomas) || idiomas < 0 || idiomas > 10
    ) {
      return res.status(400).json({ error: "Pedido no válido" });
    }
    const email = /^\S+@\S+\.\S+$/.test(b.email || "") ? b.email : undefined;
    const importe = (BASE + PAGINA_EXTRA * paginas + IDIOMA_EXTRA * idiomas) * 100;
    const referencia = `${diseno}-p${paginas}-l${idiomas}`.normalize("NFD").replace(/[^\w-]/g, "");

    const session = await stripe.checkout.sessions.create({
      // Parámetros fijados en Checkout Studio
      ui_mode: "hosted_page",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: "auto",
      integration_identifier: "hosted_web_0001",
      origin_context: "web",
      // Parámetros del pedido
      mode: "payment",
      customer_email: email,
      client_reference_id: referencia,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: importe,
            product_data: {
              name: `Web de boda · ${diseno}`,
              description: `${paginas} página(s) extra · ${idiomas} idioma(s) extra`,
            },
          },
        },
      ],
      metadata: {
        design: diseno,
        pages: String(paginas),
        languages: String(idiomas),
        music: b.music ? "si" : "no",
        song: String(b.song || "").slice(0, 450),
        form_file: String(b.formFile || "").slice(0, 450),
      },
      success_url: `${process.env.DOMAIN}/?pago=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "No se ha podido iniciar el pago" });
  }
};
