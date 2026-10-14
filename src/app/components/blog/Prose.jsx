'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-docker';

/**
 * Renders trusted CMS / committed HTML and highlights <code class="language-*">
 * blocks with Prism after mount. Token colours come from --tm-code-* in the
 * design phase (no Prism theme CSS is imported here on purpose).
 */
export default function Prose({ html, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) Prism.highlightAllUnder(ref.current);
  }, [html]);
  return <div ref={ref} className={`tm-prose ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}
