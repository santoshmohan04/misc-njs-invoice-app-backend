const mongoose = require("mongoose");
const Schema = mongoose.Schema
const _ = require("lodash")

const PaymentSchema = new Schema({
    merchant: {
        type: Schema.ObjectId,
        ref: 'User',
        required: false,
        index: true,
    },
    invoice: {
        type: Schema.ObjectId,
        ref: 'Invoice',
        required: true,
        unique: true,
    },
    status: {
        type: String,
        default: 'pending',
        required: true,
        set: (value) => {
            if (value === true) {
                return 'completed';
            }
            if (value === false) {
                return 'pending';
            }
            return value;
        }
    },
    amount: {
        min: 0,
        type: Number,
        required: false,
    },
    currency: {
        type: String,
        trim: true,
        default: 'usd',
    },
    method: {
        type: String,
        trim: true,
        default: 'card',
    },
    paid_on: {
        type: Date,
        required: false,
        default: Date.now
    },
    amount_paid: {
        min: 0,
        type: Number,
        required: true,
    },
    amount_due: {
        min: 0,
        type: Number,
        required: true,
    },
    stripePaymentIntentId: {
        type: String,
        required: false,
        index: true,
    },
    lastWebhookEventId: {
        type: String,
        required: false,
        index: true,
    },
    processedAt: {
        type: Date,
        required: false,
    },
    refundedAt: {
        type: Date,
        required: false,
    },

}, { timestamps: true })

PaymentSchema.index({ merchant: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

PaymentSchema.methods.toJSON = function () {
    const item = this;
    const itemObject = item.toObject();
    return _.pick(itemObject, ["_id", "merchant", "invoice", "status", "amount", "currency", "method", "paid_on", "amount_paid", "amount_due", "stripePaymentIntentId", "processedAt", "refundedAt", "createdAt", "updatedAt"]);
}

const Payment = mongoose.model('Payment', PaymentSchema, 'payments')

module.exports = {Payment};
