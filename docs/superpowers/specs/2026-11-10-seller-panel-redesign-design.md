# Seller panel redesign: design

Project 3 of 3, after testing (project 1) and the subscriptions cross-check (project 2). Owner's request, 2026-11-09: "update the seller panel UI of every functionality and interfaces and use fluid and animated UI for seller panel and must follow the color convention of brand for the seller panel redesign and update the dashboard".

## Intent

The seller panel still looks like stock Medusa admin: grey, flat, and unlike the storefront sellers sign up from. Sellers should feel they're in Maretinda's own tool: brand colours, smooth and responsive, with a dashboard that tells them what to do today.

## Goals

- **Every screen in the brand.** Purple `#432C63` is the primary (buttons, active nav, links, focus). Yellow `#FFC533` is the accent (highlights, "new" and plan badges, the one call to action per screen). These are the storefront's colours.
- **Fluid.** Layouts work from 360 px phones to wide desktops. The sidebar becomes a rail on tablets and a drawer on phones. Tables scroll inside their card, never the page. Forms stack on small screens.
- **Animated, quietly.** Page and drawer transitions (150–200 ms), list items fade in with a stagger, cards lift on hover, buttons press, skeletons shimmer, and dashboard numbers count up. Everything honours `prefers-reduced-motion`.
- **A dashboard that says what to do.** Top row: sales today and this month, orders to ship, return requests waiting, reviews to answer, and days left on the plan. Then the sales trend (the existing charts), a "Needs attention" list linking straight to the order or return, plan usage (products used of the cap, staff seats), and quick actions (add product, create voucher, post a reel).

## Non-goals

- No change to what any screen does: same routes, same data, same API calls. This is presentation only.
- No backend changes.
- Not fixing the panel's 701 pre-existing TypeScript errors. The count must not go up.
- No dark-mode redesign beyond keeping it readable (tokens get dark values, but dark mode isn't polished).

## Anti-goals (a failure even if it ships)

- Motion that slows a seller down or makes them wait (no animation over 250 ms, nothing blocks input).
- Brand colours failing WCAG AA contrast on text or controls.
- Breaking any existing E2E seller flow.

## How (my calls; say if you want different)

1. **Theme layer first.** The panel uses Medusa UI, which reads CSS variables. Overriding those tokens (interactive colour, buttons, focus ring, radius, shadows) in `index.css` and the Tailwind preset restyles every screen at once, including ones nobody touches by hand.
2. **Then the shell.** A redesigned sidebar (brand header, grouped sections, active-item indicator, collapsible rail) and top bar (search, plan badge, notifications, user menu), and the page transitions.
3. **Then the high-traffic screens by hand:** dashboard, orders list and detail, products list and create, subscription, store settings and onboarding checklist. Other screens get the theme layer plus shared component polish (tables, empty states, drawers, toasts).
4. **Motion** with the `motion` library the panel already depends on, through a few shared wrappers (page, list, card) rather than per-screen code.
5. **Checked by** screenshots of each redesigned screen at 375 / 768 / 1440 px, an AA contrast check of the token pairs, the existing seller E2E suites, and the panel's unit tests.

## Left to the builder

Exact spacing, icon choices, chart styling, and the wording of empty states, within the brand and the goals above.
