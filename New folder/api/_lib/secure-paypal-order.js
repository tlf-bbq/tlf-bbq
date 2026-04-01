const crypto = require("crypto");

const PAYPAL_API_PRODUCTION = "https://api-m.paypal.com";
const PAYPAL_API_SANDBOX = "https://api-m.sandbox.paypal.com";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const ORDER_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 6;

function getEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function requireEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw Object.assign(new Error(`Missing required environment variable: ${name}`), { statusCode: 500 });
  }
  return value;
}

function getPayPalApiBase() {
  const explicitBase = getEnv("PAYPAL_API_BASE");
  if (explicitBase) return explicitBase.replace(/\/$/, "");
  return getEnv("PAYPAL_ENVIRONMENT").toLowerCase() === "production"
    ? PAYPAL_API_PRODUCTION
    : PAYPAL_API_SANDBOX;
}

function getAllowedOrigins() {
  return getEnv("FRONTEND_ORIGIN")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

function applyCors(req, res) {
  const configuredOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.origin || "";
  let allowOrigin = configuredOrigins[0] || "*";

  if (configuredOrigins.length > 0) {
    if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    } else if (requestOrigin) {
      throw Object.assign(new Error("Origin not allowed."), { statusCode: 403 });
    }
  } else if (requestOrigin) {
    allowOrigin = requestOrigin;
  }

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function sanitizeText(value, maxLength = 300) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toMoneyNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100) / 100;
}

function toMoneyCents(value) {
  return Math.round(toMoneyNumber(value) * 100);
}

function formatCurrency(value) {
  return `$${toMoneyNumber(value).toFixed(2)}`;
}

function normalizeItem(item) {
  return {
    name: sanitizeText(item?.name || "Item", 80),
    qty: Math.max(1, Math.round(Number(item?.qty) || 0)),
    price: toMoneyNumber(item?.price)
  };
}

function normalizeOrder(order = {}) {
  const items = Array.isArray(order.items) ? order.items.map(normalizeItem).filter(item => item.price >= 0) : [];
  const subtotal = toMoneyNumber(order.subtotal || items.reduce((sum, item) => sum + (item.price * item.qty), 0));
  const tip = toMoneyNumber(order.tip);
  const promo = toMoneyNumber(order.promo);
  const total = toMoneyNumber(order.total || Math.max(0, subtotal + tip - promo));

  const normalized = {
    name: sanitizeText(order.name, 80),
    phone: sanitizeText(order.phone, 40),
    customerEmail: sanitizeText(order.customerEmail, 160).toLowerCase(),
    notificationEmail: sanitizeText(order.notificationEmail, 160).toLowerCase(),
    pickupDate: sanitizeText(order.pickupDate, 40),
    pickupTime: sanitizeText(order.pickupTime, 40),
    notes: sanitizeText(order.notes, 500),
    items,
    subtotal,
    tip,
    promo,
    total,
    isTest: Boolean(order.isTest)
  };

  if (normalized.items.length === 0) {
    throw Object.assign(new Error("Cart is empty."), { statusCode: 400 });
  }

  if (!normalized.name || !normalized.phone || !normalized.customerEmail || !normalized.pickupDate || !normalized.pickupTime) {
    throw Object.assign(new Error("Missing required order fields."), { statusCode: 400 });
  }

  if (!isValidEmail(normalized.customerEmail)) {
    throw Object.assign(new Error("Customer email is invalid."), { statusCode: 400 });
  }

  if (normalized.notificationEmail && !isValidEmail(normalized.notificationEmail)) {
    throw Object.assign(new Error("Extra notification email is invalid."), { statusCode: 400 });
  }

  if (normalized.total <= 0) {
    throw Object.assign(new Error("Order total must be greater than zero."), { statusCode: 400 });
  }

  return normalized;
}

