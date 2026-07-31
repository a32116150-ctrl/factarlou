export const VALID_TVA_RATES = [19, 13, 7, 0];
export const VALID_CURRENCIES = ['TND', 'EUR', 'USD'];
export const VALID_DOC_TYPES = ['facture', 'devis', 'bon', 'bl', 'ba', 'bs', 'be', 'avoir', 'ticket', 'proforma', 'forfaitaire'];
export const VALID_ROUNDING_METHODS = ['half_up', 'ceil', 'floor'];
export const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export function isString(v: unknown, maxLen = 500): boolean {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

export function isNumber(v: unknown, min = -1e12, max = 1e12): boolean {
  return typeof v === 'number' && !isNaN(v) && v >= min && v <= max;
}

export function isOptionalString(v: unknown, maxLen = 500): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.length <= maxLen);
}

export function isOptionalNumber(v: unknown, min = -1e12, max = 1e12): boolean {
  return v === null || v === undefined || (typeof v === 'number' && !isNaN(v) && v >= min && v <= max);
}

export function isUUID(v: unknown): boolean {
  return typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
}

export function isDate(v: unknown): boolean {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime());
}

export function isMF(v: unknown): boolean {
  if (!v) return true;
  if (typeof v !== 'string') return false;
  const cleaned = v.trim().toUpperCase();
  return /^\d{7}\/[A-Z]\/[A-Z]\/\d{3}$/.test(cleaned)
    || /^\d{7}[A-Z][A-Z]\d{3}$/.test(cleaned);
}

export function isCIN(v: unknown): boolean {
  if (!v) return true;
  if (typeof v !== 'string') return false;
  return /^\d{8}$/.test(v.trim());
}

export interface DocSaveData {
  userId: string;
  type: string;
  number: string;
  date: string;
  clientName: string;
  currency?: string;
  paymentMode?: string;
  paymentStatus?: string;
  discountPercent?: number;
  discountAmount?: number;
  items?: Array<{ description: string; quantity: number; price: number; tva: number }>;
}

export function validateDocSave(data: DocSaveData): string[] {
  const errors: string[] = [];
  if (!isUUID(data.userId)) errors.push('userId: invalid UUID');
  if (!VALID_DOC_TYPES.includes(data.type)) errors.push(`type: must be one of ${VALID_DOC_TYPES.join(', ')}`);
  if (!isString(data.number, 50)) errors.push('number: required (max 50 chars)');
  if (!isDate(data.date)) errors.push('date: required (YYYY-MM-DD)');
  if (!isString(data.clientName)) errors.push('clientName: required');
  if (!VALID_CURRENCIES.includes(data.currency || 'TND')) errors.push('currency: must be TND, EUR, or USD');
  if (!isOptionalString(data.paymentMode, 50)) errors.push('paymentMode: max 50 chars');
  if (data.paymentStatus && !['unpaid', 'paid', 'partial'].includes(data.paymentStatus))
    errors.push('paymentStatus: must be unpaid/paid/partial');
  if (!isOptionalNumber(data.discountPercent, 0, 100)) errors.push('discountPercent: must be 0-100');
  if ((data.discountPercent || 0) > 0 && (data.discountAmount || 0) > 0) {
    errors.push('discount: cannot apply both discountPercent and discountAmount simultaneously');
  }
  if (data.items && !Array.isArray(data.items)) errors.push('items: must be an array');
  if (data.items) {
    const isForfaitaire = data.type === 'forfaitaire';
    data.items.forEach((item, i) => {
      if (!isString(item.description)) errors.push(`items[${i}].description: required`);
      if (!isNumber(item.quantity, 0.001, 1e6)) errors.push(`items[${i}].quantity: must be > 0`);
      if (!isNumber(item.price, 0, 1e9)) errors.push(`items[${i}].price: must be >= 0`);
      if (isForfaitaire) {
        if (item.tva !== 0 && item.tva !== undefined) errors.push(`items[${i}].tva: must be 0% for régime forfaitaire`);
      } else {
        if (!VALID_TVA_RATES.includes(item.tva)) errors.push(`items[${i}].tva: must be 0, 7, 13, or 19`);
      }
    });
  }
  return errors;
}

export interface ClientSaveData {
  userId: string;
  name: string;
  mf?: string;
  email?: string;
  phone?: string;
}

export function validateClientSave(data: ClientSaveData): string[] {
  const errors: string[] = [];
  if (!isUUID(data.userId)) errors.push('userId: invalid UUID');
  if (!isString(data.name)) errors.push('name: required');
  if (!isMF(data.mf)) errors.push('mf: invalid');
  if (!isOptionalString(data.email, 200)) errors.push('email: too long');
  if (!isOptionalString(data.phone, 30)) errors.push('phone: too long');
  return errors;
}

export interface ExpenseSaveData {
  userId: string;
  date: string;
  vendor?: string;
  amountHT?: number;
  amountTTC?: number;
  tvaRate?: number;
}

export function validateExpenseSave(data: ExpenseSaveData): string[] {
  const errors: string[] = [];
  if (!isUUID(data.userId)) errors.push('userId: invalid UUID');
  if (!isDate(data.date)) errors.push('date: required (YYYY-MM-DD)');
  if (!isOptionalString(data.vendor)) errors.push('vendor: too long');
  if (!isOptionalNumber(data.amountHT, 0)) errors.push('amountHT: must be >= 0');
  if (!isOptionalNumber(data.amountTTC, 0)) errors.push('amountTTC: must be >= 0');
  if (!VALID_TVA_RATES.includes(data.tvaRate || 0)) errors.push('tvaRate: must be 0, 7, 13, or 19');
  return errors;
}

export function validateSettings(data: { decimal_places?: number; rounding_method?: string }): string[] {
  const errors: string[] = [];
  if (data.decimal_places !== undefined && ![0, 1, 2, 3, 4, 5].includes(data.decimal_places)) errors.push('decimal_places: must be 0-5');
  if (data.rounding_method && !VALID_ROUNDING_METHODS.includes(data.rounding_method))
    errors.push('rounding_method: must be half_up/ceil/floor');
  return errors;
}

export function validateRecurringInvoice(data: { userId: string; template_id?: string; frequency: string; next_run: string }): string[] {
  const errors: string[] = [];
  if (!isUUID(data.userId)) errors.push('userId: invalid UUID');
  if (data.template_id && !isUUID(data.template_id)) errors.push('template_id: invalid UUID');
  if (!VALID_FREQUENCIES.includes(data.frequency)) errors.push('frequency: must be daily/weekly/monthly/yearly');
  if (!isDate(data.next_run)) errors.push('next_run: required (YYYY-MM-DD)');
  return errors;
}
