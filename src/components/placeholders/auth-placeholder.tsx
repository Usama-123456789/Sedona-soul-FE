import type { ReactNode } from "react";

type AuthPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
};

export function AuthPlaceholder({ eyebrow, title, description, footer }: AuthPlaceholderProps) {
  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(48,30,16,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A89A82]">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl font-normal leading-tight text-[#16352B]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#7C7363]">{description}</p>
      {footer ? <div className="mt-6 text-sm text-[#7C7363]">{footer}</div> : null}
    </section>
  );
}
