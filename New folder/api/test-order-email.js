const {
  applyCors,
  normalizeOrder,
  readJsonBody,
  sendJson,
  sendOrderNotification
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
    const order = normalizeOrder({
      ...body.order,
      isTest: true
    });

    await sendOrderNotification(order, {
      orderId: "TEST-ORDER",
      captureId: `TEST-${Date.now()}`
    });

    sendJson(res, 200, {
      ok: true,
      customerEmail: order.customerEmail,
      notificationEmail: order.notificationEmail || ""
    });
  } catch (error) {
    console.error("test-order-email failed:", error);
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Test order email failed."
    });
  }
};
