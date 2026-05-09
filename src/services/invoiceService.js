/**
 * Invoice Service
 * Handles all business logic related to invoices
 */

const invoiceRepository = require('../repositories/invoiceRepository');
const customerRepository = require('../repositories/customerRepository');
const { createSuccessResponse, createErrorResponse } = require('../helpers/responseHelper');
const Logger = require('../utils/logger');
const storage = require('../config/storage');
const AuditService = require('./auditService');

class InvoiceService {
  /**
   * Create or update invoice
   * @param {Object} invoiceData - Invoice data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Invoice result
   */
  static async createOrUpdate(invoiceData, merchantId) {
    try {
      Logger.info('Invoice create/update attempt', { merchantId, invoiceNumber: invoiceData.number });

      // Validate customer exists and belongs to merchant
      const customer = await customerRepository.findById(invoiceData.customer);
      if (!customer || customer.merchant.toString() !== merchantId) {
        return createErrorResponse('Customer not found', 404);
      }

      // Set merchant ID
      invoiceData.merchant = merchantId;

      const invoice = await invoiceRepository.upsert(invoiceData);

      // If this is a new invoice, increment customer invoice count
      if (!invoice.lastErrorObject?.updatedExisting) {
        await customerRepository.incrementInvoiceCount(invoiceData.customer, invoiceData.total);
        Logger.info('New invoice created and customer count incremented', {
          invoiceId: invoice._id,
          customerId: invoiceData.customer
        });
      } else {
        Logger.info('Existing invoice updated', { invoiceId: invoice._id });
      }

      await AuditService.log({
        actorId: merchantId,
        action: invoice.lastErrorObject?.updatedExisting ? 'invoice.update' : 'invoice.create',
        entityType: 'invoice',
        entityId: invoice._id.toString(),
        metadata: { number: invoice.number, customer: invoiceData.customer },
      });

      return createSuccessResponse({ invoice }, 'Invoice updated successfully');

    } catch (error) {
      Logger.error('Invoice create/update failed', {
        error: error.message,
        merchantId,
        invoiceData
      });
      return createErrorResponse('Invoice update failed', 400);
    }
  }

  /**
   * Get all invoices for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Invoices result
   */
  static async getAll(merchantId) {
    try {
      Logger.info('Get all invoices attempt', { merchantId });

      const invoices = await invoiceRepository.findByMerchant(merchantId);

      Logger.info('Invoices retrieved successfully', { merchantId, count: invoices.length });

      return createSuccessResponse({ invoices }, 'Invoices retrieved successfully');

    } catch (error) {
      Logger.error('Get all invoices failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve invoices', 500);
    }
  }

  /**
   * Get invoice statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics result
   */
  static async getStatistics(merchantId) {
    try {
      Logger.info('Get invoice statistics attempt', { merchantId });

      const stats = await invoiceRepository.getStatistics(merchantId);

      Logger.info('Invoice statistics retrieved', { merchantId, stats });

      return createSuccessResponse(stats, 'Invoice statistics retrieved successfully');

    } catch (error) {
      Logger.error('Get invoice statistics failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve statistics', 500);
    }
  }

  /**
   * Generate PDF invoice
   * @param {string} paymentId - Payment ID
   * @param {Object} user - Merchant user object
   * @returns {Promise<Object>} PDF generation result
   */
  static async generatePdf(paymentId, user) {
    try {
      Logger.info('PDF generation attempt', { paymentId, userId: user._id });

      const invoice = await invoiceRepository.findForPdfGeneration(paymentId);

      if (!invoice) {
        return createErrorResponse('Payment not found', 404);
      }

      // Generate PDF using pdf-invoice library
      const pdfInvoice = require('pdf-invoice');
      const fs = require('fs');

      const document = pdfInvoice({
        company: {
          phone: user.phone,
          email: user.email,
          address: user.address,
          name: user.name,
        },
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
        },
        items: invoice.items.map((item) => ({
          amount: item.subtotal,
          name: item.item.name,
          description: item.item.description,
          quantity: item.quantity,
        })),
      });

      // Generate and save PDF
      document.generate();
      const outputPath = await storage.createTempPdfPath('invoice');
      const writeStream = fs.createWriteStream(outputPath);

      await new Promise((resolve, reject) => {
        document.pdfkitDoc.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      Logger.info('PDF generated successfully', { paymentId, outputPath });

      return createSuccessResponse({ pdfPath: outputPath }, 'PDF generated successfully');

    } catch (error) {
      Logger.error('PDF generation failed', { error: error.message, paymentId });
      return createErrorResponse('PDF generation failed', 500);
    }
  }

  /**
   * Send invoice via email
   * @param {string} paymentId - Payment ID
   * @param {Object} user - Merchant user object
   * @param {string} baseUrl - Base URL for payment link
   * @returns {Promise<Object>} Email sending result
   */
  static async sendByEmail(paymentId, user, baseUrl) {
    try {
      Logger.info('Email sending attempt', { paymentId, userId: user._id });

      // Generate PDF first
      const pdfResult = await this.generatePdf(paymentId, user);
      if (!pdfResult.success) {
        return pdfResult;
      }

      const invoice = await invoiceRepository.findForPdfGeneration(paymentId);
      const fullUrl = `${baseUrl}/payment/id/${paymentId}`;

      // Configure email transporter
      const nodemailer = require('nodemailer');
      const config = require('../config/config');

      const transporter = nodemailer.createTransporter({
        service: config.email.service,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });

      const mailOptions = {
        from: config.email.from,
        to: invoice.customer.email,
        subject: `Invoice number ${invoice.number}`,
        text: `Pay your latest invoice here ${fullUrl}`,
        attachments: [
          {
            filename: 'invoice.pdf',
            path: pdfResult.data.pdfPath,
            contentType: 'application/pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      await storage.cleanupFile(pdfResult.data.pdfPath);

      Logger.info('Invoice email sent successfully', { paymentId, customerEmail: invoice.customer.email });

      return createSuccessResponse(null, 'Email sent successfully');

    } catch (error) {
      Logger.error('Email sending failed', { error: error.message, paymentId });
      return createErrorResponse('Email sending failed', 500);
    }
  }
}

module.exports = InvoiceService;