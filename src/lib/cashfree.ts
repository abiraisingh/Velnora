import { load } from "@cashfreepayments/cashfree-js";

export async function openCashfreeCheckout(paymentSessionId: string) {
  if (!paymentSessionId) throw new Error("Cashfree did not return a payment session.");
  const cashfree = await load({ mode: "sandbox" });
  if (!cashfree) throw new Error("Unable to load Cashfree checkout.");
  await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
}
