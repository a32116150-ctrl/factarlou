-- =============================================
-- FACTARLOU WEB APP — FULL SCHEMA
-- Run this entire script in Supabase → SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS / PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  company TEXT,
  mf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  mf TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  rc TEXT,
  website TEXT,
  bank TEXT,
  rib TEXT,
  logo_image TEXT,
  stamp_image TEXT,
  signature_image TEXT,
  show_logo BOOLEAN DEFAULT true,
  show_stamp BOOLEAN DEFAULT true,
  show_signature BOOLEAN DEFAULT true,
  show_qr BOOLEAN DEFAULT false,
  show_accent BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  prefix_facture TEXT DEFAULT 'FAC',
  prefix_devis TEXT DEFAULT 'DEV',
  prefix_bon TEXT DEFAULT 'BC',
  prefix_retenue TEXT DEFAULT 'RS',
  prefix_avoir TEXT DEFAULT 'AV',
  prefix_contract TEXT DEFAULT 'CTR',
  prefix_bl TEXT DEFAULT 'BL',
  prefix_ba TEXT DEFAULT 'BA',
  prefix_bs TEXT DEFAULT 'BS',
  prefix_be TEXT DEFAULT 'BE',
  prefix_ticket TEXT DEFAULT 'TIC',
  decimal_places INTEGER DEFAULT 3,
  rounding_method TEXT DEFAULT 'half_up',
  document_theme TEXT,
  currency_default TEXT DEFAULT 'TND',
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_pass TEXT,
  smtp_secure BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.document_themes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  font_family TEXT DEFAULT 'Segoe UI, sans-serif',
  font_size TEXT DEFAULT '14px',
  title_facture_text TEXT DEFAULT 'FACTURE',
  title_facture_color TEXT DEFAULT '#1e3a8a',
  title_devis_text TEXT DEFAULT 'DEVIS',
  title_devis_color TEXT DEFAULT '#92400e',
  title_bon_text TEXT DEFAULT 'BON DE COMMANDE',
  title_bon_color TEXT DEFAULT '#065f46'
);

-- =============================================
-- CLIENTS / SUPPLIERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mf TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  tags TEXT,
  credit_limit REAL DEFAULT 0,
  category TEXT DEFAULT 'standard',
  rib TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fournisseurs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mf TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  category TEXT DEFAULT 'standard',
  rib TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT,
  expiry_date TEXT,
  currency TEXT DEFAULT 'TND',
  payment_mode TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  paid_amount REAL DEFAULT 0,
  paid_date TEXT,
  company_name TEXT,
  company_mf TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_rc TEXT,
  client_id UUID,
  client_name TEXT NOT NULL,
  client_mf TEXT,
  client_address TEXT,
  client_phone TEXT,
  client_email TEXT,
  items_json JSONB NOT NULL DEFAULT '[]',
  apply_timbre BOOLEAN DEFAULT false,
  timbre_amount REAL DEFAULT 0,
  fodec_rate REAL DEFAULT 0,
  rounding_adjustment REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_ht REAL NOT NULL DEFAULT 0,
  total_tva REAL DEFAULT 0,
  total_ttc REAL NOT NULL DEFAULT 0,
  logo_image TEXT,
  stamp_image TEXT,
  signature_image TEXT,
  notes TEXT,
  internal_notes TEXT,
  reference_doc UUID,
  is_pos BOOLEAN DEFAULT false,
  pos_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doc_counters (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, type, year)
);

CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  tva REAL DEFAULT 19,
  category TEXT,
  unit TEXT DEFAULT 'unité',
  barcode TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENTS / RETENUES
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  reference TEXT,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retenues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  date TEXT NOT NULL,
  retenuer_name TEXT NOT NULL,
  retenuer_mf TEXT,
  retenuer_address TEXT,
  retenuer_rc TEXT,
  retenuer_rep TEXT,
  retenuer_code_tva TEXT,
  retenuer_code_cat TEXT,
  retenuer_n_etab TEXT,
  beneficiaire_name TEXT NOT NULL,
  beneficiaire_mf TEXT,
  beneficiaire_address TEXT,
  beneficiaire_rib TEXT,
  beneficiaire_cin TEXT,
  beneficiaire_code_tva TEXT,
  beneficiaire_code_cat TEXT,
  beneficiaire_n_etab TEXT,
  facture_id UUID,
  facture_number TEXT,
  facture_date TEXT,
  montant_brut REAL NOT NULL,
  taux_retenue REAL NOT NULL DEFAULT 1.5,
  montant_retenue REAL NOT NULL,
  nature_revenu TEXT DEFAULT 'Honoraires et commissions',
  base_legale TEXT DEFAULT 'Art. 52 du Code de l''IRPP et de l''IS',
  logo_image TEXT,
  stamp_image TEXT,
  signature_image TEXT,
  notes TEXT,
  status TEXT DEFAULT 'emis',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXPENSES / CONTRACTS / EMPLOYEES / PAYSLIPS
