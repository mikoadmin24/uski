import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Building, QrCode, Truck, Phone, Mail } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [storeName, setStoreName] = useState('USKI STORE');
  const [phone, setPhone] = useState('0812-3456-7890');
  const [email, setEmail] = useState('cs@uskistore.id');
  const [address, setAddress] = useState('Jl. Margonda Raya No. 102, Depok, Jawa Barat');
  const [bcaAccount, setBcaAccount] = useState('7120982311');
  const [bsiAccount, setBsiAccount] = useState('7190023412');
  const [qrisUrl, setQrisUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=USKI_STORE_QRIS');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#101519]">Pengaturan Global Toko</h1>
        <p className="text-xs text-body mt-1">
          Konfigurasi identitas toko, nomor rekening bank resmi, gambar QRIS, dan kontak layanan
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>Pengaturan toko berhasil disimpan ke database.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 text-xs">
        {/* Identitas Toko */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-[#101519] border-b border-hairline pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            Identitas & Kontak Toko
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-body block mb-1">Nama Toko Online</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-body block mb-1">Nomor WhatsApp Resmi CS</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-body block mb-1">Email Layanan Pelanggan</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-body block mb-1">Alamat Gudang Utama / Toko Fisik</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Rekening Bank & QRIS */}
        <div className="space-y-4 border-t border-hairline pt-6">
          <h3 className="font-extrabold text-sm text-[#101519] border-b border-hairline pb-2 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Rekening Pembayaran & QRIS Toko
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-body block mb-1">No. Rekening BCA Toko</label>
              <input
                type="text"
                value={bcaAccount}
                onChange={(e) => setBcaAccount(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-body block mb-1">No. Rekening BSI Toko</label>
              <input
                type="text"
                value={bsiAccount}
                onChange={(e) => setBsiAccount(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-body block mb-1">URL Gambar / Sumber QRIS</label>
              <input
                type="url"
                value={qrisUrl}
                onChange={(e) => setQrisUrl(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-hairline flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
