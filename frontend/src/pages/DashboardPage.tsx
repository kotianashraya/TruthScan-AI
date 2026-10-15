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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
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
        <div className="p-4 text-xs font-mono text-gray-400 bg-white/5 rounded-xl border border-white/5">
          Authenticated Session: {currentUser?.displayName ?? currentUser?.email}
        </div>
      </section>
    </div>
  );
}
