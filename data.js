// data.js — shared catalog + cart utilities for Ada's Xpression

window.ADA_CONFIG = {
  // ✅ Replace with your WhatsApp number (no + sign). Example: "2348012345678"
  WHATSAPP_NUMBER: "234XXXXXXXXXX",

  // ✅ Paystack public key (pk_test_... or pk_live_...) - leave "" to disable Paystack
  PAYSTACK_PUBLIC_KEY: "",
};

window.ADA = window.ADA || {};

window.ADA.PRODUCTS = [
  {
    id: "hwb",
    title: "Insulated Hot-Water Bag",
    category: "hot-water-bags",
    description:
      "Portable hot-water bag with insulated cover for warmth, comfort, and relaxation.",
    rating: 4.8,
    variants: [
      {
        vid: "pink",
        name: "Pink",
        price: 6500,
        image: "assets/products/hot-water-bag-1.jpg",
      },
      {
        vid: "blue",
        name: "Blue",
        price: 6500,
        image: "assets/products/hot-water-bag-2.jpg",
      },
      {
        vid: "purple",
        name: "Purple",
        price: 7000,
        image: "assets/products/hot-water-bag-3.jpg",
      },
      {
        vid: "navy",
        name: "Navy",
        price: 7200,
        image: "assets/products/hot-water-bag-4.jpg",
      },
    ],
  },
  {
    id: "cover-soft",
    title: "Soft Cover (Extra Comfort)",
    category: "covers",
    description:
      "Soft insulated cover replacement to improve comfort and warmth retention.",
    rating: 4.5,
    variants: [
      {
        vid: "standard",
        name: "Standard",
        price: 2500,
        image: "assets/products/hot-water-bag-3.jpg",
      },
    ],
  },
];

window.ADA.naira = (n) => `₦${Number(n).toLocaleString("en-NG")}`;

window.ADA.getProduct = (pid) => window.ADA.PRODUCTS.find((p) => p.id === pid);
window.ADA.getVariant = (pid, vid) => {
  const p = window.ADA.getProduct(pid);
  if (!p) return null;
  return p.variants.find((v) => v.vid === vid) || p.variants[0];
};
window.ADA.makeSku = (pid, vid) => `${pid}::${vid}`;

const CART_KEY = "adas_xpression_cart_v2";

// cart format: { [sku]: { pid, vid, qty } }
window.ADA.loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

window.ADA.saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

window.ADA.cartEntries = (cart) =>
  Object.entries(cart)
    .map(([sku, item]) => {
      const product = window.ADA.getProduct(item.pid);
      const variant = window.ADA.getVariant(item.pid, item.vid);
      if (!product || !variant || !item.qty) return null;
      return { sku, ...item, product, variant };
    })
    .filter(Boolean);

window.ADA.cartTotals = (cart) => {
  const entries = window.ADA.cartEntries(cart);
  const subtotal = entries.reduce((s, it) => s + it.variant.price * it.qty, 0);
  const count = entries.reduce((s, it) => s + it.qty, 0);
  return { subtotal, count, entries };
};

window.ADA.addToCart = (pid, vid, delta) => {
  const cart = window.ADA.loadCart();
  const sku = window.ADA.makeSku(pid, vid);
  const current = cart[sku]?.qty || 0;
  const next = current + delta;

  if (next <= 0) delete cart[sku];
  else cart[sku] = { pid, vid, qty: next };

  window.ADA.saveCart(cart);
  return cart;
};

window.ADA.removeFromCart = (sku) => {
  const cart = window.ADA.loadCart();
  delete cart[sku];
  window.ADA.saveCart(cart);
  return cart;
};

window.ADA.buildWhatsAppMessage = ({ cart, customer }) => {
  const { subtotal, entries } = window.ADA.cartTotals(cart);

  const lines = [];
  lines.push("Ada’s Xpression Order");
  lines.push("—");

  entries.forEach((it) => {
    lines.push(
      `${it.product.title} (${it.variant.name}) x${it.qty} = ${window.ADA.naira(
        it.variant.price * it.qty
      )}`
    );
  });

  lines.push("—");
  lines.push(`Subtotal: ${window.ADA.naira(subtotal)}`);

  if (customer) {
    lines.push("— Customer Details —");
    if (customer.fullName) lines.push(`Name: ${customer.fullName}`);
    if (customer.phone) lines.push(`Phone: ${customer.phone}`);
    if (customer.address) lines.push(`Address: ${customer.address}`);
    if (customer.city) lines.push(`City: ${customer.city}`);
    if (customer.state) lines.push(`State: ${customer.state}`);
    if (customer.payment) lines.push(`Payment: ${customer.payment}`);
  }

  lines.push("—");
  lines.push("Please confirm availability and delivery fee.");

  return lines.join("\n");
};

window.ADA.openWhatsApp = (message) => {
  const num = window.ADA_CONFIG.WHATSAPP_NUMBER;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};
