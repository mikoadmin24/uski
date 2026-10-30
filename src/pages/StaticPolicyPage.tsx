import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Lock, FileText, Phone, Mail, MapPin } from 'lucide-react';

export const StaticPolicyPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();

  const getPolicyContent = () => {
    switch (type) {
      case 'shipping':
        return {
          title: 'Kebijakan Pengiriman & Ekspedisi',
          icon: Truck,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                USKI STORE bekerja sama dengan ekspedisi resmi (J&T Express, SiCepat, JNE, dan Kargo Logistik). Seluruh pesanan dikemas dengan standar keamanan tinggi menggunakan bubble wrap tebal dan kardus pelindung.
              </p>
              <h4 className="font-bold text-[#101519]">Waktu Operasional Pengiriman:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Senin – Sabtu: Pesanan yang diverifikasi sebelum pukul 15.00 WIB dikirim pada hari yang sama.</li>
                <li>Minggu & Libur Nasional: Pengiriman dilakukan pada hari kerja berikutnya.</li>
                <li>Layanan Pengadaan Kargo: Estimasi keberangkatan kargo grosir 1-2 hari setelah konfirmasi.</li>
              </ul>
            </div>
          ),
        };
      case 'payment':
        return {
          title: 'Kebijakan & Panduan Pembayaran',
          icon: Lock,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                Pembayaran dapat dilakukan melalui Transfer Bank Manual (BCA, Mandiri, BSI), QRIS Instant (Semua e-wallet & m-banking), serta Payment Gateway Midtrans.
              </p>
              <h4 className="font-bold text-[#101519]">Verifikasi Pembayaran:</h4>
              <p>
                Untuk pembayaran manual dan QRIS, pelanggan wajib mengunggah bukti transfer yang sah melalui halaman pesanan. Pembayaran akan diverifikasi oleh staf dalam waktu maksimal 15-30 menit pada jam kerja.
              </p>
            </div>
          ),
        };
      case 'returns':
        return {
          title: 'Kebijakan Garansi & Retur Barang',
          icon: RotateCcw,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                Kami menjamin 100% produk asli. Jika buku atau alat tulis yang diterima dalam keadaan cacat cetak, halaman hilang, atau rusak saat pengiriman, Anda berhak mendapatkan penggantian unit baru tanpa biaya tambahan.
              </p>
              <h4 className="font-bold text-[#101519]">Syarat Pengajuan Klaim:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Menyertakan video unboxing tanpa jeda saat membuka paket pertama kali.</li>
                <li>Pengajuan klaim maksimal 2x24 jam sejak status resi dinyatakan "Delivered".</li>
                <li>Hubungi customer service WhatsApp kami di 0812-3456-7890.</li>
              </ul>
            </div>
          ),
        };
      default:
        return {
          title: 'Tentang USKI STORE & Hubungi Kami',
          icon: ShieldCheck,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                <strong>USKI STORE</strong> adalah toko online penyedia buku umum, novel, buku pelajaran, mushaf Al-Qur'an, kitab kuning pesantren, alat tulis kantor (ATK), dan perlengkapan sekolah/kantor terpadu.
              </p>
              <div className="pt-2 space-y-2">
                <p className="flex items-center gap-2 font-bold text-[#101519]">
                  <Phone className="w-4 h-4 text-primary" />
                  CS WhatsApp: 0812-3456-7890
                </p>
                <p className="flex items-center gap-2 font-bold text-[#101519]">
                  <Mail className="w-4 h-4 text-primary" />
                  Email: cs@uskistore.id
                </p>
                <p className="flex items-center gap-2 text-body">
                  <MapPin className="w-4 h-4 text-primary" />
                  Jl. Margonda Raya No. 102, Depok, Jawa Barat, Indonesia
                </p>
              </div>
            </div>
          ),
        };
    }
  };

  const { title, icon: Icon, content } = getPolicyContent();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-hairline pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#101519]">{title}</h1>
        </div>

        {content}

        <div className="pt-6 border-t border-hairline">
          <Link
            to="/"
            className="text-xs font-bold text-primary hover:underline"
          >
            ← Kembali ke Halaman Utama Toko
          </Link>
        </div>
      </div>
    </div>
  );
};
