const crypto = require('crypto');

class SessionService {
  static getDeviceInfo(req) {
    return req.get('User-Agent') || 'unknown-device';
  }

  static getIpAddress(req) {
    return req.ip || req.connection?.remoteAddress || null;
  }

  static createFingerprint(req) {
    const seed = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      this.getIpAddress(req) || '',
    ].join('|');

    return crypto.createHash('sha256').update(seed).digest('hex');
  }
}

module.exports = SessionService;
