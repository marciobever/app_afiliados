"use client";

import * as React from "react";

/* helpers */
export function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/* Card */
export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={cx(
        "rounded-2xl border border-[#FFD9CF] bg-white shadow-sm",
        props.className
      )}
    />
  );
}
export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between p-5 border-b border-[#FFD9CF]",
        className
      )}
    >
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle ? (
          <div className="text-sm text-[#6B7280] mt-0.5">{subtitle}</div>
        ) : null}
      </div>
      {right}
    </div>
  );
}
export function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("p-5", props.className)} />;
}

/* Form */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "border border-[#FFD9CF] rounded-lg px-3 py-2 w-full text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]",
        props.className
      )}
    />
  );
}
export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cx(
        "border border-[#FFD9CF] rounded-lg p-2 w-full text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D]",
        props.className
      )}
    />
  );
}

/* Button */
export function Button({
  children,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-[#EE4D2D] hover:bg-[#D8431F] text-white"
      : variant === "outline"
      ? "border border-[#FFD9CF] hover:bg-[#FFF4F0] text-[#111827]"
      : "text-[#111827] hover:bg-[#FFF4F0]";
  return (
    <button
      {...rest}
      className={cx(
        "px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        styles,
        rest.className
      )}
    >
      {children}
    </button>
  );
}

/* Badge */
export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "success" | "muted";
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  const style =
    tone === "success"
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-100 text-gray-600 border border-gray-200";
  return <span className={cx(base, style, className)}>{children}</span>;
}

/* Tabs (mesmo estilo da config) */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { key: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-[#FFD9CF] bg-white shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cx(
              "px-4 py-3 text-sm font-medium border-r last:border-r-0 transition-colors flex items-center justify-center gap-2",
              "border-[#FFD9CF]",
              value === t.key
                ? "bg-[#EE4D2D] text-white"
                : "bg-white text-[#111827] hover:bg-[#FFF4F0]"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Section header (título + subtítulo) */
export function SectionHeader({
  title,
  subtitle,
  emoji,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  emoji?: string;
}) {
  return (
    <header className="pt-4 sm:pt-6">
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
        {emoji ? <span className="text-2xl">{emoji}</span> : null}
        {title}
      </h1>
      {subtitle ? (
        <div className="text-sm text-[#6B7280] mt-1">{subtitle}</div>
      ) : null}
    </header>
  );
}
