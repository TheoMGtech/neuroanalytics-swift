export interface StoreResult {
  storeName: string;
  flag: 'REGULAR' | 'TOCADORA';
  totalReviews: number;
  nps: number;
  promoters: number;
  neutral: number;
  detractors: number;
  isOutlier: boolean;
}

export interface CommentResult {
  storeName: string;
  commentText: string;
  sentiment: 'Positivo' | 'Neutro' | 'Negativo';
  category: 'Produto' | 'Limpeza' | 'Atendimento' | 'Abastecimento' | 'Cultura de Produtos' | 'Outros';
  confidence: number;
}

export interface ManagementSummary {
  flag: 'REGULAR' | 'TOCADORA';
  totalReviews: number;
  nps: number;
  promoters: number;
  neutral: number;
  detractors: number;
}

export interface Analysis {
  id: number;
  fileName: string;
  createdAt: string;
  totalReviews: number;
  generalNps: number;
  promoters: number;
  neutral: number;
  detractors: number;
  saved: boolean;
  storeResults?: StoreResult[];
  commentResults?: CommentResult[];
  managementSummary?: ManagementSummary[];
}
