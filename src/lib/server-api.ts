import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const orderItemSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive(),
});
const checkoutSchema = z.object({
  accessToken: z.string().min(1),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  phone: z.string().min(7).max(30),
  address: z.string().min(10).max(500),
  items: z.array(orderItemSchema).min(1).max(20),
  paymentMethod: z.enum(["cod", "upi"]),
});
const authSchema = z.object({ accessToken: z.string().min(1) });

const products: Record<string, number> = { Rose: 300, Jasmine: 300, Mogra: 300 };

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

function supabaseForUser(accessToken: string) {
  return createClient(env("VITE_SUPABASE_URL"), env("VITE_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function adminSupabase() {
  return createClient(env("VITE_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function cashfreeRequest(path: string, init: RequestInit = {}) {
  const base =
    env("CASHFREE_ENVIRONMENT") === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-version": "2025-01-01",
      "x-client-id": env("CASHFREE_APP_ID"),
      "x-client-secret": env("CASHFREE_SECRET_KEY"),
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(`Cashfree request failed: ${response.status}`);
  return body;
}

export const getCurrentProfile = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return null;
    const { data: profile } = await client
      .from("profiles")
      .select("id,name,role,created_at")
      .eq("id", userData.user.id)
      .single();
    return profile ? { ...profile, email: userData.user.email ?? "" } : null;
  });

export const createContactMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      accessToken: z.string().optional(),
      name: z.string().min(2).max(120),
      email: z.string().email(),
      message: z.string().min(5).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const client = data.accessToken
      ? await supabaseForUser(data.accessToken)
      : createClient(env("VITE_SUPABASE_URL"), env("VITE_SUPABASE_ANON_KEY"));
    const { data: userData } = data.accessToken
      ? await client.auth.getUser(data.accessToken)
      : { data: { user: null } };
    const { error } = await client.from("contact_messages").insert({
      user_id: userData.user?.id ?? null,
      name: data.name,
      email: data.email,
      message: data.message,
    });
    if (error) throw new Error("Unable to send your message.");
    return { success: true };
  });

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) throw new Error("Authentication required.");
    const total = data.items.reduce((sum, item) => {
      const price = products[item.product];
      if (!price) throw new Error("Invalid product.");
      return sum + price * item.quantity;
    }, 0);
    const orderItems = data.items.map((item) => ({ ...item, unit_price: products[item.product] }));
    const { data: order, error } = await client
      .from("orders")
      .insert({
        user_id: userData.user.id,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        phone: data.phone,
        address: data.address,
        items: orderItems,
        total,
        payment_method: data.paymentMethod,
        payment_status: "pending",
        status: "pending",
      })
      .select("id,total,payment_method")
      .single();
    if (error || !order) throw new Error("Unable to create order.");
    if (data.paymentMethod === "cod")
      return { orderId: order.id, paymentStatus: "pending" as const };
    const origin = getRequestHeader("origin") ?? "";
    const cashfree = await cashfreeRequest("/orders", {
      method: "POST",
      headers: { "x-idempotency-key": order.id },
      body: JSON.stringify({
        order_id: order.id,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: userData.user.id,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.phone,
        },
        order_meta: {
          return_url: `${origin}/payment-result?order_id=${order.id}`,
          notify_url: `${origin}/api/payment/webhook`,
        },
      }),
    });
    const cashfreeOrderId = String(cashfree["order_id"] ?? order.id);
    await adminSupabase()
      .from("orders")
      .update({ cashfree_order_id: cashfreeOrderId })
      .eq("id", order.id);
    return {
      orderId: order.id,
      paymentStatus: "pending" as const,
      paymentSessionId: String(cashfree["payment_session_id"] ?? ""),
    };
  });

export const getMyOrders = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) throw new Error("Authentication required.");
    const { data: orders, error } = await client
      .from("orders")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load orders.");
    return orders;
  });

export const getAdminData = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", (await client.auth.getUser(data.accessToken)).data.user?.id ?? "")
      .single();
    if (profile?.role !== "admin") throw new Error("Forbidden.");
    const [
      { data: orders, error: orderError },
      { data: messages, error: messageError },
      { data: customers, error: customerError },
    ] = await Promise.all([
      client.from("orders").select("*").order("created_at", { ascending: false }),
      client.from("contact_messages").select("*").order("created_at", { ascending: false }),
      client.from("profiles").select("id,name,role,created_at"),
    ]);
    if (orderError || messageError || customerError) throw new Error("Unable to load admin data.");
    return { orders, messages, customers };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      accessToken: z.string().min(1),
      orderId: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
    }),
  )
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", (await client.auth.getUser(data.accessToken)).data.user?.id ?? "")
      .single();
    if (profile?.role !== "admin") throw new Error("Forbidden.");
    const { error } = await client
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error("Unable to update order.");
    return { success: true };
  });

export const getCashfreePaymentStatus = createServerFn({ method: "POST" })
  .validator(z.object({ accessToken: z.string().min(1), orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const client = await supabaseForUser(data.accessToken);
    const { data: userData } = await client.auth.getUser(data.accessToken);
    if (!userData.user) throw new Error("Authentication required.");
    const { data: order } = await client
      .from("orders")
      .select("id,user_id,cashfree_order_id,payment_status")
      .eq("id", data.orderId)
      .eq("user_id", userData.user.id)
      .single();
    if (!order) throw new Error("Order not found.");
    if (!order.cashfree_order_id) return { paymentStatus: order.payment_status };
    const payments = await cashfreeRequest(`/orders/${order.cashfree_order_id}/payments`);
    const payment = Array.isArray(payments)
      ? (payments.find((item) => item && typeof item === "object" && "payment_status" in item) as
          { payment_status?: string; cf_payment_id?: string } | undefined)
      : undefined;
    const paymentStatus =
      payment?.payment_status === "SUCCESS"
        ? "paid"
        : payment?.payment_status === "FAILED"
          ? "failed"
          : "pending";
    if (paymentStatus !== order.payment_status)
      await adminSupabase()
        .from("orders")
        .update({
          payment_status: paymentStatus,
          cashfree_payment_id: payment?.cf_payment_id ?? null,
        })
        .eq("id", order.id);
    return { paymentStatus };
  });
