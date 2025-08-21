export interface Product {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
  nutriScore?: string;
  isVegan?: boolean;
}

export interface RecallInfo {
  id: string;
  productName: string;
  brand: string;
  barcode?: string;
  gtin?: string;
  recallDate: string;
  reason: string;
  risk: string;
  description: string;
  actions: string;
  distributors?: string[];
  batchNumbers?: string[];
  imageUrl?: string;
}

export interface RecallCheckResult {
  isRecalled: boolean;
  recalls: RecallInfo[];
  product?: Product;
  lastChecked: Date;
}