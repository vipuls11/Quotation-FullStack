
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Drawer,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import InvoiceForm from "./InvoiceForm";
import InvoicePdfView from "./InvoicePdfView";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const getNextInvoiceNumber = (invoices = []) => {
  const numbers = invoices
    .map((invoice) => {
      const match = String(invoice.invoiceNo || "").match(/RV-(\d+)/i);
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => Number.isFinite(value));

  return numbers.length ? Math.max(...numbers) + 1 : 1;
};

export default function Invoice() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedPdfInvoice, setSelectedPdfInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/invoices`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch invoices");
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch invoices failed:", error);
      alert(error.message || "Unable to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    setNextInvoiceNumber(getNextInvoiceNumber(rows));
  }, [rows]);

  const toggleDrawer = (value) => () => {
    setOpen(value);

    if (!value) {
      setEditingInvoice(null);
    }
  };

  const handleEdit = (row) => {
    setEditingInvoice(row);
    setOpen(true);
  };

  const handleViewPdf = (row) => {
    setSelectedPdfInvoice(row);
  };

  const handleDelete = async (invoiceId, invoiceNo) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoiceNo}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete invoice");
      }

      setRows((prevRows) => prevRows.filter((row) => row._id !== invoiceId));
      setSnackbar({
        open: true,
        message: data.message || "Invoice deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Delete invoice failed:", error);
      setSnackbar({
        open: true,
        message: error.message || "Unable to delete invoice",
        severity: "error",
      });
    }
  };

  const handleInvoiceSaved = async (payload = {}) => {
    if (payload.type === "error") {
      setSnackbar({
        open: true,
        message: payload.message || "Unable to save invoice",
        severity: "error",
      });
      return;
    }

    await fetchInvoices();
    setSnackbar({
      open: true,
      message: payload.message || "Invoice saved successfully",
      severity: "success",
    });
    setOpen(false);
    setEditingInvoice(null);
  };
console.log(rows , "rows")
  const DrawerList = (
    <Box
      sx={{
        width: { xs: "100vw", sm: 700, md: 900 },
        maxWidth: "100%",
      }}
      role="presentation"
    >
      <InvoiceForm
        handleClose={toggleDrawer(false)}
        invoice={editingInvoice}
        nextInvoiceNo={nextInvoiceNumber}
        onSave={handleInvoiceSaved}
      />
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 1,
        }}
      >
        <Typography variant="h5" component="h1">
          Invoice List
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            setEditingInvoice(null);
            setOpen(true);
          }}
          sx={{
            backgroundColor: "#1565C0",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: "#0D47A1",
            },
          }}
        >
          Create Invoice
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ overflowX: "auto" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr. No</TableCell>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer GST No</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <TableRow key={row._id || row.invoiceNo}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.invoiceNo}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{row.customerGstNo || "-"}</TableCell>
                    <TableCell>{row.state || "-"}</TableCell>

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewPdf(row)}
                          sx={{ backgroundColor: "#2e7d32" }}
                        >
                          View PDF
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleEdit(row)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleDelete(row._id, row.invoiceNo)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
      >
        {DrawerList}
      </Drawer>

      <InvoicePdfView
        invoice={selectedPdfInvoice}
        open={Boolean(selectedPdfInvoice)}
        onClose={() => setSelectedPdfInvoice(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