-- =============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  vendor TEXT,
  category TEXT,
  description TEXT,
  amount_ht REAL DEFAULT 0,
  tva_rate REAL DEFAULT 0,
  amount_ttc REAL NOT NULL DEFAULT 0,
  retenue_source REAL DEFAULT 0,
  payment_method TEXT,
  reference TEXT,
  doc_type TEXT DEFAULT 'facture',
  attachment_path TEXT,
  attachment_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT,
  employer_name TEXT,
  employer_mf TEXT,
  employer_address TEXT,
  employer_rep TEXT,
  employer_rep_role TEXT,
  employee_name TEXT,
  employee_cin TEXT,
  employee_address TEXT,
  employee_role TEXT,
  employee_department TEXT,
  start_date TEXT,
  end_date TEXT,
  salary REAL,
  salary_type TEXT DEFAULT 'mensuel',
  work_hours REAL DEFAULT 40,
  work_location TEXT,
  trial_period BOOLEAN DEFAULT false,
  trial_duration TEXT,
  notice_period TEXT,
  extra_clauses TEXT,
  status TEXT DEFAULT 'brouillon',
  notes TEXT,
  signed_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cin TEXT,
  cnss TEXT,
  role TEXT,
  department TEXT,
  hire_date TEXT,
  base_salary REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  date TEXT NOT NULL,
  base_salary REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  gross_salary REAL DEFAULT 0,
  cnss_deduction REAL DEFAULT 0,
  irpp_deduction REAL DEFAULT 0,
  net_salary REAL DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTES / REMINDERS / RELANCES / EXCHANGE RATES / ACTIVITY LOG / RECURRING
-- =============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  color TEXT DEFAULT '#fef9c3',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  due_time TEXT DEFAULT '09:00',
  entity_type TEXT,
  entity_id UUID,
  done BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.relances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  attempt INTEGER DEFAULT 1,
  method TEXT DEFAULT 'pdf',
  recipient_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT NOT NULL,
  rate REAL DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID,
  client_id UUID,
  doc_type TEXT,
  day_of_month INTEGER DEFAULT 15,
  items_template JSONB,
  currency TEXT DEFAULT 'TND',
  payment_mode TEXT DEFAULT 'Virement bancaire',
  frequency TEXT NOT NULL,
  last_run TEXT,
  next_run TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_tags (
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (document_id, tag)
);

-- =============================================
-- ATOMIC DOCUMENT NUMBER GENERATOR
-- Replaces the non-atomic upsert approach. Returns the new last_number.
-- SECURITY DEFINER so it can write to doc_counters (revoked from clients).
-- Guards against incrementing another user's counter.
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_doc_counter(
  p_user_id UUID,
  p_type TEXT,
  p_year INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.doc_counters (user_id, type, year, last_number)
  VALUES (p_user_id, p_type, p_year, 1)
  ON CONFLICT (user_id, type, year)
  DO UPDATE SET last_number = doc_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_docs_user_type ON public.documents(user_id, type);
CREATE INDEX IF NOT EXISTS idx_docs_client ON public.documents(user_id, client_name);
CREATE INDEX IF NOT EXISTS idx_docs_date ON public.documents(date);
CREATE INDEX IF NOT EXISTS idx_docs_status ON public.documents(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_doc ON public.payments(document_id);
CREATE INDEX IF NOT EXISTS idx_retenues_user ON public.retenues(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_services_user_cat ON public.services(user_id, category);
CREATE INDEX IF NOT EXISTS idx_services_barcode ON public.services(barcode);
CREATE INDEX IF NOT EXISTS idx_clients_user ON public.clients(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- RLS needs to be bypassed for the SECURITY DEFINER RPC
ALTER TABLE public.doc_counters FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.doc_counters FROM anon, authenticated;
GRANT ALL ON public.doc_counters TO service_role;

CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own company" ON public.companies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own themes" ON public.document_themes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fournisseurs" ON public.fournisseurs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own counters" ON public.doc_counters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.document_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own services" ON public.services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own service_categories" ON public.service_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own retenues" ON public.retenues FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own employees" ON public.employees FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payslips" ON public.payslips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own relances" ON public.relances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own exchange_rates" ON public.exchange_rates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activity_log" ON public.activity_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring" ON public.recurring_invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own document_tags" ON public.document_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

-- =============================================
-- STORAGE BUCKETS + POLICIES
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-attachments', 'expense-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;

CREATE POLICY "Users can upload their own assets" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own assets" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own assets" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own assets" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- AUTO-CREATE PROFILE + SETTINGS ON REGISTRATION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
