import { useTranslations } from 'next-intl';
import en from '@/messages/en.json';

// UI labels the page JSON doesn't carry. English lives in the `marketing`
// namespace of src/messages/en.json (translated by the i18n pipeline); a page
// JSON `ui` block still overrides any of them per locale.
export const UI_KEYS = Object.keys(en.marketing);

// Server or client component (sync). createRoute calls setRequestLocale, so the
// labels follow the [locale] segment.
export function useUiStrings(override) {
  const t = useTranslations('marketing');
  const base = Object.fromEntries(UI_KEYS.map((k) => [k, t(k)]));
  return { ...base, ...(override && typeof override === 'object' ? override : {}) };
}
