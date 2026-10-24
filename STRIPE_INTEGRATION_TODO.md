# Integración de Stripe Checkout — pasos pendientes

Este archivo es la única fuente de verdad para lo que falta por configurar.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [server.js](server.js)
- [public/index.html](public/index.html)
- [.env](.env)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | payment | `"payment"` para cobros únicos (tu caso: diseños de web de boda). Usa `"subscription"` solo para cobros recurrentes. |
| line_items[].price | price_... | Tu Price ID real del Dashboard (https://dashboard.stripe.com/prices) o de la API. |
| STRIPE_SECRET_KEY | sk_test_... | Tu clave secreta de https://dashboard.stripe.com/test/apikeys (en `.env`). |
| STRIPE_PK | pk_test_... | Tu clave publicable (`pk_test_...` / `pk_live_...`), en la variable `STRIPE_PK` de `public/index.html`. |

> **Importante — el importe lo decide Stripe, no el carrito.** Tu carrito calcula `150 € + 40 €/página extra + 50 €/idioma extra`, pero Stripe cobrará lo que digan los `line_items`. Con un único `price_...` cobrarías siempre el mismo importe. Para que coincida, crea en Stripe tres Prices (diseño base 150 €, página extra 40 €, idioma extra 50 €) y que el servidor genere los `line_items` con las cantidades del pedido. Calcula las cantidades en el servidor y no te fíes de importes enviados por el navegador.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [server.js](server.js)

| Parameter | Value |
|-----------|-------|
| ui_mode | form |
| billing_address_collection | auto |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| submit_type | auto |
| integration_identifier | custom_embedded_web_0001 |
| payment_method_collection | no se envía (solo aplica con `mode: "subscription"`) |

Versión de API: `2026-03-25.dahlia` (SDK `stripe` ^21). Stripe.js se carga desde `https://js.stripe.com/dahlia/stripe.js` en el `<head>` (no lo empaquetes ni lo alojes tú).

## Setup and next steps

### Instalación
1. Instala Node.js 18 o superior.
2. En esta carpeta: `npm install`
3. Edita `.env` y pon tu `STRIPE_SECRET_KEY`.
4. Edita `public/index.html` y pon tu clave publicable en `STRIPE_PK`.
5. `npm start` y abre http://localhost:4242 (no abras el HTML con doble clic: necesita el servidor para el endpoint `/api/create-checkout-session`).
6. Añade `.env` y `node_modules` a tu `.gitignore` para no subir claves.

### Estructura de archivos nuevos
```
.
├── server.js                  # servidor Express + endpoint de Checkout Session
├── package.json
├── .env                       # STRIPE_SECRET_KEY
├── STRIPE_INTEGRATION_TODO.md
└── public/
    └── index.html             # tu web (con el bloque de pago con tarjeta)
```

### Cómo funciona
1. El cliente añade diseños al carrito y pulsa **Finalizar pedido**.
2. En `public/index.html`, `mountStripe()` llama a `POST /api/create-checkout-session`.
3. El servidor crea la Checkout Session y devuelve `{ client_secret }` (JSON, sin redirección).
4. `stripe.initCheckoutFormSdk(...)` monta el formulario de pago en `#checkout-form` y el evento `confirm` completa el pago.
5. La transferencia bancaria sigue disponible como alternativa. El paso **2 · Envía tu pedido** (correo con el formulario .docx adjunto) se mantiene, porque Stripe no recibe ese archivo.

### Pruebas
- Usa claves de modo prueba (`sk_test_` / `pk_test_`).
- Tarjeta que funciona: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC y cualquier código postal.
- Tarjeta rechazada: `4000 0000 0000 0002`. Más casos: https://docs.stripe.com/testing

### Siguientes pasos
- Sustituir los placeholders de arriba (sobre todo los Price IDs y los importes variables).
- Decidir qué ocurre al terminar el pago (mensaje de confirmación o redirección). Consulta la documentación de Stripe sobre `return_url` y la confirmación en el formulario embebido.
- Cumplimiento del pedido: no hay webhook. Añade uno (`checkout.session.completed`) si quieres registrar los pedidos automáticamente en lugar de depender del correo.
- Servir la web por HTTPS en producción y pasar a claves `live` cuando termines las pruebas.

### Recursos
- https://support.stripe.com
- https://docs.stripe.com/mcp
