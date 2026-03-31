


// Global cart storage
let cartItems = [];
let tipPercent = 0;
let tipCustomAmount = 0;
let promoAmount = 0;

// --- Carousel Functionality ---
function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-img");
  if (!track || slides.length === 0) return;

  let index = 0;
  const totalSlides = slides.length;

  function goToSlide(i) {
    index = (i + totalSlides) % totalSlides;
    // Use CSS transform for smoother transitions
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");

  if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(index + 1));
  if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(index - 1));

  // Use requestAnimationFrame for smoother animation loop if needed, or keep setInterval for simplicity
  // For this example, keeping setInterval as it's common for carousels.
  let intervalId = setInterval(() => goToSlide(index + 1), 4000);

  function restartInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(() => goToSlide(index + 1), 4000);
  }

  // Optional: Clear interval on mouse hover to prevent unexpected jumps
  const carouselContainer = track.closest('.carousel');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => clearInterval(intervalId));
    carouselContainer.addEventListener('mouseleave', () => {
      restartInterval();
    });
  }
}

// --- Mobile Menu Functionality ---
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const slideout = document.getElementById("slideout");
  const closeBtn = document.getElementById("closeBtn");
  let menuOpen = false;

  // Use a class for toggling visibility for better CSS control and accessibility
  const MENU_OPEN_CLASS = "menu-open";
  const MENU_CLOSED_RIGHT = "-260px"; // Assuming this is the closed state width

  if (hamburger && slideout) {
    hamburger.addEventListener("click", () => {
      menuOpen = !menuOpen;
      slideout.classList.toggle(MENU_OPEN_CLASS);
      slideout.style.right = menuOpen ? "0" : MENU_CLOSED_RIGHT;
      // Optionally manage focus or ARIA attributes for accessibility
      if (menuOpen) {
        // Focus first element in menu
        slideout.querySelector('a, button')?.focus();
      }
    });
  }

  if (closeBtn && slideout) {
    closeBtn.addEventListener("click", () => {
      slideout.classList.remove(MENU_OPEN_CLASS);
      slideout.style.right = MENU_CLOSED_RIGHT;
      menuOpen = false;
      // Return focus to hamburger button
      hamburger?.focus();
    });
  }

  // Close menu if clicking outside of it
  document.addEventListener('click', (e) => {
    if (menuOpen && slideout && !slideout.contains(e.target) && !hamburger.contains(e.target)) {
      slideout.classList.remove(MENU_OPEN_CLASS);
      slideout.style.right = MENU_CLOSED_RIGHT;
      menuOpen = false;
    }
  });
}

// --- Parallax Effect ---
// Debounce or throttle scroll events for performance
let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const hero = document.querySelector(".hero");
      if (hero) {
        // Adjust multiplier for desired effect speed
        hero.style.transform = `translateY(${window.scrollY * 0.57}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }
});

// --- Dynamic Content Loading ---
function getNavHeight() {
  const navEl = document.getElementById("nav") || document.querySelector("header") || document.querySelector(".navbar");
  return navEl ? navEl.offsetHeight : 0;
}

function updateDynamicContent(templateId, transitionDuration = 220) {
  const dynamic = document.getElementById("dynamic-content");
  if (!dynamic) return;

  const navHeight = getNavHeight();

  dynamic.classList.add("fade-out");

  setTimeout(() => {
    dynamic.innerHTML = ""; // Clear previous content
    const template = document.getElementById(templateId);
    if (template) {
      const clone = template.content.cloneNode(true);
      dynamic.appendChild(clone);
    }

    // Ensure the cloned content is visible and styled correctly
    const contentWrapper = dynamic.querySelector(`#${templateId.replace('-template', '')}`) || dynamic.firstElementChild; // Adjust selector if needed
    if (contentWrapper) {
      contentWrapper.classList.remove("hidden", "page-scroll-wrap");
      contentWrapper.style.display = "block";
    }

    // Close mobile menu if open
    const slideout = document.getElementById("slideout");
    if (slideout && slideout.classList.contains("menu-open")) {
      slideout.classList.remove("menu-open");
      slideout.style.right = "-260px"; // Assuming this is the closed state
    }

    dynamic.classList.remove("fade-out");
    dynamic.classList.add("menu-offset", "fade-in");

    if (navHeight) {
      dynamic.style.paddingTop = `${navHeight}px`;
    } else {
      dynamic.style.paddingTop = "";
    }

    // Scroll to top of new content smoothly
    requestAnimationFrame(() => {
      setTimeout(() => {
        const rect = dynamic.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // Adjust target scroll position to account for fixed nav
        const target = rect.top + scrollTop - navHeight;
        window.scrollTo({ top: target, behavior: "smooth" });
      }, 20); // Small delay to ensure layout is calculated
    });
  }, transitionDuration);
}

