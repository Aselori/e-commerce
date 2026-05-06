import { Resend } from "resend";
import type { DeliveryMethod } from "@/types";
import { formatMXN } from "@/lib/format";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

function wrap(title: string, body: string) {
  return `
    <div style="font-family: system-ui, sans-serif; color: #111827; max-width: 560px;">
      <h2 style="margin: 0 0 12px;">${title}</h2>
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280;">FimeTienda</p>
    </div>
  `;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[email] Resend no configurado. Omitiendo:", subject);
    return;
  }
  try {
    await resend.emails.send({ from: fromAddress, to, subject, html });
  } catch (e) {
    console.error("[email] Error enviando notificación:", subject, e);
  }
}

async function sendAdmin(subject: string, html: string) {
  if (!adminEmail) {
    console.warn("[email] ADMIN_NOTIFY_EMAIL no configurado. Omitiendo:", subject);
    return;
  }
  await send(adminEmail, subject, html);
}

// ===== Admin notifications =====

type ReceiptNotification = {
  orderNumber: string;
  customerEmail: string | null;
  total: number;
  uploadedAt: Date;
};

export async function notifyAdminReceipt(data: ReceiptNotification) {
  await sendAdmin(
    `Nuevo comprobante de pago — ${data.orderNumber}`,
    wrap(
      "Comprobante recibido",
      `<p>Un cliente subió un comprobante de pago. Revísalo en el panel de administración.</p>
       <table style="border-collapse: collapse; font-size: 14px;">
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Pedido</td><td><strong>${data.orderNumber}</strong></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Cliente</td><td>${data.customerEmail ?? "(sin correo)"}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Total</td><td>${formatMXN(data.total)}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Subido</td><td>${data.uploadedAt.toLocaleString("es-MX")}</td></tr>
       </table>`
    )
  );
}

type NewOrderNotification = {
  orderNumber: string;
  customerEmail: string | null;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  billingRequired: boolean;
};

export async function notifyAdminNewOrder(data: NewOrderNotification) {
  await sendAdmin(
    `Nuevo pedido — ${data.orderNumber}`,
    wrap(
      "Nuevo pedido recibido",
      `<p>Hay un pedido esperando revisión.</p>
       <table style="border-collapse: collapse; font-size: 14px;">
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Folio</td><td><strong>${data.orderNumber}</strong></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Cliente</td><td>${data.customerEmail ?? "(sin correo)"}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Entrega</td><td>${data.deliveryMethod === "shipping" ? "Envío a domicilio" : "Recoger en sucursal"}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Subtotal</td><td>${formatMXN(data.subtotal)}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Factura</td><td>${data.billingRequired ? "Sí" : "No"}</td></tr>
       </table>`
    )
  );
}

// ===== Customer notifications =====

type CustomerBase = {
  to: string | null;
  orderNumber: string;
};

export async function notifyCustomerOrderReceived(data: CustomerBase & { deliveryMethod: DeliveryMethod }) {
  if (!data.to) return;
  const next =
    data.deliveryMethod === "shipping"
      ? "Te enviaremos una cotización con el costo de envío en breve."
      : "Te confirmaremos la disponibilidad de tu pedido en breve.";
  await send(
    data.to,
    `Recibimos tu pedido — ${data.orderNumber}`,
    wrap(
      "¡Gracias por tu pedido!",
      `<p>Recibimos tu pedido <strong>${data.orderNumber}</strong>. ${next}</p>
       <p>Puedes seguir el estado en la sección "Mis pedidos".</p>`
    )
  );
}

export async function notifyCustomerQuoteReady(data: CustomerBase & { shippingCost: number; total: number }) {
  if (!data.to) return;
  await send(
    data.to,
    `Cotización lista — ${data.orderNumber}`,
    wrap(
      "Tu cotización está lista",
      `<p>Calculamos el costo de envío para tu pedido <strong>${data.orderNumber}</strong>.</p>
       <table style="border-collapse: collapse; font-size: 14px;">
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Envío</td><td>${formatMXN(data.shippingCost)}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Total</td><td><strong>${formatMXN(data.total)}</strong></td></tr>
       </table>
       <p>Ingresa a tu cuenta para aceptar, cambiar a recolección en sucursal o cancelar.</p>`
    )
  );
}

export async function notifyCustomerAwaitingPayment(data: CustomerBase & { total: number }) {
  if (!data.to) return;
  await send(
    data.to,
    `Realiza tu pago — ${data.orderNumber}`,
    wrap(
      "Tu pedido está listo para pago",
      `<p>Confirmamos la disponibilidad de tu pedido <strong>${data.orderNumber}</strong>.</p>
       <p>Total a pagar: <strong>${formatMXN(data.total)}</strong></p>
       <p>Realiza tu transferencia y sube el comprobante desde tu cuenta.</p>`
    )
  );
}

export async function notifyCustomerPaymentConfirmed(data: CustomerBase) {
  if (!data.to) return;
  await send(
    data.to,
    `Pago confirmado — ${data.orderNumber}`,
    wrap(
      "Pago confirmado",
      `<p>Recibimos y confirmamos tu pago para el pedido <strong>${data.orderNumber}</strong>.</p>
       <p>Te avisaremos cuando esté listo.</p>`
    )
  );
}

export async function notifyCustomerShipped(data: CustomerBase) {
  if (!data.to) return;
  await send(
    data.to,
    `Tu pedido fue enviado — ${data.orderNumber}`,
    wrap(
      "Pedido enviado",
      `<p>Tu pedido <strong>${data.orderNumber}</strong> ya está en camino.</p>`
    )
  );
}

export async function notifyCustomerReadyForPickup(data: CustomerBase) {
  if (!data.to) return;
  await send(
    data.to,
    `Tu pedido está listo para recoger — ${data.orderNumber}`,
    wrap(
      "Listo para recoger",
      `<p>Tu pedido <strong>${data.orderNumber}</strong> está listo para que pases a recogerlo en sucursal.</p>`
    )
  );
}

export async function notifyCustomerDelivered(data: CustomerBase) {
  if (!data.to) return;
  await send(
    data.to,
    `Pedido entregado — ${data.orderNumber}`,
    wrap(
      "Pedido entregado",
      `<p>Marcamos como entregado tu pedido <strong>${data.orderNumber}</strong>. ¡Gracias por tu compra!</p>`
    )
  );
}

export async function notifyCustomerCancelled(data: CustomerBase & { reason?: string }) {
  if (!data.to) return;
  await send(
    data.to,
    `Pedido cancelado — ${data.orderNumber}`,
    wrap(
      "Pedido cancelado",
      `<p>Tu pedido <strong>${data.orderNumber}</strong> fue cancelado.</p>
       ${data.reason ? `<p>Motivo: ${data.reason}</p>` : ""}`
    )
  );
}
