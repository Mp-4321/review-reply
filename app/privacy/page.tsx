import Link from 'next/link'
import Navbar from '@/app/ui/navbar'

export const metadata = {
  title: 'Privacy Policy — Replyfier',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 pt-28 pb-24">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mb-10 text-sm text-slate-400">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-[15px] leading-relaxed text-slate-600">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Who we are</h2>
            <p>
              Replyfier is a software service that generates AI-powered replies to Google Business reviews.
              Replyfier acts as the data controller for personal data processed in connection with your
              account and use of the service. For any privacy-related enquiries, contact us at{' '}
              <a href="mailto:support@replyfier.com" className="text-blue-600 hover:underline">support@replyfier.com</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Data we collect</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Account data:</strong> your name and email address, collected when you sign up.</li>
              <li><strong>Payment data:</strong> billing details processed by Stripe. We do not store card numbers.</li>
              <li><strong>Review text:</strong> the text of reviews you paste or import into Replyfier in order to generate replies. This may include personal data contained in customer reviews. This data is sent to Anthropic to produce AI responses.</li>
              <li><strong>Usage data:</strong> server logs including IP addresses, request timestamps, and error events, retained for security and debugging purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Cookies</h2>
            <p>
              We use cookies and similar technologies necessary for authentication, payment processing,
              and security. See Section 4 for details on which cookies each third-party service sets.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Third-party services</h2>
            <p className="mb-3">We use the following sub-processors to deliver the service:</p>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-800">Clerk (authentication)</p>
                <p>
                  Handles account creation, login, and session management. Clerk sets session cookies
                  named <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">__session</code> and{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">__client_uat</code> in your browser.
                  Clerk servers are located in the United States and are covered by Standard Contractual Clauses.
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-800">Stripe (payments)</p>
                <p>
                  Processes subscription payments. Stripe is a PCI-DSS Level 1 certified sub-processor.
                  The Stripe.js library sets cookies named{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">__stripe_mid</code> and{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">__stripe_sid</code> for fraud prevention.
                  Stripe's privacy policy is available at{' '}
                  <span className="text-slate-500">stripe.com/privacy</span>.
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-800">Anthropic (AI)</p>
                <p>
                  Receives the review text you submit in order to generate reply suggestions. Anthropic acts
                  as a data sub-processor. Their servers are located in the United States and transfers are
                  covered by Standard Contractual Clauses. Anthropic does not use your data to train models
                  via the API.
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-800">Convex (backend infrastructure)</p>
                <p>
                  We use Convex to store and process application data necessary to provide the service.
                  Convex servers are located in the European Union (eu-west-1).
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-800">Google OAuth (Google Business Profile access)</p>
                <p>
                  When you connect your Google Business account, the OAuth authorisation flow passes through
                  Google's servers. Google may set its own cookies during this redirect. We store only the
                  OAuth access token, encrypted at rest, and use it solely to read and respond to your reviews.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Legal basis (GDPR)</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Contract (Art. 6(1)(b)):</strong> processing your account data and payment data is necessary to provide the service you signed up for.</li>
              <li><strong>Legitimate interest (Art. 6(1)(f)):</strong> server logs and security monitoring are necessary to protect the integrity of the service and prevent abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Your rights</h2>
            <p className="mb-2">Under the GDPR you have the right to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Rectify</strong> inaccurate data.</li>
              <li><strong>Erasure</strong> ("right to be forgotten") — see Section 7.</li>
              <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Object</strong> to processing based on legitimate interest.</li>
            </ul>
            <p className="mt-3">
              You also have the right to lodge a complaint with your local data protection authority.
            </p>
            <p className="mt-3">
              To exercise any of these rights, email{' '}
              <a href="mailto:support@replyfier.com" className="text-blue-600 hover:underline">support@replyfier.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Data retention</h2>
            <p>
              We retain your data for as long as your account is active. When you delete your account,
              all personal data is permanently deleted within <strong>30 days</strong>. Payment records
              may be retained for longer where required by tax law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. International transfers</h2>
            <p>
              Clerk and Anthropic operate servers in the United States. Transfers of personal data
              to these providers are governed by Standard Contractual Clauses (SCCs) approved by
              the European Commission, ensuring an adequate level of data protection.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">9. Contact</h2>
            <p>
              For any questions about this policy or your personal data, contact us at{' '}
              <a href="mailto:support@replyfier.com" className="text-blue-600 hover:underline">support@replyfier.com</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="pb-10 text-center text-xs text-slate-400">
        Replyfier · <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
        {' · '}
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
      </footer>
    </div>
  )
}
