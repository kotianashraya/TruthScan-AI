import { useNavigate } from 'react-router-dom';

export default function VerifyProductCTA() {
  const navigate = useNavigate();
  return (
    <div className="p-6 bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-700 rounded-lg text-white">
      <h3 className="text-xl font-semibold">Verify a Product</h3>
      <p className="text-sm text-white/80 mt-2">Scan a barcode, QR code, or product packaging to check authenticity.</p>
      <div className="mt-4">
        <button onClick={() => navigate('/scanner')} className="px-5 py-3 rounded-lg bg-white text-black font-semibold">Start Scanning</button>
      </div>
    </div>
  );
}
