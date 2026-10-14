import { useId } from "react";
import { MARK_COLOURS, MarkCells } from "./LogoMark";

/**
 * TenthMatrix logo. Wordmark is constructed geometry (monoline, stroke 4 on a 24-unit cap height),
 * not a font, so it renders identically everywhere.
 *
 * props:
 *   size     rendered height in px (horizontal lockup default 32, stacked default 88)
 *   variant  "brand" | "light" | "dark" | "mono"  (see LogoMark)
 *   layout   "horizontal" | "stacked"
 *   title    accessible name; pass "" when the logo sits inside a link that already has a label
 */
function Wordmark({ ink, dot, uid }) {
  const mh = `${uid}-mh`;
  const xh = `${uid}-xh`;
  return (
    <>
      <g fill="none" stroke={ink} strokeWidth="4" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10">
        <clipPath id={mh}>
          <rect x="-2" y="0" width="26" height="24" />
        </clipPath>
        <clipPath id={xh}>
          <rect x="-2" y="7" width="20" height="17" />
        </clipPath>
        <path d="M0 2H16M8 2V24" />
        <path transform="translate(16 0)" d="M2.5 15.5H15A6.5 6.5 0 1 0 13.1 20.1" />
        <path transform="translate(36.5 0)" d="M2 7V24M2 15.5A6.5 6.5 0 0 1 15 15.5V24" />
        <path transform="translate(57 0)" d="M4 1V24M0 9H11" />
        <path transform="translate(72 0)" d="M2 0V24M2 15.5A6.5 6.5 0 0 1 15 15.5V24" />
        <g transform="translate(92.5 0)">
          <path d="M2 26V-2L11 13L20 -2V26" clipPath={`url(#${mh})`} />
        </g>
        <g transform="translate(118 0)">
          <path d="M15 7V24" />
          <circle cx="8.5" cy="15.5" r="6.5" />
        </g>
        <path transform="translate(138 0)" d="M4 1V24M0 9H11" />
        <path transform="translate(152.5 0)" d="M2 7V24M2 15.5A6.5 6.5 0 0 1 8.5 9H12" />
        <path transform="translate(168.5 0)" d="M2 7V24" />
        <g transform="translate(176.5 0)">
          <path d="M-1 4L17 27M17 4L-1 27" clipPath={`url(#${xh})`} />
        </g>
      </g>
      <rect x="168.5" y="0" width="4" height="4" fill={dot} />
    </>
  );
}

const WORDMARK_W = 192.5;

export default function Logo({ size, variant = "brand", layout = "horizontal", title = "TenthMatrix", className, ...rest }) {
  const uid = useId().replace(/:/g, "");
  const c = MARK_COLOURS[variant] || MARK_COLOURS.brand;
  const decorative = title === "" || title == null;
  const stacked = layout === "stacked";
  const vbW = stacked ? WORDMARK_W : 236.5;
  const vbH = stacked ? 88 : 32;
  const h = size ?? (stacked ? 88 : 32);
  const w = (h * vbW) / vbH;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={w}
      height={h}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : `${uid}-t`}
      focusable="false"
      {...rest}
    >
      {!decorative && <title id={`${uid}-t`}>{title}</title>}
      {stacked ? (
        <>
          <g transform={`translate(${(WORDMARK_W - 48) / 2} 0) scale(1.5)`}>
            <MarkCells ink={c.ink} accent={c.accent} />
          </g>
          <g transform="translate(0 64)">
            <Wordmark ink={c.ink} dot={c.accent} uid={uid} />
          </g>
        </>
      ) : (
        <>
          <MarkCells ink={c.ink} accent={c.accent} />
          <g transform="translate(44 8)">
            <Wordmark ink={c.ink} dot={c.accent} uid={uid} />
          </g>
        </>
      )}
    </svg>
  );
}
