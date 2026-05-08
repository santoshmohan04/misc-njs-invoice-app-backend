/**
 * Customer Repository
 * Handles all database operations related to customers
 */

const { Customer } = require('../../models/customer');
const BaseRepository = require('./baseRepository');

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  /**
   * Find customers by merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of customers
   */
  async findByMerchant(merchantId, options = {}) {
    const query = { merchant: merchantId };
    return await this.find(query, options);
  }

  /**
   * Find customer by email and merchant
   * @param {string} email - Customer email
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Customer document
   */
  async findByEmailAndMerchant(email, merchantId) {
    return await this.findOne({
      email,
      merchant: merchantId
    });
  }

  /**
   * Increment customer invoice count and total
   * @param {string} customerId - Customer ID
   * @param {number} invoiceTotal - Invoice total amount
   * @returns {Promise<Object>} Updated customer
   */
  async incrementInvoiceCount(customerId, invoiceTotal) {
    return await this.updateById(customerId, {
      $inc: {
        number_invoices: 1,
        total: invoiceTotal
      }
    });
  }

  /**
   * Get customer statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(merchantId) {
    const pipeline = [
      { $match: { merchant: require('mongoose').Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageRevenue: { $avg: '$total' }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    return result[0] || {
      totalCustomers: 0,
      totalRevenue: 0,
      averageRevenue: 0
    };
  }
}

module.exports = new CustomerRepository();