"use client";

import Link from "next/link";

type Props = {
  initials: string;
  name: string;
  desc: string;
  href?: string;        // se existir vira link
  colorFrom: string;    // ex: from-[#EE4D2D]
  colorTo: string;      // ex: to-[#FF8A65]
  disabled?: boolean;   // “Em breve”
  badge?: string;       // opcional (ex.: “conectado”)
};

export default function PlatformCard({
  initials,
  name,
  desc,
  href,
  colorFrom,
  colorTo,
  disabled,
  badge,
}: Props) {
  const Wrapper: any = href && !disabled ? Link : "div";

  return (
    <Wrapper
      href={href!}
      aria-disabled={disabled}
      className={[
        "group relative rounded-2xl p-[1px] transition-transform",
        "bg-gradient-to-r", colorFrom, colorTo,
        disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01]",
      ].join(" ")}
    >
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={[
            "h-10 w-10 shrink-0 rounded-xl text-white font-semibold",
            "flex items-center justify-center",
            "bg-gradient-to-br", colorFrom, colorTo
          ].join(" ")}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
              {badge && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4">
          {disabled ? (
            <button
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            >
              Em breve
            </button>
          ) : (
            <span
              className={[
                "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm",
                "border border-transparent bg-gray-900 text-white",
                "group-hover:bg-gray-800"
              ].join(" ")}
            >
              Abrir
              <svg width="16" height="16" viewBox="0 0 24 24" className="ml-0.5">
                <path fill="currentColor" d="M13.172 12L8.222 7.05l1.414-1.414L16 12l-6.364 6.364l-1.414-1.414z"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
