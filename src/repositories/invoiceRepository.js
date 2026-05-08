/**
 * Invoice Repository
 * Handles all database operations related to invoices
 */

const { Invoice } = require('../../models/invoice');
const BaseRepository = require('./baseRepository');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  /**
   * Find invoices by merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of invoices
   */
  async findByMerchant(merchantId, options = {}) {
    const query = { merchant: merchantId };
    return await this.find(query, {
      ...options,
      populate: options.populate || ['payment']
    });
  }

  /**
   * Find invoice by number and merchant
   * @param {string} number - Invoice number
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Invoice document
   */
  async findByNumberAndMerchant(number, merchantId) {
    return await this.findOne({
      number,
      merchant: merchantId
    });
  }

  /**
   * Create or update invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created/updated invoice
   */
  async upsert(invoiceData) {
    const { number, customer, merchant } = invoiceData;

    const query = { number, customer, merchant };
    const updateData = {
      $set: {
        number: invoiceData.number,
        customer: invoiceData.customer,
        issued: invoiceData.issued,
        due: invoiceData.due,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount,
        total: invoiceData.total,
        payment: invoiceData.payment,
        merchant: invoiceData.merchant
      }
    };

    const options = {
      upsert: true,
      new: true,
      runValidators: true
    };

    return await this.model.findOneAndUpdate(query, updateData, options);
  }

  /**
   * Find invoice with populated data for PDF generation
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Invoice with populated customer and items
   */
  async findForPdfGeneration(paymentId) {
    const { Payment } = require('../../models/payment');

    const payment = await Payment.findOne({ _id: paymentId })
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

    return payment ? payment.invoice : null;
  }

  /**
   * Get invoice statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(merchantId) {
    const pipeline = [
      { $match: { merchant: require('mongoose').Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          paidAmount: {
            $sum: {
              $cond: [
                { $ifNull: ['$payment', false] },
                '$total',
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $ifNull: ['$payment', true] },
                '$total',
                0
              ]
            }
          }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    return result[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };
  }
}

module.exports = new InvoiceRepository();