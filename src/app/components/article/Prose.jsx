'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Prism, { LANG_LABELS } from './prism';
import { externalLinksInNewTab } from '@/app/components/sections/links';

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

/**
 * Renders trusted article HTML (committed JSON / CMS) in .tm-prose and, after
 * mount, highlights <code class="language-*"> with Prism and adds a copy
 * button + language label to every <pre>. Heading ids are added server-side
 * (src/lib/articleHtml.js) so anchors work before hydration.
 */
export default function Prose({ html, className = '' }) {
  const t = useTranslations('article');
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    Prism.highlightAllUnder(root);
    const cleanups = [];
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('tm-code-wrap')) return;
      const code = pre.querySelector('code');
      const lang = (code?.className.match(/language-([\w-]+)/) || pre.className.match(/language-([\w-]+)/) || [])[1];
      const wrap = document.createElement('div');
      wrap.className = 'tm-code-wrap';
      if (lang) wrap.dataset.lang = LANG_LABELS[lang] || lang;
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      pre.setAttribute('tabindex', '0'); // scrollable region must be keyboard reachable
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tm-copy-btn';
      btn.innerHTML = `${COPY_ICON}<span>${t('copy')}</span>`;
      btn.setAttribute('aria-label', t('copyCode'));
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText((code || pre).innerText);
          btn.dataset.copied = 'true';
          btn.querySelector('span').textContent = t('copied');
          setTimeout(() => {
            btn.dataset.copied = 'false';
            btn.querySelector('span').textContent = t('copy');
          }, 1800);
        } catch {
          /* clipboard blocked: user can still select the text */
        }
      };
      btn.addEventListener('click', onClick);
      wrap.appendChild(btn);
      cleanups.push(() => btn.removeEventListener('click', onClick));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [html, t]);

  return <div ref={ref} className={`tm-prose ${className}`.trim()} dangerouslySetInnerHTML={{ __html: externalLinksInNewTab(html || '') }} />;
}
