import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | ZenRent',
  description: 'ZenRent Privacy Policy and Data Protection Information',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-lg text-gray-600 mb-6">
            <strong>Effective Date:</strong> January 1, 2024<br />
            <strong>Last Updated:</strong> January 15, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ZenRent Ltd is committed to protecting your privacy and ensuring the security of your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Contact Information</h2>
            <p className="text-gray-700">
              <strong>Data Protection Officer:</strong> dpo@zenrent.com<br />
              <strong>Privacy Team:</strong> privacy@zenrent.com<br />
              <strong>Phone:</strong> +44 20 1234 5680
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Account information (name, email, phone, address)</li>
              <li>Property and tenant management data</li>
              <li>Tax information and HMRC submissions</li>
              <li>Financial transactions via Plaid integration</li>
              <li>Communications and support interactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Providing property management services</li>
              <li>Processing tax calculations and HMRC submissions</li>
              <li>Facilitating payments and financial reporting</li>
              <li>Customer support and platform improvements</li>
              <li>Legal compliance and fraud prevention</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.3 for data in transit</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits and monitoring</li>
              <li>24/7 incident response capabilities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate information</li>
              <li>Erase data (subject to legal requirements)</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
            <p className="text-gray-700">
              For privacy concerns or to exercise your rights:<br />
              Email: <a href="mailto:privacy@zenrent.com" className="text-blue-600 hover:underline">privacy@zenrent.com</a><br />
              Phone: +44 20 1234 5680
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>Last Updated:</strong> January 15, 2024<br />
              <strong>Version:</strong> 2.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 