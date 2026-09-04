import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCashfreePaymentStatus } from "../lib/server-api";
import { getAccessToken } from "../lib/supabase";

export const Route = createFileRoute("/payment-result")({
  validateSearch: (search: Record<string, unknown>) => ({
    order_id: typeof search["order_id"] === "string" ? search["order_id"] : "",
  }),
  component: PaymentResult,
});

function PaymentResult() {
  const { order_id: orderId } = Route.useSearch();
  const [status, setStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function checkStatus() {
      const accessToken = await getAccessToken();
      if (!accessToken || !orderId) {
        setLoading(false);
        return;
      }
      try {
        const result = await getCashfreePaymentStatus({ data: { accessToken, orderId } });
        if (active) setStatus(result.paymentStatus);
      } finally {
        if (active) setLoading(false);
      }
    }
    void checkStatus();
    return () => {
      active = false;
    };
  }, [orderId]);
  const copy =
    status === "paid"
      ? "Payment successful"
      : status === "failed"
        ? "Payment failed"
        : "Payment pending";
  const Icon = status === "paid" ? CheckCircle2 : status === "failed" ? CircleAlert : Clock3;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="w-full max-w-md rounded-2xl bg-card p-8 text-center">
        <Icon
          className={`mx-auto h-12 w-12 ${status === "paid" ? "text-primary" : status === "failed" ? "text-destructive" : "text-accent"}`}
        />
        <h1 className="mt-5 font-display text-4xl text-primary">
          {loading ? "Checking payment" : copy}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {loading
            ? "We are confirming your payment with Cashfree."
            : status === "paid"
              ? "Your order is confirmed and will be prepared shortly."
              : status === "failed"
                ? "No payment was captured. You can try checkout again."
                : "Your payment is still being verified. Please check your order history shortly."}
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          View my orders
        </Link>
      </section>
    </main>
  );
}
