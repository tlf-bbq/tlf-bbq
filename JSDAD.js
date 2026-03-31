
// Global cart storage
let cartItems = [];
let tipPercent = 0;
let tipCustomAmount = 0;
let promoAmount = 0;

// Carousel functionality
function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-img");
  if (!track || slides.length === 0) return;

  let index = 0;
  
  function goToSlide(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");

  if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(index + 1));
  if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(index - 1));
  
  setInterval(() => goToSlide(index + 1), 4000);
}

// Mobile menu functionality
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const slideout = document.getElementById("slideout");
  const closeBtn = document.getElementById("closeBtn");
  let menuOpen = false;

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      menuOpen = !menuOpen;
      slideout.style.right = menuOpen ? "0" : "-260px";
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      slideout.style.right = "-260px";
      menuOpen = false;
    });
  }
}

// Parallax effect
window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero");
  if (hero) {
    hero.style.transform = `translateY(${window.scrollY * 0.57}px)`;
  }
});

function showAboutPage() {
  const dynamic = document.getElementById("dynamic-content");
  if (!dynamic) return;

  const navEl = document.getElementById("nav") || document.querySelector("header") || document.querySelector(".navbar");
  const navHeight = navEl ? navEl.offsetHeight : 0;

  dynamic.classList.add("fade-out");

  setTimeout(() => {
    dynamic.innerHTML = "";
    const aboutTemplate = document.querySelector("#about-page");
    if (aboutTemplate) {
      const aboutClone = aboutTemplate.cloneNode(true);
      dynamic.appendChild(aboutClone);
    }

    const aboutPage = dynamic.querySelector("#about-page");
    if (aboutPage) {
      aboutPage.classList.remove("hidden", "page-scroll-wrap");
      aboutPage.style.display = "block";
    }

    document.getElementById("slideout")?.style.setProperty("right", "-260px");

    dynamic.classList.remove("fade-out");
    dynamic.classList.add("menu-offset", "fade-in");

    if (navHeight) {
      dynamic.style.paddingTop = navHeight + "px";
    } else {
      dynamic.style.paddingTop = "";
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        const rect = dynamic.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const target = rect.top + scrollTop - navHeight;
        window.scrollTo({ top: target, behavior: "smooth" });

      }, 20);
    });

  }, 220);
}

function showHomePage() {
  location.reload();
}

// Cart helpers
function getSubtotal() {
  return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getTotal() {
  const subtotal = getSubtotal();
  const tip = tipCustomAmount > 0 ? tipCustomAmount : subtotal * tipPercent;
  const total = Math.max(0, subtotal + tip - promoAmount);
  return { subtotal, tip, promo: promoAmount, total };
}

function updateCartDisplay() {
  const list = document.getElementById("cart-list");
  const totalBox = document.getElementById("cart-total");
  const subtotalDisplay = document.getElementById("subtotal-display");
  const tipDisplay = document.getElementById("tip-display");
  const promoDisplay = document.getElementById("promo-display");
  const cartEmptyMsg = document.getElementById("cart-empty-msg");
  const cartCountEl = document.getElementById("cart-count");
  if (!list || !totalBox) return;

  list.innerHTML = "";
  let totalItems = 0;

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    totalItems += item.qty;

    const li = document.createElement("li");
    li.className = "cart-row";
    li.innerHTML = `
      <span class="cart-title">${item.name}</span>
      <div class="cart-controls">
        <button class="qty-btn cart-minus" data-index="${index}">−</button>
        <span class="qty">${item.qty}</span>
        <button class="qty-btn cart-plus" data-index="${index}">+</button>
        <span class="cart-price">$${(itemTotal).toFixed(2)}</span>
        <button class="delete-btn" data-index="${index}">✕</button>
      </div>
    `;
    list.appendChild(li);
  });

  if (cartEmptyMsg) {
    cartEmptyMsg.style.display = cartItems.length === 0 ? "block" : "none";
  }

  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
  }

  const { subtotal, tip, promo, total } = getTotal();

  subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  tipDisplay.textContent = `$${tip.toFixed(2)}`;
  promoDisplay.textContent = `–$${promo.toFixed(2)}`;
  totalBox.textContent = `$${total.toFixed(2)}`;

  syncMenuCardQuantities();
}

