'use client';

import { motion, useReducedMotion } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1]; // --tm-ease-out

/**
 * "The step" (BRAND.md §10): children arrive with a short rise + fade,
 * staggered 40ms like cells filling a row. Use `stagger` on a list wrapper and
 * <RevealItem> for each child, or plain <Reveal> for a single block.
 * Reduced motion: renders static markup (no transforms, no opacity tween).
 *
 * props: as ('div'), stagger (bool), delay (s), y (px, default 10), once (default true), className
 */
export default function Reveal({ as = 'div', stagger = false, delay = 0, y = 10, once = true, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const variants = stagger
    ? { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: delay } } }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT, delay } },
      };
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once, amount: 0.15 }} variants={variants} {...rest}>
      {children}
    </Tag>
  );
}

export function RevealItem({ as = 'div', y = 10, className, children, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT } } }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

