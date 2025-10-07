// …cabeçalho do arquivo igual…

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
-  title: string;
-  subtitle?: string;
+  title: React.ReactNode;
+  subtitle?: React.ReactNode;
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
          <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}
