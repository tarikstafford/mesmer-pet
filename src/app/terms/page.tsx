export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: February 7, 2026</p>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Mesmer AR Pet App ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Mesmer is an augmented reality virtual pet application with AI-powered personalities, genetics-based breeding, and educational capabilities. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Virtual pet creation and care</li>
              <li>AI-powered conversations using GPT-4o-mini</li>
              <li>Augmented reality pet viewing (WebXR)</li>
              <li>Genetics system with trait inheritance</li>
              <li>Skill marketplace with in-app purchases</li>
              <li>Social features and friend breeding</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-3">3.1 Registration</h3>
            <p className="text-gray-700 mb-4">
              You must provide accurate and complete information during registration. You are responsible for maintaining the security of your account credentials.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">3.2 Age Requirements</h3>
            <p className="text-gray-700 mb-4">
              Users under 13 years old must obtain parental consent to use the Service (COPPA compliance). Users under 18 may have limited access to certain features.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">3.3 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are solely responsible for all activities under your account. Notify us immediately of any unauthorized use or security breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the Service for any illegal purpose or to violate any laws</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to access unauthorized areas of the Service</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use bots, scripts, or automation to manipulate the Service</li>
              <li>Share inappropriate content in conversations or pet names</li>
              <li>Exploit bugs or vulnerabilities for personal gain</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Payments and Purchases</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-3">5.1 Skill Purchases</h3>
            <p className="text-gray-700 mb-4">
              All skill purchases are processed through Stripe. Prices are in USD and subject to change. Purchases are final and non-refundable unless required by law.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">5.2 Virtual Currency</h3>
            <p className="text-gray-700 mb-4">
              Virtual currency earned through gameplay has no real-world value and cannot be exchanged for cash. It is not transferable between users.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">5.3 Refund Policy</h3>
            <p className="text-gray-700 mb-4">
              Refunds may be issued at our discretion in cases of technical errors or unauthorized charges. Contact support within 14 days of purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-3">6.1 Our Rights</h3>
            <p className="text-gray-700 mb-4">
              All content, trademarks, and intellectual property in the Service are owned by Mesmer or licensed to us. You may not copy, modify, or distribute our content without permission.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">6.2 Your Rights</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of pet names and conversation content you create. By using the Service, you grant us a license to use this content to provide and improve our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. AI-Generated Content</h2>
            <p className="text-gray-700 mb-4">
              Pet responses are generated by AI (GPT-4o-mini). While we strive for accuracy and appropriateness:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>AI responses may occasionally be inaccurate or inappropriate</li>
              <li>We are not responsible for AI-generated content</li>
              <li>Report any offensive or harmful responses to our support team</li>
              <li>Do not rely on AI responses for medical, legal, or professional advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Virtual Pet Mechanics</h2>
            <p className="text-gray-700 mb-4">
              Virtual pets require care and may enter a "Critical" state if neglected. While we've designed recovery mechanics:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Stat degradation occurs automatically based on time elapsed</li>
              <li>Recovery items can restore Critical pets but with penalties</li>
              <li>We are not responsible for pet stat loss due to user inactivity</li>
              <li>Service downtime may affect pet stats - we will provide grace periods when possible</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Privacy and Data</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-medium text-gray-700 mb-3">10.1 Service Availability</h3>
            <p className="text-gray-700 mb-4">
              The Service is provided "AS IS" without warranties of any kind. We do not guarantee uninterrupted or error-free service.
            </p>

            <h3 className="text-xl font-medium text-gray-700 mb-3">10.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, Mesmer shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at any time for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse or harassment of other users</li>
              <li>Extended period of inactivity (12+ months)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You may delete your account at any time through your account settings. Account deletion is permanent and cannot be reversed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. Significant changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms:
            </p>
            <ul className="list-none text-gray-700 mb-4">
              <li>Email: legal@mesmer-ar-pet.com</li>
              <li>Support: support@mesmer-ar-pet.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">15. Severability</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
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
