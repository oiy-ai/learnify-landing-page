import { Marquee } from "~/components/ui/marquee";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Netflix",
  "YouTube",
  "Instagram",
  "Uber",
  "Spotify",
];

export function CompanyShowcase() {
  return (
    <section id="companies" className="w-full">
      <div className="py-14">
        <h3 className="text-center text-sm font-semibold text-gray-500 mb-6">
          TRUSTED BY LEADING TEAMS
        </h3>
        <div className="relative w-full bg-background">
          <Marquee className="w-full [--duration:40s] !p-0 py-4">
            {companies.map((logo, idx) => (
              <img
                key={idx}
                src={`https://cdn.magicui.design/companies/${logo}.svg`}
                className="h-10 w-28 dark:brightness-0 dark:invert"
                alt={logo}
              />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-background"></div>
        </div>
      </div>
    </section>
  );
}