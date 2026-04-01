const TLF_EMAIL_TEST_QUERY_PARAM = "emailtest";
const TLF_PENDING_PAYPAL_SESSION_KEY = "tlfPendingPayPalSession";

function tlfApiBase() {
  const configuredBase = typeof window.__TLF_API_BASE__ === "string" ? window.__TLF_API_BASE__.trim() : "";
  return configuredBase.replace(/\/$/, "");
}

function tlfApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${tlfApiBase()}${normalizedPath}`;
}

async function tlfPostJson(path, payload) {
  const response = await fetch(tlfApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload || {})
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function tlfEscapeHtml(str) {
  if (typeof str !== "string") return str;
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tlfFormatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function tlfTrimmedValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function tlfIsValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tlfShouldShowEmailTestTools() {
  try {
    return new URLSearchParams(window.location.search).get(TLF_EMAIL_TEST_QUERY_PARAM) === "1";
  } catch (error) {
    console.warn("Could not read email test query flag.", error);
    return false;
  }
}

function tlfBuildOrderPayload(options = {}) {
  const totals = getTotal();
  return {
    name: tlfTrimmedValue("cust-name"),
    phone: tlfTrimmedValue("cust-phone"),
    customerEmail: tlfTrimmedValue("cust-email"),
    notificationEmail: tlfTrimmedValue("notify-email"),
    pickupDate: tlfTrimmedValue("pickup-date"),
    pickupTime: tlfTrimmedValue("pickup-time"),
    notes: tlfTrimmedValue("order-notes"),
    items: cartItems.map(item => ({ ...item })),
    subtotal: totals.subtotal,
    tip: totals.tip,
    promo: totals.promo,
    total: totals.total,
    isTest: Boolean(options.isTest)
  };
}

function tlfValidateOrderPayload(order) {
  if (!order.items || order.items.length === 0) {
    alert("Add items to cart first!");
    openCheckoutDrawer();
    return false;
  }

  if (!order.name || !order.phone || !order.customerEmail || !order.pickupDate || !order.pickupTime) {
    alert("Please fill in your name, phone number, email, pickup date, and pickup time before continuing.");
    return false;
  }

  if (!tlfIsValidEmail(order.customerEmail)) {
    alert("Please enter a valid customer email address.");
    return false;
  }

  if (order.notificationEmail && !tlfIsValidEmail(order.notificationEmail)) {
    alert("Please enter a valid extra order email address or leave it blank.");
    return false;
  }

  return true;
}

function tlfResetCartState() {
  cartItems.forEach(item => resetMenuCardQty(item.name));
  cartItems = [];
  tipPercent = 0;
  tipCustomAmount = 0;
  promoAmount = 0;
  updateCartDisplay();
}

function tlfSavePendingSession(session) {
  try {
    window.sessionStorage.setItem(TLF_PENDING_PAYPAL_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("Could not store PayPal session.", error);
  }
}

function tlfLoadPendingSession() {
  try {
    const raw = window.sessionStorage.getItem(TLF_PENDING_PAYPAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Could not load PayPal session.", error);
    return null;
  }
}

function tlfClearPendingSession() {
  try {
    window.sessionStorage.removeItem(TLF_PENDING_PAYPAL_SESSION_KEY);
  } catch (error) {
    console.warn("Could not clear PayPal session.", error);
  }
}

function tlfShowOrderSentConfirmation(options = {}) {
  const recipients = [];
  if (options.customerEmail) recipients.push(`customer copy: ${options.customerEmail}`);
  if (options.notificationEmail) recipients.push(`extra copy: ${options.notificationEmail}`);
  const details = recipients.length ? `\n\nRequested recipient emails:\n${recipients.join("\n")}` : "";
  alert(`${options.isTest ? "Test order" : "Order"} email request completed.${details}`);
}

window.testOrderNotification = async function secureTestOrderNotification() {
  const order = tlfBuildOrderPayload({ isTest: true });
  if (!tlfValidateOrderPayload(order)) return false;

  try {
    await tlfPostJson("/api/test-order-email", { order });
    tlfShowOrderSentConfirmation(order);
    return true;
  } catch (error) {
    console.error("Test email failed:", error);
    alert(error.message || "Test email failed.");
    return false;
  }
};

window.showPrePayConfirmation = function secureShowPrePayConfirmation() {
  const dynamic = document.getElementById("dynamic-content");
  const orderPreview = tlfBuildOrderPayload();

  if (!tlfValidateOrderPayload(orderPreview)) return;

  let cartHTML = `<ul class="confirm-cart-list">`;
  orderPreview.items.forEach(item => {
    const lineTotal = item.price * item.qty;
    cartHTML += `
      <li class="confirm-cart-item">
        <span>${tlfEscapeHtml(item.name)}</span>
        <span>${item.qty} x ${tlfFormatCurrency(item.price)}</span>
        <span>${tlfFormatCurrency(lineTotal)}</span>
      </li>`;
  });
  cartHTML += `<li class="confirm-cart-item"><span>Tip</span><span></span><span>${tlfFormatCurrency(orderPreview.tip)}</span></li>`;
  cartHTML += `<li class="confirm-cart-item"><span>Promo</span><span></span><span>-${tlfFormatCurrency(orderPreview.promo)}</span></li>`;
  cartHTML += `<li class="confirm-cart-total"><strong>Total: ${tlfFormatCurrency(orderPreview.total)}</strong></li></ul>`;

  dynamic.innerHTML = `
    <div class="confirmation-screen animate-in">
      <div class="confirm-box-wrapper">
        <h1>Confirm Your Order</h1>
        <div class="confirm-box">
          <p><strong>Name:</strong> ${tlfEscapeHtml(orderPreview.name)}</p>
          <p><strong>Phone:</strong> ${tlfEscapeHtml(orderPreview.phone)}</p>
          <p><strong>Customer Email:</strong> ${tlfEscapeHtml(orderPreview.customerEmail)}</p>
          <p><strong>Extra Order Email:</strong> ${tlfEscapeHtml(orderPreview.notificationEmail || "None")}</p>
          <p><strong>Pickup Date:</strong> ${tlfEscapeHtml(orderPreview.pickupDate)}</p>
          <p><strong>Pickup Time:</strong> ${tlfEscapeHtml(orderPreview.pickupTime)}</p>
          <p><strong>Notes:</strong> ${tlfEscapeHtml(orderPreview.notes || "None")}</p>
        </div>
        <h2>Order Contents</h2>
        ${cartHTML}
        <button class="cancel-btn" id="go-back-menu-btn">Back to Menu</button>
        <div class="confirm-pay-section">
          <div id="paypal-button-container"></div>
          ${tlfShouldShowEmailTestTools() ? '<button id="test-email-btn" class="test-email-btn" type="button">Send Test Order Email</button>' : ""}
        </div>
      </div>
    </div>`;

  closeCheckoutDrawer();

  const testEmailBtn = document.getElementById("test-email-btn");
  if (testEmailBtn) {
    testEmailBtn.addEventListener("click", async () => {
      testEmailBtn.disabled = true;
      await window.testOrderNotification();
      testEmailBtn.disabled = false;
    });
  }

  const buttonContainer = document.getElementById("paypal-button-container");
  if (!buttonContainer) return;

  if (typeof paypal === "undefined") {
    buttonContainer.innerHTML = "<p>PayPal is currently unavailable.</p>";
    return;
  }

  paypal.Buttons({
    style: { color: "white", shape: "pill", layout: "vertical", tagline: false },
    createOrder: async () => {
      const result = await tlfPostJson("/api/create-paypal-order", { order: orderPreview });
      tlfSavePendingSession({
        sessionToken: result.sessionToken,
        orderID: result.orderID
      });
      return result.orderID;
    },
    onApprove: async (data) => {
      buttonContainer.style.pointerEvents = "none";

      try {
        const pending = tlfLoadPendingSession();
        if (!pending?.sessionToken || pending.orderID !== data.orderID) {
          throw new Error("Secure checkout session was missing. Please try again.");
        }

        const result = await tlfPostJson("/api/capture-paypal-order", {
          sessionToken: pending.sessionToken,
          orderID: data.orderID
        });

        tlfClearPendingSession();
        tlfResetCartState();
        alert(`Payment confirmed and order email sent.\n\nPayPal order: ${result.orderID}\nTotal: ${result.totalFormatted}`);
      } catch (error) {
        console.error("PayPal capture or email failed:", error);
        alert(error.message || "Payment was approved, but order confirmation could not be completed.");
      } finally {
        buttonContainer.style.pointerEvents = "";
      }
    },
    onError: (error) => {
      console.error("PayPal error:", error);
      alert("PayPal payment could not be initialized. Please try again.");
    },
    onCancel: () => {
      tlfClearPendingSession();
    }
  }).render("#paypal-button-container");
};

showPrePayConfirmation = window.showPrePayConfirmation;
testOrderNotification = window.testOrderNotification;
