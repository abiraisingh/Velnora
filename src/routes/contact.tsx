import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Instagram, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Velnora | Let's Talk Candles" },
      {
        name: "description",
        content:
          "Reach Velnora on WhatsApp or Instagram with questions about our handcrafted candles.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8">
      <nav className="flex items-center justify-between text-sm text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-2 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Velnora
        </Link>
        <span className="hidden uppercase tracking-[0.25em] sm:block">Here for you</span>
      </nav>

      <section className="my-auto grid gap-12 py-16 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            A little note goes a long way
          </p>
          <h1 className="mt-5 max-w-lg font-display text-5xl leading-[1.05] text-primary sm:text-6xl">
            We would love to hear from you.
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">
            Questions about a scent, an order, or finding the right candle for your space? Drop us a
            message wherever you feel most at home.
          </p>
          <div className="mt-8 h-px w-24 bg-accent/60" />
          <p className="mt-5 text-sm text-muted-foreground">Ignite calm. Inspire souls.</p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          <a
            href="https://wa.me/919149744806"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-5 py-7 transition-colors hover:text-primary"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <MessageCircle className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Message us on
              </span>
              <span className="mt-1 block font-display text-3xl text-foreground">WhatsApp</span>
              <span className="mt-1 block text-sm text-muted-foreground">+91 91497 44806</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </a>

          <a
            href="https://instagram.com/velnora131"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-5 py-7 transition-colors hover:text-primary"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Instagram className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Find us on
              </span>
              <span className="mt-1 block font-display text-3xl text-foreground">Instagram</span>
              <span className="mt-1 block text-sm text-muted-foreground">@velnora131</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>Velnora Candles</span>
        <span>Hand-poured with care</span>
      </footer>
    </main>
  );
}
