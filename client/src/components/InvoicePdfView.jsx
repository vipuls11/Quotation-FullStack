import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatAmount = (value) => `₹${Number(value || 0).toFixed(2)}`;

const makePdf = async (invoice) => {
  const doc = new jsPDF({ unit: "pt", format: "A4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const invoiceNo = invoice?.invoiceNo || "MR vibhuti sir ji";
  const invoiceDate = invoice?.date
    ? new Date(invoice.date).toLocaleDateString("en-GB")
    : "06/01/2026";
  const customerName = invoice?.name || "Vipul Vishwakarma";
  const customerGstNo = invoice?.customerGstNo || "27AIPG...";
  const stateCode = invoice?.state || "27";
  const totalAmount = Number(invoice?.totalAmount || 133000);
  const gst = (totalAmount * 18) / 100;
  const finalAmountGSt = Number(invoice?.finalAmountGSt || 133000);
  const totalInWords =
    invoice?.totalInWords || "One lakh thirty three thousand only";

  const rows =
    Array.isArray(invoice?.items) && invoice.items.length > 0
      ? invoice.items.map((item, index) => ({
          ...item,
          no: index + 1,
        }))
      : [];

  const tableBody = rows
    .map(
      (item, index) => `
        <tr>
          <td>${item.no ?? index + 1}</td>
          <td>${item.description ?? ""}</td>
          <td>${item.hsnSac || "-"}</td>
          <td>${item.unitArea ?? "-"}</td>
          <td>Rs ${Number(item.rate || 0).toFixed(2)}</td>
          <td>Rs ${Number(item.amount || 0).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <style>
      @page { margin: 0; size: A4; }

      html, body {
        margin: 0;
        padding: 0;
        font-family: 'Times New Roman', serif;
      }

      * {
        box-sizing: border-box;
      }

      .page {
        width: ${pageWidth}px;
        min-height: ${pageHeight}px;
        position: relative;
      }

      .sheet {
        position: relative;
        width: 100%;
        height: auto;
        min-height: 0;
        padding-bottom: 20px;
        background: #fff;
        color: #111;
      }

      .topline {
        text-align: center;
        font-size: 9px;
        color: #464646;
        margin-top: 18px;
        margin-bottom: 4px;
      }

      .brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px 0 18px;
        margin-top: 8px;
      }

      .brand-name {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.2;
        color: #c92f6d;
        font-style: italic;
        letter-spacing: 0.2px;
        text-align: center;
      }

      .brand-name span {
        font-size: 22px;
      }

      .contact {
        font-size: 8px;
        line-height: 1.3;
        color: #3a3a3a;
        text-align: left;
        margin-top: 2px;
      }

      .center-text {
        text-align: center;
        font-size: 8.8px;
        font-weight: 700;
        color: #3c3c3c;
        letter-spacing: 0.3px;
        margin-top: 16px;
      }

      .rule {
        height: 1px;
        background: #3d3d3d;
        margin: 6px 28px 0;
      }

      .service {
        text-align: center;
        font-size: 7.4px;
        color: #333;
        margin-top: 8px;
        line-height: 1.5;
      }

      .address {
        text-align: center;
        font-size: 7.4px;
        color: #333;
        margin-top: 8px;
        line-height: 1.5;
      }

      .invoice-box {
        border: 1px solid #171717;
        margin: 12px 24px 0;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        padding: 12px 24px 0;
        color: #111;
      }

      .name-line {
        border-bottom: 1px solid #444;
        margin: 6px 24px 0;
        height: 6px;
      }

      .theme {
        text-align: center;
        font-size: 9px;
        font-weight: 700;
        margin-top: 10px;
      }

      .gst-row {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        padding: 10px 24px 0;
      }

      .gst-box {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .field {
        font-weight: 700;
      }

      .value-line {
        flex: 1;
        border-bottom: 1px solid #4a4a4a;
        margin-left: 2px;
        min-height: 14px;
      }

      /* FIXED TABLE COLUMN ALIGNMENT */
      .invoice-table {
        width: calc(100% - 48px);
        margin: 10px 24px 0;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 7.3px;
        border-spacing: 0;
      }

      .invoice-table,
      .invoice-table th,
      .invoice-table td {
        border: 0.5px solid #000;
      }

      .invoice-table th,
      .invoice-table td {
        padding: 3px 4px;
        text-align: left;
        vertical-align: middle;
        box-sizing: border-box;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }

      /* All six columns use one shared width definition */
      .invoice-table col.col-sr {
        width: 5%;
      }

      .invoice-table col.col-description {
        width: 35%;
      }

      .invoice-table col.col-hsn {
        width: 12%;
      }

      .invoice-table col.col-unit {
        width: 12%;
      }

      .invoice-table col.col-rate {
        width: 16%;
      }

      .invoice-table col.col-amount {
        width: 20%;
      }

      .invoice-table thead th {
        background: #f0f0f0;
        font-weight: 700;
        height: 18px;
      }

      .invoice-table tbody td {
        min-height: 18px;
      }

      .invoice-table .note {
        font-weight: 700;
        font-size: 6.5px;
      }

      .invoice-table .summary-cell {
        font-weight: 700;
      }

      .invoice-table .words-cell {
        vertical-align: top;
      }

      .invoice-table .signature-cell {
        height: 45px;
        vertical-align: bottom;
      }

      .note {
        font-weight: 700;
        font-size: 6.5px;
      }

      .summary-row {
        border: 1px solid #222;
        margin: 0 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 8.5px;
        min-height: 22px;
        padding: 0 8px;
      }

      .summary-row .words {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .summary-row .total-text {
        font-weight: 700;
        margin-left: 10px;
      }

      .bottom-meta {
        display: flex;
        justify-content: space-between;
        font-size: 8.8px;
        padding: 16px 24px 0;
      }

      .bottom-meta .for-line {
        color: #c92f6d;
        font-style: italic;
      }

      .bottom-meta .signed {
        text-align: right;
      }

      .signature-line {
        height: 1px;
        background: #7a7a7a;
        margin: 8px 24px 0;
      }

      .payment-note {
        font-size: 7.4px;
        color: #555;
        font-style: italic;
        padding: 10px 24px 0;
        line-height: 1.6;
      }
    </style>

    <div class="page">
      <div class="sheet">
        <div class="topline">|| Shree Ganesh Namah ||</div>

        <div class="brand-row">
          <div class="brand-name">Rajesh Interior Decorators</div>
          <div class="contact">
            <div>Rajesh Vishwakarma</div>
            <div>Mob.: 9732329921</div>
            <div>8169717434</div>
          </div>
        </div>

        <div class="center-text">ALL WORK AT ONE PLACE</div>
        <div class="rule"></div>

        <div class="service">
          All type of Furniture Work, Windows, Sliding, Civil Work, Painting,
          Plumbing, Electrical<br />
          (All other Interior Work)
        </div>

        <div class="rule" style="margin-top: 8px;"></div>

        <div class="address">
          Arey Colony, Gautham Nagar, Near Modern Bakery,
          Gayrageon (E) Mumbai - 400065.
        </div>

        <div class="rule" style="margin-top: 8px;"></div>

        <div class="invoice-box">TAX INVOICE</div>

        <div class="meta">
          <div>Invoice No. : <b>${invoiceNo}</b></div>
          <div>Date: ${invoiceDate}</div>
        </div>
        <div class="meta">
          <div>Name : <b>${customerName}</b></div>
        </div>
        <div class="name-line"></div>

        <div class="theme">
          Bill - Furniture Work with Material and Labour Charge
        </div>

        <div class="gst-row">
          <div class="gst-box">
            <span class="field">Customer's GST No:</span>
            <span>${customerGstNo}</span>
          </div>

          <div class="gst-box" style="justify-content: flex-end;">
            <span class="field">State Code:</span>
            <span>${stateCode}</span>
          </div>
        </div>

        <table class="invoice-table">
          <colgroup>
            <col class="col-sr" />
            <col class="col-description" />
            <col class="col-hsn" />
            <col class="col-unit" />
            <col class="col-rate" />
            <col class="col-amount" />
          </colgroup>

          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Description</th>
              <th>HSN/SAC</th>
              <th>Unit/Area</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            ${tableBody}

            <tr>
              <td colspan="6" class="note">
                Note: - Payment by cheque Amount + GST 18%
              </td>
            </tr>

            <tr>
              <td colspan="4" class="words-cell">
                Total Invoice Amount in Words:
                <b>${totalInWords}</b>
              </td>
              <td class="summary-cell">Total</td>
              <td>Rs ${Number(totalAmount).toFixed(2)}</td>
            </tr>

            <tr>
              <td colspan="4" class="words-cell">
                Total Amount + 18% GST (Rs ${Number(totalAmount).toFixed(2)}
                + Rs ${Number(gst).toFixed(2)})
              </td>
              <td class="summary-cell">Total</td>
              <td>Rs ${Number(finalAmountGSt).toFixed(2)}</td>
            </tr>

            <tr>
              <td colspan="4">
                <b>GST TIN No.: GST0103567</b>
              </td>
              <td colspan="2">
                <b>PAN No.: AIGPV9897E</b>
              </td>
            </tr>

            <tr>
              <td colspan="4" class="note">
                <b>
                  Note: - Payment by cheque Amount + GST 18%<br />
                  In favour of "RAJESH INTERIOR DECORATORS"
                </b>
              </td>
              <td colspan="2" class="signature-cell">
                <b>Authorized Signature</b>
              </td>
            </tr>

            <tr>
              <td colspan="4">
                <b>For Rajesh Interior Decorators</b>
              </td>
              <td colspan="2">
                Certified that the particulars given above are true and
                correct.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  wrapper.style.position = "relative";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.display = "block";
  wrapper.style.width = `${pageWidth}px`;
  wrapper.style.height = `${pageHeight}px`;
//  wrapper.style.background = "#2d2d2d";
  wrapper.style.visibility = "visible";
  wrapper.style.overflow = "visible";

  document.body.appendChild(wrapper);

  try {
    await doc.html(wrapper, {
      margin: [20, 20, 80, 20],
      autoPaging: "slice",
      x: 0,
      y: 0,
      width: pageWidth - 40,
      windowWidth: pageWidth,
    });

    return doc;
  } finally {
    wrapper.remove();
  }
};

export default function InvoicePdfView({ invoice, open, onClose }) {
  useEffect(() => {
    if (!open || !invoice) return;

    const generate = async () => {
      const doc = await makePdf(invoice);
      const blobUrl = doc.output("bloburl");
      const pdfWindow = window.open(blobUrl, "_blank");

      if (pdfWindow) {
        pdfWindow.focus();
      }

      onClose?.();
    };

    generate();
  }, [invoice, onClose, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        Invoice Preview
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            {invoice?.invoiceNo || "Invoice"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            The PDF will open in a new tab.
          </Typography>

          <Button
            variant="contained"
            onClick={async () => {
              const doc = await makePdf(invoice);
              doc.output("dataurlnewwindow");
            }}
          >
            Open PDF
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
