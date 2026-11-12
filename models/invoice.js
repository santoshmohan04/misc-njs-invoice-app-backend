const mongoose = require("mongoose");
const Schema = mongoose.Schema
const _ = require("lodash")
const { Payment } = require("./payment");

const InvoiceSchema = new Schema({
    number: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        minlength: 8
    },
    merchant: {
        type: Schema.ObjectId,
        required: true,
        ref: 'User'
    },
    customer: {
        type: Schema.ObjectId,
        required: true,
        ref: 'Customer'
    },
    issued: {
        type: Date,
        required: true,
        default: Date.now
    },
    due: {
        type: Date,
        required: true,
        default: Date.now
    },
    items: [{
        item: {
            type: Schema.ObjectId,
            required: true,
            ref: 'Item'
        },
        quantity: {
            type: Number,
            min: 0,
            required: true,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        subtotal: {
            min: 0,
            type: Number,
            required: true,
        }
    }],
    subtotal: {
        min: 0,
        type: Number,
        required: true,
    },
    discount: {
        min: 0,
        type: Number,
        required: true,
    },
    total: {
        min: 0,
        type: Number,
        required: true,
    },
    payment: {
        type: Schema.ObjectId,
        ref: 'Payment',
        required: false,
    }
})

InvoiceSchema.index({number: 1, customer: 1}, {unique: true});

InvoiceSchema.virtual('payment', {
    ref: Payment,
    localField: '_id',
    foreignField: 'invoice',
    justOne: true,
});

InvoiceSchema.methods.toJSON = function () {
    const item = this;
    const itemObject = item.toObject({ virtuals: true });
    return _.pick(itemObject, ["_id", "number", "customer", "issued", "due", "items", "subtotal", "discount", "total", "payment"]);
}

const Invoice = mongoose.model('Invoice', InvoiceSchema, 'invoices')

module.exports = {Invoice};
