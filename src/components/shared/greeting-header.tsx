type GreetingHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function GreetingHeader({ eyebrow, title, description }: GreetingHeaderProps) {
  return (
    <header>
      <p className="sedona-eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-serif text-[38px] font-normal leading-[1.08] text-sedona-pineSoft pwa:text-[42px]">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-[15px] leading-6 text-sedona-stone">{description}</p> : null}
    </header>
  );
}
