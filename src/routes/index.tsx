import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Leaf,
  Flame,
  Sparkles,
  Gift,
  Phone,
  Instagram,
  Mail,
  Heart,
  Globe,
  Rabbit,
  ShoppingBag,
  ShieldCheck,
  User,
  LogIn,
  Send,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { addToCart } from "../lib/store";
import { createCheckoutOrder, createContactMessage, getCurrentProfile } from "../lib/server-api";
import { getAccessToken, isSupabaseConfigured, supabase, type Profile } from "../lib/supabase";
import { openCashfreeCheckout } from "../lib/cashfree";

import heroCandle from "@/assets/hero-candle.jpg";
import roseImg from "@/assets/rose.jpg";
import jasmineImg from "@/assets/jasmine.jpg";
import mograImg from "@/assets/mogra.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velnora — Handcrafted Scented Candles | Essence of Calm" },
      {
        name: "description",
        content:
          "Velnora handcrafted soy wax scented candles in Rose, Jasmine and Mogra. Light. Breathe. Unwind — natural ingredients, long lasting aroma.",
      },
      { property: "og:title", content: "Velnora — Handcrafted Scented Candles" },
      {
        property: "og:description",
        content:
          "Handcrafted scented candles made to bring peace to your space and warmth to your soul.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const benefits = [
  {
    icon: Leaf,
    title: "Natural Ingredients",
    text: "Made with 100% soy wax, premium fragrance oils and cotton wicks.",
  },
  {
    icon: Flame,
    title: "Handcrafted with Care",
    text: "Each candle is hand-poured in small batches for perfect quality.",
  },
  {
    icon: Sparkles,
    title: "Long Lasting Aroma",
    text: "Enjoy a clean, even burn and long-lasting fragrance that soothes your soul.",
  },
  {
    icon: Gift,
    title: "Perfect for Every Moment",
    text: "Self-care, work, yoga, meditation or gifting — Velnora is always the right choice.",
  },
];

const promises = [
  { icon: Leaf, label: "Paraben Free" },
  { icon: Sparkles, label: "Toxin Free" },
  { icon: Globe, label: "Eco Friendly" },
  { icon: Rabbit, label: "Cruelty Free" },
];

const fragrances = [
  {
    name: "Rose",
    image: roseImg,
    price: "₹300",
    text: "Soft, romantic petals of Bulgarian rose for a warm, comforting glow.",
  },
  {
    name: "Jasmine",
    image: jasmineImg,
    price: "₹300",
    text: "Delicate night-blooming jasmine that calms the mind and lifts the mood.",
  },
  {
    name: "Mogra",
    image: mograImg,
    price: "₹300",
    text: "Fresh, traditional mogra blossoms bringing a nostalgic Indian summer home.",
  },
];

