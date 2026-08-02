export type DocType = 'facture' | 'devis' | 'bon' | 'bl' | 'ba' | 'bs' | 'be' | 'avoir' | 'ticket' | 'proforma' | 'forfaitaire';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type Currency = 'TND' | 'EUR' | 'USD';

export interface Profile {
  id: string;
  name: string;
  company?: string | null;
  mf?: string | null;
  created_at?: string;
}

export interface Company {
  user_id: string;
  name?: string | null;
  mf?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  rc?: string | null;
  website?: string | null;
  bank?: string | null;
  rib?: string | null;
  logo_image?: string | null;
  stamp_image?: string | null;
  signature_image?: string | null;
  show_logo: boolean;
  show_stamp: boolean;
  show_signature: boolean;
  show_qr: boolean;
  show_accent: boolean;
}

export interface UserSettings {
  user_id: string;
  prefix_facture: string;
  prefix_devis: string;
  prefix_bon: string;
  prefix_retenue: string;
  prefix_avoir: string;
  prefix_contract: string;
  prefix_bl: string;
  prefix_ba: string;
  prefix_bs: string;
  prefix_be: string;
  prefix_ticket: string;
  decimal_places: number;
  rounding_method: 'half_up' | 'ceil' | 'floor';
  document_theme?: string | null;
  currency_default: Currency;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_user?: string | null;
  smtp_pass?: string | null;
  smtp_secure: boolean;
}

export interface DocumentDesign {
  primaryColor: string;
  fontFamily: 'inter' | 'roboto' | 'playfair' | 'mono';
  templateStyle: 'classic' | 'modern' | 'minimalist';
  customFooterText: string;
  showBankDetails: boolean;
  showSignatureBox: boolean;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  mf?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  tags?: string | null;
  credit_limit: number;
  category: string;
  rib?: string | null;
  created_at?: string;
}

export interface Fournisseur {
  id: string;
  user_id: string;
  name: string;
  mf?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  category: string;
  rib?: string | null;
  created_at?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tva: number;
  unit?: string;
}

export interface Document {
  id: string;
  user_id: string;
  type: DocType;
  number: string;
  date: string;
  due_date?: string | null;
  expiry_date?: string | null;
  currency: Currency;
  payment_mode?: string | null;
  payment_status: PaymentStatus;
  paid_amount: number;
  paid_date?: string | null;
  company_name?: string | null;
  company_mf?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  company_rc?: string | null;
  client_id?: string | null;
  client_name: string;
  client_mf?: string | null;
  client_address?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  items_json: InvoiceItem[];
  apply_timbre: boolean;
  timbre_amount: number;
  fodec_rate: number;
  rounding_adjustment: number;
  discount_percent: number;
  discount_amount: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  logo_image?: string | null;
  stamp_image?: string | null;
  signature_image?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  reference_doc?: string | null;
  is_pos: boolean;
  pos_session_id?: string | null;
  created_at?: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  price: number;
  tva: number;
  category?: string | null;
  unit: string;
  barcode?: string | null;
  stock: number;
  min_stock: number;
  created_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  document_id: string;
  amount: number;
  method?: string | null;
  reference?: string | null;
  date: string;
  notes?: string | null;
  created_at?: string;
}

export interface Retenue {
  id: string;
  user_id: string;
  number: string;
  year: number;
  month: number;
  date: string;
  retenuer_name: string;
  retenuer_mf?: string | null;
  retenuer_address?: string | null;
  retenuer_rc?: string | null;
  retenuer_rep?: string | null;
  retenuer_code_tva?: string | null;
  retenuer_code_cat?: string | null;
  retenuer_n_etab?: string | null;
  beneficiaire_name: string;
  beneficiaire_mf?: string | null;
  beneficiaire_address?: string | null;
  beneficiaire_rib?: string | null;
  beneficiaire_cin?: string | null;
  beneficiaire_code_tva?: string | null;
  beneficiaire_code_cat?: string | null;
  beneficiaire_n_etab?: string | null;
  facture_id?: string | null;
  facture_number?: string | null;
  facture_date?: string | null;
  montant_brut: number;
  taux_retenue: number;
  montant_retenue: number;
  nature_revenu: string;
  base_legale: string;
  logo_image?: string | null;
  stamp_image?: string | null;
  signature_image?: string | null;
  notes?: string | null;
  status: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  vendor?: string | null;
  category?: string | null;
  description?: string | null;
  amount_ht: number;
  tva_rate: number;
  amount_ttc: number;
  retenue_source: number;
  payment_method?: string | null;
  reference?: string | null;
  doc_type: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  cin?: string | null;
  cnss?: string | null;
  role?: string | null;
  department?: string | null;
  hire_date?: string | null;
  base_salary: number;
  transport_allowance: number;
  other_allowances: number;
  active: boolean;
  created_at?: string;
}

export interface Payslip {
  id: string;
  user_id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  date: string;
  base_salary: number;
  transport_allowance: number;
  other_allowances: number;
  gross_salary: number;
  cnss_deduction: number;
  irpp_deduction: number;
  net_salary: number;
  status: string;
  created_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title?: string | null;
  content?: string | null;
  color: string;
  pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  due_time: string;
  entity_type?: string | null;
  entity_id?: string | null;
  done: boolean;
  notified: boolean;
  created_at?: string;
}

export interface DashboardStats {
  revenue: number;
  totalInvoices: number;
  totalClients: number;
  pendingAmount: number;
  totalExpenses: number;
  netProfit: number;
  recentDocs: Document[];
  overdueCount: number;
}

export interface DocCounter {
  user_id: string;
  type: string;
  year: number;
  last_number: number;
}
