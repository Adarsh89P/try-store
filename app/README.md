# Saree store app (Expo / React Native)

Mobile version of the website: Home, category browsing with the swipe gallery, Search with filters, Wishlist, Bag, Checkout, Account (sign in, orders, saved addresses). Everything is saved on the phone only until the backend exists.

```
npm install
npx expo start        # scan the QR code with Expo Go on your phone
npm run test:e2e      # phone-size browser test of the full flow (web build)
```

TODO before launch: real prices (`lib/products.ts`), store name (`App.tsx`, `app.json`), contact details, app icon, fonts, one photo per colour, payment gateway and order backend (`src/screens/CheckoutScreen.tsx`), other categories.

Virtual try-on (bag -> Try on with AI) is a simulated preview; TODO: connect the try-on model in the backend.
