import { useId } from "react";

/**
 * TenthMatrix mark: a 3x3 matrix with a tenth cell stepped out beyond its corner.
 * Drawn on a 32-unit grid (cells 6, gaps 2) so it lands on whole pixels at 16, 32, 48 and 64 px.
 *
 * variant:
 *   "brand"   ink + accent from theme tokens (--tm-logo-ink / --tm-logo-accent), adapts to light/dark
 *   "light"   fixed colours for light backgrounds
 *   "dark"    fixed colours for dark backgrounds
 *   "mono"    single colour, inherits currentColor
 */
export const MARK_COLOURS = {
  brand: { ink: "var(--tm-logo-ink, #12161A)", accent: "var(--tm-logo-accent, #0A7A57)" },
  light: { ink: "#12161A", accent: "#0A7A57" },
  dark: { ink: "#F1F2EE", accent: "#3DD69E" },
  mono: { ink: "currentColor", accent: "currentColor" },
};

export function MarkCells({ ink, accent }) {
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push(<rect key={`${row}-${col}`} x={col * 8} y={10 + row * 8} width="6" height="6" rx="1" />);
    }
  }
  return (
    <>
      <g fill={ink}>{cells}</g>
      <rect x="26" y="0" width="6" height="6" rx="1" fill={accent} />
    </>
  );
}

export default function LogoMark({ size = 32, variant = "brand", title = "TenthMatrix", className, ...rest }) {
  const titleId = useId();
  const c = MARK_COLOURS[variant] || MARK_COLOURS.brand;
  const decorative = title === "" || title == null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      focusable="false"
      {...rest}
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <MarkCells ink={c.ink} accent={c.accent} />
    </svg>
  );
}