function showAboutPage() {
  updateDynamicContent("about-page-template"); // Assuming you have a template with id="about-page-template"
}

function showHomePage() {
  // Reloading is often not ideal for SPAs. Consider a more controlled approach if possible.
  // For now, keeping location.reload() as per original code.
  location.reload();
}

// --- Cart Helpers ---
function getSubtotal() {
  return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getTotal() {
  const subtotal = getSubtotal();
  // Ensure tip calculation is robust
  const tip = tipCustomAmount > 0 ? tipCustomAmount : subtotal * tipPercent;
  // Ensure promoAmount is not greater than subtotal + tip
  const effectivePromo = Math.min(promoAmount, subtotal + tip);
  const total = Math.max(0, subtotal + tip - effectivePromo);
  return { subtotal, tip, promo: effectivePromo, total };
}

function updateCartDisplay() {
  const list = document.getElementById("cart-list");
  const totalBox = document.getElementById("cart-total");
  const subtotalDisplay = document.getElementById("subtotal-display");
  const tipDisplay = document.getElementById("tip-display");
  const promoDisplay = document.getElementById("promo-display");
  const cartEmptyMsg = document.getElementById("cart-empty-msg");
  const cartCountEl = document.getElementById("cart-count");

  if (!list || !totalBox) return; // Exit if essential elements are missing

  list.innerHTML = ""; // Clear existing list items
  let totalItems = 0;

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    totalItems += item.qty;

    const li = document.createElement("li");
    li.className = "cart-row";
    // Use template literals for cleaner HTML generation
    li.innerHTML = `
      <span class="cart-title">${escapeHtml(item.name)}</span>
      <div class="cart-controls">
        <button class="qty-btn cart-minus" data-index="${index}" aria-label="Decrease quantity of ${escapeHtml(item.name)}">-</button>
        <span class="qty" aria-live="polite">${item.qty}</span>
        <button class="qty-btn cart-plus" data-index="${index}" aria-label="Increase quantity of ${escapeHtml(item.name)}">+</button>
        <span class="cart-price">$${itemTotal.toFixed(2)}</span>
        <button class="delete-btn" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)} from cart">✕</button>
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
  const existingIndex = cartItems.findIndex(i => i.name === name);
  const numericPrice = parseFloat(price); // Ensure price is a number

  if (existingIndex > -1) {
    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      const removedItem = cartItems.splice(existingIndex, 1)[0];
      resetMenuCardQty(removedItem.name);
    } else {
      // Update quantity
      cartItems[existingIndex].qty = qty;
    }
  } else if (qty > 0) {
    // Add new item if it doesn't exist and quantity is positive
    cartItems.push({ name, price: numericPrice, qty });
  }
  updateCartDisplay();
}

function syncMenuCardQuantities() {
  // Optimize by iterating through cartItems once and updating relevant DOM elements
  const itemQuantities = {};
  cartItems.forEach(item => {
    itemQuantities[item.name] = item.qty;
  });

  document.querySelectorAll(".add-btn").forEach(btn => {
    const itemName = btn.dataset.item;
    const card = btn.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");

    if (qtySpan) {
      const currentQty = itemQuantities[itemName] || 0;
      if (currentQty > 0) {
        qtySpan.textContent = currentQty;
        // Optionally update button state or display if needed
      } else {
        qtySpan.textContent = "1"; // Reset to default if not in cart
      }
    }
  });
}

function resetMenuCardQty(itemName) {
  document.querySelectorAll(".add-btn").forEach(btn => {
    if (btn.dataset.item === itemName) {
      const card = btn.closest(".menu-item");
      const qtySpan = card?.querySelector(".qty-number");
      if (qtySpan) qtySpan.textContent = "1"; // Reset to default quantity
    }
  });
}

function loadMenu() {
  updateDynamicContent("menu-template", 250); // Assuming you have a template with id="menu-template"

  // Event listeners for tabs should be attached after content is loaded
  // This is now handled within updateDynamicContent's setTimeout or can be moved to a dedicated init function
  // called after updateDynamicContent completes.
  // For now, assuming tab listeners are handled by the main event delegation or a separate init.
}

// --- Checkout Drawer Controls ---
function openCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (drawer && backdrop) {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";
  }
}

function closeCheckoutDrawer() {
  const drawer = document.getElementById("checkout-drawer");
  const backdrop = document.getElementById("checkout-backdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    // Restore body scroll
    document.body.style.overflow = "";
   }
}

// --- Email Sending: Web3Forms ---
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = '';
const FORM_REQUEST_TIMEOUT_MS = 10000;
const EMAIL_TEST_QUERY_PARAM = 'emailtest';

function createHiddenField(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  return input;
}

/**
 * Send order notification using Web3Forms.
 * @param {object} order - The order details object.
 * @param {string} order.name - Customer name.
 * @param {string} order.phone - Customer phone.
 * @param {Array<object>} order.items - Array of cart items.
 * @param {number} order.total - Total order amount.
 * @param {string} order.pickupDate - Pickup date.
 * @param {string} order.pickupTime - Pickup time.
 * @param {string} order.notes - Special notes.
 * @param {string} [order.paypalCaptureId] - PayPal capture ID if applicable.
 */
async function sendOrderNotification(order) {
  const itemsList = (order.items || [])
    .map(i => `${i.qty}x ${i.name} - $${(i.price * i.qty).toFixed(2)}`)
    .join('\n');
  const orderId = 'TLF-' + Date.now();

  return submitOrderWithWeb3Forms(order, itemsList, orderId);
}

async function submitOrderWithWeb3Forms(order, itemsList, orderId) {
  const accessKey = WEB3FORMS_ACCESS_KEY.trim();

  if (!accessKey) {
    alert('Add your Web3Forms access key in JSDAD.js before sending order emails.');
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORM_REQUEST_TIMEOUT_MS);

  try {
    const customerEmail = (order.customerEmail || '').trim();
    const notificationEmail = (order.notificationEmail || '').trim();
    const isTestOrder = Boolean(order.isTest);

    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `${isTestOrder ? 'TEST - ' : ''}New BBQ Order - ${order.name || 'Customer'}`,
        from_name: 'TLF BBQ Online Orders',
        name: order.name || '',
        phone: order.phone || '',
        email: customerEmail,
        replyto: customerEmail,
        ccemail: notificationEmail,
        items: itemsList,
        total: `$${(order.total || 0).toFixed(2)}`,
        pickup: `${order.pickupDate || ''} ${order.pickupTime || ''}`.trim(),
        notes: order.notes || 'None',
        orderId: orderId,
        customerEmail: customerEmail || 'N/A',
        notificationEmail: notificationEmail || 'None',
        paypalCaptureId: order.paypalCaptureId || 'N/A',
        botcheck: ''
      }),
      signal: controller.signal
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      const message = result.message || `Request failed with status ${response.status}.`;
      throw new Error(message);
    }

    console.log('Web3Forms sent successfully.', result);
    showOrderSentConfirmation(order);
    return true;
  } catch (error) {
    console.error('Web3Forms error:', error);
    alert(`Web3Forms could not send the order: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Small helper to avoid injection issues in generated HTML
function escapeHtml(str) {
  if (typeof str !== 'string') return str; // Handle non-string inputs gracefully
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Show a nicer confirmation (replace alerts in production if desired)
function legacyShowOrderSentConfirmation(isFallback = false) {
  const msg = isFallback ? '✅ Order submitted via fallback. Please check your email for confirmation.' : '✅ Order submitted! Please check your email for confirmation.';
  // In a real application, you'd likely use a modal or toast notification.
  // For now, using alert as per original code, but with a more informative message.
  alert(msg);
}

function showOrderSentConfirmation(options = {}) {
  const recipients = [];

  if (options.customerEmail) {
    recipients.push(`customer copy: ${options.customerEmail}`);
  }

  if (options.notificationEmail) {
    recipients.push(`extra copy: ${options.notificationEmail}`);
  }

  const modeLabel = options.isTest ? 'Test order' : 'Order';
  const details = recipients.length > 0
    ? `\n\nRequested recipient emails:\n${recipients.join('\n')}\n\nCustomer and extra recipient delivery depends on your Web3Forms autoresponder/CC setup.`
    : '';
  const msg = `${modeLabel} email sent to TLF BBQ.${details}`;
  alert(msg);
}

// Legacy test helper kept for reference while the shared paid/test flow is active below.
async function legacyTestOrderNotification() {
  if (cartItems.length === 0) {
    alert('Add items to cart first! 🛒');
    openCheckoutDrawer(); // Open drawer to encourage adding items
    return;
  }

  // Use placeholder values or actual input values for testing
  const order = {
    name: 'TEST ' + (document.getElementById('cust-name')?.value || 'Customer Name'),
    phone: document.getElementById('cust-phone')?.value || '555-1234',
    items: cartItems,
    total: getTotal().total,
    pickupDate: document.getElementById('pickup-date')?.value || 'Tomorrow',
    pickupTime: document.getElementById('pickup-time')?.value || '6:00 PM',
    notes: document.getElementById('order-notes')?.value || 'This is a test order.'
  };

  try {
    await sendOrderNotification(order);
    console.log('Test order notification sent successfully.');
  } catch (err) {
    console.error('Test order notification failed:', err);
    alert('Test email failed. Please check the console for details.');
  }
}

function getTrimmedInputValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shouldShowEmailTestTools() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(EMAIL_TEST_QUERY_PARAM) === '1';
  } catch (error) {
    console.warn('Could not read email test query flag.', error);
    return false;
  }
}

function buildCurrentOrderPayload(options = {}) {
  const { isTest = false, paypalCaptureId = null } = options;
  const { total } = getTotal();

  return {
    name: getTrimmedInputValue('cust-name'),
    phone: getTrimmedInputValue('cust-phone'),
    customerEmail: getTrimmedInputValue('cust-email'),
    notificationEmail: getTrimmedInputValue('notify-email'),
    items: cartItems.map(item => ({ ...item })),
    total,
    pickupDate: getTrimmedInputValue('pickup-date'),
    pickupTime: getTrimmedInputValue('pickup-time'),
    notes: getTrimmedInputValue('order-notes'),
    paypalCaptureId,
    isTest
  };
}

function validateOrderPayload(order, options = {}) {
  const { isTest = false } = options;

  if (!order.items || order.items.length === 0) {
    alert('Add items to cart first!');
    openCheckoutDrawer();
    return false;
  }

  if (!order.name || !order.phone || !order.customerEmail || !order.pickupDate || !order.pickupTime) {
    alert('Please fill in your name, phone number, email, pickup date, and pickup time before continuing.');
    return false;
  }

  if (!isValidEmail(order.customerEmail)) {
    alert('Please enter a valid customer email address.');
    return false;
  }

  if (order.notificationEmail && !isValidEmail(order.notificationEmail)) {
    alert('Please enter a valid extra order email address or leave it blank.');
    return false;
  }

  if (!isTest && !order.paypalCaptureId) {
    alert('Payment must be confirmed before order emails are sent.');
    return false;
  }

  return true;
}

async function sendCheckoutEmailsForCurrentOrder(options = {}) {
  const order = buildCurrentOrderPayload(options);

  if (!validateOrderPayload(order, options)) {
    return false;
  }

  try {
    await sendOrderNotification(order);
    console.log(options.isTest ? 'Test order notification sent successfully.' : 'Paid order notification sent successfully.');
    return true;
  } catch (err) {
    console.error('Order notification failed:', err);
    alert('Order email failed. Please check the console for details.');
    return false;
  }
}

// Override the legacy test handler so it uses the same payload as the paid flow.
async function testOrderNotification() {
  return sendCheckoutEmailsForCurrentOrder({ isTest: true });
}

window.testOrderNotification = testOrderNotification;
window.sendCheckoutEmailsForCurrentOrder = sendCheckoutEmailsForCurrentOrder;

// Show pre-pay confirmation screen
function showPrePayConfirmation() {
  const dynamic = document.getElementById("dynamic-content");
  const orderPreview = buildCurrentOrderPayload();
  const { total } = getTotal();

  if (!validateOrderPayload(orderPreview, { isTest: true })) {
    return;
  }

  const n = orderPreview.name;
  const p = orderPreview.phone;
  const em = orderPreview.customerEmail;
  const notify = orderPreview.notificationEmail;
  const d = orderPreview.pickupDate;
  const t = orderPreview.pickupTime;
  const nt = orderPreview.notes;

  let cartHTML = `<ul class="confirm-cart-list">`;
  orderPreview.items.forEach(item => {
    const lineTotal = item.price * item.qty;
    cartHTML += `
      <li class="confirm-cart-item">
        <span>${escapeHtml(item.name)}</span>
        <span>${item.qty} × $${item.price.toFixed(2)}</span>
        <span>$${lineTotal.toFixed(2)}</span>
      </li>`;
  });
  cartHTML += `<li class="confirm-cart-total"><strong>Total: $${total.toFixed(2)}</strong></li></ul>`;

  // Use a template for the confirmation screen for better maintainability
  dynamic.innerHTML = `
    <div class="confirmation-screen animate-in">
      <div class="confirm-box-wrapper">
        <h1>Confirm Your Order</h1>
        <div class="confirm-box">
          <p><strong>Name:</strong> ${escapeHtml(n)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(p)}</p>
          <p><strong>Customer Email:</strong> ${escapeHtml(em)}</p>
          <p><strong>Extra Order Email:</strong> ${escapeHtml(notify || "None")}</p>
          <p><strong>Pickup Date:</strong> ${escapeHtml(d)}</p>
          <p><strong>Pickup Time:</strong> ${escapeHtml(t)}</p>
          <p><strong>Notes:</strong> ${escapeHtml(nt || "None")}</p>
        </div>
        <h2>Order Contents</h2>
        ${cartHTML}
        <button class="cancel-btn" id="go-back-menu-btn">← Go Back to Menu</button>
        <div class="confirm-pay-section">
          <div id="paypal-button-container"></div>
          ${shouldShowEmailTestTools() ? '<button id="test-email-btn" class="test-email-btn" type="button">Send Test Order Email</button>' : ''}
        </div>
      </div>
    </div>`;

  closeCheckoutDrawer();

  // Attach event listener for the test email button
  const testEmailBtn = document.getElementById('test-email-btn');
  if (testEmailBtn) {
    testEmailBtn.addEventListener('click', async () => {
      // Disable button to prevent multiple clicks
      testEmailBtn.disabled = true;
      await testOrderNotification();
      testEmailBtn.disabled = false; // Re-enable after completion
    });
  }

  // PayPal integration (if available)
  if (typeof paypal !== "undefined") {
    paypal.Buttons({
      style: { color: "white", shape: "pill", layout: "vertical", tagline: false },
      createOrder: (data, actions) => {
        const { total } = getTotal();
        // Ensure total is a valid number and at least 0.01 for PayPal
        const orderTotal = Math.max(0.01, total).toFixed(2);
        return actions.order.create({
          purchase_units: [{ amount: { value: orderTotal } }]
        });
      },
      onApprove: async (data, actions) => {
        const container = document.querySelector("#paypal-button-container");
        if (container) container.style.pointerEvents = "none"; // Disable button interaction

        try {
          const capture = await actions.order.capture();
          console.log('PayPal capture details:', capture);

          const emailSent = await sendCheckoutEmailsForCurrentOrder({
            isTest: false,
            paypalCaptureId: capture?.id || null
          });

          if (!emailSent) {
            alert("Payment was captured, but the order email could not be sent. Please contact TLF BBQ with your pickup details.");
          } else {
            cartItems.forEach(item => resetMenuCardQty(item.name));
            cartItems = [];
            tipPercent = 0;
            tipCustomAmount = 0;
            promoAmount = 0;
            updateCartDisplay();
          }
          // Optionally show a success message or redirect after successful payment and email
          // alert("Payment successful! Your order has been placed.");
          // window.location.href = "/thanks.html"; // Redirect to a thank you page
        } catch (err) {
          console.error("Payment or email sending failed:", err);
          alert("Payment failed or order confirmation could not be sent. Please try again.");
        } finally {
          if (container) container.style.pointerEvents = ""; // Re-enable button interaction
        }
      },
      onError: (err) => {
        console.error("PayPal error:", err);
        alert("PayPal payment could not be initialized. Please try again.");
      }
    }).render("#paypal-button-container");
  } else {
    console.warn("PayPal SDK not loaded. PayPal buttons will not be available.");
    // Hide PayPal button container or show a message
    document.getElementById("paypal-button-container").innerHTML = "<p>PayPal is currently unavailable.</p>";
  }
}

// --- Tip + Promo Logic ---
function initTipAndPromo() {
  const tipButtons = document.querySelectorAll(".tip-btn");
  const tipCustomInput = document.getElementById("tip-custom");
  const promoInput = document.getElementById("promo-code");
  const applyPromoBtn = document.getElementById("apply-promo");

  tipButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tipButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tipPercent = parseFloat(btn.dataset.tip) || 0; // Ensure valid number
      tipCustomAmount = 0; // Reset custom amount when percentage is selected
      if (tipCustomInput) tipCustomInput.value = ""; // Clear custom input field
      updateCartDisplay();
    });
  });

  if (tipCustomInput) {
    tipCustomInput.addEventListener("input", () => {
      const val = parseFloat(tipCustomInput.value);
      if (!isNaN(val) && val >= 0) {
        tipCustomAmount = val;
        tipPercent = 0; // Reset percentage when custom amount is entered
        tipButtons.forEach(b => b.classList.remove("active")); // Deactivate percentage buttons
        updateCartDisplay();
      } else if (tipCustomInput.value === "") {
        // If input is cleared, reset to default (e.g., 0 tip)
        tipCustomAmount = 0;
        tipPercent = 0; // Or set to a default percentage if desired
        updateCartDisplay();
      }
    });
  }

  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener("click", () => {
      const code = promoInput.value.trim().toUpperCase();
      const subtotal = getSubtotal();
      let applied = false;

      // Define promo codes and their conditions
      const promos = {
        "BBQ10": { value: 10, minSpend: 50 },
        "BBQ5": { value: 5, minSpend: 25 }
      };

      if (promos[code] && subtotal >= promos[code].minSpend) {
        promoAmount = promos[code].value;
        applied = true;
        alert(`Promo code "${code}" applied!`);
      } else {
        promoAmount = 0; // Reset promo if invalid or conditions not met
        if (code) alert("Promo code not recognized or minimum spending not met.");
      }
      updateCartDisplay();
    });
  }
}

