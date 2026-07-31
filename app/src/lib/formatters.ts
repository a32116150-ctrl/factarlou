export function formatNumber(value: number | string | null | undefined, decimalPlaces = 3): string {
  const num = Number(value || 0);
  return num.toLocaleString('fr-TN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

export function formatCurrency(value: number | string | null | undefined, currency = 'TND', decimalPlaces = 3): string {
  const num = Number(value || 0);
  return `${num.toLocaleString('fr-TN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })} ${currency}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
}

export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  facture: 'Facture',
  devis: 'Devis',
  bon: 'Bon de commande',
  bl: 'Bon de livraison',
  ba: 'Bon d\'achat',
  bs: 'Bon de sortie',
  be: 'Bon d\'entrée',
  avoir: 'Avoir',
  ticket: 'Ticket',
  proforma: 'Proforma',
  forfaitaire: 'Forfaitaire',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Impayé',
  paid: 'Payé',
  partial: 'Partiel',
};

export const RETENUE_STATUS_LABELS: Record<string, string> = {
  emis: 'Émis',
  encaisse: 'Encaissé',
  annule: 'Annulé',
};
