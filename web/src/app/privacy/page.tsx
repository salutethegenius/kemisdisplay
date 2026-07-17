import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal-page";
import { getSiteUrl } from "@/lib/site";

const title = "Privacy Policy";
const description =
  "How KemisDisplay LLC collects, uses, and protects personal information, in line with the Bahamas Data Protection (Privacy of Personal Information) Act, 2003.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/privacy` },
  openGraph: {
    title: `${title} · KemisDisplay`,
    description,
    url: `${getSiteUrl()}/privacy`,
    siteName: "KemisDisplay",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="2 May 2026"
      intro={
        <p>
          KemisDisplay LLC (&ldquo;<strong>KemisDisplay</strong>,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates the digital signage
          platform available at kemisdisplay.com (the &ldquo;<strong>Service</strong>&rdquo;).
          This policy explains what personal information we collect, why we
          collect it, who we share it with, and the rights you have under the
          Bahamian{" "}
          <em>
            Data Protection (Privacy of Personal Information) Act, 2003
          </em>{" "}
          (the &ldquo;<strong>DPA</strong>&rdquo;).
        </p>
      }
    >
      <Section heading="1. Who we are">
        <p>
          KemisDisplay LLC is a Bahamian company and a member of the KGC family
          of companies, with its registered address at Freeport, Grand Bahama,
          The Bahamas. For privacy questions, including requests to exercise
          your rights, contact us at{" "}
          <a
            href="mailto:legal@kemisdisplay.com"
            className="text-brand-amber underline"
          >
            legal@kemisdisplay.com
          </a>
          .
        </p>
      </Section>

      <Section heading="2. Who this policy covers">
        <p>This policy applies to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Account holders</strong> &mdash; people who sign up and use
            the dashboard.
          </li>
          <li>
            <strong>Visitors</strong> &mdash; people who browse our marketing
            pages.
          </li>
          <li>
            <strong>Display viewers</strong> &mdash; we do not collect personal
            information from people who simply look at a TV running our display
            page. We only know that the screen polled our API.
          </li>
        </ul>
      </Section>

      <Section heading="3. Information we collect">
        <p>
          <strong>Information you give us</strong> when you create an account
          or use the Service: your email address, business name, password (only
          ever stored hashed), and the menus, images, and videos you upload or
          create.
        </p>
        <p>
          <strong>Information collected automatically</strong> as you use the
          Service: IP address, browser and device information, log timestamps,
          and the times each of your screens last polled our API. We use this
          to operate, secure, and improve the Service.
        </p>
        <p>
          <strong>Billing information</strong> is processed by Stripe. We store
          a Stripe customer reference but not full card details.
        </p>
        <p>
          We do not knowingly collect special categories of personal data
          (health, religion, biometrics, etc.), and the Service is not designed
          to be used to display them.
        </p>
      </Section>

      <Section heading="4. How we use your information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide and operate the Service (including authentication and rendering menu videos);</li>
          <li>Bill and collect payment for paid plans;</li>
          <li>Communicate with you about your account, security, and updates;</li>
          <li>Investigate and prevent abuse, fraud, and security incidents;</li>
          <li>Improve, debug, and develop new features;</li>
          <li>Comply with legal obligations and enforce our Terms of Use.</li>
        </ul>
      </Section>

      <Section heading="5. Legal basis for processing (DPA)">
        <p>
          Under section 6 of the DPA, our processing is based on one or more of
          the following:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Performance of a contract</strong> &mdash; running the
            Service for you under our Terms of Use;
          </li>
          <li>
            <strong>Legitimate interests</strong> &mdash; protecting our
            systems, preventing abuse, and improving the product, where these
            interests are not overridden by your fundamental rights;
          </li>
          <li>
            <strong>Legal obligation</strong> &mdash; complying with Bahamian
            tax, accounting, and regulatory requirements;
          </li>
          <li>
            <strong>Your consent</strong> &mdash; where we ask for it, for
            example before sending optional marketing emails.
          </li>
        </ul>
      </Section>

      <Section heading="6. Who we share information with">
        <p>
          We do not sell personal information. We share it only with service
          providers who help us run the Service, and only to the extent each
          provider needs to do its job. Today these include:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Cloud infrastructure</strong> &mdash; Railway and Vercel
            for hosting; Cloudflare R2 for media storage; Mux for video
            delivery in some cases.
          </li>
          <li>
            <strong>Payment processing</strong> &mdash; Stripe processes
            subscription payments. Card data is handled by Stripe, not by us.
          </li>
          <li>
            <strong>Email and support tools</strong> &mdash; transactional
            email and customer support providers, where applicable.
          </li>
          <li>
            <strong>Legal and safety</strong> &mdash; we may disclose
            information if required by law, to enforce our Terms, or to protect
            the rights, property, or safety of KemisDisplay, our users, or the
            public.
          </li>
          <li>
            <strong>Corporate transactions</strong> &mdash; if we are part of a
            merger, acquisition, or sale of assets, your information may be
            transferred, subject to this policy.
          </li>
        </ul>
      </Section>

      <Section heading="7. International transfers">
        <p>
          The providers above are based in or operate from countries outside
          The Bahamas, primarily the United States and the European Union.
          When personal information is transferred internationally, we rely on
          contractual safeguards with our providers and on the providers&apos;
          own compliance frameworks to protect it. By using the Service you
          acknowledge that your information may be processed outside The
          Bahamas.
        </p>
      </Section>

      <Section heading="8. Cookies and similar technologies">
        <p>
          We use a small number of strictly necessary cookies and browser
          storage entries to keep you signed in, remember your screen&apos;s
          last playlist, and keep the dashboard usable. We do not use
          third-party advertising or cross-site tracking cookies.
        </p>
      </Section>

      <Section heading="9. How long we keep information">
        <p>
          We keep account information for as long as your account is active.
          If you ask us to delete your account, we will delete or anonymise
          your personal information within a reasonable period unless we are
          legally required to retain it (for example, for tax or accounting
          records). Backups are rotated and overwritten on a regular schedule.
        </p>
      </Section>

      <Section heading="10. Your rights under the DPA">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Ask whether we hold personal information about you and request a copy of it;</li>
          <li>Ask us to correct information that is inaccurate or incomplete;</li>
          <li>Withdraw consent where consent is the basis for processing;</li>
          <li>Object to processing carried out under our legitimate interests, on grounds relating to your particular situation;</li>
          <li>Ask us to delete your account and associated personal information, subject to legal retention requirements.</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a
            href="mailto:legal@kemisdisplay.com"
            className="text-brand-amber underline"
          >
            legal@kemisdisplay.com
          </a>
          . We will respond within the timeframe required by the DPA. If you
          believe we have not handled your information appropriately, you may
          also lodge a complaint with the Office of the Data Protection
          Commissioner of The Bahamas.
        </p>
      </Section>

      <Section heading="11. How we protect information">
        <p>
          We use industry-standard safeguards: TLS for data in transit, hashed
          passwords, scoped access keys for storage, role-based access to
          production systems, and audit logs for sensitive operations. No
          system is perfectly secure. If we become aware of a breach affecting
          your personal information, we will notify you and, where required by
          the DPA, the Data Protection Commissioner.
        </p>
      </Section>

      <Section heading="12. Children">
        <p>
          The Service is intended for businesses and is not directed to
          children under 18. We do not knowingly collect personal information
          from children. If you believe a child has provided us with personal
          information, contact us and we will delete it.
        </p>
      </Section>

      <Section heading="13. Changes to this policy">
        <p>
          We may update this policy from time to time. When we make material
          changes, we will update the effective date at the top of this page
          and, where appropriate, notify you by email or through the
          dashboard. Your continued use of the Service after a change becomes
          effective means you accept the updated policy.
        </p>
      </Section>

      <Section heading="14. Contact us">
        <p>
          KemisDisplay LLC
          <br />
          A KGC Company
          <br />
          Freeport, Grand Bahama, The Bahamas
          <br />
          <a
            href="mailto:legal@kemisdisplay.com"
            className="text-brand-amber underline"
          >
            legal@kemisdisplay.com
          </a>
        </p>
        <p className="text-sm text-brand-muted">
          See also our{" "}
          <Link href="/terms" className="text-brand-amber underline">
            Terms of Use
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
