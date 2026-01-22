// product.js — product details with colors + shared cart + WhatsApp

const el = (id) => document.getElementById(id);

const els = {
  year: el("year"),
  nav: el("nav"),
  menuBtn: el("menuBtn"),

  cartBtn: el("cartBtn"),
  cartDrawer: el("cartDrawer"),
  drawerOverlay: el("drawerOverlay"),
  closeCartBtn: el("closeCartBtn"),
  cartCount: el("cartCount"),
  cartItems: el("cartItems"),
  cartSubtotal: el("cartSubtotal"),

  crumbProduct: el("crumbProduct"),

  mainImg: el("mainImg"),
  thumbs: el("thumbs"),

  pTitle: el("pTitle"),
  pCategory: el("pCategory"),
  pRating: el("pRating"),
  pPrice: el("pPrice"),
  pDesc: el("pDesc"),

  variantList: el("variantList"),
  whatsappBtn: el("whatsappBtn"),

  decQty: el("decQty"),
  incQty: el("incQty"),
  qtyVal: el("qtyVal"),

  addToCartBtn: el("addToCartBtn"),
  buyNowBtn: el("buyNowBtn"),
  actionNote: el("actionNote"),

  relatedGrid: el("relatedGrid"),
};

let qty = 1;
let currentPid = null;
let currentVid = null;

function getParams() {
  const p = new URLSearchParams(location.search);
  return { id: p.get("id"), v: p.get("v") };
}

function categoryLabel(c) {
  if (c === "hot-water-bags") return "Hot-water bag";
  if (c === "covers") return "Cover";
  return "Item";
}

function setDrawer(open) {
  els.cartDrawer.classList.toggle("show", open);
  els.cartDrawer.setAttribute("aria-hidden", String(!open));
}

function renderDrawer() {
  const cart = ADA.loadCart();
  const { subtotal, count, entries } = ADA.cartTotals(cart);

  els.cartCount.textContent = String(count);
  els.cartSubtotal.textContent = ADA.naira(subtotal);

  if (!entries.length) {
    els.cartItems.innerHTML = `<p class="muted">Your cart is empty.</p>`;
    return;
  }

  els.cartItems.innerHTML = entries
    .map(
      (it) => `
    <div class="cartItem" data-sku="${it.sku}">
      <img src="${it.variant.image}" alt="${it.product.title}" />
      <div>
        <h4>${it.product.title} (${it.variant.name})</h4>
        <p class="muted">${ADA.naira(it.variant.price)} • ★ ${it.product.rating.toFixed(1)}</p>

        <div class="cartItem__row">
          <div class="qty">
            <button type="button" data-action="dec">−</button>
            <span>${it.qty}</span>
            <button type="button" data-action="inc">+</button>
          </div>
          <button class="btn btn--small" data-action="remove">Remove</button>
        </div>
      </div>
    </div>`
    )
    .join("");

  els.cartItems.querySelectorAll(".cartItem").forEach((row) => {
    row.addEventListener("click", (e) => {
      const sku = row.getAttribute("data-sku");
      const btn = e.target.closest("button");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const cart = ADA.loadCart();
      const item = cart[sku];
      if (!item) return;

      if (action === "inc") ADA.addToCart(item.pid, item.vid, 1);
      if (action === "dec") ADA.addToCart(item.pid, item.vid, -1);
      if (action === "remove") ADA.removeFromCart(sku);

      renderDrawer();
    });
  });
}

function renderGallery(variant) {
  const gallery = (variant.gallery && variant.gallery.length) ? variant.gallery : [variant.image];

  els.mainImg.src = gallery[0];
  els.mainImg.alt = `${variant.name} image`;

  els.thumbs.innerHTML = gallery
    .map(
      (src, i) => `
    <button class="thumb ${i === 0 ? "active" : ""}" data-src="${src}" aria-label="View image ${i + 1}">
      <img src="${src}" alt="thumbnail ${i + 1}" />
    </button>`
    )
    .join("");

  els.thumbs.querySelectorAll(".thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.thumbs.querySelectorAll(".thumb").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      els.mainImg.src = btn.getAttribute("data-src");
    });
  });
}

function renderVariants(product, selectedVid) {
  els.variantList.innerHTML = product.variants
    .map(
      (v) => `
      <button class="variantBtn ${v.vid === selectedVid ? "active" : ""}" data-vid="${v.vid}">
        ${v.name}
      </button>`
    )
    .join("");

  els.variantList.querySelectorAll(".variantBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vid = btn.getAttribute("data-vid");
      setVariant(product.id, vid, true);
    });
  });
}

