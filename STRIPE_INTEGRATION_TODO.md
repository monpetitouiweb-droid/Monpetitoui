# Stripe: pasos pendientes

## Valores a reemplazar

Estos valores dependen de tu web y de tu cuenta, y hay que ponerlos antes de cobrar.

**Archivos que los usan:**
- [api/create-checkout-session.js](api/create-checkout-session.js)

| Campo | Valor actual | Qué poner |
|-------|--------------|-----------|
| success_url | `${DOMAIN}/?pago=ok&session_id={CHECKOUT_SESSION_ID}` | Funciona tal cual. La web muestra un aviso de pago recibido. Conserva `{CHECKOUT_SESSION_ID}`. |
| cancel_url | `${DOMAIN}/` | Funciona tal cual: vuelve a tu web. |
| line_items | `price_data` calculado en el servidor | No hay Price ID: el importe se calcula con 150 € + 40 € por página extra + 50 € por idioma extra. Si cambias los precios, edita BASE, PAGINA_EXTRA e IDIOMA_EXTRA. |
| DISENOS | Sombras, Tinta, Hilo, Japón, Cera, Bordado, Mediterráneo | Añade o quita nombres aquí cuando añadas o quites diseños en la web. |
| STRIPE_SECRET_KEY | (variable de entorno) | Tu clave `sk_test_...` para pruebas. Para cobrar de verdad, tu clave `sk_live_...`. |
| DOMAIN | (variable de entorno) | La dirección de tu web en Vercel, por ejemplo `https://mon-petit-oui.vercel.app`. |
| RESEND_API_KEY | (variable de entorno) | Tu clave de Resend (`re_...`), para enviarte el correo con el formulario. Ver "Correo con el formulario". |
| ORDER_EMAIL | monpetitoui.web@gmail.com | Opcional. Correo donde recibes los pedidos. |

## Parámetros configurados

Vienen de Checkout Studio y ya están puestos.

**Archivos:**
- [api/create-checkout-session.js](api/create-checkout-session.js)

| Parámetro | Valor |
|-----------|-------|
| ui_mode | hosted_page |
| billing_address_collection | auto |
| phone_number_collection | enabled: false |
| automatic_tax | enabled: false |
| allow_promotion_codes | false |
| submit_type | auto |
| integration_identifier | hosted_web_0001 |
| origin_context | web |
| mode | payment |

`payment_method_collection` no se incluye porque solo se usa en suscripciones.

## Instalación

1. Sube a tu repositorio de GitHub estos archivos, manteniendo las carpetas:
   - `index.html`
   - `api/create-checkout-session.js`
   - `api/send-form.js`
   - `package.json`
   - `.gitignore`
   - `STRIPE_INTEGRATION_TODO.md`
2. En https://vercel.com crea un proyecto nuevo e importa ese repositorio. No hay que configurar nada más.
3. En Vercel, en Settings > Environment Variables, añade `STRIPE_SECRET_KEY` y `DOMAIN` (ver `.env.example`). Vuelve a desplegar.
4. Abre tu web, añade un diseño al carrito, pulsa "Finalizar pedido" y paga con tarjeta.

La clave secreta solo va en Vercel, nunca en el código ni en GitHub.

**Versión del SDK:** `package.json` pide `stripe` 21.0.0 o superior, que usa `ui_mode: "hosted_page"`. Si usaras una versión anterior, habría que cambiarlo a `"hosted"`.

## Correo con el formulario

Cuando el cliente paga, la web envía el formulario relleno a tu correo con Resend.

1. Crea una cuenta en https://resend.com con el correo en el que quieres recibir los pedidos (monpetitoui.web@gmail.com).
2. En Resend, ve a API Keys, crea una clave y cópiala.
3. En Vercel, añade la variable `RESEND_API_KEY` con esa clave y vuelve a desplegar.

Sin dominio verificado, Resend solo permite enviar al correo con el que registraste tu cuenta, usando el remitente `onboarding@resend.dev`. Para tu caso es suficiente, porque el correo va a ti. Si más adelante quieres un remitente propio, verifica un dominio en Resend y define la variable `MAIL_FROM`.

Detalles:
- El archivo puede ser .docx, .doc o .pdf, de hasta 3 MB.
- Solo se envía si Stripe confirma que el pago está completado, y como máximo 3 veces por pago.
- Si el cliente no había adjuntado el formulario antes de pagar, al volver a la web se le pide que lo suba.

## Cómo funciona

1. El cliente elige diseño, páginas e idiomas y los añade al carrito.
2. En "Finalizar pedido" escribe su email y pulsa "Pagar".
3. La web llama a `/api/create-checkout-session`, que recalcula el precio en el servidor y crea la sesión de Stripe.
4. El cliente paga en la página segura de Stripe y vuelve a tu web con un aviso de pago recibido.
5. Al volver, la web envía el formulario a `/api/send-form`, que comprueba el pago en Stripe y te manda un correo con el resumen del pedido y el formulario adjunto.
6. El diseño, las páginas, los idiomas y la música quedan guardados en el pago de Stripe (metadatos y referencia).

Los pagos con tarjeta son de un diseño por pedido. Si hay varios en el carrito, cada uno se paga por separado.

## Pruebas

- Con claves `sk_test_`, tarjeta de prueba `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
- Comprueba el pago en https://dashboard.stripe.com/test/payments.

## Siguientes pasos

- **Avisos de Stripe:** además del correo con el formulario, puedes recibir un aviso de cada pago activándolo en Stripe, en Ajustes y luego Notificaciones.
- **Avisos:** Stripe te manda los avisos de pago a tu correo si lo activas en Ajustes > Notificaciones. Si quieres que el pago dispare un correo propio o guarde el pedido, hace falta un webhook para `checkout.session.completed`. No está incluido.
- **Cobros reales:** activa tu cuenta de Stripe y cambia a `sk_live_`.
- **Legal:** revisa condiciones de venta, privacidad y desistimiento, y el IVA, con tu gestoría.

## Recursos

- https://support.stripe.com
- https://docs.stripe.com/mcp
