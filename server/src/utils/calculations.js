export function calculateQuotation({
  items = [],
  discountPercent = 0,
  taxPercent = 0,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required");
  }

  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    throw new Error("Invalid discount percentage");
  }

  if (
    !Number.isFinite(taxPercent) ||
    taxPercent < 0 ||
    taxPercent > 100
  ) {
    throw new Error("Invalid tax percentage");
  }

  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const rate = Number(item.rate);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(rate) ||
      quantity <= 0 ||
      rate < 0
    ) {
      throw new Error("Invalid item quantity or rate");
    }

    const amount = Math.round(quantity * rate * 100) / 100;

    return {
      description: String(item.description || "").trim(),
      category: String(item.category || "Other").trim(),
      unit: String(item.unit || "Nos").trim(),
      quantity,
      rate,
      amount,
    };
  });

  const roundMoney = (value) => Math.round(value * 100) / 100;

  const subtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.amount, 0)
  );

  const discountAmount = roundMoney(
    (subtotal * discountPercent) / 100
  );

  const taxableAmount = roundMoney(subtotal - discountAmount);

  const taxAmount = roundMoney(
    (taxableAmount * taxPercent) / 100
  );

  const grandTotal = roundMoney(taxableAmount + taxAmount);

  return {
    items: normalizedItems,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    grandTotal,
  };
}