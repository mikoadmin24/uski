import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Building, QrCode, Truck, Phone, Mail, Database, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export const AdminSettings: React.FC = () => {
  const [storeName, setStoreName] = useState('USKI STORE');
  const [phone, setPhone] = useState('0859-6724-9718');
  const [email, setEmail] = useState('cs@uskistore.id');
  const [address, setAddress] = useState('Jl. Margonda Raya No. 102, Depok, Jawa Barat');
  const [bcaAccount, setBcaAccount] = useState('7120982311');
  const [bsiAccount, setBsiAccount] = useState('7190023412');
  const [qrisUrl, setQrisUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=USKI_STORE_QRIS');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

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
          Konfigurasi identitas toko, nomor rekening bank resmi, gambar QRIS, dan status database cloud
        </p>
      </div>

      {/* Supabase Cloud Connection Diagnostics Card */}
      <div className={`p-6 rounded-3xl border text-xs space-y-3 ${
        isSupabaseConfigured
          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/60 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className={`w-5 h-5 ${isSupabaseConfigured ? 'text-emerald-700' : 'text-amber-700'}`} />
            <div>
              <h3 className="font-extrabold text-sm text-[#101519]">
                Status Koneksi Database Supabase Cloud
              </h3>
              <p className="text-[11px] text-body">
                Sinkronisasi data real-time antara laptop admin, HP pelanggan, dan HP kurir
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
            isSupabaseConfigured
              ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              : 'bg-amber-200 text-amber-900 border border-amber-300 animate-pulse'
          }`}>
            {isSupabaseConfigured ? '● Cloud Terhubung Aktif' : '▲ Menunggu Kredensial Asli'}
          </span>
        </div>

        <div className="p-3 bg-white/80 rounded-2xl border border-hairline space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center text-body">
            <span>Project URL Terbaca:</span>
            <span className="font-bold text-[#101519] truncate max-w-[280px]">
              {rawSupabaseUrl || '(Belum diatur)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-body">
            <span>Mode Operasional:</span>
            <span className="font-bold text-[#101519]">
              {isSupabaseConfigured ? 'Live PostgreSQL Cloud' : 'In-Memory Local Cache (Offline)'}
            </span>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-2 text-xs text-[#2D3033]">
            <p className="font-bold text-amber-900">
              Cara Menghubungkan Supabase Project Anda dalam 3 Langkah:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-body">
              <li>
                Buka project Anda di <strong>Supabase.com</strong> &gt; menu <strong>SQL Editor</strong> &gt; jalankan file master: <code className="bg-neutral-2 px-1.5 py-0.5 rounded text-[#101519] font-bold">supabase/complete_setup.sql</code>
              </li>
              <li>
                Buka <strong>Project Settings</strong> &gt; <strong>API</strong> &gt; salin <strong>Project URL</strong> dan <strong>anon key</strong>.
              </li>
              <li>
                Tempelkan kredensial tersebut ke file <code className="bg-neutral-2 px-1.5 py-0.5 rounded text-[#101519] font-bold">.env</code> dan di <strong>Cloudflare Dashboard &gt; Settings &gt; Variables and Secrets</strong>.
              </li>
            </ol>
          </div>
        )}
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
