import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Typography } from "@mui/material";

const API_BASE_URL = import.meta.env.API_BASE_URI || "http://localhost:8000";

const emptyItem = {
  description: "",

  hsnSac: "",

  unitArea: "",

  rate: "",

  amount: "",
};

const emptyInvoice = {
  invoiceNo: "",

  name: "",

  date: "",

  customerGstNo: "",

  state: "",
};

export default function InvoiceForm({ handleClose, invoice: editingInvoice, onSave, nextInvoiceNo = 1 }) {
  const generateInvoiceNo = (number) => {
    const safeNumber = Number(number) || 1;
    return `RV-${String(safeNumber).padStart(3, "0")}`;
  };

  const [invoice, setInvoice] = useState({
    ...emptyInvoice,
    invoiceNo: generateInvoiceNo(nextInvoiceNo),
  });
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(nextInvoiceNo || 1);

  const [items, setItems] = useState([{ ...emptyItem }]);
  const [isEditing, setIsEditing] = useState(Boolean(editingInvoice));

  useEffect(() => {
    setNextInvoiceNumber(nextInvoiceNo || 1);

    if (editingInvoice) {
      setInvoice({
        invoiceNo: editingInvoice.invoiceNo || "",
        name: editingInvoice.name || "",
        date: editingInvoice.date ? new Date(editingInvoice.date).toISOString().slice(0, 10) : "",
        customerGstNo: editingInvoice.customerGstNo || "",
        state: editingInvoice.state || "",
      });
      setItems(
        (editingInvoice.items || []).map((item) => ({
          description: item.description || "",
          hsnSac: item.hsnSac || "",
          unitArea: item.unitArea ?? "",
          rate: item.rate ?? "",
          amount: item.amount ?? "",
        }))
      );
      setIsEditing(true);
    } else {
      setInvoice({
        ...emptyInvoice,
        invoiceNo: generateInvoiceNo(nextInvoiceNo || 1),
      });
      setItems([{ ...emptyItem }]);
      setIsEditing(false);
    }
  }, [editingInvoice, nextInvoiceNo]);

  // Invoice details

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;

    setInvoice((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  // Add item row

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  // Remove item row

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item and calculate amount

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        if (field === "unitArea" || field === "rate") {
          const unitArea = Number(
            field === "unitArea" ? value : updated.unitArea,
          );

          const rate = Number(field === "rate" ? value : updated.rate);

          updated.amount =
            updated.unitArea !== "" && updated.rate !== ""
              ? (unitArea * rate).toFixed(2)
              : "";
        }

        return updated;
      }),
    );
  };

  // Convert whole numbers into Indian currency words

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",

      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",

      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",

      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",

      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",

      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convert = (n) => {
      if (n === 0) return "";

      if (n < 20) return ones[n];

      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      }

      if (n < 1000) {
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + convert(n % 100) : "")
        );
      }

      if (n < 100000) {
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + convert(n % 1000) : "")
        );
      }

      if (n < 10000000) {
        return (
          convert(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + convert(n % 100000) : "")
        );
      }

      return (
        convert(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + convert(n % 10000000) : "")
      );
    };

    if (!Number.isSafeInteger(num) || num < 0) {
      return "Invalid Amount";
    }

    return num === 0 ? "Zero" : convert(num);
  };

  // Calculate total in paise to avoid floating-point rounding errors

  const totalPaise = items.reduce(
    (total, item) => total + Math.round(Number(item.amount || 0) * 100),

    0,
  );

  const totalAmount = totalPaise / 100;
  const gst = totalAmount * 18 / 100;
