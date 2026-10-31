# The TipTop: ordering website demo

Client preview of the new ordering website for **The TipTop** (Law Gate, LPU, Phagwara).
It includes the customer site and a mobile-friendly owner dashboard.

> **Demo only.** The menu, prices and orders are sample data. Payments run in test mode and no real money moves. This is not the production site.

## Try it

| | Link |
|---|---|
| Customer site | `https://<github-user>.github.io/thetiptop-demo/` |
| Owner dashboard | `https://<github-user>.github.io/thetiptop-demo/admin/` (PIN **1234**) |

### Suggested walkthrough (5 minutes)
1. Open the owner dashboard in one tab and enter PIN 1234. Tap **Tap to turn on the new-order sound**.
2. In a second tab, open the customer site. Add Chicken Dum Biryani (Full) and two Butter Naan, then apply **TIPTOP50** in the cart.
3. Check out with any name and a 10-digit mobile number starting with 6 to 9. Pay with UPI, then tap **Pay (test)**. You can also try **Simulate failure** to see the retry and cash-on-delivery fallback.
4. Switch to the dashboard tab. The order rings and flashes. Tap **Accept** and choose a prep time.
5. Switch back to the customer tab. The tracking page has already moved to "Accepted" and shows an arrival time. Then move the order through Cooking, Ready, and Out for delivery.
6. In the dashboard, mark a dish sold out under **Menu** and watch it grey out on the customer menu. Also look at **Offers**, **Sales** and **Settings**.

Reset everything from **Settings → Reset demo data** (dashboard) or **Info → Reset demo data** (customer site).

### Demo limits
- Orders are stored in the browser, so the customer site and dashboard update each other live only on **the same device and browser**. In production a database (Supabase, Mumbai region) syncs every phone instantly. Every data function in `lib/db.ts` is written to be swapped for that.
- Dish photos are representative, openly licensed sample photos from Wikimedia Commons (credits on the Info page and in `lib/dishPhotos.ts`), cropped to 800×600 WebP in `public/dishes/`. Replace them with The TipTop's own photos before launch; the owner can also upload a photo from Menu → edit dish.
- The phone number and address on the Info page are placeholders.

## What's inside

**Customer site:** home with offer banner and bestsellers, full menu with search (it tolerates spellings like "biriyani"), a veg-only filter and section chips, a dish sheet with portion, add-ons, spice level and note, a cart with coupons and a full bill (delivery fee, packing, GST), and guest checkout with no login. Checkout offers UPI, card and cash on delivery, with a COD limit. There's also a test payment screen, a live order tracking timeline with ETA, "My orders" on this device, and an info/FAQ page.

**Owner dashboard (works as an installable app on the counter phone):**
- PIN login.
- Live order board (New, Cooking, Ready, Out) with a looping ring alert, screen wake-lock and browser notifications.
- Accept with prep time, reject or cancel with a reason (an automatic test refund on paid orders), rider hand-off, and an order detail page with a printable KOT.
- Open, pause or close the shop.
- Menu manager: sold-out switches, a dish editor with sizes, prices, add-ons, veg/non-veg, bestseller tag and photo upload, plus categories.
- Coupons and the home banner.
- Sales: today, yesterday or 7 days, orders by hour, top dishes, and order history search.
- Settings for fees, GST, COD limit, hours and ETAs.

**Safety rules already built in:**
- Prices are recalculated from the menu when an order is placed, so the browser total is never trusted.
- Money is stored as whole paise.
- Order placement is idempotent, so a double tap never makes two orders.
- Order status can only move through valid steps.
- Item names and prices are copied into the order when it's placed.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # static export in out/
```

Optional: set `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...` to open the real Razorpay **test** checkout instead of the simulated payment screen. Live keys are refused.

## Deploy (free preview)

Every push to `main` builds and publishes to GitHub Pages through `.github/workflows/pages.yml`. In the repo settings, set **Pages → Source** to **GitHub Actions**.

## After client approval

The production plan (Vercel Pro, Supabase Pro in Mumbai, Razorpay live, Cloudflare, and the official domain thetiptop.in) is in the project blueprint and development plan. This demo's screens carry over. The storage layer in `lib/db.ts` and `lib/persist.ts` is replaced with Supabase, and payments switch to server-verified Razorpay orders and webhooks.

Stack: Next.js 15 (App Router, static export), React 19, TypeScript, Tailwind CSS.
