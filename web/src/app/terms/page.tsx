import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal-page";
import { getSiteUrl } from "@/lib/site";

const title = "Terms of Use";
const description =
  "The terms governing your use of KemisDisplay, the browser-based digital signage service operated by KemisDisplay LLC under the laws of The Bahamas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/terms` },
  openGraph: {
    title: `${title} · KemisDisplay`,
    description,
    url: `${getSiteUrl()}/terms`,
    siteName: "KemisDisplay",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      effectiveDate="2 May 2026"
      intro={
        <p>
          These terms (the &ldquo;<strong>Terms</strong>&rdquo;) govern your
          use of the KemisDisplay digital signage service (the
          &ldquo;<strong>Service</strong>&rdquo;), provided by KemisDisplay
          LLC, a Bahamian company in the KGC family of companies (&ldquo;
          <strong>KemisDisplay</strong>,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; &ldquo;our&rdquo;). By creating an account or
          using the Service, you agree to these Terms. If you do not agree,
          do not use the Service.
        </p>
      }
    >
      <Section heading="1. Eligibility and account">
        <p>
          You must be at least 18 years old and able to enter into a binding
          contract to use the Service. If you sign up on behalf of a business,
          you represent that you have the authority to bind that business to
          these Terms.
        </p>
        <p>
          You are responsible for keeping your account credentials secure and
          for everything that happens under your account. Notify us at{" "}
          <a
            href="mailto:legal@kemisdisplay.com"
            className="text-brand-amber underline"
          >
            legal@kemisdisplay.com
          </a>{" "}
          if you suspect unauthorised use.
        </p>
      </Section>

      <Section heading="2. The Service">
        <p>
          KemisDisplay lets you upload images and videos, build menu boards,
          and display them on any internet-connected screen via a unique URL.
          Specific features and limits are described on our pricing page and
          in the dashboard. We may change, add, or remove features over time.
          We will give reasonable notice for changes that materially reduce
          functionality you are paying for.
        </p>
      </Section>

      <Section heading="3. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Violate any law of The Bahamas or any other applicable jurisdiction;</li>
          <li>Infringe anyone&apos;s intellectual property, privacy, or publicity rights;</li>
          <li>Display content that is defamatory, obscene, hateful, or that depicts or promotes the sexual exploitation of minors;</li>
          <li>Misrepresent your identity or affiliation;</li>
          <li>Send spam, phishing content, or malware via the Service;</li>
          <li>Probe, scan, or test the vulnerability of the Service, or attempt to bypass authentication, rate limits, or quotas;</li>
          <li>Use the Service to build a competing product, or to scrape or republish our software.</li>
        </ul>
        <p>
          We may suspend or terminate access for violations, with or without
          notice, depending on the severity.
        </p>
      </Section>

      <Section heading="4. Your content">
        <p>
          You retain ownership of all images, videos, menus, and other content
          you upload or create using the Service (&ldquo;<strong>Your
          Content</strong>&rdquo;). You grant KemisDisplay a worldwide,
          non-exclusive, royalty-free licence to host, store, transcode, cache,
          deliver, and display Your Content for the purpose of providing the
          Service to you. This licence ends when you delete the content or
          close your account, except for residual copies in routine backups
          that are rotated and overwritten over time.
        </p>
        <p>
          You represent that you own or have the necessary rights to Your
          Content (including any music in videos) and that displaying it on
          the Service does not violate any law or third-party right. You are
          solely responsible for Your Content.
        </p>
      </Section>

      <Section heading="5. Subscription, fees, and refunds">
        <p>
          The Service offers a free trial period followed by paid subscription
          plans. Current pricing is shown on our website and in the dashboard.
          Subscriptions auto-renew at the end of each billing period unless
          cancelled before the renewal date.
        </p>
        <p>
          Fees are billed in advance and are non-refundable for partial
          periods, except where required by applicable law. You can cancel at
          any time from your account settings; you will keep access through
          the end of the period you have already paid for.
        </p>
        <p>
          We may change subscription pricing on at least 30 days&apos; notice.
          If you do not accept a price change, you can cancel before the new
          price takes effect.
        </p>
      </Section>

      <Section heading="6. Service availability">
        <p>
          We work hard to keep the Service available, but we do not promise
          uninterrupted or error-free operation. The Service may be
          temporarily unavailable for maintenance, upgrades, or reasons
          outside our reasonable control (including issues at our hosting,
          storage, or payment providers, or at the network level).
        </p>
      </Section>

      <Section heading="7. Suspension and termination">
        <p>
          We may suspend or terminate your access if you breach these Terms,
          if we are required to do so by law, or if your account is inactive
          or has unpaid invoices. You may close your account at any time. On
          termination, your right to use the Service ends; provisions that by
          their nature should survive termination (including ownership,
          disclaimers, limitation of liability, and governing law) will
          survive.
        </p>
      </Section>

      <Section heading="8. Intellectual property">
        <p>
          The Service, including its software, design, and documentation, is
          owned by KemisDisplay LLC and its licensors and is protected by
          intellectual property laws. We grant you a limited, non-exclusive,
          non-transferable right to use the Service in accordance with these
          Terms. We reserve all rights not expressly granted.
        </p>
      </Section>

      <Section heading="9. Disclaimers">
        <p>
          To the maximum extent permitted by law, the Service is provided
          &ldquo;<strong>as is</strong>&rdquo; and &ldquo;<strong>as
          available</strong>&rdquo;, without warranties of any kind, express
          or implied, including warranties of merchantability, fitness for a
          particular purpose, and non-infringement. We do not warrant that
          the Service will meet your requirements, be uninterrupted, or be
          free of errors or harmful components.
        </p>
      </Section>

      <Section heading="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, KemisDisplay and its
          affiliates, officers, employees, agents, and licensors will not be
          liable for any indirect, incidental, special, consequential,
          exemplary, or punitive damages, or for any loss of profits,
          revenue, data, or goodwill, arising out of or in connection with
          your use of the Service.
        </p>
        <p>
          Our total aggregate liability arising out of or in connection with
          the Service or these Terms will not exceed the greater of
          (a) the amount you paid us for the Service in the twelve months
          before the event giving rise to the claim, or (b) one hundred
          United States dollars (USD 100).
        </p>
      </Section>

      <Section heading="11. Indemnification">
        <p>
          You agree to indemnify and hold harmless KemisDisplay and its
          affiliates from and against any third-party claims, damages,
          liabilities, and expenses (including reasonable legal fees) arising
          out of or related to (i) Your Content, (ii) your use of the
          Service, or (iii) your violation of these Terms or applicable law.
        </p>
      </Section>

      <Section heading="12. Privacy">
        <p>
          Our handling of personal information is governed by our{" "}
          <Link href="/privacy" className="text-brand-amber underline">
            Privacy Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </Section>

      <Section heading="13. Governing law and disputes">
        <p>
          These Terms and any dispute arising out of or in connection with
          them or the Service are governed by the laws of the Commonwealth of
          The Bahamas, without regard to its conflict-of-laws rules. Subject
          to applicable consumer protection rules, you and KemisDisplay
          submit to the exclusive jurisdiction of the courts of The Bahamas
          for the resolution of any such dispute.
        </p>
        <p>
          Nothing in these Terms limits your rights as a consumer under any
          mandatory rules of the jurisdiction where you live.
        </p>
      </Section>

      <Section heading="14. Electronic communications">
        <p>
          You consent to receive communications from us electronically (by
          email or through the dashboard) and you agree that electronic
          communications, agreements, and notices satisfy any legal
          requirement that such communications be in writing, in line with
          the Bahamian{" "}
          <em>Electronic Communications and Transactions Act, 2003</em>.
        </p>
      </Section>

      <Section heading="15. Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we make material
          changes, we will update the effective date and, where appropriate,
          notify you by email or through the dashboard at least 30 days
          before they take effect. Your continued use of the Service after
          the effective date means you accept the updated Terms.
        </p>
      </Section>

      <Section heading="16. Miscellaneous">
        <p>
          These Terms (together with the Privacy Policy and any order form,
          plan terms, or written agreement between us) are the entire
          agreement between you and KemisDisplay regarding the Service. If
          any provision is found unenforceable, the remaining provisions
          remain in effect. Our failure to enforce a provision is not a
          waiver of that provision. You may not assign these Terms without
          our written consent; we may assign them in connection with a
          merger, acquisition, or sale of assets.
        </p>
      </Section>

      <Section heading="17. Contact">
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
      </Section>
    </LegalPage>
  );
}
