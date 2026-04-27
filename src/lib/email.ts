import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

type ReceiptNotification = {
  orderNumber: string;
  customerEmail: string | null;
  total: number;
  uploadedAt: Date;
};

export async function notifyAdminReceipt(data: ReceiptNotification) {
  if (!resend || !adminEmail) {
    console.warn("[email] Resend no configurado. Omitiendo notificación.");
    return;
  }

  const formattedTotal = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(data.total);

  try {
    await resend.emails.send({
      from: fromAddress,
      to: adminEmail,
      subject: `Nuevo comprobante de pago — ${data.orderNumber}`,
      html: `
        <div style="font-family: system-ui, sans-serif; color: #111827;">
          <h2 style="margin: 0 0 12px;">Comprobante recibido</h2>
          <p style="margin: 0 0 16px;">
            Un cliente subió un comprobante de pago. Revísalo en el panel de
            administración.
          </p>
          <table style="border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">Orden</td>
              <td style="padding: 4px 0;"><strong>${data.orderNumber}</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">Cliente</td>
              <td style="padding: 4px 0;">${data.customerEmail ?? "(sin correo)"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">Total</td>
              <td style="padding: 4px 0;">${formattedTotal}</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">Subido</td>
              <td style="padding: 4px 0;">${data.uploadedAt.toLocaleString("es-MX")}</td>
            </tr>
          </table>
        </div>
      `,
    });
  } catch (e) {
    console.error("[email] Error enviando notificación:", e);
  }
}
