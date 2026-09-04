import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Check, LogOut, Package, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdminData, updateOrderStatus as updateOrderStatusServer } from "../lib/server-api";
import { getAccessToken, getCurrentProfile, supabase } from "../lib/supabase";
import type { Order, OrderStatus, ContactMessage } from "../lib/store";

export const Route = createFileRoute("/admin")({ component: Admin });

const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function Admin() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentProfile()
      .then(async (profile) => {
        if (!profile || profile.role !== "admin") {
          toast.error("Admin access required.");
          navigate({ to: "/" });
          return;
        }
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        const data = await getAdminData({ data: { accessToken } });
        if (!active) return;
        setOrders(
          (data.orders ?? []).map((order) => ({
            id: order.id,
            customer: order.customer_name,
            customerEmail: order.customer_email,
            phone: order.phone,
            address: order.address,
            product: Array.isArray(order.items)
              ? order.items
                  .map(
                    (item: { product: string; quantity: number }) =>
                      `${item.product} x${item.quantity}`,
                  )
                  .join(", ")
              : "Order items",
            quantity: 1,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            status: order.status,
            createdAt: order.created_at,
          })) as Order[],
        );
        setMessages(
          (data.messages ?? []).map((message) => ({
            id: message.id,
            name: message.name,
            email: message.email,
            message: message.message,
            status: message.status,
            createdAt: message.created_at,
          })) as ContactMessage[],
        );
        setAuthenticated(true);
      })
      .catch(() => {
        toast.error("Unable to load admin data.");
        navigate({ to: "/" });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!authenticated) return null;
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.status === "pending").length;
  const upi = orders.filter((order) => order.paymentMethod === "upi").length;

  const changeStatus = async (order: Order, status: OrderStatus) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    try {
      await updateOrderStatusServer({ data: { accessToken, orderId: order.id, status } });
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status } : item)),
      );
      toast(`Order ${order.id} marked ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update order.");
    }
  };

  const metrics: { label: string; value: string | number; Icon: LucideIcon }[] = [
    { label: "Revenue", value: `₹${revenue.toLocaleString("en-IN")}`, Icon: BarChart3 },
    { label: "Orders", value: orders.length, Icon: Package },
    { label: "Pending", value: pending, Icon: Check },
    { label: "UPI orders", value: upi, Icon: Users },
  ];

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-6">
        <div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Storefront
          </Link>
          <h1 className="mt-4 font-display text-4xl text-primary">Velnora operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Orders, customers, and customer care in one quiet corner.
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-card"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <section className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl bg-card p-5">
            <Icon className="h-5 w-5 text-accent" />
            <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-3xl text-primary">{value}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-8 max-w-6xl rounded-2xl bg-card p-5 sm:p-7">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-primary">Recent orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update fulfillment as each order moves through your studio.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Orders will appear here after your first checkout.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/70">
                    <td className="py-4 font-semibold text-primary">
                      {order.id}
                      <div className="font-normal text-xs text-muted-foreground">
                        {order.product} x {order.quantity}
                      </div>
                    </td>
                    <td className="py-4">
                      {order.customer}
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </td>
                    <td className="py-4 uppercase text-xs">{order.paymentMethod}</td>
                    <td className="py-4">₹{order.total.toLocaleString("en-IN")}</td>
                    <td className="py-4">
                      <select
                        value={order.status}
                        onChange={(event) => changeStatus(order, event.target.value as OrderStatus)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-6xl rounded-2xl bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl text-primary">Reach us inbox</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages submitted from the storefront.
        </p>
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Your inbox is clear.</p>
        ) : (
          <div className="mt-5 grid gap-3">
            {messages.map((message) => (
              <article key={message.id} className="border-b border-border pb-4">
                <div className="flex justify-between gap-4">
                  <p className="font-semibold">
                    {message.name}{" "}
                    <span className="font-normal text-muted-foreground">{message.email}</span>
                  </p>
                  <time className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
