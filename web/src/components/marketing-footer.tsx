import Link from "next/link";

const YEAR = new Date().getFullYear();

export function MarketingFooter() {
  return (
    <footer className="bg-brand-amber text-brand-deep">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-baseline gap-1 font-display text-xl font-bold tracking-tight"
            >
              <span>Kemis</span>
              <span className="text-brand-warm">Display</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-brand-deep/85">
              Browser-based digital signage. Turn any TV into a revenue screen.
            </p>
          </div>

          <FooterColumn
            heading="Product"
            links={[
              { href: "/", label: "Overview" },
              { href: "/signup", label: "Start free trial" },
              { href: "/login", label: "Log in" },
            ]}
          />

          <FooterColumn
            heading="Legal"
            links={[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Use" },
            ]}
          />

          <FooterColumn
            heading="Contact"
            links={[
              {
                href: "mailto:legal@kemisdisplay.com",
                label: "legal@kemisdisplay.com",
              },
            ]}
          >
            <address className="mt-3 not-italic text-sm leading-relaxed text-brand-deep/85">
              KemisDisplay LLC
              <br />
              A KGC Company
              <br />
              Freeport, GB
              <br />
              The Bahamas
            </address>
          </FooterColumn>
        </div>

        <div className="border-t border-brand-deep/15 pt-6 text-xs leading-relaxed text-brand-deep/80 sm:flex sm:items-center sm:justify-between">
          <p>
            © {YEAR} KemisDisplay LLC. All rights reserved.
          </p>
          <p className="mt-2 sm:mt-0">
            A product of the KGC family. Built in The Bahamas.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
  children,
}: {
  heading: string;
  links: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-deep/70">
        {heading}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-brand-deep transition hover:text-brand-warm"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
