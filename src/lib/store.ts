export type PaymentMethod = "cod" | "upi";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

export type Customer = {
  id: string;
  name: string;
  email: string;
  password: string;
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
  paymentStatus: "pending" | "paid";
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
  session: "velnora.session",
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

export function getCustomers() {
  return read<Customer[]>(keys.customers, []);
}

export function getOrders() {
  return read<Order[]>(keys.orders, []);
}

export function getMessages() {
  return read<ContactMessage[]>(keys.messages, []);
}

export function getSession() {
  return read<Customer | { role: "admin" } | null>(keys.session, null);
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

function validateCredentials(email: string, password: string) {
  if (password.length < 6 || !email.includes("@")) {
    throw new Error("Use a valid email and a password with at least 6 characters.");
  }
}

export function signIn(email: string, password: string) {
  if (email === "admin@velnora.com" && password === "velnora123") {
    const session = { role: "admin" as const };
    write(keys.session, session);
    return session;
  }
  validateCredentials(email, password);
  const customers = getCustomers();
  const existing = customers.find((customer) => customer.email === email);
  if (!existing || existing.password !== password) {
    throw new Error("No account found with those details. Create an account first.");
  }
  write(keys.session, existing);
  return existing;
}

export function signUp(name: string, email: string, password: string) {
  validateCredentials(email, password);
  if (!name.trim()) throw new Error("Please enter your name.");
  const customers = getCustomers();
  if (customers.some((customer) => customer.email === email)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  const customer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email,
    password,
    createdAt: new Date().toISOString(),
  };
  write(keys.customers, [...customers, customer]);
  write(keys.session, customer);
  return customer;
}

export function signOut() {
  window.localStorage.removeItem(keys.session);
  window.dispatchEvent(new Event("velnora-store"));
}

export function createOrder(order: Omit<Order, "id" | "createdAt" | "status" | "paymentStatus">) {
  const next: Order = {
    ...order,
    id: `VN-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentStatus: order.paymentMethod === "upi" ? "pending" : "pending",
  };
  write(keys.orders, [next, ...getOrders()]);
  return next;
}

export function createMessage(message: Omit<ContactMessage, "id" | "createdAt" | "status">) {
  const next: ContactMessage = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
  };
  write(keys.messages, [next, ...getMessages()]);
  return next;
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  write(
    keys.orders,
    getOrders().map((order) => (order.id === id ? { ...order, status } : order)),
  );
}
