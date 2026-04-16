/** Concept 02 mark — Screen Pulse (from brand identity system). */
export function BrandMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      aria-hidden
    >
      <rect
        x="6"
        y="10"
        width="68"
        height="52"
        rx="12"
        fill="none"
        stroke="#FFAA00"
        strokeWidth="3"
      />
      <rect
        x="12"
        y="16"
        width="56"
        height="40"
        rx="8"
        fill="#FFAA00"
        opacity="0.06"
      />
      <line
        x1="30"
        y1="24"
        x2="30"
        y2="48"
        stroke="#FFAA00"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="36"
        x2="50"
        y2="24"
        stroke="#FFAA00"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="36"
        x2="50"
        y2="48"
        stroke="#FFAA00"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="40" cy="68" r="3" fill="#7B61FF" />
      <circle
        cx="40"
        cy="68"
        r="6"
        fill="none"
        stroke="#7B61FF"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle
        cx="40"
        cy="68"
        r="10"
        fill="none"
        stroke="#7B61FF"
        strokeWidth="1"
        opacity="0.25"
      />
    </svg>
  );
}
