/**
 * Customer Service
 * Handles all business logic related to customers
 */

const customerRepository = require('../repositories/customerRepository');
const { createSuccessResponse, createErrorResponse } = require('../helpers/responseHelper');
const Logger = require('../utils/logger');

class CustomerService {
  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Customer creation result
   */
  static async create(customerData, merchantId) {
    try {
      Logger.info('Customer creation attempt', { merchantId, email: customerData.email });

      // Check if customer with this email already exists for this merchant
      const existingCustomer = await customerRepository.findByEmailAndMerchant(customerData.email, merchantId);
      if (existingCustomer) {
        return createErrorResponse('Customer with this email already exists', 409);
      }

      // Set merchant ID
      customerData.merchant = merchantId;

      const customer = await customerRepository.create(customerData);

      Logger.info('Customer created successfully', { customerId: customer._id, merchantId });

      return createSuccessResponse({ customer }, 'Customer created successfully');

    } catch (error) {
      Logger.error('Customer creation failed', {
        error: error.message,
        merchantId,
        customerData
      });

      if (error.code === 11000) {
        return createErrorResponse('Customer with this email already exists', 409);
      }

      return createErrorResponse('Customer creation failed', 400);
    }
  }

  /**
   * Get all customers for merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customers result
   */
  static async getAll(merchantId, options = {}) {
    try {
      Logger.info('Get all customers attempt', { merchantId });

      const customers = await customerRepository.findByMerchant(merchantId, options);

      Logger.info('Customers retrieved successfully', { merchantId, count: customers.length });

      return createSuccessResponse({ customers }, 'Customers retrieved successfully');

    } catch (error) {
      Logger.error('Get all customers failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve customers', 500);
    }
  }

  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Customer result
   */
  static async getById(customerId, merchantId) {
    try {
      Logger.info('Get customer by ID attempt', { customerId, merchantId });

      const customer = await customerRepository.findById(customerId);

      if (!customer || customer.merchant.toString() !== merchantId) {
        return createErrorResponse('Customer not found', 404);
      }

      Logger.info('Customer retrieved successfully', { customerId, merchantId });

      return createSuccessResponse({ customer }, 'Customer retrieved successfully');

    } catch (error) {
      Logger.error('Get customer by ID failed', { error: error.message, customerId, merchantId });
      return createErrorResponse('Failed to retrieve customer', 500);
    }
  }

  /**
   * Update customer
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Update data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Update result
   */
  static async update(customerId, updateData, merchantId) {
    try {
      Logger.info('Customer update attempt', { customerId, merchantId });

      // Check if customer exists and belongs to merchant
      const existingCustomer = await customerRepository.findById(customerId);
      if (!existingCustomer || existingCustomer.merchant.toString() !== merchantId) {
        return createErrorResponse('Customer not found', 404);
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingCustomer.email) {
        const customerWithEmail = await customerRepository.findByEmailAndMerchant(updateData.email, merchantId);
        if (customerWithEmail) {
          return createErrorResponse('Customer with this email already exists', 409);
        }
      }

      const customer = await customerRepository.updateById(customerId, updateData, {
        new: true,
        runValidators: true
      });

      Logger.info('Customer updated successfully', { customerId, merchantId });

      return createSuccessResponse({ customer }, 'Customer updated successfully');

    } catch (error) {
      Logger.error('Customer update failed', {
        error: error.message,
        customerId,
        merchantId,
        updateData
      });
      return createErrorResponse('Customer update failed', 400);
    }
  }

  /**
   * Delete customer
   * @param {string} customerId - Customer ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Delete result
   */
  static async delete(customerId, merchantId) {
    try {
      Logger.info('Customer deletion attempt', { customerId, merchantId });

      // Check if customer exists and belongs to merchant
      const customer = await customerRepository.findById(customerId);
      if (!customer || customer.merchant.toString() !== merchantId) {
        return createErrorResponse('Customer not found', 404);
      }

      // Check if customer has any unpaid invoices
      const invoiceRepository = require('../repositories/invoiceRepository');
      const unpaidInvoices = await invoiceRepository.find({
        customer: customerId,
        payment: { $exists: false }
      });

      if (unpaidInvoices.length > 0) {
        return createErrorResponse('Cannot delete customer with unpaid invoices', 400);
      }

      await customerRepository.deleteById(customerId);

      Logger.info('Customer deleted successfully', { customerId, merchantId });

      return createSuccessResponse(null, 'Customer deleted successfully');

    } catch (error) {
      Logger.error('Customer deletion failed', { error: error.message, customerId, merchantId });
      return createErrorResponse('Customer deletion failed', 500);
    }
  }

  /**
   * Get customer statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics result
   */
  static async getStatistics(merchantId) {
    try {
      Logger.info('Get customer statistics attempt', { merchantId });

      const stats = await customerRepository.getStatistics(merchantId);

      Logger.info('Customer statistics retrieved', { merchantId, stats });

      return createSuccessResponse(stats, 'Customer statistics retrieved successfully');

    } catch (error) {
      Logger.error('Get customer statistics failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve statistics', 500);
    }
  }
}

module.exports = CustomerService;