import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  clearCart,
  createOrder,
  getCart,
  getSession,
  updateCartQuantity,
  type CartItem,
} from "../lib/store";

export const Route = createFileRoute("/cart")({ component: Cart });

function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [payment, setPayment] = useState<"cod" | "upi">("cod");
  useEffect(() => {
    const session = getSession();
    if (!session || !("email" in session)) {
      toast.error("Please sign in to view your cart.");
      navigate({ to: "/" });
      return;
    }
    setItems(getCart());
    setForm((current) => ({ ...current, name: session.name, email: session.email }));
    const refresh = () => setItems(getCart());
    window.addEventListener("velnora-store", refresh);
    return () => window.removeEventListener("velnora-store", refresh);
  }, [navigate]);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!getSession()) {
      toast.error("Please sign in before placing an order.");
      return;
    }
    if (!items.length || !form.name || !form.email || !form.phone || !form.address) {
      toast.error("Complete your delivery details first.");
      return;
    }
    const first = items[0];
    if (!first) return;
    createOrder({
      customer: form.name,
      customerEmail: form.email,
      phone: form.phone,
      address: form.address,
      product: items.map((item) => `${item.product} x${item.quantity}`).join(", "),
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total,
      paymentMethod: payment,
    });
    clearCart();
    setItems([]);
    toast.success("Your order has been received.");
  };
  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-border pb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <Link to="/orders" className="text-sm font-semibold text-primary hover:text-accent">
          My orders
        </Link>
      </header>
      <div className="mx-auto max-w-5xl">
        <h1 className="mt-10 font-display text-5xl text-primary">Your cart</h1>
        {!items.length ? (
          <div className="mt-10 rounded-2xl bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-4 font-display text-2xl text-primary">
              Your cart is waiting for a little light.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Browse fragrances
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-3">
              {items.map((item) => (
                <article key={item.product} className="flex gap-4 rounded-2xl bg-card p-4">
                  <img
                    src={item.image}
                    alt={item.product}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl text-primary">{item.product}</h2>
                        <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <button
                        onClick={() => updateCartQuantity(item.product, 0)}
                        aria-label={`Remove ${item.product}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateCartQuantity(item.product, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="rounded-md border border-border p-1"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="rounded-md border border-border p-1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="ml-auto font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <form onSubmit={submit} className="rounded-2xl bg-card p-6">
              <h2 className="font-display text-2xl text-primary">Delivery and payment</h2>
              <div className="mt-5 space-y-3">
                <input
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Complete delivery address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={`rounded-lg border px-3 py-3 text-xs ${payment === "cod" ? "border-primary bg-secondary" : "border-input"}`}
                >
                  Cash on delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("upi")}
                  className={`rounded-lg border px-3 py-3 text-xs ${payment === "upi" ? "border-primary bg-secondary" : "border-input"}`}
                >
                  UPI
                </button>
              </div>
              <div className="mt-6 flex justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <strong className="font-display text-2xl text-primary">
                  ₹{total.toLocaleString("en-IN")}
                </strong>
              </div>
              <button className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                Place order
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
