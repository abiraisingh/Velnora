export type PaymentMethod = "cod" | "upi";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Order = {
  id: string;
  customer: string;
  customerEmail: string;
  phone: string;
  address: string;
  product: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: OrderStatus;
  createdAt: string;
};

export type CartItem = {
  product: string;
  image: string;
  price: number;
  quantity: number;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: "new" | "read";
};

const keys = {
  customers: "velnora.customers",
  orders: "velnora.orders",
  messages: "velnora.messages",
  cart: "velnora.cart",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("velnora-store"));
}

export function getCart() {
  return read<CartItem[]>(keys.cart, []);
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart();
  const existing = cart.find((cartItem) => cartItem.product === item.product);
  write(
    keys.cart,
    existing
      ? cart.map((cartItem) =>
          cartItem.product === item.product
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      : [...cart, { ...item, quantity: 1 }],
  );
}

export function updateCartQuantity(product: string, quantity: number) {
  write(
    keys.cart,
    getCart()
      .filter((item) => item.product !== product || quantity > 0)
      .map((item) => (item.product === product ? { ...item, quantity } : item)),
  );
}

export function clearCart() {
  write(keys.cart, []);
}
