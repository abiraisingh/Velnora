# Velnora Candles

A calm storefront for handcrafted scented candles.

## Features

- Product catalogue with Rose, Jasmine, and Mogra candles
- Account creation and sign-in
- Login-protected cart and checkout
- Cash on delivery and UPI order selection
- Customer order history at `/orders`
- Reach-us contact form
- Admin operations dashboard at `/admin`
- Responsive layout for mobile and desktop

## Getting Started

Requirements: Node.js 18+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Available Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the development server     |
| `npm run build`   | Create a production build        |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run ESLint                       |
| `npm run format`  | Format the project with Prettier |

## Data and Production Notes

The current demo stores accounts, sessions, cart items, orders, and contact messages in the browser's `localStorage`. This makes the project easy to run locally, but data is not shared between browsers or devices.

Before production use:

- Replace browser storage with a secure database and server-side authentication.
- Hash passwords and remove demo credentials from source code.
- Connect UPI checkout to a real payment provider and verify payments on the server.
- Protect the admin route with server-side authorization.
- Store secrets in environment variables. `.env` files are excluded by `.gitignore`.
