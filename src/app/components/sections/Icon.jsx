import { createElement } from 'react';
import { getIcon } from './iconMap';

/** Decorative lucide icon from a legacy JSON icon name. */
export default function Icon({ name, size = 20, strokeWidth, className, label }) {
  return createElement(getIcon(name), {
    size,
    strokeWidth: strokeWidth ?? (size <= 16 ? 2 : 1.75),
    className,
    'aria-hidden': label ? undefined : true,
    'aria-label': label || undefined,
    role: label ? 'img' : undefined,
    focusable: 'false',
  });
}
