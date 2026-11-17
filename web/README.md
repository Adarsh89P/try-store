# Saree store

Next.js 16 + Tailwind v4. Pages: Home, category pages (Sarees, Dresses, Girls' wear, Men's wear, Earrings, Accessories) with the sideways gallery, Search with filters, Wishlist, Bag, Checkout, Account (sign in, orders, saved addresses).

```
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run test:e2e     # Playwright (uses system Chrome; set PW_CHANNEL to change)
```

Account, wishlist, bag and orders are saved in the browser only until the backend exists.

TODO before launch: real prices (`lib/products.ts`), store name/contact placeholders, one photo per colour, payment gateway and order backend (`components/CheckoutView.tsx`), other categories.

Virtual try-on (bag -> Try on with AI) is a simulated preview; TODO: connect the try-on model in the backend.
