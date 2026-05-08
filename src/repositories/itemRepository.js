/**
 * Item Repository
 * Handles all database operations related to items
 */

const { Item } = require('../../models/item');
const BaseRepository = require('./baseRepository');

class ItemRepository extends BaseRepository {
  constructor() {
    super(Item);
  }

  /**
   * Find items by merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of items
   */
  async findByMerchant(merchantId, options = {}) {
    const query = { merchant: merchantId };
    return await this.find(query, options);
  }

  /**
   * Find item by name and merchant
   * @param {string} name - Item name
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Item document
   */
  async findByNameAndMerchant(name, merchantId) {
    return await this.findOne({
      name,
      merchant: merchantId
    });
  }

  /**
   * Search items by name or description
   * @param {string} searchTerm - Search term
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matching items
   */
  async search(searchTerm, merchantId, options = {}) {
    const query = {
      merchant: merchantId,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await this.find(query, options);
  }

  /**
   * Get items by category
   * @param {string} category - Item category
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of items in category
   */
  async findByCategory(category, merchantId, options = {}) {
    const query = { category, merchant: merchantId };
    return await this.find(query, options);
  }
}

module.exports = new ItemRepository();