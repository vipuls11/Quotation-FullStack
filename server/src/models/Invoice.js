import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  // gstRate: {
  //   type: Number,
  //   required: true,
  //   min: 0,
  // },
  hsnSac: {
    type: String,
    required: false,
  },
  unitArea: {
    type: Number,
    required: true,
    min: 0,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    customerGstNo: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [itemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one item is required",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    finalAmountGSt:{
      type: Number,
      required: true,
      min: 0,
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNo: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;