// --- Main Event Delegation ---
// Use a single event listener for efficiency, especially for dynamically added elements.
document.addEventListener("click", function(e) {
  const target = e.target;

  // Menu quantity controls (within menu cards)
  if (target.matches(".qty-btn-card.qty-plus")) {
    e.preventDefault();
    const card = target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (qtySpan) {
      let qty = parseInt(qtySpan.textContent) + 1;
      qtySpan.textContent = qty;
      const btn = card.querySelector(".add-btn"); // Assuming add-btn is in the same card
      if (btn) setCartQty(btn.dataset.item, btn.dataset.price, qty);
    }
  }

  if (target.matches(".qty-btn-card.qty-minus")) {
    e.preventDefault();
    const card = target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    if (qtySpan) {
      let qty = Math.max(1, parseInt(qtySpan.textContent) - 1); // Ensure quantity doesn't go below 1 here
      qtySpan.textContent = qty;
      const btn = card.querySelector(".add-btn");
      if (btn) setCartQty(btn.dataset.item, btn.dataset.price, qty);
    }
  }

  // Add to cart button
  if (target.matches(".add-btn")) {
    e.preventDefault();
    const card = target.closest(".menu-item");
    const qtySpan = card?.querySelector(".qty-number");
    // Default to 1 if qtySpan is not found or has invalid content
    const qty = qtySpan ? parseInt(qtySpan.textContent) || 1 : 1;

    if (qty > 0) {
      setCartQty(target.dataset.item, target.dataset.price, qty);
    }
  }

  // Cart controls (within the cart drawer/display)
  if (target.id === "clear-cart") {
    e.preventDefault();
    // Reset quantities on menu cards before clearing cartItems
    cartItems.forEach(item => resetMenuCardQty(item.name));
    cartItems = []; // Clear the cart array
    updateCartDisplay(); // Update the UI
  }

  if (target.matches(".cart-plus")) {
    const index = parseInt(target.dataset.index);
    if (cartItems[index]) {
      cartItems[index].qty++;
      updateCartDisplay();
    }
  }

  if (target.matches(".cart-minus")) {
    const index = parseInt(target.dataset.index);
    if (cartItems[index] && cartItems[index].qty > 1) {
      cartItems[index].qty--;
      updateCartDisplay();
    } else if (cartItems[index] && cartItems[index].qty === 1) {
      // If quantity is 1 and minus is clicked, remove the item
      const item = cartItems[index];
      cartItems.splice(index, 1);
      resetMenuCardQty(item.name); // Reset menu card quantity display
      updateCartDisplay();
    }
  }

  if (target.matches(".delete-btn")) {
    const index = parseInt(target.dataset.index);
    const item = cartItems[index];
    if (item) {
      cartItems.splice(index, 1);
      updateCartDisplay();
      resetMenuCardQty(item.name); // Reset menu card quantity display
    }
  }

  // Navigation and checkout flow
  if (target.id === "go-back-menu-btn") {
    e.preventDefault();
    loadMenu(); // Reload menu content
    openCheckoutDrawer(); // Re-open checkout drawer
  }

  if (target.id === "open-checkout" || target.closest("#open-checkout")) {
    e.preventDefault();
    openCheckoutDrawer();
  }

  if (target.id === "close-checkout" || target.id === "checkout-backdrop") {
    e.preventDefault();
    closeCheckoutDrawer();
  }

  if (target.id === "review-order-btn") {
    e.preventDefault();
    showPrePayConfirmation();
  }
});