function setVariant(pid, vid, pushUrl = false) {
  const product = ADA.getProduct(pid);
  const variant = ADA.getVariant(pid, vid);
  if (!product || !variant) return;

  currentPid = pid;
  currentVid = variant.vid;

  document.title = `${product.title} (${variant.name}) — Ada's Xpression`;
  els.crumbProduct.textContent = `${product.title} (${variant.name})`;

  els.pTitle.textContent = `${product.title} (${variant.name})`;
  els.pCategory.textContent = categoryLabel(product.category);
  els.pRating.textContent = `★ ${product.rating.toFixed(1)}`;
  els.pPrice.textContent = ADA.naira(variant.price);
  els.pDesc.textContent = product.description;

  renderGallery(variant);
  renderVariants(product, variant.vid);

  if (pushUrl) {
    const url = `product.html?id=${encodeURIComponent(pid)}&v=${encodeURIComponent(variant.vid)}`;
    history.replaceState({}, "", url);
  }
}

function renderRelated(currentPid) {
  const current = ADA.getProduct(currentPid);
  if (!current) return;

  const related = ADA.PRODUCTS.filter((p) => p.id !== currentPid).slice(0, 4);

  els.relatedGrid.innerHTML = related
    .map((p) => {
      const v = p.variants[0];
      return `
      <article class="card" data-id="${p.id}">
        <img class="card__img" src="${v.image}" alt="${p.title}" loading="lazy" />
        <div class="card__body">
          <h3 class="card__title">${p.title}</h3>
          <div class="card__meta">
            <span>${categoryLabel(p.category)}</span>
            <span>★ ${p.rating.toFixed(1)}</span>
          </div>
          <p class="price">From ${ADA.naira(Math.min(...p.variants.map(x => x.price)))}</p>
          <div class="card__actions">
            <button class="btn btn--primary" data-action="open">View</button>
            <button class="btn" data-action="add">Add</button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  els.relatedGrid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const pid = card.getAttribute("data-id");
      const btn = e.target.closest("button");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const product = ADA.getProduct(pid);
      if (!product) return;

      if (action === "open") {
        const def = product.variants[0];
        location.href = `product.html?id=${encodeURIComponent(pid)}&v=${encodeURIComponent(def.vid)}`;
      }
      if (action === "add") {
        const def = product.variants[0];
        ADA.addToCart(pid, def.vid, 1);
        renderDrawer();
        setDrawer(true);
      }
    });
  });
}

function setupMenu() {
  els.menuBtn.addEventListener("click", () => els.nav.classList.toggle("show"));
}

function setupDrawer() {
  els.cartBtn.addEventListener("click", () => {
    renderDrawer();
    setDrawer(true);
  });
  els.closeCartBtn.addEventListener("click", () => setDrawer(false));
  els.drawerOverlay.addEventListener("click", () => setDrawer(false));
}

function setupQty() {
  const clamp = () => {
    if (qty < 1) qty = 1;
    if (qty > 20) qty = 20;
    els.qtyVal.textContent = String(qty);
  };
  els.decQty.addEventListener("click", () => { qty--; clamp(); });
  els.incQty.addEventListener("click", () => { qty++; clamp(); });
  clamp();
}

function setupActions() {
  els.addToCartBtn.addEventListener("click", () => {
    ADA.addToCart(currentPid, currentVid, qty);
    els.actionNote.textContent = "Added to cart.";
    renderDrawer();
    setTimeout(() => (els.actionNote.textContent = ""), 1200);
  });

  els.buyNowBtn.addEventListener("click", () => {
    ADA.addToCart(currentPid, currentVid, qty);
    renderDrawer();
    setDrawer(true);
  });

  els.whatsappBtn.addEventListener("click", () => {
    const cart = {};
    const sku = ADA.makeSku(currentPid, currentVid);
    cart[sku] = { pid: currentPid, vid: currentVid, qty };
    const msg = ADA.buildWhatsAppMessage({ cart });
    ADA.openWhatsApp(msg);
  });
}

function init() {
  els.year.textContent = String(new Date().getFullYear());

  setupMenu();
  setupDrawer();
  setupQty();
  setupActions();

  renderDrawer();

  const { id, v } = getParams();
  const product = ADA.getProduct(id);

  if (!product) {
    location.href = "index.html#shop";
    return;
  }

  const defaultVariant = ADA.getVariant(product.id, v || product.variants[0].vid);
  setVariant(product.id, defaultVariant.vid, true);

  renderRelated(product.id);
}

init();
