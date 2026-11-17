# Saree Store API

Node 20+ / Express 5 / Mongoose / TypeScript. Accounts, products, orders, Razorpay payments, AI try-on.

## Run
```
docker compose up -d            # MongoDB 7 on :27017
cp .env.example .env            # set JWT_SECRET (32+ chars) and the rest
npm install && npm run seed && npm run dev
```
Tests: `npm test` (no database needed). Add `TEST_MONGODB_URI=mongodb://localhost:27017/saree_test` to also run the database tests (this database is wiped).

## Endpoints (errors: `{ "error": { "code", "message" } }`)
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register, /login | returns `{ token, user }`; emails in `ADMIN_EMAILS` become admins |
| GET | /api/auth/me | Bearer token |
| GET | /api/products | `?category&q&colour&size&sort=new\|name` |
| GET | /api/products/:slug | |
| POST/PATCH/DELETE | /api/products[/:slug] | admin; DELETE is a soft delete |
| GET/PUT/DELETE | /api/me/wishlist[/:slug] | signed in |
| GET/POST/DELETE | /api/me/addresses[/:id] | signed in |
| POST | /api/orders | guest or signed in. Send slug/colour/size/qty only; prices come from the database. `paymentMethod: cod\|online` |
| GET | /api/orders/mine, /api/orders/:id | owner token, or `x-order-token` for guests |
| POST | /api/orders/:id/verify | Razorpay checkout result: `razorpayOrderId, razorpayPaymentId, razorpaySignature` |
| POST | /api/webhooks/razorpay | set this URL in the Razorpay dashboard; signature checked on the raw body |
| POST | /api/tryon | multipart `photo` (JPG/PNG/WebP, 5 MB) + `slug` + `colour`; 10/min; photo is never stored |

## TODO before launch
- Set product prices (null blocks ordering with `PRICE_NOT_SET`), `DELIVERY_FEE_INR`, and real photos.
- Try-on: `TRYON_PROVIDER=mock` just echoes the photo. For real results set `replicate`, a token and `TRYON_MODEL_VERSION`, and check the input field names in `src/lib/tryon/index.ts`.
- Put the API behind HTTPS and set `CORS_ORIGINS`.
