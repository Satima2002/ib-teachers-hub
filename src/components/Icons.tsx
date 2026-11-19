type P = { size?: number; label?: string };

function svgProps(size: number, label?: string) {
  return label
    ? { width: size, height: size, role: 'img' as const, 'aria-label': label }
    : { width: size, height: size, 'aria-hidden': true as const };
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function EyeIcon({ size = 18, label }: P) {
  return (
    <svg viewBox="0 0 24 24" {...svgProps(size, label)} {...stroke}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CheckIcon({ size = 18, label }: P) {
  return (
    <svg viewBox="0 0 24 24" {...svgProps(size, label)} {...stroke}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function BulbIcon({ size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" {...svgProps(size)} {...stroke} strokeWidth={2}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
    </svg>
  );
}

export function BoxIcon({ size = 26 }: P) {
  return (
    <svg viewBox="0 0 24 24" {...svgProps(size)} {...stroke}>
      <path d="M4 7l2-3h12l2 3" />
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 12h6" />
    </svg>
  );
}
