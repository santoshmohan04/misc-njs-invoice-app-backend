const express = require("express");
const router = express.Router();
const { Customer } = require("../models/customer");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/customerValidations");
const asyncHandler = require("../src/helpers/asyncHandler");
const { sendSuccess } = require("../src/helpers/responseHelper");

/**
 * Edit customer information
 * POST /customer/edit
 */
router.post("/edit", authenticate, validate(editSchema), asyncHandler(async (req, res) => {
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

  return sendSuccess(res, { customer }, "Customer updated successfully");
}));

/**
 * Get all customers for the authenticated merchant
 * GET /customer/all
 */
router.get("/all", authenticate, asyncHandler(async (req, res) => {
  const query = {
    merchant: req.user._id
  };

  const customers = await Customer.find(query);

  return sendSuccess(res, { customers }, "Customers retrieved successfully");
}));

module.exports = router;
