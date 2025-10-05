// components/Logo.tsx
export default function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center rounded-lg"
        style={{ width: size, height: size, background: 'linear-gradient(135deg,#EE4D2D 0%,#F5856B 100%)' }}
      >
        <svg width={size - 10} height={size - 10} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 7h12v2H8v3h8v2H8v3h10v2H6V7Z" fill="white"/>
        </svg>
      </span>
      {withText && <span className="font-semibold tracking-tight">SeuReview</span>}
    </div>
  );
}
