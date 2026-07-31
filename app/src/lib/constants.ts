export const TIMBRE_FISCAL = 0.600;

export const VALID_TVA_RATES = [19, 13, 7, 0];

export const CNSS_EMPLOYEE_RATE = 0.0918;
export const CNSS_EMPLOYER_RATE = 0.1657;

export const IRPP_BRACKETS = [
  { min: 0, max: 5000, rate: 0.00 },
  { min: 5000, max: 20000, rate: 0.26 },
  { min: 20000, max: 30000, rate: 0.28 },
  { min: 30000, max: 50000, rate: 0.32 },
  { min: 50000, max: Infinity, rate: 0.35 },
];

export const MF_REGEX = /^\d{7}\/[A-Z]\/[A-Z]\/\d{3}$/;

export const CIN_REGEX = /^\d{8}$/;

export const DOC_TYPES = ['facture', 'devis', 'bon', 'bl', 'ba', 'bs', 'be', 'avoir', 'ticket', 'proforma', 'forfaitaire'];

export const RETENUE_RATES = [
  { value: 0.5, label: '0.5% — Importateurs (Art. 52)' },
  { value: 1, label: '1% — Achats auprès fabricants/grossistes' },
  { value: 1.5, label: '1.5% — Honoraires et commissions' },
  { value: 5, label: '5% — Loyers locaux' },
  { value: 10, label: '10% — Revenus de capitaux mobiliers' },
  { value: 15, label: '15% — Revenus distribués non-résidents' },
  { value: 20, label: '20% — Redevances / brevets non-résidents' },
];

export const DOC_PREFIX_KEY: Record<string, string> = {
  facture: 'prefix_facture',
  devis: 'prefix_devis',
  bon: 'prefix_bon',
  retenue: 'prefix_retenue',
  avoir: 'prefix_avoir',
  contract: 'prefix_contract',
  bl: 'prefix_bl',
  ba: 'prefix_ba',
  bs: 'prefix_bs',
  be: 'prefix_be',
  ticket: 'prefix_ticket',
};
