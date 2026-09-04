import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

async function verifySignature(timestamp: string, body: string, signature: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("CASHFREE_WEBHOOK_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  return expected === signature;
}

export const Route = createFileRoute("/api/payment/webhook")({
  server: {
    handlers: {
      POST: async () => {
        const request = getRequest();
        const body = await request.text();
        const timestamp = getRequestHeader("x-webhook-timestamp");
        const signature = getRequestHeader("x-webhook-signature");
        if (!timestamp || !signature || !(await verifySignature(timestamp, body, signature)))
          return new Response("Invalid signature", { status: 401 });
        const payload = JSON.parse(body) as {
          data?: {
            order?: { order_id?: string };
            payment?: { cf_payment_id?: string; payment_status?: string };
          };
        };
        const orderId = payload.data?.order?.order_id;
        const payment = payload.data?.payment;
        if (!orderId || !payment) return new Response("Invalid payload", { status: 400 });
        const paymentStatus =
          payment.payment_status === "SUCCESS"
            ? "paid"
            : payment.payment_status === "FAILED"
              ? "failed"
              : "pending";
        const supabase = createClient(env("VITE_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            cashfree_payment_id: payment.cf_payment_id ?? null,
          })
          .eq("id", orderId);
        if (error) return new Response("Unable to update order", { status: 500 });
        return Response.json({ received: true });
      },
    },
  },
});
