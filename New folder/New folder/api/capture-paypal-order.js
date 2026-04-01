const {
  applyCors,
  capturePayPalOrder,
  formatCurrency,
  getCompletedCapture,
  readJsonBody,
  sendJson,
  sendOrderNotification,
  verifySignedSessionToken
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
    const session = verifySignedSessionToken(body.sessionToken);
    const incomingOrderId = String(body.orderID || "").trim();

    if (!incomingOrderId || incomingOrderId !== session.paypalOrderId) {
      sendJson(res, 400, { error: "PayPal order ID did not match the secure checkout session." });
      return;
    }

    const capturePayload = await capturePayPalOrder(session.paypalOrderId);
    const completedCapture = getCompletedCapture(capturePayload);

    if (!completedCapture) {
      sendJson(res, 409, { error: "PayPal payment is not completed yet." });
      return;
    }

    await sendOrderNotification(session.order, {
      orderId: session.paypalOrderId,
      captureId: completedCapture.id
    });

    sendJson(res, 200, {
      ok: true,
      orderID: session.paypalOrderId,
      captureID: completedCapture.id,
      total: session.order.total,
      totalFormatted: formatCurrency(session.order.total),
      customerEmail: session.order.customerEmail,
      notificationEmail: session.order.notificationEmail || ""
    });
  } catch (error) {
    console.error("capture-paypal-order failed:", error);
    sendJson(res, error.statusCode || 500, {
      error: error.message || "PayPal order could not be captured."
    });
  }
};
