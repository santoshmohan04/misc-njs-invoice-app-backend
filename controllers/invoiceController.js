const express = require("express");
const router = express.Router();
const { Invoice } = require("../models/invoice");
const { Customer } = require("../models/customer");
const { Payment } = require("../models/payment");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/invoiceValidations");
const asyncHandler = require("../src/helpers/asyncHandler");
const { sendSuccess, sendError } = require("../src/helpers/responseHelper");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");

/**
 * Email transporter configuration
 */
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Edit invoice information
 * POST /invoice/edit
 */
router.post("/edit", authenticate, validate(editSchema), asyncHandler(async (req, res) => {
  const query = {
    number: req.body.number,
    customer: req.body.customer,
    merchant: req.user._id,
  };

  const invoiceData = {
    $set: {
      number: req.body.number,
      customer: req.body.customer,
      issued: req.body.issued,
      due: req.body.due,
      items: req.body.items,
      subtotal: req.body.subtotal,
      discount: req.body.discount,
      total: req.body.total,
      payment: req.body.payment,
      merchant: req.user._id
    },
  };

  const options = {
    upsert: true,
    new: true,
  };

  const invoice = await Invoice.findOneAndUpdate(query, invoiceData, options);

  // Keep customer totals in sync only when a new invoice record is created.
  if (!invoice.lastErrorObject?.updatedExisting) {
    await Customer.updateOne(
      { _id: req.body.customer },
      { $inc: { number_invoices: 1, total: req.body.total } }
    );
  }

  return sendSuccess(res, { invoice }, "Invoice updated successfully");
}));

/**
 * Get all invoices for the authenticated merchant
 * GET /invoice/all
 */
router.get("/all", authenticate, asyncHandler(async (req, res) => {
  const query = {
    merchant: req.user._id,
  };

  const invoices = await Invoice.find(query).populate("payment");

  return sendSuccess(res, { invoices }, "Invoices retrieved successfully");
}));

/**
 * Send invoice via email
 * POST /invoice/send
 */
router.post("/send", authenticate, asyncHandler(async (req, res) => {
  const query = {
    payment: req.body.payment,
  };

  const payment = await Payment.findOne(query)
    .populate({
      path: "invoice",
      model: "Invoice",
      populate: [
        {
          path: "customer",
          model: "Customer",
        },
        {
          path: "items.item",
          model: "Item",
        },
      ],
    });

  if (!payment) {
    return sendError(res, "Payment not found", 404);
  }

  // Keep the PDF generation and email flow sequential to avoid sending stale attachments.
  await invoiceToPdf(req.user, payment.invoice);

  const fullUrl = `${req.protocol}://${req.get("host")}/payment/id/${payment._id}`;

  const mailOptions = {
    from: "invoiceappserver@gmail.com",
    to: payment.invoice.customer.email,
    subject: `Invoice number ${payment.invoice.number}`,
    text: `Pay your latest invoice here ${fullUrl}`,
    attachments: [
      {
        filename: "invoice.pdf",
        path: path.join(path.resolve("attachments"), "invoice.pdf"),
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);

  return sendSuccess(res, null, "Email sent successfully");
}));

/**
 * Generate PDF invoice
 * @param {Object} user - Merchant user object
 * @param {Object} invoice - Invoice object with populated customer and items
 */
const invoiceToPdf = async (user, invoice) => {
  const pdfInvoice = require("pdf-invoice");

  const document = pdfInvoice({
    company: {
      phone: user.phone,
      email: user.email,
      address: user.address,
      name: user.name,
    },
    customer: {
      name: invoice.customer.name,
      email: invoice.customer.email,
    },
    items: invoice.items.map((i) => ({
      amount: i.subtotal,
      name: i.item.name,
      description: i.item.description,
      quantity: i.quantity,
    })),
  });

  document.generate(); // triggers rendering

  const outputPath = path.join(path.resolve("attachments"), "invoice.pdf");
  const writeStream = fs.createWriteStream(outputPath);
  document.pdfkitDoc.pipe(writeStream);

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
};

module.exports = router;
