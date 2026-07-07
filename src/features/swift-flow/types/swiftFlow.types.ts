export interface ProductSummary {
  id: number;
  name: string;
  category: string;
  price: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  responseTimeMs: number;
  cached: boolean;
}

export interface ComparisonResult {
  key: string;
  productId: number;
  productName: string;
  productCategory: string;
  directTimeMs: number;
  cachedTimeMs: number;
  speedup: number;
  timestamp: number;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}