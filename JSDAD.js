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

  if (hamburger && slideout) {
    hamburger.addEventListener("click", () => {
      menuOpen = !menuOpen;
      slideout.style.right = menuOpen ? "0" : "-260px";
    });
  }
  if (closeBtn && slideout) {
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
        <span class="cart-price">$${itemTotal.toFixed(2)}</span>
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

  if (subtotalDisplay) subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  if (tipDisplay) tipDisplay.textContent = `$${tip.toFixed(2)}`;
  if (promoDisplay) promoDisplay.textContent = `–$${promo.toFixed(2)}`;
  totalBox.textContent = `$${total.toFixed(2)}`;

  syncMenuCardQuantities();
}

function setCartQty(name, price, qty) {
  const existing = cartItems.find(i => i.name === name);
  if (existing) {
    existing.qty = qty;
    if (qty === 0) {
      const index = cartItems.indexOf(existing);
      cartItems.splice(index, 1);
      resetMenuCardQty(name);
    }
  } else if (qty > 0) {
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
      if (qtySpan) qtySpan.textContent = "1";
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
  if (drawer && backdrop) {
    drawer.classList.add("open");
    backdrop.classList.add("open");
  }
}

function closeCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
  }
}

// Email order notification (100% FREE - Uses YOUR Gmail)
async function sendOrderNotification(order) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://formsubmit.co/aidenjgregg@gmail.com';
  form.style.display = 'none';
  
  const itemsList = order.items.map(i => `${i.qty}x ${i.name}`).join('\n');
  const orderId = 'TLF-' + Date.now();
  
  form.innerHTML = `
    <input type="text" name="name" value="${order.name}">
    <input type="text" name="phone" value="${order.phone}">
    <textarea name="items">${itemsList}</textarea>
    <input type="text" name="total" value="$${order.total.toFixed(2)}">
    <input type="text" name="pickup" value="${order.pickupDate} ${order.pickupTime}">
    <input type="text" name="notes" value="${order.notes || 'None'}">
    <input type="text" name="orderId" value="${orderId}">
    <input type="text" name="_next" value="https://tlf-bbq.github.io/tlf-bbq/thanks.html">
    <input type="text" name="_subject" value="New BBQ Order - ${order.name}">
    <input type="text" name="_captcha" value="false">
  `;
  
  document.body.appendChild(form);
  form.submit();
  
  alert('✅ Order emailed to you! Check inbox.');
}

// Test email order function
function testEmailOrder() {
  if (cartItems.length === 0) {
    alert('Add items to cart first! 🛒');
    openCheckoutDrawer();
    return;
  }
  
  const order = {
    name: 'TEST ' + (document.getElementById('cust-name')?.value || 'Customer'),
    phone: document.getElementById('cust-phone')?.value || '555-1234',
    items: cartItems,
    total: getTotal().total,
    pickupDate: document.getElementById('pickup-date')?.value || 'Tomorrow',
    pickupTime: document.getElementById('pickup-time')?.value || '6PM',
    notes: document.getElementById('order-notes')?.value || 'Test order'
  };
  
  sendOrderNotification(order);
}

// Show pre-pay confirmation
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
          <button id="test-email-btn" class="test-email-btn">Test Email Order</button>
        </div>
      </div>
    </div>`;

  closeCheckoutDrawer();

  // Test email button
  document.getElementById('test-email-btn')?.addEventListener('click', testEmailOrder);

  // PayPal integration (if available)
  if (typeof paypal !== "undefined") {
    paypal.Buttons({
      style: { color: "white", shape: "pill", layout: "vertical", tagline: false },
      createOrder: (data, actions) => {
        const { total } = getTotal();
        return actions.order.create({
          purchase_units: [{ amount: { value: (total || 0).toFixed(2) } }]
        });
      },
      onApprove: async (data, actions) => {
        const container = document.querySelector("#paypal-button-container");
        if (container) container.style.pointerEvents = "none";

        try {
          const capture = await actions.order.capture();
          const orderPayload = {
            name: n, phone: p, items: cartItems,
            total: getTotal().total || getTotal().subtotal || 0,
            pickupDate: d, pickupTime: t, notes: nt,
            paypalCaptureId: capture?.id || null
          };

          await sendOrderNotification(orderPayload);
          
        } catch (err) {
          console.error("Payment failed:", err);
          alert("Payment failed. Please try again.");
        } finally {
          if (container) container.style.pointerEvents = "";
        }
      },
      onError: (err) => {
        console.error("PayPal error:", err);
        alert("Payment could not be initialized.");
      }
    }).render("#paypal-button-container");
  }
}

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
      if (code === "BBQ10" && subtotal >= 50) {
        promoAmount = 10;
      } else if (code === "BBQ5" && subtotal >= 25) {
        promoAmount = 5;
      } else {
        promoAmount = 0;
        if (code) alert("Promo code not recognized or minimum not met.");
      }
      updateCartDisplay();
    });
  }
}

// Main event delegation
document.addEventListener("click", function(e) {
  // Menu quantity controls
  if (e.target.matches(".qty-btn-card.qty-plus")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (qtySpan) {
      let qty = parseInt(qtySpan.textContent) + 1;
      qtySpan.textContent = qty;
      const btn = card.querySelector(".add-btn");
      if (btn) setCartQty(btn.dataset.item, btn.dataset.price, qty);
    }
  }

  if (e.target.matches(".qty-btn-card.qty-minus")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (qtySpan) {
      let qty = Math.max(0, parseInt(qtySpan.textContent) - 1);
      qtySpan.textContent = qty;
      const btn = card.querySelector(".add-btn");
      if (btn) setCartQty(btn.dataset.item, btn.dataset.price, qty);
    }
  }

  // Add to cart
  if (e.target.matches(".add-btn")) {
    e.preventDefault();
    const card = e.target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    const qty = qtySpan ? parseInt(qtySpan.textContent) : 1;
    
    if (qty > 0) {
      setCartQty(e.target.dataset.item, e.target.dataset.price, qty);
    }
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

  // Navigation & checkout
  if (e.target.id === "go-back-menu-btn") {
    loadMenu();
    openCheckoutDrawer();
  }

  if (e.target.id === "open-checkout" || e.target.closest("#open-checkout")) {
    e.preventDefault();
    openCheckoutDrawer();
  }

  if (e.target.id === "close-checkout" || e.target.id === "checkout-backdrop") {
    e.preventDefault();
    closeCheckoutDrawer();
  }

  if (e.target.id === "review-order-btn") {
    e.preventDefault();
    showPrePayConfirmation();
  }
});

// Navigation handlers
function initNavigation() {
  document.addEventListener("click", function(e) {
    const target = e.target;

    if (target.matches("#aboutNav, #aboutSlide, #aboutNav *, #aboutSlide *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px");
      showAboutPage();
      return;
    }

    if (target.matches("#homeLogo, #homeLogo *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px");
      showHomePage();
      return;
    }

    if (["menuNav", "menuSlide", "viewMenusBtn", "heroReserve", "navReserve"].some(id =>
      target.id === id || target.matches(`#${id} *`))) {
      e.preventDefault();
      if (target.id === "menuSlide") {
        document.getElementById("slideout").style.right = "-260px";
      }
      loadMenu();
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
  updateCartDisplay();
});