const finalAmountGSt = totalAmount + gst;

  const rupees = Math.floor(totalPaise / 100);

  const paise = totalPaise % 100;

  const amountInWords =
    `${numberToWords(rupees)} Rupees` +
    (paise > 0 ? ` and ${numberToWords(paise)} Paise` : "") +
    " Only";

  // Submit or update invoice

  const handleSubmit = async (e) => {
    e.preventDefault();

    const savedInvoice = {
      ...invoice,
      items: items.map((item) => ({ ...item })),
      totalAmount,
      finalAmountGSt
    };

    try {
      const endpoint = isEditing
        ? `${API_BASE_URL}/api/invoices/${editingInvoice?._id}`
        : `${API_BASE_URL}/api/invoices`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savedInvoice),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save invoice");
      }

      if (typeof onSave === "function") {
        onSave({
          type: "success",
          message: data.message || "Invoice saved successfully",
          invoice: data.invoice || savedInvoice,
        });
      }
      if (typeof handleClose === "function") {
        handleClose();
      }
    } catch (error) {
      console.error("Invoice submit error:", error);
      if (typeof onSave === "function") {
        onSave({
          type: "error",
          message: error.message || "Something went wrong while saving the invoice",
        });
      }
    }
  };

  const handleNewInvoice = () => {
    const nextNumber = nextInvoiceNumber + 1;
    setNextInvoiceNumber(nextNumber);
    setInvoice({
      ...emptyInvoice,
      invoiceNo: generateInvoiceNo(nextNumber),
    });
    setItems([{ ...emptyItem }]);
    setIsEditing(false);
  };

  const inputStyle = {
    padding: "9px",

    width: "100%",

    boxSizing: "border-box",

    border: "1px solid #ccc",

    borderRadius: "4px",
  };

  const fields = [
    ["invoiceNo", "Invoice No", true],

    ["name", "Name", true],

    ["date", "Date", true],

    ["customerGstNo", "Customer GST No", true],

    ["state", "State", true],
  ];

  const itemFields = [
    ["description", "Description", true],

    ["hsnSac", "HSN/SAC", false],

    ["unitArea", "Unit/Area (sq)", true],

    ["rate", "Rate", true],

    ["amount", "Amount", false],
  ];

  return (
    <Box
      style={{
        margin: "auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
        <Box
          sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, #1565C0, #283593)",
    color: "#fff",
    px: 3,
    py: 1 ,
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          }}>
      <Typography variant="h5" component="h5">{isEditing ? "Edit Invoice" : "Invoice Form"}</Typography>
       

          <Button onClick={handleClose}>
            <CloseIcon sx={{color:"#fff"}}/>
          </Button>
        </Box>
      <form onSubmit={handleSubmit} style={{padding: "20px",}}>
      
   <h3>Invoice Details</h3>
        <Box
          style={{
            display: "grid",

            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",

            gap: "15px",
          }}
        >
          {fields.map(([field, label, required]) => (
            <label key={field}>
              {label}

              {required && <span style={{ color: "red" }}> *</span>}

              <input
 style={inputStyle}
  type={field === "date" ? "date" : "text"}
  name={field}
  value={invoice[field]}
  onChange={handleInvoiceChange}
  required={required}
  disabled={field === "invoiceNo"}
  readOnly={field === "invoiceNo"}
              />
            </label>
          ))}
        </Box>

        <h3 style={{ marginTop: "30px" }}>Item Details</h3>

        {items.map((item, index) => (
          <Box
            key={index}
            style={{
              display: "grid",

              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",

              gap: "10px",

              marginBottom: "15px",

              padding: "15px",

              border: "1px solid #ddd",

              borderRadius: "6px",
            }}
          >
            {itemFields.map(([field, label, required]) => (
              <label key={field}>
                {label}

                {required && <span style={{ color: "red" }}> *</span>}

                <input
                  style={inputStyle}
                  type={
                    [ "unitArea", "rate", "amount"].includes(field)
                      ? "number"
                      : "text"
                  }
                  min={
                    [ "unitArea", "rate", "amount"].includes(field)
                      ? "0"
                      : undefined
                  }
                  step={
                    [ "unitArea", "rate", "amount"].includes(field)
                      ? "any"
                      : undefined
                  }
                  value={item[field]}
                  onChange={(e) =>
                    handleItemChange(index, field, e.target.value)
                  }
                  readOnly={field === "amount"}
                  required={required}
                />
              </label>
            ))}

            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              style={{
                alignSelf: "end",

                padding: "10px",

                cursor: items.length === 1 ? "not-allowed" : "pointer",
              }}
            >
              Remove
            </button>
          </Box>
        ))}

        <button
          type="button"
          onClick={addItem}
          style={{ padding: "10px", marginRight: "10px" }}
        >
          + Add More
        </button>

        <Box style={{ marginTop: "20px" }}>
          <h3>Total Amount: ₹{totalAmount.toFixed(2)}</h3>
          <h3>Total Amount + 18% GST (₹{totalAmount.toFixed(2)} + ₹{gst.toFixed(2)}): ₹{finalAmountGSt.toFixed(2)}</h3>
          <h4>Amount in Words: {amountInWords}</h4>
        </Box>

        <button
          type="submit"
          variant="contained"
          style={{
            padding: "10px 20px",

            marginTop: "10px",

            marginRight: "10px",

            cursor: "pointer",
          }}
        >
          {isEditing ? "Update Invoice" : "Submit Invoice"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);

              setInvoice({ ...emptyInvoice });

              setItems([{ ...emptyItem }]);
            }}
            style={{ padding: "10px 20px", marginTop: "10px" }}
          >
            Cancel Edit
          </button>
        )}
      </form>

    </Box>
  );
}
