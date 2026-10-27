import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type Variant } from './buttonClass';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button type="button" {...props} className={buttonClass(variant, className)} />;
}
