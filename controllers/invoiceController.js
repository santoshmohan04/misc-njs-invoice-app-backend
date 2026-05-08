const express = require("express");
const router = express.Router();
const { Invoice } = require("../models/invoice");
const { Customer } = require("../models/customer");
const { Payment } = require("../models/payment");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/invoiceValidations");
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
router.post("/edit", authenticate, validate(editSchema), async (req, res) => {
  try {
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

    // If this is a new invoice (not updated), increment customer invoice count
    if (!invoice.lastErrorObject?.updatedExisting) {
      await Customer.updateOne(
        { _id: req.body.customer },
        { $inc: { number_invoices: 1, total: req.body.total } }
      );
    }

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: { invoice }
    });

  } catch (error) {
    console.error("Invoice edit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during invoice update"
    });
  }
});

/**
 * Get all invoices for the authenticated merchant
 * GET /invoice/all
 */
router.get("/all", authenticate, async (req, res) => {
  try {
    const query = {
      merchant: req.user._id,
    };

    const invoices = await Invoice.find(query).populate("payment");

    res.json({
      success: true,
      message: "Invoices retrieved successfully",
      data: { invoices }
    });

  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving invoices"
    });
  }
});

/**
 * Send invoice via email
 * POST /invoice/send
 */
router.post("/send", authenticate, async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Generate PDF invoice
    await invoiceToPdf(req.user, payment.invoice);

    // Send email
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

    res.json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (error) {
    console.error("Send invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, email was not sent"
    });
  }
});

/**
 * Generate PDF invoice
 * @param {Object} user - Merchant user object
 * @param {Object} invoice - Invoice object with populated customer and items
 */
const invoiceToPdf = (user, invoice) => {
  return new Promise((resolve, reject) => {
    try {
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

      writeStream.on('finish', resolve);
      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = router;
        let mailOptions = {
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

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
            res.status(500).send("Something went wrong, email was not sent.");
          } else {
            console.log("Email sent: " + info.response);
            res.send("Email sent successfully");
          }
        });
      } else {
        throw Error;
      }
    })
    .catch((error) => {
      res.status(500).send("Something went wrong, email was not sent.");
    });
});

const invoiceToPdf = (user, invoice) => {
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
    items: invoice.items.map((i) => {
      return {
        amount: i.subtotal,
        name: i.item.name,
        description: i.item.description,
        quantity: i.quantity,
      };
    }),
  });
  console.log(
    invoice.items.map((i) => {
      return {
        amount: i.subtotal,
        name: i.item.name,
        description: i.item.description,
        quantity: i.quantity,
      };
    }),
  );
  const fs = require("fs");
  document.generate(); // triggers rendering
  document.pdfkitDoc.pipe(
    fs.createWriteStream(path.join(path.resolve("attachments"), "invoice.pdf")),
  );
};

module.exports = router;
