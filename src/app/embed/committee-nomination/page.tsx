import { CommitteeNominationForm } from '@/components/forms/committee-nomination-form';

/**
 * Embed route for committee nomination form
 * Can be embedded in club websites via iframe:
 * <iframe src="https://yourapp.com/embed/committee-nomination?clubId=xxx&clubName=xxx" />
 */
export default function EmbedCommitteeNominationPage({
  searchParams,
}: {
  searchParams: { clubId?: string; clubName?: string };
}) {
  const { clubId, clubName } = searchParams;

  if (!clubId || !clubName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Missing Parameters</h2>
          <p className="text-gray-700">
            This page requires both <code className="bg-gray-100 px-2 py-1 rounded">clubId</code> and{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">clubName</code> parameters.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Example: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              /embed/committee-nomination?clubId=abc123&clubName=Anytown%20Pony%20Club
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {clubName} Committee Nomination
          </h1>
          <p className="text-gray-600">
            Submit your committee nominations following the Annual General Meeting
          </p>
        </div>

        <CommitteeNominationForm
          clubId={clubId}
          clubName={clubName}
          onSubmitSuccess={() => {
            // Show success message
            window.alert('Committee nomination submitted successfully! You will receive a confirmation email.');
            // Reload to reset form
            window.location.reload();
          }}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by <strong>Pony Club Event Manager</strong>
          </p>
          <p className="mt-1">
            For technical support, contact your zone representative
          </p>
        </div>
      </div>
    </div>
  );
}
