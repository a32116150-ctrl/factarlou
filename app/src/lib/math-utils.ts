export const VALID_TVA_RATES = [19, 13, 7, 0] as const;
export type TVARate = 0 | 7 | 13 | 19;

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tva: TVARate;
  unit?: string;
}

export interface TotalsResult {
  totalHT: number;
  totalTTC: number;
  totalTVA: number;
  tvaByRate: Record<number, { baseHT: number; tvaAmount: number }>;
  tvaLines: Array<{ rate: number; baseHT: number; tvaAmount: number }>;
  timbreAmount: number;
  roundingAdjustment: number;
  discountAmount: number;
}

export interface TotalsOptions {
  applyTimbre?: boolean;
  discountPercent?: number;
  discountAmount?: number;
  decimalPlaces?: number;
  roundingMethod?: 'half_up' | 'ceil' | 'floor';
}

export function parseTVARate(tva: unknown): TVARate {
  const rate = Number(tva) || 0;
  return (VALID_TVA_RATES as readonly number[]).includes(rate) ? (rate as TVARate) : 0;
}

export function calculateTotals(items: InvoiceItem[], options: TotalsOptions = {}): TotalsResult {
  const {
    applyTimbre = false,
    discountPercent = 0,
    discountAmount = 0,
    decimalPlaces = 3,
    roundingMethod = 'half_up'
  } = options;

  const round = (value: number): number => {
    const factor = Math.pow(10, decimalPlaces);
    if (roundingMethod === 'ceil') return Math.ceil(value * factor) / factor;
    if (roundingMethod === 'floor') return Math.floor(value * factor) / factor;
    return Math.round(value * factor) / factor;
  };

  let totalHTRawPreDiscount = 0;
  (items || []).forEach(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    totalHTRawPreDiscount += qty * price;
  });

  let discountRatio = 0;
  if (discountPercent > 0) {
    discountRatio = discountPercent / 100;
  } else if (discountAmount > 0 && totalHTRawPreDiscount > 0) {
    discountRatio = discountAmount / totalHTRawPreDiscount;
  }

  let totalHTAfterDiscount = 0;
  let totalTVA = 0;
  const tvaByRate: Record<number, { baseHT: number; tvaAmount: number }> = {};

  (items || []).forEach(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const tva = parseTVARate(item.tva);
    let lineHT = qty * price;

    if (discountRatio > 0) lineHT *= (1 - discountRatio);

    totalHTAfterDiscount += lineHT;

    if (!tvaByRate[tva]) tvaByRate[tva] = { baseHT: 0, tvaAmount: 0 };
    tvaByRate[tva].baseHT += lineHT;
    tvaByRate[tva].tvaAmount += (lineHT * tva) / 100;
  });

  Object.keys(tvaByRate).forEach(rate => {
    tvaByRate[Number(rate)].baseHT = round(tvaByRate[Number(rate)].baseHT);
    tvaByRate[Number(rate)].tvaAmount = round(tvaByRate[Number(rate)].tvaAmount);
    totalTVA += tvaByRate[Number(rate)].tvaAmount;
  });

  const totalHT = round(totalHTAfterDiscount);
  totalTVA = round(totalTVA);

  const timbreAmount = applyTimbre ? 0.600 : 0;

  const totalTTCRaw = totalHT + totalTVA + timbreAmount;
  const totalTTC = round(totalTTCRaw);
  const roundingAdjustment = round(totalTTC - totalTTCRaw);

  const tvaLines = Object.entries(tvaByRate)
    .filter(([_, v]) => Math.abs(v.baseHT) > 0.0001)
    .map(([rate, v]) => ({ rate: Number(rate), ...v }))
    .sort((a, b) => b.rate - a.rate);

  return {
    totalHT,
    totalTTC,
    totalTVA,
    tvaByRate,
    tvaLines,
    timbreAmount,
    roundingAdjustment,
    discountAmount: round(totalHTRawPreDiscount - totalHTAfterDiscount),
  };
}

export function formatAmount(value: number | string | null | undefined, decimalPlaces = 3): string {
  const factor = Math.pow(10, decimalPlaces);
  return (Math.round(parseFloat(String(value || 0)) * factor) / factor).toFixed(decimalPlaces);
}

export function calculatePayroll(grossSalary: number, options: { transportAllowance?: number; otherAllowances?: number } = {}) {
  const { transportAllowance = 0, otherAllowances = 0 } = options;

  const totalGross = (Number(grossSalary) || 0) + (Number(transportAllowance) || 0) + (Number(otherAllowances) || 0);

  const cnssDeduction = Math.round(totalGross * 0.0918 * 1000) / 1000;

  const taxableMonthly = totalGross - cnssDeduction;
  const taxableAnnual = taxableMonthly * 12;

  let irppAnnual = 0;
  if (taxableAnnual > 50000) irppAnnual += (taxableAnnual - 50000) * 0.35;
  if (taxableAnnual > 30000) irppAnnual += (Math.min(taxableAnnual, 50000) - 30000) * 0.32;
  if (taxableAnnual > 20000) irppAnnual += (Math.min(taxableAnnual, 30000) - 20000) * 0.28;
  if (taxableAnnual > 5000) irppAnnual += (Math.min(taxableAnnual, 20000) - 5000) * 0.26;

  const irppMonthly = Math.round((irppAnnual / 12) * 1000) / 1000;
  const netSalary = Math.round((totalGross - cnssDeduction - irppMonthly) * 1000) / 1000;

  const employerCNSS = Math.round(totalGross * 0.1657 * 1000) / 1000;

  return {
    grossSalary: totalGross,
    cnssDeduction,
    irppDeduction: irppMonthly,
    netSalary,
    employerCNSS
  };
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: Array<{ currency: string; rate: number }> = []): number {
  const val = Number(amount) || 0;
  if (!val || fromCurrency === toCurrency) return val;

  const getRateToTND = (curr: string): number => {
    if (curr === 'TND') return 1.0;
    const found = (rates || []).find(r => r.currency === curr);
    return found ? Number(found.rate) || 1.0 : 1.0;
  };

  const fromRate = getRateToTND(fromCurrency);
  const toRate = getRateToTND(toCurrency);

  const amountInTND = val * fromRate;
  const converted = amountInTND / toRate;

  return Math.round(converted * 1000) / 1000;
}
