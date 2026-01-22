// checkout.js — real checkout page with order summary + Paystack (optional) + WhatsApp fallback

const el = (id) => document.getElementById(id);

const els = {
  nav: el("nav"),
  menuBtn: el("menuBtn"),
  summaryItems: el("summaryItems"),
  subtotal: el("subtotal"),
  checkoutForm: el("checkoutForm"),
  payBtn: el("payBtn"),
  waOrderBtn: el("waOrderBtn"),
  note: el("note"),
};

function setMenu() {
  els.menuBtn.addEventListener("click", () => els.nav.classList.toggle("show"));
}

function renderSummary() {
  const cart = ADA.loadCart();
  const { subtotal, entries } = ADA.cartTotals(cart);

  if (!entries.length) {
    els.summaryItems.innerHTML = `<p class="muted">Your cart is empty. <a href="index.html#shop">Go shopping</a></p>`;
    els.subtotal.textContent = ADA.naira(0);
    return { cart, subtotal: 0, entries: [] };
  }

  els.summaryItems.innerHTML = entries
    .map(
      (it) => `
      <div class="summaryItem" data-sku="${it.sku}">
        <img src="${it.variant.image}" alt="${it.product.title}" />
        <div>
          <h4>${it.product.title} (${it.variant.name})</h4>
          <p class="muted">${ADA.naira(it.variant.price)} each</p>

          <div class="row">
            <span class="muted">Qty: ${it.qty}</span>
            <strong>${ADA.naira(it.variant.price * it.qty)}</strong>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  els.subtotal.textContent = ADA.naira(subtotal);
  return { cart, subtotal, entries };
}

function getCustomer() {
  const fd = new FormData(els.checkoutForm);
  return {
    fullName: String(fd.get("fullName") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    address: String(fd.get("address") || "").trim(),
    city: String(fd.get("city") || "").trim(),
    state: String(fd.get("state") || "").trim(),
    payment: String(fd.get("payment") || "").trim(),
  };
}

function validateCustomer(c) {
  if (!c.fullName || !c.phone || !c.address || !c.city || !c.state || !c.payment) {
    return "Please fill in all required fields.";
  }
  return "";
}

function placeOrderWhatsApp(cart, customer) {
  const msg = ADA.buildWhatsAppMessage({ cart, customer });
  ADA.openWhatsApp(msg);
}

function payWithPaystack({ subtotal, customer, onSuccess, onFail }) {
  const key = ADA_CONFIG.PAYSTACK_PUBLIC_KEY;
  if (!key) {
    onFail("Paystack key not set. Use WhatsApp order or add your public key in data.js.");
    return;
  }

  // Paystack expects amount in kobo
  const amountKobo = Math.round(subtotal * 100);

  // If customer has no email, Paystack requires one; use placeholder.
  const email = customer.email || "customer@example.com";

  const handler = PaystackPop.setup({
    key,
    email,
    amount: amountKobo,
    currency: "NGN",
    metadata: {
      custom_fields: [
        { display_name: "Customer Name", variable_name: "customer_name", value: customer.fullName },
        { display_name: "Phone", variable_name: "phone", value: customer.phone },
        { display_name: "Address", variable_name: "address", value: customer.address },
      ],
    },
    callback: function (response) {
      onSuccess(response);
    },
    onClose: function () {
      onFail("Payment window closed.");
    },
  });

  handler.openIframe();
}

function init() {
  setMenu();

  const summary = renderSummary();

  els.waOrderBtn.addEventListener("click", () => {
    const customer = getCustomer();
    const err = validateCustomer(customer);
    if (err) {
      els.note.textContent = err;
      return;
    }
    if (!summary.entries.length) {
      els.note.textContent = "Your cart is empty.";
      return;
    }
    placeOrderWhatsApp(summary.cart, customer);
  });

  els.payBtn.addEventListener("click", () => {
    const customer = getCustomer();
    const err = validateCustomer(customer);
    if (err) {
      els.note.textContent = err;
      return;
    }
    if (!summary.entries.length) {
      els.note.textContent = "Your cart is empty.";
      return;
    }

    // If payment method isn't card, do WhatsApp order (you can customize later)
    if (customer.payment !== "card") {
      placeOrderWhatsApp(summary.cart, customer);
      return;
    }

    payWithPaystack({
      subtotal: summary.subtotal,
      customer,
      onSuccess: () => {
        els.note.textContent = "Payment successful. Order confirmed.";
        // Clear cart after successful payment
        ADA.saveCart({});
        setTimeout(() => (location.href = "index.html#shop"), 900);
      },
      onFail: (msg) => {
        els.note.textContent = msg;
      },
    });
  });
}

init();
