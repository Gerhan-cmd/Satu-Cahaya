export type Variant = 'primary' | 'ghost';

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  const base =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-gold text-midnight hover:bg-ivory'
      : 'border border-mist/40 text-ivory hover:border-gold hover:text-gold';
  return `${base} ${styles} ${extra}`;
}
