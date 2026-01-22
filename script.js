// script.js (UPDATED) — Ada's Xpression with Variants + Real Checkout + WhatsApp
// Requires data.js loaded before this file.

const els = {
  year: document.getElementById("year"),
  nav: document.getElementById("nav"),
  menuBtn: document.getElementById("menuBtn"),

  grid: document.getElementById("productGrid"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),

  cartBtn: document.getElementById("cartBtn"),
  cartDrawer: document.getElementById("cartDrawer"),
  drawerOverlay: document.getElementById("drawerOverlay"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  cartCount: document.getElementById("cartCount"),
  cartItems: document.getElementById("cartItems"),
  cartSubtotal: document.getElementById("cartSubtotal"),

  // optional: if you changed to link
  checkoutLink: document.getElementById("checkoutLink"),

  faqAccordion: document.getElementById("faqAccordion"),
  contactForm: document.getElementById("contactForm"),
  contactNote: document.getElementById("contactNote"),
};

let state = {
  query: "",
  category: "all",
  sort: "featured",
};

function categoryLabel(c) {
  if (c === "hot-water-bags") return "Hot-water bag";
  if (c === "covers") return "Cover";
  return "Item";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setDrawer(open) {
  els.cartDrawer.classList.toggle("show", open);
  els.cartDrawer.setAttribute("aria-hidden", String(!open));
}

/**
 * Build "flat" list for grid:
 * Each variant becomes a card item so user can pick color directly.
 */
function listGridItems() {
  const q = state.query.trim().toLowerCase();

  let items = [];
  ADA.PRODUCTS.forEach((p) => {
    p.variants.forEach((v) => {
      items.push({
        pid: p.id,
        vid: v.vid,
        title: `${p.title} (${v.name})`,
        baseTitle: p.title,
        variantName: v.name,
        category: p.category,
        price: v.price,
        rating: p.rating,
        image: v.image,
        description: p.description,
      });
    });
  });

  if (state.category !== "all") {
    items = items.filter((it) => it.category === state.category);
  }

  if (q) {
    items = items.filter((it) =>
      it.title.toLowerCase().includes(q) ||
      it.description.toLowerCase().includes(q)
    );
  }

  if (state.sort === "priceLow") items.sort((a, b) => a.price - b.price);
  if (state.sort === "priceHigh") items.sort((a, b) => b.price - a.price);
  if (state.sort === "ratingHigh") items.sort((a, b) => b.rating - a.rating);

  return items;
}

function productCardHTML(it) {
  return `
    <article class="card" data-pid="${it.pid}" data-vid="${it.vid}">
      <img class="card__img" src="${it.image}" alt="${escapeHtml(it.title)}" loading="lazy" />
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(it.title)}</h3>

        <div class="card__meta">
          <span>${categoryLabel(it.category)}</span>
          <span>★ ${it.rating.toFixed(1)}</span>
        </div>

        <p class="price">${ADA.naira(it.price)}</p>

        <div class="card__actions">
          <button class="btn btn--primary" data-action="add">Add</button>
          <button class="btn" data-action="view">View</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const items = listGridItems();
  els.grid.innerHTML = items.map(productCardHTML).join("");
  bindProductCardEvents();
}

function bindProductCardEvents() {
  els.grid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const pid = card.getAttribute("data-pid");
      const vid = card.getAttribute("data-vid");
      const action = btn.getAttribute("data-action");

      if (action === "add") {
        ADA.addToCart(pid, vid, 1);
        renderCart();
      }

      if (action === "view") {
        window.location.href = `product.html?id=${encodeURIComponent(pid)}&v=${encodeURIComponent(vid)}`;
      }
    });
  });
}

function cartItemHTML(entry) {
  return `
    <div class="cartItem" data-sku="${entry.sku}">
      <img src="${entry.variant.image}" alt="${escapeHtml(entry.product.title)}" />
      <div>
        <h4>${escapeHtml(entry.product.title)} (${escapeHtml(entry.variant.name)})</h4>
        <p class="muted">${ADA.naira(entry.variant.price)} • ★ ${entry.product.rating.toFixed(1)}</p>

        <div class="cartItem__row">
          <div class="qty" aria-label="Quantity controls">
            <button type="button" data-action="dec" aria-label="Decrease">−</button>
            <span aria-live="polite">${entry.qty}</span>
            <button type="button" data-action="inc" aria-label="Increase">+</button>
          </div>

          <button class="btn btn--small" data-action="remove">Remove</button>
        </div>
      </div>
    </div>
  `;
}

function renderCart() {
  const cart = ADA.loadCart();
  const { subtotal, count, entries } = ADA.cartTotals(cart);

  els.cartCount.textContent = String(count);
  els.cartSubtotal.textContent = ADA.naira(subtotal);

  if (!entries.length) {
    els.cartItems.innerHTML = `
      <div class="empty">
        <p class="muted">Your cart is empty. Add items from the shop.</p>
      </div>
    `;
    if (els.checkoutLink) {
      els.checkoutLink.setAttribute("aria-disabled", "true");
      els.checkoutLink.style.opacity = "0.6";
      els.checkoutLink.style.pointerEvents = "none";
    }
  } else {
    els.cartItems.innerHTML = entries.map(cartItemHTML).join("");
    if (els.checkoutLink) {
      els.checkoutLink.removeAttribute("aria-disabled");
      els.checkoutLink.style.opacity = "1";
      els.checkoutLink.style.pointerEvents = "auto";
    }
  }

  bindCartEvents();
}

function bindCartEvents() {
  els.cartItems.querySelectorAll(".cartItem").forEach((row) => {
    row.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const sku = row.getAttribute("data-sku");
      const action = btn.getAttribute("data-action");

      const cart = ADA.loadCart();
      const item = cart[sku];
      if (!item) return;

      if (action === "inc") ADA.addToCart(item.pid, item.vid, 1);
      if (action === "dec") ADA.addToCart(item.pid, item.vid, -1);
      if (action === "remove") ADA.removeFromCart(sku);

      renderCart();
    });
  });
}

/* FAQ Accordion */
function setupAccordion() {
  if (!els.faqAccordion) return;
  const buttons = els.faqAccordion.querySelectorAll(".accItem");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      buttons.forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        const panel = b.nextElementSibling;
        if (panel) panel.style.display = "none";
      });
      if (!expanded) {
        btn.setAttribute("aria-expanded", "true");
        const panel = btn.nextElementSibling;
        if (panel) panel.style.display = "block";
      }
    });
  });
}

/* Menu toggle (mobile) */
function setupMobileMenu() {
  els.menuBtn?.addEventListener("click", () => els.nav.classList.toggle("show"));
}

/* Cart drawer handlers */
function setupCartDrawer() {
  els.cartBtn?.addEventListener("click", () => setDrawer(true));
  els.closeCartBtn?.addEventListener("click", () => setDrawer(false));
  els.drawerOverlay?.addEventListener("click", () => setDrawer(false));
}

/* Contact form */
function setupContactForm() {
  if (!els.contactForm) return;
  els.contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    els.contactNote.textContent = "Message sent. We’ll respond as soon as possible.";
    setTimeout(() => {
      els.contactForm.reset();
      els.contactNote.textContent = "";
    }, 1500);
  });
}

/* Init */
function init() {
  if (els.year) els.year.textContent = String(new Date().getFullYear());
  setupAccordion();
  setupMobileMenu();
  setupCartDrawer();
  setupContactForm();
  renderProducts();
  renderCart();
}

init();
