process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/invoice-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-1234567890';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@example.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS || 'test-password';
