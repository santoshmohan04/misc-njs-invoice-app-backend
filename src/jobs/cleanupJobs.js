const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const Logger = require('../utils/logger');

let started = false;

const cleanupOldAttachments = async () => {
  const attachmentsPath = path.resolve('attachments');
  try {
    const files = await fs.promises.readdir(attachmentsPath);
    const cutoff = Date.now() - (1000 * 60 * 60);
    await Promise.all(
      files
        .filter((file) => file.endsWith('.pdf'))
        .map(async (file) => {
          const fullPath = path.join(attachmentsPath, file);
          const stat = await fs.promises.stat(fullPath);
          if (stat.mtimeMs < cutoff) {
            await fs.promises.unlink(fullPath);
          }
        })
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      Logger.error('jobs.cleanup.attachments.failed', { error: error.message });
    }
  }
};

const startJobs = () => {
  if (started || process.env.NODE_ENV === 'test') {
    return;
  }

  started = true;

  // Every hour: clean revoked/expired refresh tokens.
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await refreshTokenRepository.removeExpiredRevoked();
      Logger.info('jobs.cleanup.refresh_tokens.completed', { deleted: result.deletedCount || 0 });
    } catch (error) {
      Logger.error('jobs.cleanup.refresh_tokens.failed', { error: error.message });
    }
  });

  // Every 30 minutes: remove stale generated PDFs.
  cron.schedule('*/30 * * * *', async () => {
    await cleanupOldAttachments();
  });

  Logger.info('Background cleanup jobs started');
};

module.exports = {
  startJobs,
};
