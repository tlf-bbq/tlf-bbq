const {
  applyCors,
  createPayPalOrder,
  createSignedSessionToken,
  normalizeOrder,
  readJsonBody,
  sendJson
} = require("./_lib/secure-paypal-order");

module.exports = async (req, res) => {
  try {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    const body = await readJsonBody(req);
    const order = normalizeOrder(body.order);
    const paypalOrder = await createPayPalOrder(order);

    const sessionToken = createSignedSessionToken({
      createdAt: Date.now(),
      paypalOrderId: paypalOrder.id,
      order
    });

    sendJson(res, 200, {
      orderID: paypalOrder.id,
      sessionToken
    });
  } catch (error) {
    console.error("create-paypal-order failed:", error);
    sendJson(res, error.statusCode || 500, {
      error: error.message || "PayPal order could not be created."
    });
  }
};
