'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import Prism, { LANG_LABELS } from './prism';

/**
 * Standalone highlighted code block (dark in both themes) with a copy button.
 * props: code (string), language ('bash', 'python', 'tsx' …), label (overrides the language label)
 */
export default function CodeBlock({ code = '', language, label }) {
  const t = useTranslations('article');
  const [copied, setCopied] = useState(false);
  const grammar = language && Prism.languages[language];
  const highlighted = useMemo(() => (grammar ? Prism.highlight(code, grammar, language) : null), [code, grammar, language]);
  const display = label || (language ? LANG_LABELS[language] || language : undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="tm-code tm-code-wrap" data-lang={display}>
      <pre tabIndex={0} className={language ? `language-${language}` : undefined}>
        {highlighted ? (
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
      <button type="button" className="tm-copy-btn" data-copied={copied} aria-label={t('copyCode')} onClick={copy}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        <span>{copied ? t('copied') : t('copy')}</span>
      </button>
    </div>
  );
}
