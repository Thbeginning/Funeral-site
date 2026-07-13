// Supabase Edge Function: send-invoice
// Receives order data from the checkout page and sends a professional HTML invoice
// via the Resend API. This runs server-side, so there are no CORS issues.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = "re_Sj6daB1k_BVpwTAERdT5zTQFgM3e5mnQv";
const ADMIN_EMAIL = "contact@royalfuneralsupplies.com";
const FROM_ADDRESS = "Royal Funeral Supplies <contact@royalfuneralsupplies.com>";

// CORS headers — allow requests from any origin (our static site)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(data: any): string {
  const rows = (data.cart || []).map((item: any) => {
    const p = parseFloat(item.price) || 0;
    const q = parseInt(item.quantity, 10) || 1;
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${escapeHtml(item.name)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:14px;color:#475569;">${q}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;color:#475569;">${formatCurrency(p)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#0f172a;">${formatCurrency(p * q)}</td>
      </tr>`;
  }).join("");

  const subtotal = (data.cart || []).reduce((sum: number, i: any) => {
    return sum + (parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1);
  }, 0);

  const hasTier2 = (data.cart || []).some((i: any) => i.tier === 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Invoice — Royal Funeral Supplies</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);max-width:600px;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 48px;text-align:center;">
              <div style="display:inline-block;border:2px solid rgba(13,148,136,0.6);border-radius:10px;padding:8px 20px;margin-bottom:16px;">
                <h1 style="color:#ffffff;margin:0;font-size:18px;letter-spacing:3px;text-transform:uppercase;font-weight:800;">ROYAL FUNERAL SUPPLIES</h1>
              </div>
              <p style="color:#0d9488;margin:0;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Official Order Confirmation &amp; Invoice</p>
            </td>
          </tr>

          <!-- ── GREETING ── -->
          <tr>
            <td style="padding:36px 48px 0;">
              <p style="color:#0f172a;font-size:16px;margin:0 0 8px;line-height:1.6;">Dear <strong>${escapeHtml(data.firstName + " " + data.lastName)}</strong>,</p>
              <p style="color:#475569;font-size:14px;margin:0 0 28px;line-height:1.7;">Thank you for choosing Royal Funeral Supplies. Your order has been received and is now being processed by our team. Please keep this confirmation for your records.</p>

              <!-- Order Reference Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Order Reference ID</p>
                    <p style="margin:8px 0 4px;font-size:28px;font-weight:800;color:#0d9488;letter-spacing:5px;font-family:monospace;">${escapeHtml(data.orderId)}</p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;">${escapeHtml(data.orderDate)}</p>
                  </td>
                </tr>
              </table>

              <!-- Payment Method Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;">&#128179; Payment Method: ${escapeHtml(data.paymentMethod)}</p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">Our service team will email you the payment account details for your chosen method within <strong>1 business day</strong>. Please keep an eye on your inbox.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── ORDER ITEMS TABLE ── -->
          <tr>
            <td style="padding:0 48px 28px;">
              <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:12px 16px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Product</th>
                    <th style="padding:12px 16px;text-align:center;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Qty</th>
                    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Unit Price</th>
                    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Total</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                  <tr style="background:#f8fafc;border-top:2px solid #e2e8f0;">
                    <td colspan="3" style="padding:14px 16px;text-align:right;font-weight:700;color:#0f172a;font-size:15px;">Subtotal</td>
                    <td style="padding:14px 16px;text-align:right;font-weight:800;color:#0d9488;font-size:18px;">${formatCurrency(subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
              ${hasTier2 ? `<p style="margin:10px 0 0;font-size:12px;color:#64748b;font-style:italic;">&#128666; Your order includes freight items. Final shipping cost will be calculated and communicated separately.</p>` : ""}
            </td>
          </tr>

          <!-- ── SHIPPING INFO ── -->
          <tr>
            <td style="padding:0 48px 28px;">
              <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;">Shipping Information</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.8;">
                      <strong>${escapeHtml(data.firstName + " " + data.lastName)}</strong><br>
                      ${data.company ? escapeHtml(data.company) + "<br>" : ""}
                      ${escapeHtml(data.address)}<br>
                      ${escapeHtml(data.city + ", " + data.state + " " + data.zip)}<br>
                      <span style="color:#475569;">&#128222; ${escapeHtml(data.phone)}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f8fafc;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">Royal Funeral Supplies</p>
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;">B2B Funeral Products &amp; Supplies</p>
              <p style="margin:0;font-size:12px;color:#0d9488;">contact@royalfuneralsupplies.com</p>
              <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Royal Funeral Supplies. All rights reserved.</p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const data = await req.json();

    // Validate required fields
    if (!data.customerEmail || !data.orderId || !data.cart) {
      return new Response(JSON.stringify({ error: "Missing required fields: customerEmail, orderId, cart" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(data);
    const subject = `Order Confirmation ${data.orderId} — Royal Funeral Supplies`;

    // Send to customer AND admin
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [data.customerEmail, ADMIN_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    const resendBody = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendBody);
      return new Response(JSON.stringify({ error: "Email send failed", details: resendBody }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendBody.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
