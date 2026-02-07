export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: February 7, 2026</p>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Mesmer AR Pet App ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our augmented reality virtual pet application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Email address and name (for account creation)</li>
              <li>Date of birth (for COPPA compliance and age verification)</li>
              <li>Password (encrypted and stored securely)</li>
              <li>Payment information (processed securely through Stripe, we do not store card details)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-700 mb-3">2.2 Pet and Interaction Data</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Pet creation details, names, genetic traits, and stats</li>
              <li>Conversations with your AI pet (encrypted at rest)</li>
              <li>Game states and interaction history</li>
              <li>Breeding records and lineage information</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-700 mb-3">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Device information and browser type</li>
              <li>IP address and location data (for EU cookie consent detection)</li>
              <li>Session data and usage analytics</li>
              <li>AR session performance metrics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To provide and maintain our AR pet services</li>
              <li>To personalize your pet's AI-powered personality and interactions</li>
              <li>To process payments and manage skill purchases</li>
              <li>To send important account notifications (not marketing, unless consented)</li>
              <li>To improve our services through analytics and error monitoring</li>
              <li>To comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Encryption at Rest:</strong> All LLM conversations and sensitive data are encrypted in our database</li>
              <li><strong>Encryption in Transit:</strong> All data transmission uses HTTPS/TLS encryption</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with salt</li>
              <li><strong>Payment Security:</strong> All payments processed through PCI-compliant Stripe</li>
              <li><strong>Access Controls:</strong> Strict authentication and authorization on all API endpoints</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-700 mb-4">
              <strong>We do NOT sell your data to third parties.</strong> We only share data with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>OpenAI:</strong> Your pet conversations are sent to OpenAI's GPT-4o-mini API for AI responses (subject to OpenAI's privacy policy)</li>
              <li><strong>Stripe:</strong> Payment information for skill purchases (subject to Stripe's privacy policy)</li>
              <li><strong>Sentry:</strong> Anonymized error logs for monitoring and debugging</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights (GDPR & CCPA)</h2>
            <p className="text-gray-700 mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Right to Access:</strong> Request a copy of all your data (use our Data Export feature)</li>
              <li><strong>Right to Rectification:</strong> Update incorrect or incomplete information in your account settings</li>
              <li><strong>Right to Erasure:</strong> Delete your account and all associated data (permanent action)</li>
              <li><strong>Right to Data Portability:</strong> Export your data in JSON format</li>
              <li><strong>Right to Withdraw Consent:</strong> Opt out of marketing communications or data processing</li>
              <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use essential cookies for authentication and session management. EU users will see a cookie consent banner on first visit. You can manage cookie preferences at any time.
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Essential Cookies:</strong> Required for login and app functionality (cannot be disabled)</li>
              <li><strong>Analytics Cookies:</strong> Track usage patterns to improve our service (optional, requires consent)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences (optional)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Children's Privacy (COPPA Compliance)</h2>
            <p className="text-gray-700 mb-4">
              Users under 13 years old require parental consent to use our services. We implement an age gate during registration:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Users under 13 will be redirected to a parental consent process</li>
              <li>Limited data collection for users under 13</li>
              <li>Parents can review, modify, or delete their child's data at any time</li>
              <li>No targeted advertising to children</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data for as long as your account is active or as needed to provide services. You can request deletion at any time. After deletion request:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Active data deleted within 30 days</li>
              <li>Backups purged within 90 days</li>
              <li>Legal/financial records retained as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your data may be transferred to and processed in countries other than your own. We ensure adequate safeguards are in place for international transfers in compliance with GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy concerns, data requests, or questions about this policy:
            </p>
            <ul className="list-none text-gray-700 mb-4">
              <li>Email: privacy@mesmer-ar-pet.com</li>
              <li>Data Protection Officer: dpo@mesmer-ar-pet.com</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
