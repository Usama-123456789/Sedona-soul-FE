import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GreetingHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function GreetingHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  className,
}: GreetingHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        actions && "min-[575px]:flex-row min-[575px]:items-start min-[575px]:justify-between",
        className,
      )}
    >
      <div className={cn("min-w-0", align === "center" && "mx-auto")}>
        <p className="sedona-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-wrap font-serif text-[36px] font-normal leading-[1.08] text-sedona-pineSoft min-[390px]:text-[38px] pwa:text-[42px]">
          {title}
        </h1>
        {description ? (
          <p className={cn("mt-3 max-w-2xl text-[15px] leading-6 text-sedona-stone", align === "center" && "mx-auto")}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