function BuyButton({ name, price, image }: { name: string; price: string; image: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [form, setForm] = useState({ customer: "", customerEmail: "", phone: "", address: "" });
  const total = Number(price.replace(/[^0-9]/g, ""));
  const requireSignIn = async () => {
    if (await getAccessToken()) return true;
    toast.error("Please sign in before shopping.");
    return false;
  };
  const add = async () => {
    if (!(await requireSignIn())) return;
    addToCart({ product: name, image, price: total });
    toast.success(`${name} added to cart.`);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customer || !form.customerEmail || !form.phone || !form.address) {
      toast.error("Please complete your delivery details.");
      return;
    }
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Please sign in before placing an order.");
      return;
    }
    try {
      const order = await createCheckoutOrder({
        data: {
          accessToken,
          customerName: form.customer,
          customerEmail: form.customerEmail,
          phone: form.phone,
          address: form.address,
          items: [{ product: name, quantity: 1 }],
          paymentMethod,
        },
      });
      if (paymentMethod === "upi" && order.paymentSessionId) {
        await openCashfreeCheckout(order.paymentSessionId);
        return;
      }
      setSubmitted(true);
      toast.success(`Order ${order.orderId} received.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to place order.");
    }
  };

  return (
    <>
      <button
        onClick={add}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ShoppingBag className="h-4 w-4" />
        Add to cart
      </button>
      <button
        onClick={async () => {
          if (await requireSignIn()) setOpen(true);
        }}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Buy now
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent">Secure order</p>
                <h3 className="mt-1 font-display text-3xl text-primary">
                  {submitted ? "Thank you" : `Bring home ${name}`}
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                Close
              </button>
            </div>
            {submitted ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Your order is pending confirmation. We will call you shortly with delivery
                  details.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                  required
                  placeholder="Full name"
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Email address"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <input
                  required
                  placeholder="Phone number"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <textarea
                  required
                  placeholder="Complete delivery address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`rounded-lg border px-3 py-3 text-sm ${paymentMethod === "cod" ? "border-primary bg-secondary" : "border-input"}`}
                  >
                    Cash on delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`rounded-lg border px-3 py-3 text-sm ${paymentMethod === "upi" ? "border-primary bg-secondary" : "border-input"}`}
                  >
                    UPI
                  </button>
                </div>
                {paymentMethod === "upi" && (
                  <p className="rounded-lg bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                    UPI payment details will be shared by our team after your order is verified.
                  </p>
                )}
                <button className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  Place order for ₹{total}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReachUsForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const accessToken = await getAccessToken();
      await createContactMessage({ data: { ...form, accessToken: accessToken ?? undefined } });
      setForm({ name: "", email: "", message: "" });
      setSent(true);
      toast.success("Your message is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send your message.");
    }
  };

  return (
    <section
      className="mt-8 grid gap-8 rounded-3xl bg-card p-7 sm:p-10 md:grid-cols-[0.8fr_1.2fr]"
      id="reach-us"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Reach us</p>
        <h3 className="mt-3 font-display text-4xl leading-tight text-primary">
          A little note goes a long way.
        </h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Questions about a fragrance, gifting, or delivery? We read every message and reply within
          one working day.
        </p>
      </div>
      {sent ? (
        <div className="flex items-center justify-center rounded-2xl bg-secondary p-8 text-center">
          <div>
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-display text-2xl text-primary">Message received.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for reaching out to Velnora.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-3 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-3 text-sm"
            />
          </div>
          <textarea
            required
            rows={4}
            placeholder="How can we help?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
          />
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            <Send className="h-4 w-4" /> Send message
          </button>
        </form>
      )}
    </section>
  );
}

function AccountPanel() {
  const [session, setSession] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const loadProfile = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) setSession(await getCurrentProfile({ data: { accessToken } }));
    };
    void loadProfile();
    const { data } = supabase.auth.onAuthStateChange(() => void loadProfile());
    return () => data.subscription.unsubscribe();
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Account sign-in is not configured. Add the Supabase values to .env.");
      return;
    }
    try {
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
          : await supabase.auth.signUp({
              email: form.email,
              password: form.password,
              options: { data: { name: form.name } },
            });
      if (result.error) throw result.error;
      const next = await getCurrentProfile({
        data: { accessToken: result.data.session?.access_token ?? "" },
      });
      setSession(next);
      setOpen(false);
      toast.success(
        mode === "signin" ? "Welcome back to Velnora." : "Your Velnora account is ready.",
      );
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error && typeof error.status === "number"
          ? error.status
          : null;
      const message =
        status === 429
          ? "Too many signup attempts. Please wait a few minutes before trying again."
          : status === 400 && mode === "signin"
            ? "Email or password is incorrect."
            : error instanceof Error
              ? error.message
              : "Unable to sign in.";
      toast.error(message);
    }
  };
  const isAdmin = session && "role" in session && session.role === "admin";
  const sessionName = session && "name" in session ? session.name : "";
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <User className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {session
              ? isAdmin
                ? "Studio admin"
                : `Welcome, ${sessionName}`
              : "Your Velnora account"}
          </p>
          <p className="text-xs text-muted-foreground">Save your details for a smoother order.</p>
        </div>
      </div>
      {session ? (
        <div className="flex items-center gap-3">
          {isAdmin && (
            <a href="/admin" className="text-sm font-semibold text-primary hover:text-accent">
              Open dashboard
            </a>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setSession(null);
            }}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <LogIn className="h-4 w-4" /> Sign in
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent">Account</p>
                <h3 className="mt-1 font-display text-3xl text-primary">
                  {mode === "signin" ? "Welcome back." : "Make it yours."}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 rounded-lg bg-secondary p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-md px-3 py-2 ${mode === "signin" ? "bg-background font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-md px-3 py-2 ${mode === "signup" ? "bg-background font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}
              >
                Create account
              </button>
            </div>
            {mode === "signup" && (
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="Password (6+ characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"
            />
            <button className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function Index() {
  const showReachUsForm = false;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-0 pt-8 sm:px-8">
      <nav className="mb-8 flex items-center justify-end gap-5 text-sm text-muted-foreground">
        <a href="#shop" className="hover:text-primary">
          Shop
        </a>
        {showReachUsForm && (
          <a href="#reach-us" className="hover:text-primary">
            Reach us
          </a>
        )}
        <Link to="/contact" className="hover:text-primary">
          Contact
        </Link>
        <Link to="/orders" className="hover:text-primary">
          My orders
        </Link>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 font-semibold text-primary hover:text-accent"
        >
          <ShoppingBag className="h-4 w-4" /> Cart
        </Link>
      </nav>
      {/* Hero */}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Flame className="h-7 w-7 text-accent" />
            </span>
            <div>
              <h1 className="font-display text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
                velnora
              </h1>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
                Essence of Calm
              </p>
            </div>
          </div>

          <h2 className="mt-10 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
            <span className="block text-primary">Light.</span>
            <span className="block text-primary">Breathe.</span>
            <span className="block text-accent">Unwind.</span>
          </h2>

          <div className="rule-line my-7 max-w-xs">
            <Leaf className="h-4 w-4 text-primary/70" />
          </div>

          <p className="max-w-md text-base leading-8 text-muted-foreground">
            Handcrafted scented candles made to bring{" "}
            <span className="font-semibold text-primary">peace</span> to your space and{" "}
            <span className="font-semibold text-accent">warmth</span> to your soul.
          </p>
        </div>

        <div className="relative">
          <img
            src={heroCandle}
            alt="Velnora handcrafted soy wax candle surrounded by roses and jasmine"
            width={1280}
            height={1280}
            className="w-full rounded-[3rem] rounded-tr-[10rem] object-cover shadow-soft"
          />
          <div className="absolute -top-3 right-6 hidden rounded-b-2xl bg-forest-gradient px-5 py-4 text-center text-xs leading-5 text-primary-foreground sm:block">
            Handcrafted
            <br />
            with care,
            <br />
            made for you.
            <Heart className="mx-auto mt-2 h-4 w-4" />
          </div>
        </div>
      </section>

      {/* Why you'll love it */}
      <section className="mt-20">
        <h3 className="rule-line font-display text-2xl uppercase tracking-wide text-primary sm:text-3xl">
          <span className="whitespace-nowrap">Why You'll Love It</span>
        </h3>
        <div className="mt-8 grid gap-8 rounded-3xl bg-card p-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="px-2 text-center lg:px-6">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <h4 className="mt-4 text-sm font-bold uppercase tracking-wide text-foreground">
                {title}
              </h4>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="mt-16">
        <h3 className="rule-line font-display text-2xl uppercase tracking-wide text-primary sm:text-3xl">
          <span className="whitespace-nowrap">Our Signature Fragrances</span>
        </h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fragrances.map(({ name, image, price, text }) => (
            <article key={name} className="flex flex-col overflow-hidden rounded-3xl bg-card">
              <img
                src={image}
                alt={`Velnora ${name} scented soy wax candle`}
                loading="lazy"
                className="h-56 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <h4 className="font-display text-2xl text-primary">{name}</h4>
                <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">{text}</p>
                <p className="mt-4 text-lg font-semibold text-foreground">{price}</p>
                <BuyButton name={name} price={price} image={image} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Calm space */}
      <section className="relative mt-8 overflow-hidden rounded-3xl bg-forest-gradient p-10 text-primary-foreground">
        <h3 className="font-display text-3xl uppercase leading-tight">
          Create Your
          <br />
          Calm Space
        </h3>
        <div className="my-5 h-px w-24 bg-primary-foreground/40" />
        <p className="max-w-md text-sm leading-8 text-primary-foreground/90">
          Whether it's a cozy evening, a busy day or a moment just for you, Velnora is here to make
          it better.
        </p>
        <Flame className="absolute bottom-6 right-6 h-20 w-20 text-primary-foreground/20" />
      </section>

      {/* Promises */}
      <section className="mt-6 grid gap-4 rounded-2xl bg-card px-6 py-5 sm:grid-cols-4 sm:divide-x sm:divide-border">
        {promises.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {label}
            </span>
          </div>
        ))}
      </section>

      {showReachUsForm && <ReachUsForm />}

      <section className="mt-12 grid gap-8 border-y border-border py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Get in touch
          </p>
          <h3 className="mt-3 max-w-xl font-display text-3xl leading-tight text-primary sm:text-4xl">
            Connect us through whatsapp and instagram
          </h3>
          <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            Have a question about a candle, an order, or choosing a scent? Send us a message or
            follow along for a little more Velnora in your day.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://wa.me/919149744806"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href="https://instagram.com/velnora131"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <Instagram className="h-4 w-4" /> Instagram
          </a>
        </div>
      </section>

      <AccountPanel />

      {/* Contact */}
      <footer className="mt-6 rounded-t-2xl bg-forest-gradient px-6 py-5 text-primary-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          <a href="tel:9149744806" className="flex items-center gap-2 hover:text-accent">
            <Phone className="h-4 w-4" /> 9149744806
          </a>
          <a
            href="https://instagram.com/velnora131"
            className="flex items-center gap-2 hover:text-accent"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram className="h-4 w-4" /> @velnora131
          </a>
          <a
            href="mailto:velnora1215@gmail.com"
            className="flex items-center gap-2 hover:text-accent"
          >
            <Mail className="h-4 w-4" /> velnora1215@gmail.com
          </a>
        </div>
        <p className="mt-4 text-center text-[0.7rem] uppercase tracking-[0.4em] text-primary-foreground/70">
          Ignite calm. Inspire souls.
        </p>
      </footer>
    </main>
  );
}
