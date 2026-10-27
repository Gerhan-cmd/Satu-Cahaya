export const REPORT_REASONS = ['tidak_pantas', 'spam', 'data_pribadi', 'membahayakan', 'lainnya'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  tidak_pantas: 'Isinya tidak pantas',
  spam: 'Spam atau promosi',
  data_pribadi: 'Memuat data pribadi',
  membahayakan: 'Berpotensi membahayakan seseorang',
  lainnya: 'Alasan lain',
};
