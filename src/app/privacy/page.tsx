import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen text-neutral-200 pb-12">
      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold mb-2">
            Privacy Policy
          </h1>
          <p className="text-neutral-500 text-sm">
            Last updated: December 08, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>PreseedMe</strong>. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and protect your information when you use our platform 
              to share your projects, vote, or interact with micro-investors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>
                <strong>Account Information:</strong> When you sign in (via Google or other providers), we collect your authentication ID (UID), email address, and profile picture to manage your identity.
              </li>
              <li>
                <strong>Usage Data:</strong> We track your interactions, including the ideas you "Like," the projects you view, and your engagement with our "Weekly Winners" features.
              </li>
              <li>
                <strong>User Content:</strong> Any ideas, descriptions, or comments you submit to the platform are stored and displayed publicly.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-neutral-400">
              <li>Facilitate the core functionality of PreseedMe (displaying ideas, counting likes).</li>
              <li>Calculate metrics for our "Weekly Winners" and "Featured Ideas" sections.</li>
              <li>Prevent fraud and ensure unique voting (one like per user per idea).</li>
              <li>Display relevant advertisements via our partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Advertising</h2>
            <p>
              We use cookies to maintain your signed-in state. Additionally, our application includes third-party advertising components 
              (e.g., AdBanner). These third-party vendors may use cookies to serve ads based on your prior visits to our website or other websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention & Deletion</h2>
            <p>
              We retain your personal data only as long as necessary to provide our services. You may request the deletion of your account 
              and associated data by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:<br />
              <a href="mailto:team@preseedme.com" className="text-[var(--brand)] hover:underline">team@preseedme.com</a>
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-white/10">
          <Link href="/" className="text-sm text-neutral-500 hover:text-[var(--brand)] transition-colors">
            Go Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}