function setCartQty(name, price, qty) {
  const existing = cartItems.find(i => i.name === name);
  if (existing) {
    existing.qty = qty;
  } else {
    cartItems.push({ name, price: parseFloat(price), qty });
  }
  updateCartDisplay();
}

function syncMenuCardQuantities() {
  cartItems.forEach(item => {
    document.querySelectorAll(".add-btn").forEach(btn => {
      if (btn.dataset.item === item.name) {
        const card = btn.closest(".menu-item");
        const qtySpan = card?.querySelector(".qty-number");
        if (qtySpan) qtySpan.textContent = item.qty;
      }
    });
  });
}

function resetMenuCardQty(itemName) {
  document.querySelectorAll(".add-btn").forEach(btn => {
    if (btn.dataset.item === itemName) {
      const card = btn.closest(".menu-item");
      const qtySpan = card?.querySelector(".qty-number");
      if (qtySpan) qtySpan.textContent = "1"; // Reset to 1 as default when removed from cart
    }
  });
}

function loadMenu() {
  const dynamic = document.getElementById("dynamic-content");
  const template = document.getElementById("menu-template");
  if (!dynamic || !template) return;

  dynamic.classList.add("fade-out");

  const navEl = document.getElementById("nav") || document.querySelector("header") || document.querySelector(".navbar");
  const navHeight = navEl ? navEl.offsetHeight : 0;

  setTimeout(() => {
    const clone = template.content.cloneNode(true);
    dynamic.innerHTML = "";
    dynamic.appendChild(clone);

    dynamic.classList.remove("fade-out");
    dynamic.classList.add("menu-offset", "fade-in");

    if (navHeight) {
      dynamic.style.paddingTop = navHeight + "px";
    } else {
      dynamic.style.paddingTop = "";
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        const rect = dynamic.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const target = rect.top + scrollTop - navHeight;

        window.scrollTo({ top: target, behavior: "smooth" });

        updateCartDisplay();

        document.querySelectorAll(".tab").forEach(tab => {
          tab.addEventListener("click", e => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.querySelectorAll(".menu-grid").forEach(g => g.classList.add("hidden"));
            const grid = document.getElementById(tab.dataset.category);
            if (grid) grid.classList.remove("hidden");
          });
        });

      }, 20);
    });

  }, 250);
}

// Checkout drawer controls
function openCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.add("open");
  backdrop.classList.add("open");
}

function closeCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
}

// Event delegation for menu/cart interactions
document.addEventListener("click", function(e) {
  // Menu quantity controls
  if (e.target.matches(".qty-btn-card.qty-plus")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card.querySelector(".qty-number");
    let qty = parseInt(qtySpan.textContent) + 1;
    qtySpan.textContent = qty;
    
    const btn = card.querySelector(".add-btn");
    setCartQty(btn.dataset.item, btn.dataset.price, qty);
  }

  if (e.target.matches(".qty-btn-card.qty-minus")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card.querySelector(".qty-number");
    let qty = Math.max(0, parseInt(qtySpan.textContent) - 1);
    qtySpan.textContent = qty;
    
    const btn = card.querySelector(".add-btn");
    setCartQty(btn.dataset.item, btn.dataset.price, qty);
  }

  // Add to cart
  if (e.target.matches(".add-btn")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card.querySelector(".qty-number");
    const qty = parseInt(qtySpan.textContent);

	if (qty === 0) return; // prevent adding zero-qty items
    setCartQty(e.target.dataset.item, e.target.dataset.price, qty);
  }

  // Cart controls
  if (e.target.id === "clear-cart") {
    e.preventDefault();
    cartItems.forEach(item => resetMenuCardQty(item.name));
    cartItems = [];
    updateCartDisplay();
  }

  if (e.target.matches(".cart-plus")) {
    const index = parseInt(e.target.dataset.index);
    if (cartItems[index]) {
      cartItems[index].qty++;
      updateCartDisplay();
    }
  }

  if (e.target.matches(".cart-minus")) {
    const index = parseInt(e.target.dataset.index);
    if (cartItems[index] && cartItems[index].qty > 1) {
      cartItems[index].qty--;
      updateCartDisplay();
    }
  }

  if (e.target.matches(".delete-btn")) {
    const index = parseInt(e.target.dataset.index);
    const item = cartItems[index];
    if (item) {
      cartItems.splice(index, 1);
      updateCartDisplay();
      resetMenuCardQty(item.name);
    }
  }

  // Go back from confirmation
  if (e.target.id === "go-back-menu-btn") {
    loadMenu();
    openCheckoutDrawer();
  }

  // Open checkout drawer
  if (e.target.id === "open-checkout" || e.target.closest("#open-checkout")) {
    e.preventDefault();
    openCheckoutDrawer();
  }

  // Close checkout drawer
  if (e.target.id === "close-checkout" || e.target.id === "checkout-backdrop") {
    e.preventDefault();
    closeCheckoutDrawer();
  }
});

