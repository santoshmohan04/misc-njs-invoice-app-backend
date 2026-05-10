const mongoose = require('mongoose');
const { Invoice } = require('../../models/invoice');
const { Payment } = require('../../models/payment');
const { Customer } = require('../../models/customer');

class ReportingService {
  static buildDateMatch(startDate, endDate) {
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    return Object.keys(dateFilter).length ? dateFilter : null;
  }

  static async invoiceAging(merchantId, { startDate, endDate }) {
    const now = new Date();
    const match = { merchant: new mongoose.Types.ObjectId(merchantId) };
    const dateMatch = this.buildDateMatch(startDate, endDate);
    if (dateMatch) {
      match.issued = dateMatch;
    }

    return Invoice.aggregate([
      { $match: match },
      {
        $project: {
          total: 1,
          due: 1,
          agingBucket: {
            $switch: {
              branches: [
                { case: { $lt: ['$due', new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))] }, then: '90_plus' },
                { case: { $lt: ['$due', new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))] }, then: '61_90' },
                { case: { $lt: ['$due', new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))] }, then: '31_60' },
                { case: { $lt: ['$due', now] }, then: '1_30' },
              ],
              default: 'current',
            },
          },
        },
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]);
  }

  static async revenueAnalytics(merchantId, { startDate, endDate }) {
    const match = {
      merchant: new mongoose.Types.ObjectId(merchantId),
      status: 'completed',
    };
    const dateMatch = this.buildDateMatch(startDate, endDate);
    if (dateMatch) {
      match.createdAt = dateMatch;
    }

    return Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$amount', '$amount_paid'] } },
          count: { $sum: 1 },
          avgTicketSize: { $avg: { $ifNull: ['$amount', '$amount_paid'] } },
        },
      },
    ]);
  }

  static async paymentAnalytics(merchantId, { startDate, endDate }) {
    const match = {
      merchant: new mongoose.Types.ObjectId(merchantId),
    };
    const dateMatch = this.buildDateMatch(startDate, endDate);
    if (dateMatch) {
      match.createdAt = dateMatch;
    }

    return Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', '$amount_paid'] } },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  static async topCustomers(merchantId, { limit = 10, skip = 0 }) {
    return Customer.find({ merchant: merchantId })
      .sort({ total: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email total number_invoices');
  }

  static async monthlyTrends(merchantId, { startDate, endDate }) {
    const match = {
      merchant: new mongoose.Types.ObjectId(merchantId),
      status: 'completed',
    };
    const dateMatch = this.buildDateMatch(startDate, endDate);
    if (dateMatch) {
      match.createdAt = dateMatch;
    }

    return Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: { $ifNull: ['$amount', '$amount_paid'] } },
          payments: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  static async outstandingBalances(merchantId) {
    return Invoice.aggregate([
      {
        $match: {
          merchant: new mongoose.Types.ObjectId(merchantId),
          payment: { $exists: false },
        },
      },
      {
        $group: {
          _id: null,
          outstandingTotal: { $sum: '$total' },
          invoices: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = ReportingService;
