import { getAllClubs, getAllZones } from '@/lib/server-data';
import { NominateCommitteeHeader } from '@/components/nominate-committee-header';
import { NominateCommitteeForm } from '@/components/nominate-committee-form';
import { serializeFirestoreData } from '@/lib/data-utils';

export const dynamic = 'force-dynamic';
export const revalidate = false;

export default async function NominateCommitteePage() {
  const [rawClubs, rawZones] = await Promise.all([
    getAllClubs(),
    getAllZones()
  ]);

  const clubs = serializeFirestoreData(rawClubs);
  const zones = serializeFirestoreData(rawZones);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <NominateCommitteeHeader />
        <NominateCommitteeForm clubs={clubs} zones={zones} />
      </div>
    </div>
  );
}
