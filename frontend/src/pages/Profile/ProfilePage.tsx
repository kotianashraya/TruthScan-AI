import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  return (
    <main className="min-h-screen bg-[#030712] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-display font-semibold">Profile</h1>
        <div className="mt-4 bg-white/3 p-6 rounded-lg">
          <div className="text-sm text-gray-300">Name</div>
          <div className="font-semibold mt-1">{currentUser?.displayName ?? '—'}</div>
          <div className="text-sm text-gray-300 mt-4">Email</div>
          <div className="font-semibold mt-1">{currentUser?.email ?? '—'}</div>
        </div>
      </div>
    </main>
  );
}
