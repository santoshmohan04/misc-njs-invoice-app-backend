const express = require("express");
const router = express.Router();
const { Item } = require("../models/item");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/itemValidations");
const asyncHandler = require("../src/helpers/asyncHandler");
const { sendSuccess } = require("../src/helpers/responseHelper");

/**
 * Edit item information
 * POST /item/edit
 */
router.post("/edit", authenticate, validate(editSchema), asyncHandler(async (req, res) => {
  const query = {
    name: req.body.name,
    merchant: req.user._id
  };

  const itemData = {
    $set: {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      merchant: req.user._id
    }
  };

  const options = {
    upsert: true,
    new: true
  };

  const item = await Item.findOneAndUpdate(query, itemData, options);

  return sendSuccess(res, { item }, "Item updated successfully");
}));

/**
 * Get all items for the authenticated merchant
 * GET /item/all
 */
router.get("/all", authenticate, asyncHandler(async (req, res) => {
  const query = {
    merchant: req.user._id
  };

  const items = await Item.find(query);

  return sendSuccess(res, { items }, "Items retrieved successfully");
}));

module.exports = router;
