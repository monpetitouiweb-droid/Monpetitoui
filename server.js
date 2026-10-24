require("dotenv").config();
const path = require("path");
const express = require("express");
const { Stripe } = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.post("/api/create-checkout-session", async (req, res) => {
  // TODO: usa "subscription" si vendes productos recurrentes.
  const mode = "payment";

  // Parámetros fijados en Checkout Studio (fixed_by_ui) + placeholders (sample_only).
  const sessionParams = {
    ui_mode: "form",
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    submit_type: "auto",
    integration_identifier: "custom_embedded_web_0001",
    mode,
    // TODO: sustituye por tus Price IDs reales (ver STRIPE_INTEGRATION_TODO.md).
    line_items: [{ price: "price_...", quantity: 1 }],
  };
  // payment_method_collection solo aplica en modo "subscription".
  if (mode === "subscription") {
    sessionParams.payment_method_collection = "always";
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ client_secret: session.client_secret });
  } catch (err) {
    console.error("Error creando la Checkout Session:", err.message);
    res.status(500).json({ error: "No se pudo iniciar el pago." });
  }
});

app.listen(4242, () => console.log("Servidor en http://localhost:4242"));