// Tip + promo logic
function initTipAndPromo() {
  const tipButtons = document.querySelectorAll(".tip-btn");
  const tipCustomInput = document.getElementById("tip-custom");
  const promoInput = document.getElementById("promo-code");
  const applyPromoBtn = document.getElementById("apply-promo");

  tipButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tipButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tipPercent = parseFloat(btn.dataset.tip);
      tipCustomAmount = 0;
      if (tipCustomInput) tipCustomInput.value = "";
      updateCartDisplay();
    });
  });

  if (tipCustomInput) {
    tipCustomInput.addEventListener("input", () => {
      const val = parseFloat(tipCustomInput.value);
      if (!isNaN(val) && val >= 0) {
        tipCustomAmount = val;
        tipPercent = 0;
        tipButtons.forEach(b => b.classList.remove("active"));
        updateCartDisplay();
      }
    });
  }

  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener("click", () => {
      const code = promoInput.value.trim().toUpperCase();
      const subtotal = getSubtotal();
      // Simple demo: "BBQ10" = $10 off if subtotal >= $50
      if (code === "BBQ10" && subtotal >= 50) {
        promoAmount = 10;
      } else if (code === "BBQ5" && subtotal >= 25) {
        promoAmount = 5;
      } else if (code === "") {
        promoAmount = 0;
      } else {
        promoAmount = 0;
        alert("Promo code not recognized or minimum not met.");
      }
      updateCartDisplay();
    });
  }
}

// Confirmation screens
function showPrePayConfirmation() {
  const dynamic = document.getElementById("dynamic-content");
  const { total } = getTotal();
  
  const n = document.getElementById("cust-name")?.value || "";
  const p = document.getElementById("cust-phone")?.value || "";
  const d = document.getElementById("pickup-date")?.value || "";
  const t = document.getElementById("pickup-time")?.value || "";
  const nt = document.getElementById("order-notes")?.value || "";

  if (!n || !p || !d || !t) {
    alert("Please fill in name, phone, date, and time before continuing.");
    return;
  }

  let cartHTML = `<ul class="confirm-cart-list">`;
  cartItems.forEach(item => {
    const lineTotal = item.price * item.qty;
    cartHTML += `
      <li class="confirm-cart-item">
        <span>${item.name}</span>
        <span>${item.qty} × $${item.price.toFixed(2)}</span>
        <span>$${lineTotal.toFixed(2)}</span>
      </li>`;
  });
  cartHTML += `<li class="confirm-cart-total"><strong>Total: $${total.toFixed(2)}</strong></li></ul>`;

  dynamic.innerHTML = `
    <div class="confirmation-screen animate-in">
      <div class="confirm-box-wrapper">
        <h1>Confirm Your Order</h1>
        <div class="confirm-box">
          <p><strong>Name:</strong> ${n}</p>
          <p><strong>Phone:</strong> ${p}</p>
          <p><strong>Pickup Date:</strong> ${d}</p>
          <p><strong>Pickup Time:</strong> ${t}</p>
          <p><strong>Notes:</strong> ${nt || "None"}</p>
        </div>
        <h2>Order Contents</h2>
        ${cartHTML}
        <button class="cancel-btn" id="go-back-menu-btn">← Go Back to Menu</button>
        <div class="confirm-pay-section">
          <div id="paypal-button-container"></div>
        </div>
      </div>
    </div>`;

  closeCheckoutDrawer();

async function sendOrderNotification(order) {
  // Same Slack code as above
  // Same EmailJS code as above
  
  alert('Order sent to kitchen!');
}

if (typeof paypal !== "undefined") {
  paypal.Buttons({
    style: { color: "white", shape: "pill", layout: "vertical", tagline: false },

    createOrder: (data, actions) => {
      // compute total at the moment of creating the order
      const { total } = getTotal();
      return actions.order.create({
        purchase_units: [{ amount: { value: (total || 0).toFixed(2) } }]
      });
    },

    onApprove: async (data, actions) => {
      // disable PayPal UI while processing (optional)
      const container = document.querySelector("#paypal-button-container");
      if (container) container.style.pointerEvents = "none";

      try {
        // 1) Capture the payment
        const capture = await actions.order.capture();

        // 2) Build the order payload for notifyKitchen
        const orderPayload = {
          name: document.getElementById("cust-name")?.value || "",
          phone: document.getElementById("cust-phone")?.value || "",
          items: cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
          total: getTotal().total || getTotal().subtotal || 0,
          pickupDate: document.getElementById("pickup-date")?.value || "",
          pickupTime: document.getElementById("pickup-time")?.value || "",
          notes: document.getElementById("order-notes")?.value || "",
          paypalCaptureId: capture?.id || null
        };

        // 3) Notify kitchen (await so we know it ran)
        try {
          await notifyKitchen(orderPayload);
        } catch (notifyErr) {
          console.error("Kitchen notification failed:", notifyErr);
          // continue to confirmation even if notify fails; consider logging server-side
        }

        // 4) Show confirmation to the customer
        showConfirmation(
          orderPayload.name,
          orderPayload.phone,
          orderPayload.pickupDate,
          orderPayload.pickupTime,
          orderPayload.notes
        );

      } catch (err) {
        console.error("Payment capture or post-capture processing failed:", err);
        alert("There was a problem completing your payment. Please try again or contact us.");
      } finally {
        // re-enable PayPal UI
        if (container) container.style.pointerEvents = "";
      }
    },

    onError: (err) => {
      console.error("PayPal Buttons error:", err);
      alert("Payment could not be initialized. Please try again later.");
    }

  }).render("#paypal-button-container");
}

}