function createSignedSessionToken(payload) {
  const secret = requireEnv("ORDER_SIGNING_SECRET");
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySignedSessionToken(token) {
  const secret = requireEnv("ORDER_SIGNING_SECRET");
  const [encodedPayload, signature] = String(token || "").split(".");

  if (!encodedPayload || !signature) {
    throw Object.assign(new Error("Order session token is missing or invalid."), { statusCode: 400 });
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw Object.assign(new Error("Order session token failed verification."), { statusCode: 400 });
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

  if (!payload.createdAt || (Date.now() - Number(payload.createdAt)) > ORDER_TOKEN_MAX_AGE_MS) {
    throw Object.assign(new Error("Order session token expired."), { statusCode: 400 });
  }

  return payload;
}

async function getPayPalAccessToken() {
  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const clientSecret = requireEnv("PAYPAL_CLIENT_SECRET");
  const auth = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");

  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw Object.assign(new Error(data.error_description || "Could not get PayPal access token."), {
      statusCode: response.status || 502,
      details: data
    });
  }

  return data.access_token;
}

async function paypalRequest(path, options = {}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalApiBase()}${path}`, {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.idempotencyKey ? { "PayPal-Request-Id": options.idempotencyKey } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message
      || data.details?.map(detail => detail.description).filter(Boolean).join(" ")
      || `PayPal request failed with status ${response.status}.`;
    throw Object.assign(new Error(message), { statusCode: response.status || 502, details: data });
  }

  return data;
}

function buildPurchaseUnit(order) {
  return {
    amount: {
      currency_code: "USD",
      value: toMoneyNumber(order.total).toFixed(2),
      breakdown: {
        item_total: {
          currency_code: "USD",
          value: toMoneyNumber(order.subtotal).toFixed(2)
        },
        shipping: {
          currency_code: "USD",
          value: "0.00"
        },
        handling: {
          currency_code: "USD",
          value: toMoneyNumber(order.tip).toFixed(2)
        },
        discount: {
          currency_code: "USD",
          value: toMoneyNumber(order.promo).toFixed(2)
        }
      }
    },
    description: `TLF BBQ pickup for ${order.name}`,
    items: order.items.map(item => ({
      name: item.name,
      quantity: String(item.qty),
      unit_amount: {
        currency_code: "USD",
        value: toMoneyNumber(item.price).toFixed(2)
      }
    })),
    shipping: {
      name: {
        full_name: order.name
      },
      type: "PICKUP"
    },
    custom_id: crypto.randomUUID(),
    soft_descriptor: "TLFBBQ"
  };
}

async function createPayPalOrder(order) {
  const response = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    idempotencyKey: crypto.randomUUID(),
    body: {
      intent: "CAPTURE",
      purchase_units: [buildPurchaseUnit(order)],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "TLF BBQ",
            user_action: "PAY_NOW"
          }
        }
      }
    }
  });

  if (!response.id) {
    throw Object.assign(new Error("PayPal did not return an order ID."), { statusCode: 502, details: response });
  }

  return response;
}

async function capturePayPalOrder(orderId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    idempotencyKey: crypto.randomUUID(),
    body: {}
  });
}

function getCompletedCapture(capturePayload) {
  const purchaseUnits = Array.isArray(capturePayload?.purchase_units) ? capturePayload.purchase_units : [];
  for (const unit of purchaseUnits) {
    const captures = unit?.payments?.captures || [];
    const completed = captures.find(capture => capture.status === "COMPLETED");
    if (completed) return completed;
  }
  return null;
}

async function sendOrderNotification(order, payment = {}) {
  const accessKey = requireEnv("WEB3FORMS_ACCESS_KEY");
  const itemsList = order.items
    .map(item => `${item.qty}x ${item.name} - ${formatCurrency(item.price * item.qty)}`)
    .join("\n");
  const orderId = `TLF-${Date.now()}`;

  const response = await fetch(WEB3FORMS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `${order.isTest ? "TEST - " : ""}New BBQ Order - ${order.name}`,
      from_name: "TLF BBQ Online Orders",
      name: order.name,
      phone: order.phone,
      email: order.customerEmail,
      replyto: order.customerEmail,
      ccemail: order.notificationEmail || undefined,
      items: itemsList,
      total: formatCurrency(order.total),
      pickup: `${order.pickupDate} ${order.pickupTime}`.trim(),
      notes: order.notes || "None",
      orderId,
      customerEmail: order.customerEmail,
      notificationEmail: order.notificationEmail || "None",
      paypalOrderId: payment.orderId || "N/A",
      paypalCaptureId: payment.captureId || "N/A",
      botcheck: ""
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const message = result.message || `Web3Forms request failed with status ${response.status}.`;
    throw Object.assign(new Error(message), { statusCode: response.status || 502, details: result });
  }

  return result;
}

module.exports = {
  applyCors,
  capturePayPalOrder,
  createPayPalOrder,
  createSignedSessionToken,
  formatCurrency,
  getCompletedCapture,
  normalizeOrder,
  readJsonBody,
  sendJson,
  sendOrderNotification,
  verifySignedSessionToken
};
