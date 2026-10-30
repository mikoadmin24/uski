import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { useAuthStore } from '@/store/authStore';

export const BulkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRequest, requests } = useCustomOrderStore();
  const { user } = useAuthStore();

  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone_number || '');
  const [institutionName, setInstitutionName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Buku Pelajaran & Edukasi');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [quantity, setQuantity] = useState<string>('100');
  const [targetDate, setTargetDate] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReq, setSuccessReq] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !title || !description) return;

    setIsSubmitting(true);
    try {
      const attachments = fileName
        ? [
            {
              name: fileName,
              url: '#',
              file_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.ms-excel',
            },
          ]
        : [];

      const newReq = createRequest({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        institution_name: institutionName,
        title,
        category,
        description,
        specifications,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        target_date: targetDate,
        shipping_address: shippingAddress,
        attachments,
      });

      setSuccessReq(newReq);
    } catch {
      alert('Gagal mengirim pesan request. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0060AE] to-[#2D3033] text-white p-6 sm:p-10 space-y-3">
        <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase rounded-full backdrop-blur-sm">
          Layanan Spesial USKI STORE
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Layanan Pesan Request & Pengadaan Kustom
        </h1>
        <p className="text-xs sm:text-sm text-neutral-2 max-w-2xl leading-relaxed">
          Kirim daftar kebutuhan buku perpustakaan, kitab kuning pesantren, ATK kantor, atau kebutuhan cetak khusus. USKI Store menerapkan sistem harga pas resmi tanpa tawar-menawar dengan jaminan produk 100% original.
        </p>
      </div>

      {/* Success Notification if Submitted */}
      {successReq ? (
        <div className="bg-white border border-hairline rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#101519]">
            Pesan Request Berhasil Dikirim!
          </h2>
          <p className="text-sm text-body max-w-lg mx-auto">
            Nomor Referensi Tiket: <strong className="text-primary text-base font-mono">{successReq.reference_number}</strong>
          </p>
          <p className="text-xs text-body max-w-md mx-auto">
            Admin kami akan segera meninjau daftar request barang Anda dan memvalidasi ketersediaan stok distributor resmi dalam waktu 1x24 jam.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to={`/bulk-order/${successReq.reference_number}`}
              className="px-6 py-3 bg-primary text-white font-extrabold text-xs sm:text-sm rounded-xl hover:bg-primary-dark transition-all"
            >
              Lihat Status Pesan Request
            </Link>
            <button
              onClick={() => setSuccessReq(null)}
              className="px-6 py-3 bg-neutral-2 text-[#2D3033] font-bold text-xs sm:text-sm rounded-xl hover:bg-neutral-1/50 transition-all"
            >
              Ajukan Request Lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-8">
          {/* Section 1: Customer & Institution */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] border-b border-hairline pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              1. Identitas Pemohon & Instansi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Pemohon / Penanggung Jawab *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad / Ibu Siti"
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nama Sekolah / Instansi / Kantor (Jika Ada)</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Contoh: Pondok Pesantren Al-Hikmah / PT Maju Jaya"
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="pengadaan@instansi.sch.id"
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] border-b border-hairline pb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              2. Rincian Kebutuhan & Spesifikasi
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Judul Permintaan / Nama Kebutuhan *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pengadaan 200 Eks Buku Pelajaran Kelas 10 & 50 Pack Buku Tulis Berlogo"
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-body block mb-1">Kategori Kebutuhan *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="Buku Pelajaran & Edukasi">Buku Pelajaran & Edukasi</option>
                    <option value="Al-Qur'an">Mushaf Al-Qur'an & Tafsir</option>
                    <option value="Kitab">Kitab Kuning & Literatur Pesantren</option>
                    <option value="Buku Tulis & ATK Custom">Buku Tulis & ATK Berlogo</option>
                    <option value="Perlengkapan Kantor & Filing">Perlengkapan Kantor & Filing</option>
                    <option value="Pencarian Buku Langka / Luar Katalog">Pencarian Buku Langka / Luar Katalog</option>
                    <option value="Paket Kado / Souvenir Seminar">Paket Kado / Souvenir Seminar</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-body block mb-1">Estimasi Jumlah / Kuantitas Total *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 100"
                    className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Lengkap Daftar Barang yang Dicari *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sebutkan judul-judul buku, penulis, penerbit, atau spesifikasi pulpen/kertas yang Anda butuhkan..."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Spesifikasi Kustom Tambahan (Jika Ada)</label>
                <textarea
                  rows={2}
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="Contoh: Cetak logo sekolah di sampul depan, jilid spiral, kemasan khusus per kelas..."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-body block mb-1">Target Tanggal Dibutuhkan (Opsional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="p-3 bg-neutral-2/50 rounded-xl flex items-center gap-2.5 border border-hairline">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[11px] text-body leading-relaxed">
                    <strong>Kebijakan Harga Pas Resmi:</strong> USKI Store tidak menerima tawar-menawar harga untuk memastikan keaslian kualitas dan garansi distributor resmi.
                  </p>
                </div>
              </div>

              {/* Upload Document / Excel / PDF */}
              <div className="border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-6 text-center space-y-2 bg-neutral-2/30">
                <Upload className="w-8 h-8 text-primary mx-auto" />
                <p className="font-bold text-[#101519]">
                  Unggah Daftar Kebutuhan (Excel / CSV / PDF) atau Desain Logo
                </p>
                <p className="text-[11px] text-body">
                  File lampiran akan diperiksa tim admin kami secara aman dan rahasia.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="text-xs text-body"
                />
                {fileName && (
                  <p className="text-xs font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    File terpilih: {fileName}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Alamat Pengiriman Tujuan</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Contoh: Komplek Pesantren / Gedung Kantor Lt. 3, Kota..."
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-hairline">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Request...' : 'Kirim Pesan Request'}</span>
            </button>
            <p className="text-[11px] text-body text-center mt-2">
              Pesan request ini akan diverifikasi admin ke distributor resmi untuk ketersediaan stok buku dan spesifikasi kustom.
            </p>
          </div>
        </form>
      )}

      {/* Recent Existing Requests Quick View */}
      {requests.length > 0 && (
        <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-[#101519] border-b border-hairline pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Riwayat Pesan Request Terdaftar
          </h3>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-neutral-2/50 rounded-2xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{req.reference_number}</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded">
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="font-bold text-[#101519] text-sm mt-1">{req.title}</p>
                  <p className="text-body text-[11px]">{req.customer_name} • Kuantitas: {req.quantity} pcs</p>
                </div>

                <Link
                  to={`/bulk-order/${req.reference_number}`}
                  className="px-4 py-2 bg-white border border-hairline hover:border-primary text-primary font-bold rounded-xl shadow-sm transition-all self-start sm:self-center"
                >
                  Lihat Detail Pesan Request
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
