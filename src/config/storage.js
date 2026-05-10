const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const attachmentsDir = path.resolve('attachments');

const ensureAttachmentsDir = async () => {
  await fs.promises.mkdir(attachmentsDir, { recursive: true });
};

const createTempPdfPath = async (prefix = 'invoice') => {
  await ensureAttachmentsDir();
  const fileName = `${prefix}-${Date.now()}-${randomUUID()}.pdf`;
  return path.join(attachmentsDir, fileName);
};

const cleanupFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

module.exports = {
  createTempPdfPath,
  cleanupFile,
  attachmentsDir,
};
