require("dotenv").config();

const express = require("express");
const app = express();

require("./db/db");

const userController = require("./controllers/userController");
const customerController = require("./controllers/customerController");
const itemController = require("./controllers/itemController");
const invoiceController = require("./controllers/invoiceController");
const paymentController = require("./controllers/paymentController");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// View Engine
app.engine("html", require("ejs").renderFile);

// Routes
app.use("/user", userController);
app.use("/customer", customerController);
app.use("/item", itemController);
app.use("/invoice", invoiceController);
app.use("/payment", paymentController);

// Server
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});