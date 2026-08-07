export type BillLineItemKind = "service" | "pricingRule" | "noShowFee" | "custom";

export interface BillLineItem {
  label: string;
  amountLKR: number;
  kind: BillLineItemKind;
}
