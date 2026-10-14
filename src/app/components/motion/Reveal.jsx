'use client';

import { motion, useReducedMotion } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1]; // --tm-ease-out

/**
 * "The step" (BRAND.md §10): children arrive with a short rise + fade,
 * staggered 40ms like cells filling a row. Use `stagger` on a list wrapper and
 * <RevealItem> for each child, or plain <Reveal> for a single block.
 * Reduced motion: same markup and the same initial styles as the server render
 * (useReducedMotion is null on the server, so a different "hidden" state caused
 * a hydration mismatch); only the transition changes, to an instant cut.
 *
 * props: as ('div'), stagger (bool), delay (s), y (px, default 10), once (default true), className
 */
export default function Reveal({ as = 'div', stagger = false, delay = 0, y = 10, once = true, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  const variants = stagger
    ? { hidden: {}, show: { transition: reduce ? { duration: 0 } : { staggerChildren: 0.04, delayChildren: delay } } }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { duration: 0.36, ease: EASE_OUT, delay } },
      };
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once, amount: 0.15 }} variants={variants} {...rest}>
      {children}
    </Tag>
  );
}

export function RevealItem({ as = 'div', y = 10, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  const variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { duration: 0.36, ease: EASE_OUT } },
  };
  return (
    <Tag
      className={className}
      variants={variants}
      {...rest}
    >
      {children}
    </Tag>
  );
}

