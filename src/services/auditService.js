const { AuditLog } = require('../../models/auditLog');
const Logger = require('../utils/logger');

class AuditService {
  static async log(entry) {
    try {
      setImmediate(async () => {
        try {
          await AuditLog.create(entry);
        } catch (error) {
          Logger.error('audit.log.failed', { error: error.message, action: entry.action });
        }
      });
    } catch (error) {
      Logger.error('audit.queue.failed', { error: error.message });
    }
  }

  static async logRequestAction(req, payload) {
    return this.log({
      actorId: req.user ? req.user._id : null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      ...payload,
    });
  }
}

module.exports = AuditService;
