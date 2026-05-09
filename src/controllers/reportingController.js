const express = require('express');
const router = express.Router();

const ReportingService = require('../services/reportingService');
const { authenticate } = require('../middlewares/authenticate');
const { authorizePermissions } = require('../middlewares/authorization');
const validate = require('../middlewares/validate');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const { paginationSchema, dateFilterSchema } = require('../validations/commonValidations');

router.get('/invoice-aging', authenticate, authorizePermissions('invoice:read'), validate(dateFilterSchema, 'query'), asyncHandler(async (req, res) => {
  const data = await ReportingService.invoiceAging(req.user._id, req.query);
  return sendSuccess(res, { buckets: data }, 'Invoice aging analytics generated');
}));

router.get('/revenue', authenticate, authorizePermissions('payment:read'), validate(dateFilterSchema, 'query'), asyncHandler(async (req, res) => {
  const data = await ReportingService.revenueAnalytics(req.user._id, req.query);
  return sendSuccess(res, { revenue: data[0] || { totalRevenue: 0, count: 0, avgTicketSize: 0 } }, 'Revenue analytics generated');
}));

router.get('/payments', authenticate, authorizePermissions('payment:read'), validate(dateFilterSchema, 'query'), asyncHandler(async (req, res) => {
  const data = await ReportingService.paymentAnalytics(req.user._id, req.query);
  return sendSuccess(res, { statuses: data }, 'Payment analytics generated');
}));

router.get('/top-customers', authenticate, authorizePermissions('customer:read'), validate(paginationSchema, 'query'), asyncHandler(async (req, res) => {
  const data = await ReportingService.topCustomers(req.user._id, req.query);
  return sendSuccess(res, { customers: data }, 'Top customers fetched');
}));

router.get('/monthly-trends', authenticate, authorizePermissions('payment:read'), validate(dateFilterSchema, 'query'), asyncHandler(async (req, res) => {
  const data = await ReportingService.monthlyTrends(req.user._id, req.query);
  return sendSuccess(res, { trends: data }, 'Monthly trends generated');
}));

router.get('/outstanding-balances', authenticate, authorizePermissions('invoice:read'), asyncHandler(async (req, res) => {
  const data = await ReportingService.outstandingBalances(req.user._id);
  return sendSuccess(res, { outstanding: data[0] || { outstandingTotal: 0, invoices: 0 } }, 'Outstanding balances generated');
}));

router.use((err, req, res, next) => {
  return sendError(res, err.message, err.statusCode || 500);
});

module.exports = router;
