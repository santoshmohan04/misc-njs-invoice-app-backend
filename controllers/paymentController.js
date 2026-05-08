const express = require("express");
const { Payment } = require("../models/payment");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { newPaymentSchema, processPaymentSchema } = require("../src/validations/paymentValidations");
const asyncHandler = require("../src/helpers/asyncHandler");
const { sendSuccess, sendError } = require("../src/helpers/responseHelper");
const path = require("path");
const views = path.resolve("views");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

/**
 * Create new payment
 * POST /payment/new
 */
router.post("/new", authenticate, validate(newPaymentSchema), asyncHandler(async (req, res) => {
  const paymentData = {
    $set: {
      invoice: req.body.invoice,
      status: req.body.status,
      paid_on: req.body.paid_on,
      amount_paid: req.body.amount_paid,
      amount_due: req.body.amount_due,
      merchant: req.user._id
    },
  };

  const options = {
    upsert: true,
    new: true,
  };

  const payment = await Payment.findOneAndUpdate(
    { invoice: req.body.invoice },
    paymentData,
    options
  );

  return sendSuccess(res, { payment }, "Payment created successfully");
}));

/**
 * Serve payment page
 * GET /payment/id/:_id
 */
router.use("/id/:_id", express.static("views", { index: false }));
router.get("/id/:_id", asyncHandler(async (req, res) => {
  const _id = req.params._id;

  const payment = await Payment.findOne({ _id })
    .populate({
      path: "invoice",
      model: "Invoice",
      populate: {
        path: "merchant",
        model: "User",
      },
    });

  if (!payment) {
    return res.render(path.join(views, "404.html"));
  }

  if (payment.status) {
    return res.status(200).send("Invoice already paid.");
  }

  return res.render(path.join(views, "index.html"), {
    payment_id: payment._id,
    invoice_id: payment.invoice._id,
    currency: payment.invoice.merchant.base_currency,
    amount: payment.amount_due,
  });
}));

/**
 * Get Stripe public key
 * GET /payment/stripe-key
 */
router.get("/stripe-key", (req, res) => {
  return sendSuccess(res, {
    publicKey: process.env.STRIPE_PUBLIC_KEY
  });
});

/**
 * Process payment with Stripe
 * POST /payment/pay
 */
router.post("/pay", validate(processPaymentSchema), asyncHandler(async (req, res) => {
  const { token, payment_id, amount, currency } = req.body;

  if (!token) {
    return sendError(res, "Payment token is required", 400);
  }

  console.log("Processing payment:", { token: token.substring(0, 10) + "...", payment_id, amount, currency });

  // Create a charge with the token sent by the client
  const charge = await stripe.charges.create({
    amount: amount * 100, // Convert to cents
    currency: currency,
    source: token,
  });

  // Update payment status
  await Payment.updateOne(
    { _id: payment_id },
    {
      status: true,
      amount_due: 0,
      amount_paid: amount,
      paid_on: new Date(),
    }
  );

  return sendSuccess(res, { charge }, "Payment processed successfully");
}));

module.exports = router;
