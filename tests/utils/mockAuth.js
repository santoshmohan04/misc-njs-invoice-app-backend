const createMockUser = (overrides = {}) => ({
  _id: '64a1b2c3d4e5f6a7b8c9d001',
  email: 'owner@example.com',
  name: 'Owner User',
  role: 'owner',
  permissions: [],
  toJSON() {
    return {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    };
  },
  ...overrides,
});

module.exports = {
  createMockUser,
};
