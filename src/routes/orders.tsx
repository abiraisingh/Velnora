import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Package, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getOrders, getSession, type Order } from "../lib/store";

export const Route = createFileRoute("/orders")({ component: Orders });

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const session = getSession();
    if (!session || !("email" in session)) {
      toast.error("Please sign in to view your orders.");
      navigate({ to: "/" });
      return;
    }
    setSignedIn(true);
    const refresh = () =>
      setOrders(getOrders().filter((order) => order.customerEmail === session.email));
    refresh();
    window.addEventListener("velnora-store", refresh);
    return () => window.removeEventListener("velnora-store", refresh);
  }, [navigate]);
  if (!signedIn) return null;
  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-10">
      <header className="mx-auto flex max-w-4xl items-center justify-between border-b border-border pb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Storefront
        </Link>
        <Link to="/cart" className="text-sm font-semibold text-primary hover:text-accent">
          Your cart
        </Link>
      </header>
      <div className="mx-auto max-w-4xl">
        <div className="mt-10 flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <UserRound className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Account</p>
            <h1 className="font-display text-4xl text-primary">My orders</h1>
          </div>
        </div>
        {!orders.length ? (
          <div className="mt-10 rounded-2xl bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-4 font-display text-2xl text-primary">No orders yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Velnora purchases will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-accent">{order.id}</p>
                    <h2 className="mt-1 font-display text-2xl text-primary">{order.product}</h2>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-primary">
                    {order.status}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Placed {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="capitalize">Payment: {order.paymentMethod}</p>
                  <p className="font-semibold text-foreground">
                    Total: ₹{order.total.toLocaleString("en-IN")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
