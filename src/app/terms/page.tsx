import { PublicHeader } from '@/components/public-header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using GoalMates, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Content</h2>
              <p className="text-gray-600">
                You retain all rights to any content you submit, post or display on or through GoalMates. By submitting content, you grant GoalMates a worldwide, non-exclusive license to use, copy, modify, and distribute your content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h2>
              <p className="text-gray-600">
                You agree not to engage in any activity that interferes with or disrupts the services or servers and networks connected to GoalMates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Termination</h2>
              <p className="text-gray-600">
                We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify or replace these terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 