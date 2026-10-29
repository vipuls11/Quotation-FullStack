import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";

const postInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      name,
      date,
      customerGstNo,
      state,
      items,
      totalAmount,
      finalAmountGSt
    } = req.body;
console.log(
req.body,"vipul")
    if (
      !invoiceNo ||
      !name ||
      !date ||
      !customerGstNo ||
      !state ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Please provide all invoice details and at least one item",
      });
    }

    const calculatedItems = items.map((item) => {
      const unitArea = Number(item.unitArea);
      const rate = Number(item.rate);
      // const gstRate = Number(item.gstRate);

      if (
        !Number.isFinite(unitArea) ||
        !Number.isFinite(rate) ||
   //     // !Number.isFinite(gstRate) ||
        unitArea < 0 ||
        rate < 0 
        // gstRate < 0
      ) {
        throw new Error("Invalid numeric item values");
      }

      return {
        description: item.description,
        // gstRate,
        hsnSac: item.hsnSac,
        unitArea,
        rate,
        amount: Number((unitArea * rate).toFixed(2)),
      };
    });

    const computedTotalAmount = Number(
      calculatedItems
        .reduce((sum, item) => sum + item.amount, 0)
        .toFixed(2)
    );

    const normalizedTotalAmount = Number.isFinite(Number(totalAmount))
      ? Number(totalAmount)
      : computedTotalAmount;

    const normalizedFinalAmountGSt = Number.isFinite(Number(finalAmountGSt))
      ? Number(finalAmountGSt)
      : Number((normalizedTotalAmount * 1.18).toFixed(2));

    const invoice = await Invoice.create({
      invoiceNo,
      name,
      date,
      customerGstNo,
      state,
      items: calculatedItems,
      totalAmount: normalizedTotalAmount,
      finalAmountGSt: normalizedFinalAmountGSt,
    });

    return res.status(201).json({
      message: "Invoice saved successfully",
      invoice,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Invoice number already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(400).json({
      message: error.message || "Unable to save invoice",
    });
  }
};

const fetchInvoice = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({
      createdAt: -1,
    });

    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch invoices",
    });
  }
};

const fetchoneInvoiceById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch invoice",
    });
  }
};



const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      invoiceNo,
      name,
      date,
      customerGstNo,
      state,
      items,
      totalAmount,
      finalAmountGSt
    } = req.body;

    // Validate required fields
    if (
      !invoiceNo ||
      !name ||
      !date ||
      !customerGstNo ||
      !state ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please provide all invoice details and at least one item",
      });
    }

    // Calculate item amounts
    const calculatedItems = items.map((item) => {
      const unitArea = Number(item.unitArea);
      const rate = Number(item.rate);
      // const gstRate = Number(item.gstRate);

      if (
        !Number.isFinite(unitArea) ||
        !Number.isFinite(rate) ||
       // // !Number.isFinite(gstRate) ||
        unitArea < 0 ||
        rate < 0
        // gstRate < 0
      ) {
        throw new Error("Invalid numeric item values");
      }

      return {
        description: item.description,
        hsnSac: item.hsnSac,
        unitArea,
        rate,
        // gstRate,
        amount: Number((unitArea * rate).toFixed(2)),
      };
    });

    // Calculate total amount
    const computedTotalAmount = Number(
      calculatedItems
        .reduce((sum, item) => sum + item.amount, 0)
        .toFixed(2)
    );

    const finalTotalAmount = Number.isFinite(Number(totalAmount))
      ? Number(totalAmount)
      : computedTotalAmount;

    const finalTotalGStAmount = Number.isFinite(Number(finalAmountGSt))
      ? Number(finalAmountGSt)
      : Number((finalTotalAmount * 1.18).toFixed(2));

    // Update invoice in database
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      {
        invoiceNo,
        name,
        date,
        customerGstNo,
        state,
        items: calculatedItems,
        totalAmount: finalTotalAmount,
        finalAmountGSt: finalTotalGStAmount,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Invoice number already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid invoice ID or field value",
      });
    }

    if (error.message === "Invalid numeric item values") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Error updating invoice:", error);

    return res.status(500).json({
      message: "Unable to update invoice",
    });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.json({
      message: "Invoice deleted successfully",
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete invoice",
    });
  }
};

export {
  fetchInvoice,
  fetchoneInvoiceById,
  postInvoice,
  updateInvoice,
  deleteInvoice,
};