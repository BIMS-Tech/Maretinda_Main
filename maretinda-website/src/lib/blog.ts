// Editorial content for the Maretinda blog. Posts are static for now —
// swap this module for a CMS fetch later without touching the page components.

export interface BlogBlock {
  type: "heading" | "paragraph" | "list";
  text?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO date
  readTime: string;
  author: string;
  authorRole: string;
  /** Hero gradient for the card + article header (no external images needed). */
  gradient: string;
  body: BlogBlock[];
}

export const posts: BlogPost[] = [
  {
    slug: "how-subscription-pricing-works",
    title: "How Maretinda's seller subscription works — and why your first month is free",
    excerpt:
      "No commissions, no listing fees. Just one simple subscription that unlocks everything you need to sell across the Philippines.",
    category: "Pricing",
    date: "2026-06-18",
    readTime: "4 min read",
    author: "Maretinda Team",
    authorRole: "Seller Success",
    gradient: "linear-gradient(135deg,#2A1B3E,#432C63 60%,#5C3E88)",
    body: [
      {
        type: "paragraph",
        text: "We built Maretinda's pricing around a single promise: you keep what you earn. Instead of taking a cut of every sale, we charge a flat monthly subscription. That means your margins stay predictable no matter how much you sell.",
      },
      { type: "heading", text: "One subscription, zero commission" },
      {
        type: "paragraph",
        text: "Most marketplaces deduct a percentage from each order on top of payment fees. On Maretinda there is no per-sale commission and no listing fee. You pick a plan, list your products, and every peso from a sale (minus standard payment processing) is yours.",
      },
      { type: "heading", text: "Your first month is on us" },
      {
        type: "paragraph",
        text: "Every new seller starts with a free first month. You can set up your shop, upload products, run your first promos, and make real sales before paying anything. If it is not the right fit, cancel any time.",
      },
      { type: "heading", text: "What's included" },
      {
        type: "list",
        items: [
          "Your own storefront with a custom shop handle",
          "Order, inventory, and customer management tools",
          "GiyaPay checkout (GCash, cards, InstaPay, QR Ph, and more)",
          "Flash sales, vouchers, and promotions on higher tiers",
          "Analytics and performance reports",
        ],
      },
      {
        type: "paragraph",
        text: "Ready to start? Register your shop, upload a valid ID, and our team approves new sellers within 1 to 2 business days.",
      },
    ],
  },
  {
    slug: "7-tips-to-grow-your-shop",
    title: "7 practical tips to grow your shop in your first 90 days",
    excerpt:
      "From product photos to fast replies, here are the habits that separate top Filipino sellers from the rest.",
    category: "Growth",
    date: "2026-06-10",
    readTime: "6 min read",
    author: "Maretinda Team",
    authorRole: "Seller Success",
    gradient: "linear-gradient(135deg,#5C3E88,#7C3AED 70%,#9B80D2)",
    body: [
      {
        type: "paragraph",
        text: "The first three months set the tone for your shop. These are the things that consistently help new sellers build momentum on Maretinda.",
      },
      {
        type: "list",
        items: [
          "Shoot clean, well-lit product photos on a plain background.",
          "Write titles buyers actually search for, not just brand names.",
          "Reply to messages quickly — fast sellers win more orders.",
          "Keep stock counts accurate to avoid cancellations.",
          "Use flash sales and vouchers to drive your first reviews.",
          "Ship on time and pack carefully to earn five-star ratings.",
          "Check your analytics weekly and double down on what sells.",
        ],
      },
      { type: "heading", text: "Reviews are your growth engine" },
      {
        type: "paragraph",
        text: "Buyers trust sellers with real reviews. Make your first ten orders count: deliver fast, follow up politely, and a steady stream of five-star ratings will lift your products in search.",
      },
    ],
  },
  {
    slug: "shipping-across-the-philippines",
    title: "Shipping across the Philippines: a simple guide for new sellers",
    excerpt:
      "Couriers, timelines, and packaging basics so your orders arrive on time from Luzon to Mindanao.",
    category: "Logistics",
    date: "2026-05-29",
    readTime: "5 min read",
    author: "Maretinda Team",
    authorRole: "Operations",
    gradient: "linear-gradient(135deg,#1F5C48,#2E8B6B 70%,#5FA88B)",
    body: [
      {
        type: "paragraph",
        text: "Reliable shipping keeps buyers coming back. Here is how to set expectations and pick the right courier for each order.",
      },
      { type: "heading", text: "Typical delivery timelines" },
      {
        type: "list",
        items: [
          "Metro Manila: 1 to 3 business days",
          "Luzon provinces: 3 to 5 business days",
          "Visayas and Mindanao: 5 to 7 business days",
        ],
      },
      { type: "heading", text: "Pack it to survive the trip" },
      {
        type: "paragraph",
        text: "Use sturdy boxes or padded mailers, wrap fragile items, and seal everything well. Good packaging means fewer damaged-item disputes and better reviews.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
