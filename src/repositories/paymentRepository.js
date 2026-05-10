/**
 * Payment Repository
 * Handles all database operations related to payments
 */

const { Payment } = require('../../models/payment');
const BaseRepository = require('./baseRepository');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  /**
   * Find payments by merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByMerchant(merchantId, options = {}) {
    const query = { merchant: merchantId };
    return await this.find(query, {
      ...options,
      populate: options.populate || ['invoice']
    });
  }

  /**
   * Find payment by invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Payment document
   */
  async findByInvoice(invoiceId) {
    return await this.findOne({ invoice: invoiceId });
  }

  /**
   * Get payment statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(merchantId) {
    const pipeline = [
      { $match: { merchant: require('mongoose').Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', '$amount_paid'] } },
          successfulPayments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0
              ]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'failed'] },
                1,
                0
              ]
            }
          },
          refundedPayments: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'refunded'] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    return result[0] || {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
    };
  }

  async analyticsByDateRange(merchantId, startDate, endDate) {
    const match = {
      merchant: require('mongoose').Types.ObjectId(merchantId),
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) {
        match.createdAt.$gte = startDate;
      }
      if (endDate) {
        match.createdAt.$lte = endDate;
      }
    }

    return this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', '$amount_paid'] } },
        },
      },
    ]);
  }

  /**
   * Find payments by status
   * @param {string} status - Payment status
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByStatus(status, merchantId, options = {}) {
    const query = { status, merchant: merchantId };
    return await this.find(query, options);
  }

  /**
   * Find payments within date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByDateRange(startDate, endDate, merchantId, options = {}) {
    const query = {
      merchant: merchantId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    return await this.find(query, options);
  }
}

module.exports = new PaymentRepository();