// --- Navigation Handlers ---
function initNavigation() {
  // Use event delegation on document for navigation links
  document.addEventListener("click", function(e) {
    const target = e.target;

    // About Navigation
    if (target.matches("#aboutNav, #aboutSlide, #aboutNav *, #aboutSlide *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px"); // Close mobile menu
      showAboutPage();
      return;
    }

    // Home Navigation (Logo)
    if (target.matches("#homeLogo, #homeLogo *")) {
      e.preventDefault();
      document.getElementById("slideout")?.style.setProperty("right", "-260px"); // Close mobile menu
      showHomePage();
      return;
    }

    // Menu Navigation
    const menuNavIds = ["menuNav", "menuSlide", "viewMenusBtn", "heroReserve", "navReserve"];
    if (menuNavIds.some(id => target.id === id || target.matches(`#${id} *`))) {
      e.preventDefault();
      if (target.id === "menuSlide") { // Close mobile menu if clicked from there
        document.getElementById("slideout").style.right = "-260px";
      }
      loadMenu();
      return;
    }
  }, true); // Use capture phase to ensure it fires before other listeners if needed
}

// --- Initialize Everything ---
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initMobileMenu();
  initNavigation();
  initTipAndPromo();
  updateCartDisplay(); // Initial display of cart (should be empty)

  // Add event listeners for dynamically loaded content if necessary,
  // or ensure they are handled by the main event delegation.
  // For example, tab clicks within the menu.
  document.addEventListener("click", function(e) {
    if (e.target.matches(".tab")) {
      e.preventDefault();
      const tab = e.target;
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".menu-grid").forEach(g => g.classList.add("hidden"));
      const grid = document.getElementById(tab.dataset.category);
      if (grid) grid.classList.remove("hidden");
    }
  });
});
