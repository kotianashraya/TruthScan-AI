export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-semibold">Scan History</h1>
        <p className="text-sm text-gray-400 mt-1">All your past verifications will appear here.</p>
        <div className="mt-6 bg-white/3 p-6 rounded-lg text-center">
          <div className="text-gray-400">No history to show yet.</div>
        </div>
      </div>
    </main>
  );
}
