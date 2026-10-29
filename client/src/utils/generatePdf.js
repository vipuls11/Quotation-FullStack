import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function generateDocumentPdf({
  type = "QUOTATION",
  company,
  document,
}) {
  const pdf = new jsPDF();

  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text(company.name || "Interior Design Studio", margin, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  pdf.text(company.address || "", margin, 27);
  pdf.text(
    `Phone: ${company.phone || "-"} | Email: ${company.email || "-"}`,
    margin,
    33
  );

  if (company.gstin) {
    pdf.text(`GSTIN: ${company.gstin}`, margin, 39);
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  pdf.text(
    type === "INVOICE" ? "TAX INVOICE" : "QUOTATION",
    pageWidth - margin,
    20,
    { align: "right" }
  );

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Number: ${
      type === "INVOICE"
        ? document.invoiceNumber
        : document.quotationNumber
    }`,
    pageWidth - margin,
    28,
    { align: "right" }
  );

  pdf.text(
    `Date: ${new Date(document.issueDate || Date.now()).toLocaleDateString("en-IN")}`,
    pageWidth - margin,
    34,
    { align: "right" }
  );

  pdf.setDrawColor(190, 180, 160);
  pdf.line(margin, 44, pageWidth - margin, 44);

  pdf.setFont("helvetica", "bold");
  pdf.text("BILL TO", margin, 53);

  pdf.setFont("helvetica", "normal");
  pdf.text(document.client?.name || "-", margin, 60);
  pdf.text(document.client?.address || "-", margin, 66);
  pdf.text(`Phone: ${document.client?.phone || "-"}`, margin, 72);

  pdf.text(
    `Project: ${document.project?.name || "-"}`,
    pageWidth - margin,
    60,
    { align: "right" }
  );

  autoTable(pdf, {
    startY: 82,
    head: [["#", "Description", "Qty", "Unit", "Rate", "Amount"]],
    body: (document.items || []).map((item, index) => [
      index + 1,
      item.description,
      item.quantity,
      item.unit,
      money(item.rate),
      money(item.amount),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [72, 61, 51],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      1: { cellWidth: 65 },
    },
  });

  let y = pdf.lastAutoTable.finalY + 10;

  if (y > 225) {
    pdf.addPage();
    y = 20;
  }

  const totals = [
    ["Subtotal", money(document.subtotal)],
    ["Discount", money(document.discountAmount)],
    ["Tax", money(document.taxAmount)],
    ["Grand Total", money(document.grandTotal)],
  ];

  totals.forEach(([label, value], index) => {
    pdf.setFont("helvetica", index === 3 ? "bold" : "normal");
    pdf.text(label, pageWidth - 75, y);
    pdf.text(value, pageWidth - margin, y, { align: "right" });
    y += 7;
  });

  y += 8;

  pdf.setFont("helvetica", "bold");
  pdf.text("Terms and Conditions", margin, y);

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  const terms = pdf.splitTextToSize(
    document.termsAndConditions ||
      "Payment and project terms as mutually agreed.",
    pageWidth - margin * 2
  );

  pdf.text(terms, margin, y);

  y += terms.length * 4 + 15;

  if (y > 260) {
    pdf.addPage();
    y = 30;
  }

  pdf.line(pageWidth - 70, y, pageWidth - margin, y);
  pdf.text(
    "Authorized Signature",
    pageWidth - 42,
    y + 6,
    { align: "center" }
  );

  const number =
    type === "INVOICE"
      ? document.invoiceNumber
      : document.quotationNumber;

  pdf.save(`${number || "interior-document"}.pdf`);
}