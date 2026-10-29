import express from "express";
import {
  fetchInvoice,
  fetchoneInvoiceById,
  postInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/Invoice.Controller.js";

const router = express.Router();

router.post("/", postInvoice);
router.get("/", fetchInvoice);
router.get("/:id", fetchoneInvoiceById);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
