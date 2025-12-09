import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen text-neutral-200 pb-12">
      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold mb-2">
            Terms of <span className="text-[var(--brand)]">Service</span>
          </h1>
          <p className="text-neutral-500 text-sm">
            Last updated: December 08, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using <strong>PreseedMe</strong>, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              PreseedMe is a platform connecting indie founders with potential micro-investors and the community. 
              We provide a space for users to post ideas, "like" projects, and view featured content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-neutral-400">
              <li>Use the service for any illegal purpose.</li>
              <li>Attempt to manipulate the "Like" system or "Weekly Winners" results through bots or automated scripts.</li>
              <li>Post content that is hateful, threatening, or pornographic.</li>
              <li>Harass other users or founders.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to ban any user or remove any idea that violates these rules without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>
              <strong>Your Content:</strong> You retain ownership of the ideas and content you submit. However, by posting on PreseedMe, 
              you grant us a non-exclusive, worldwide license to display, feature, and promote your content on our platform.
            </p>
            <p className="mt-2">
              <strong>Our Content:</strong> The PreseedMe code, design, and branding are owned by us and protected by copyright laws.
            </p>
          </section>

          <section className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-[var(--brand)] mb-3">5. No Financial Advice & Disclaimer</h2>
            <p className="text-sm">
              PreseedMe is a discovery platform, not a registered broker-dealer or investment advisor. 
              <strong>Nothing on this website constitutes financial advice, a recommendation to invest, or an offer to sell securities.</strong> 
            </p>
            <p className="text-sm mt-2">
              Information regarding ideas and startups is provided "as is" by the users. We do not verify the accuracy of claims made by founders. 
              Any investment or interaction you undertake is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall PreseedMe be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from 
              your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of San Francisco, California, United States, 
              without regard to its conflict of law provisions.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-white/10">
          <Link href="/" className="text-sm text-neutral-500 hover:text-[var(--brand)] transition-colors">
            ← Go Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}