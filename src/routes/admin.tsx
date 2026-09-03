import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Check, LogOut, Package, Users, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMessages,
  getOrders,
  getSession,
  signOut,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "../lib/store";

export const Route = createFileRoute("/admin")({ component: Admin });

const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

function Admin() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState(getMessages());
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session && "role" in session && session.role === "admin") setAuthenticated(true);
    else navigate({ to: "/" });
    const refresh = () => {
      setOrders(getOrders());
      setMessages(getMessages());
    };
    refresh();
    window.addEventListener("velnora-store", refresh);
    return () => window.removeEventListener("velnora-store", refresh);
  }, [navigate]);

  if (!authenticated) return null;
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.status === "pending").length;
  const upi = orders.filter((order) => order.paymentMethod === "upi").length;

  const changeStatus = (order: Order, status: OrderStatus) => {
    updateOrderStatus(order.id, status);
    setOrders(getOrders());
    toast(`Order ${order.id} marked ${status}.`);
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
          onClick={() => {
            signOut();
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
