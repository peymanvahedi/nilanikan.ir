// lib/bundlePrice.ts
export function calcBundlePrice(bundle) {
  const total = bundle.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  if (bundle.discountType === "percent") {
    return total * (1 - bundle.discountValue / 100);
  } else if (bundle.discountType === "fixed") {
    return total - bundle.discountValue;
  }
  return total;
}
