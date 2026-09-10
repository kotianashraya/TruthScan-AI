import Sidebar from '@/pages/Dashboard/components/Sidebar';
import DashboardHeader from '@/pages/Dashboard/components/DashboardHeader';
import QuickActions from '@/pages/Dashboard/components/QuickActions';
import StatsCards from '@/pages/Dashboard/components/StatsCards';
import RecentScans from '@/pages/Dashboard/components/RecentScans';
import AuthenticityOverview from '@/pages/Dashboard/components/AuthenticityOverview';
import VerifyProductCTA from '@/pages/Dashboard/components/VerifyProductCTA';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <DashboardHeader />
            <section className="mt-6">
              <QuickActions />
            </section>

            <section className="mt-6">
              <StatsCards />
            </section>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <RecentScans />
              </div>
              <div className="space-y-6">
                <AuthenticityOverview />
                <VerifyProductCTA />
              </div>
            </div>

            <section className="mt-8">
              <div className="p-4 text-sm text-gray-400">Signed in as {currentUser?.displayName ?? currentUser?.email}</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
