/**
 * Item Service
 * Handles all business logic related to items
 */

const itemRepository = require('../repositories/itemRepository');
const { createSuccessResponse, createErrorResponse } = require('../helpers/responseHelper');
const Logger = require('../utils/logger');

class ItemService {
  /**
   * Create a new item
   * @param {Object} itemData - Item data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Item creation result
   */
  static async create(itemData, merchantId) {
    try {
      Logger.info('Item creation attempt', { merchantId, name: itemData.name });

      // Check if item with this name already exists for this merchant
      const existingItem = await itemRepository.findByNameAndMerchant(itemData.name, merchantId);
      if (existingItem) {
        return createErrorResponse('Item with this name already exists', 409);
      }

      // Set merchant ID
      itemData.merchant = merchantId;

      const item = await itemRepository.create(itemData);

      Logger.info('Item created successfully', { itemId: item._id, merchantId });

      return createSuccessResponse({ item }, 'Item created successfully');

    } catch (error) {
      Logger.error('Item creation failed', {
        error: error.message,
        merchantId,
        itemData
      });

      if (error.code === 11000) {
        return createErrorResponse('Item with this name already exists', 409);
      }

      return createErrorResponse('Item creation failed', 400);
    }
  }

  /**
   * Get all items for merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Items result
   */
  static async getAll(merchantId, options = {}) {
    try {
      Logger.info('Get all items attempt', { merchantId });

      const items = await itemRepository.findByMerchant(merchantId, options);

      Logger.info('Items retrieved successfully', { merchantId, count: items.length });

      return createSuccessResponse({ items }, 'Items retrieved successfully');

    } catch (error) {
      Logger.error('Get all items failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve items', 500);
    }
  }

  /**
   * Get item by ID
   * @param {string} itemId - Item ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Item result
   */
  static async getById(itemId, merchantId) {
    try {
      Logger.info('Get item by ID attempt', { itemId, merchantId });

      const item = await itemRepository.findById(itemId);

      if (!item || item.merchant.toString() !== merchantId) {
        return createErrorResponse('Item not found', 404);
      }

      Logger.info('Item retrieved successfully', { itemId, merchantId });

      return createSuccessResponse({ item }, 'Item retrieved successfully');

    } catch (error) {
      Logger.error('Get item by ID failed', { error: error.message, itemId, merchantId });
      return createErrorResponse('Failed to retrieve item', 500);
    }
  }

  /**
   * Update item
   * @param {string} itemId - Item ID
   * @param {Object} updateData - Update data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Update result
   */
  static async update(itemId, updateData, merchantId) {
    try {
      Logger.info('Item update attempt', { itemId, merchantId });

      // Check if item exists and belongs to merchant
      const existingItem = await itemRepository.findById(itemId);
      if (!existingItem || existingItem.merchant.toString() !== merchantId) {
        return createErrorResponse('Item not found', 404);
      }

      // Check name uniqueness if name is being updated
      if (updateData.name && updateData.name !== existingItem.name) {
        const itemWithName = await itemRepository.findByNameAndMerchant(updateData.name, merchantId);
        if (itemWithName) {
          return createErrorResponse('Item with this name already exists', 409);
        }
      }

      const item = await itemRepository.updateById(itemId, updateData, {
        new: true,
        runValidators: true
      });

      Logger.info('Item updated successfully', { itemId, merchantId });

      return createSuccessResponse({ item }, 'Item updated successfully');

    } catch (error) {
      Logger.error('Item update failed', {
        error: error.message,
        itemId,
        merchantId,
        updateData
      });
      return createErrorResponse('Item update failed', 400);
    }
  }

  /**
   * Delete item
   * @param {string} itemId - Item ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Delete result
   */
  static async delete(itemId, merchantId) {
    try {
      Logger.info('Item deletion attempt', { itemId, merchantId });

      // Check if item exists and belongs to merchant
      const item = await itemRepository.findById(itemId);
      if (!item || item.merchant.toString() !== merchantId) {
        return createErrorResponse('Item not found', 404);
      }

      // Check if item is used in any invoices
      const invoiceRepository = require('../repositories/invoiceRepository');
      const invoicesWithItem = await invoiceRepository.find({
        merchant: merchantId,
        'items.item': itemId
      });

      if (invoicesWithItem.length > 0) {
        return createErrorResponse('Cannot delete item that is used in invoices', 400);
      }

      await itemRepository.deleteById(itemId);

      Logger.info('Item deleted successfully', { itemId, merchantId });

      return createSuccessResponse(null, 'Item deleted successfully');

    } catch (error) {
      Logger.error('Item deletion failed', { error: error.message, itemId, merchantId });
      return createErrorResponse('Item deletion failed', 500);
    }
  }

  /**
   * Search items
   * @param {string} searchTerm - Search term
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search result
   */
  static async search(searchTerm, merchantId, options = {}) {
    try {
      Logger.info('Item search attempt', { merchantId, searchTerm });

      const items = await itemRepository.search(searchTerm, merchantId, options);

      Logger.info('Item search completed', { merchantId, searchTerm, count: items.length });

      return createSuccessResponse({ items }, 'Items found successfully');

    } catch (error) {
      Logger.error('Item search failed', { error: error.message, merchantId, searchTerm });
      return createErrorResponse('Search failed', 500);
    }
  }

  /**
   * Get items by category
   * @param {string} category - Category
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Items result
   */
  static async getByCategory(category, merchantId, options = {}) {
    try {
      Logger.info('Get items by category attempt', { merchantId, category });

      const items = await itemRepository.findByCategory(category, merchantId, options);

      Logger.info('Items by category retrieved', { merchantId, category, count: items.length });

      return createSuccessResponse({ items }, 'Items retrieved successfully');

    } catch (error) {
      Logger.error('Get items by category failed', { error: error.message, merchantId, category });
      return createErrorResponse('Failed to retrieve items', 500);
    }
  }
}

module.exports = ItemService;