// Navigation handlers
function initNavigation() {
  document.addEventListener("click", function(e) {
    const target = e.target;

    // ABOUT
    if (target.matches("#aboutNav, #aboutSlide, #aboutNav *, #aboutSlide *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px");
      showAboutPage();
      return;
    }

    // HOME
    if (target.matches("#homeLogo, #homeLogo *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px");
      showHomePage();
      return;
    }

    // MENU
    if (["menuNav", "menuSlide", "viewMenusBtn", "heroReserve", "navReserve"].some(id =>
      target.id === id || target.matches(`#${id} *`))) {
      e.preventDefault();
      if (target.id === "menuSlide") {
        document.getElementById("slideout").style.right = "-260px";
      }
      loadMenu();
      return;
    }

    // Review order & pay
    if (target.id === "review-order-btn") {
      e.preventDefault();
      showPrePayConfirmation();
      return;
    }
  }, true);
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initMobileMenu();
  initNavigation();
  initTipAndPromo();

  const openCheckoutBtn = document.getElementById("open-checkout");
  const closeCheckoutBtn = document.getElementById("close-checkout");
  const backdrop = document.getElementById("checkout-backdrop");

  if (openCheckoutBtn) openCheckoutBtn.addEventListener("click", openCheckoutDrawer);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", closeCheckoutDrawer);
  if (backdrop) backdrop.addEventListener("click", closeCheckoutDrawer);

  updateCartDisplay();
});
document.querySelectorAll(".add-btn").forEach(btn => {
  const card = btn.closest(".menu-item");
  const qtySpan = card?.querySelector(".qty-number");
  const item = cartItems.find(i => i.name === btn.dataset.item);

  qtySpan.textContent = item ? item.qty : 0;
});



const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function testSlackNow() {
  try {
    const payload = {
      text: `*🧪 TEST ORDER* (from live site)\nName: Aiden Test\nPhone: 555-1234\nItems: 1x Brisket\nTotal: $12\nPickup: Tomorrow 6PM`
    };

    const res = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('✅ SLACK MESSAGE SENT! Check your channel.');
    } else {
      alert('❌ Slack error: ' + await res.text());
    }
  } catch(e) {
    alert('❌ Fetch failed (still building?): ' + e.message);
  }
}



