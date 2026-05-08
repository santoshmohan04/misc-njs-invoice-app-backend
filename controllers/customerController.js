const express = require("express");
const router = express.Router();
const { Customer } = require("../models/customer");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/customerValidations");

/**
 * Edit customer information
 * POST /customer/edit
 */
router.post("/edit", authenticate, validate(editSchema), async (req, res) => {
  try {
    const query = {
      email: req.body.email,
      merchant: req.user._id
    };

    const customerData = {
      $set: {
        name: req.body.name,
        email: req.body.email,
        company: req.body.company,
        phone: req.body.phone,
        mobile: req.body.mobile,
        merchant: req.user._id,
        addresses: req.body.addresses
      }
    };

    const options = {
      upsert: true,
      new: true
    };

    const customer = await Customer.findOneAndUpdate(query, customerData, options);

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: { customer }
    });

  } catch (error) {
    console.error("Customer edit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during customer update"
    });
  }
});

/**
 * Get all customers for the authenticated merchant
 * GET /customer/all
 */
router.get("/all", authenticate, async (req, res) => {
  try {
    const query = {
      merchant: req.user._id
    };

    const customers = await Customer.find(query);

    res.json({
      success: true,
      message: "Customers retrieved successfully",
      data: { customers }
    });

  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving customers"
    });
  }
});

module.exports = router;
