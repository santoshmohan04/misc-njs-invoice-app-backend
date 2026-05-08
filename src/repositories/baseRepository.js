/**
 * Base Repository Class
 * Provides common database operations for all models
 */

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Found document
   */
  async findById(id) {
    return await this.model.findById(id);
  }

  /**
   * Find one document by query
   * @param {Object} query - Query object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object>} Found document
   */
  async findOne(query, options = {}) {
    let queryBuilder = this.model.findOne(query);

    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach(pop => queryBuilder = queryBuilder.populate(pop));
      } else {
        queryBuilder = queryBuilder.populate(options.populate);
      }
    }

    if (options.select) {
      queryBuilder = queryBuilder.select(options.select);
    }

    return await queryBuilder;
  }

  /**
   * Find multiple documents
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async find(query = {}, options = {}) {
    let queryBuilder = this.model.find(query);

    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach(pop => queryBuilder = queryBuilder.populate(pop));
      } else {
        queryBuilder = queryBuilder.populate(options.populate);
      }
    }

    if (options.select) {
      queryBuilder = queryBuilder.select(options.select);
    }

    if (options.sort) {
      queryBuilder = queryBuilder.sort(options.sort);
    }

    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    if (options.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }

    return await queryBuilder;
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(data) {
    const document = new this.model(data);
    return await document.save();
  }

  /**
   * Update document by ID
   * @param {string} id - Document ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated document
   */
  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return await this.model.findByIdAndUpdate(id, updateData, options);
  }

  /**
   * Update one document
   * @param {Object} query - Query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateOne(query, updateData, options = { new: true, runValidators: true }) {
    return await this.model.updateOne(query, updateData, options);
  }

  /**
   * Update multiple documents
   * @param {Object} query - Query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(query, updateData, options = {}) {
    return await this.model.updateMany(query, updateData, options);
  }

  /**
   * Find one and update
   * @param {Object} query - Query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated document
   */
  async findOneAndUpdate(query, updateData, options = { new: true, runValidators: true }) {
    return await this.model.findOneAndUpdate(query, updateData, options);
  }

  /**
   * Delete document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Deleted document
   */
  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  /**
   * Delete one document
   * @param {Object} query - Query object
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(query) {
    return await this.model.deleteOne(query);
  }

  /**
   * Delete multiple documents
   * @param {Object} query - Query object
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(query) {
    return await this.model.deleteMany(query);
  }

  /**
   * Count documents
   * @param {Object} query - Query object
   * @returns {Promise<number>} Count
   */
  async count(query = {}) {
    return await this.model.countDocuments(query);
  }

  /**
   * Check if document exists
   * @param {Object} query - Query object
   * @returns {Promise<boolean>} Exists
   */
  async exists(query) {
    const count = await this.model.countDocuments(query).limit(1);
    return count > 0;
  }
}

module.exports = BaseRepository;