declare module "@cashfreepayments/cashfree-js" {
  type CashfreeMode = "sandbox" | "production";
  type CashfreeCheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
  };
  type CashfreeClient = {
    checkout(options: CashfreeCheckoutOptions): Promise<unknown>;
  };
  export function load(options: { mode: CashfreeMode }): Promise<CashfreeClient | null>;
}
