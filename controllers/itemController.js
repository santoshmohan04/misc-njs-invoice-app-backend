const express = require("express");
const router = express.Router();
const { Item } = require("../models/item");
const { authenticate } = require("../src/middlewares/authenticate");
const validate = require("../src/middlewares/validate");
const { editSchema } = require("../src/validations/itemValidations");

/**
 * Edit item information
 * POST /item/edit
 */
router.post("/edit", authenticate, validate(editSchema), async (req, res) => {
  try {
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

    res.json({
      success: true,
      message: "Item updated successfully",
      data: { item }
    });

  } catch (error) {
    console.error("Item edit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during item update"
    });
  }
});

/**
 * Get all items for the authenticated merchant
 * GET /item/all
 */
router.get("/all", authenticate, async (req, res) => {
  try {
    const query = {
      merchant: req.user._id
    };

    const items = await Item.find(query);

    res.json({
      success: true,
      message: "Items retrieved successfully",
      data: { items }
    });

  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving items"
    });
  }
});

module.exports = router;
