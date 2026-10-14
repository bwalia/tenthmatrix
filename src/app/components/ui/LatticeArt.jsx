import cx from './cx';
import s from './LatticeArt.module.scss';

/**
 * Brand illustration built from the logo's lattice (BRAND.md §9): a field of
 * faint 6-unit cells, the 3x3 "model" in ink, the tenth cell stepped out in
 * accent, and a short trail of cells that tick on in sequence (the agent
 * acting). Decorative: aria-hidden. Motion is CSS-only and stops under
 * prefers-reduced-motion.
 *
 * props: cols (default 12), rows (default 9), at [col,row] of the 3x3 cluster's top-left, animate (default true), className
 */
export default function LatticeArt({ cols = 12, rows = 9, at = [3, 4], animate = true, density = 'full', className }) {
  const U = 8; // 6 cell + 2 gap
  const [cx0, cy0] = at;
  const clusterRight = (cx0 + 3) * U - 2; // right edge of 3x3
  const clusterTop = cy0 * U;
  const tenth = { x: clusterRight + 4, y: clusterTop - 4 - 6 };
  const trail = [1, 2, 3, 4].map((i) => ({ x: tenth.x + i * U, y: tenth.y - i * U }));

  const inCluster = (c, r) => c >= cx0 && c < cx0 + 3 && r >= cy0 && r < cy0 + 3;
  const overlaps = (x, y, box) => x < box.x + 7 && x + 7 > box.x && y < box.y + 7 && y + 7 > box.y;
  const field = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * U;
      const y = r * U;
      if (inCluster(c, r)) continue;
      if (overlaps(x, y, tenth) || trail.some((t) => overlaps(x, y, t))) continue;
      if (density === 'sparse' && (c + r) % 2) continue;
      field.push({ x, y, k: `${c}-${r}` });
    }
  }
  const cluster = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cluster.push({ x: (cx0 + c) * U, y: (cy0 + r) * U, k: `${c}${r}` });

  const w = cols * U - 2;
  const h = rows * U - 2;
  return (
    <svg
      className={cx('tm-lattice', s.art, animate && s.animate, className)}
      viewBox={`-2 -2 ${w + 4} ${h + 4}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className={s.field}>
        {field.map((f) => (
          <rect key={f.k} x={f.x} y={f.y} width="6" height="6" rx="1" />
        ))}
      </g>
      <g className={s.cluster}>
        {cluster.map((f) => (
          <rect key={f.k} x={f.x} y={f.y} width="6" height="6" rx="1" />
        ))}
      </g>
      <g className={s.trail}>
        {trail
          .filter((t) => t.x + 6 <= w && t.y >= 0)
          .map((t, i) => (
            <rect key={i} x={t.x} y={t.y} width="6" height="6" rx="1" style={{ '--i': i }} />
          ))}
      </g>
      <rect className={s.tenth} x={tenth.x} y={tenth.y} width="6" height="6" rx="1" />
    </svg>
  );
}
