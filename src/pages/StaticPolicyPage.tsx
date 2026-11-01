import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Lock, FileText, Phone, Mail, MapPin } from 'lucide-react';

export const StaticPolicyPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();

  const getPolicyContent = () => {
    switch (type?.trim().toLowerCase()) {
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
                <li>Hubungi customer service WhatsApp kami di 0859-6724-9718.</li>
              </ul>
            </div>
          ),
        };
      case 'privacy':
        return {
          title: 'Kebijakan Privasi (Privacy Policy)',
          icon: ShieldCheck,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                USKI STORE berkomitmen penuh untuk melindungi kerahasiaan dan keamanan data pribadi setiap pelanggan serta pengunjung situs, sesuai dengan ketentuan Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) yang berlaku di Republik Indonesia.
              </p>
              <h4 className="font-bold text-[#101519]">1. Informasi yang Kami Kumpulkan:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Identitas Diri:</strong> Nama lengkap pembeli dan akun pengguna yang terdaftar.</li>
                <li><strong>Data Kontak:</strong> Nomor telepon seluler/WhatsApp aktif dan alamat surat elektronik (email).</li>
                <li><strong>Alamat Pengiriman:</strong> Alamat lengkap penerima mencakup nama jalan, kecamatan, kota/kabupaten, provinsi, serta kode pos untuk kelancaran pengiriman ekspedisi logistik.</li>
                <li><strong>Data Transaksi:</strong> Rincian barang belanjaan, metode pembayaran yang dipilih, riwayat transaksi, serta dokumen pengadaan custom.</li>
              </ul>
              <h4 className="font-bold text-[#101519]">2. Penggunaan Informasi:</h4>
              <p>
                Informasi yang dikumpulkan digunakan semata-mata untuk memproses pemesanan, verifikasi pembayaran, pengiriman pesanan melalui kurir/mitra logistik resmi, pengiriman nomor resi pelacakan, serta penanganan bantuan layanan pelanggan (Customer Care).
              </p>
              <h4 className="font-bold text-[#101519]">3. Kerahasiaan & Keamanan Data:</h4>
              <p>
                Kami menerapkan enkripsi standar industri dan kontrol keamanan server berbasis Supabase RLS (Row Level Security). USKI STORE <strong>tidak pernah dan tidak akan pernah</strong> memperjualbelikan, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga manapun di luar kebutuhan operasional transaksi pengiriman barang.
              </p>
              <h4 className="font-bold text-[#101519]">4. Hak Pelanggan:</h4>
              <p>
                Anda berhak mengakses, memperbarui, atau mengajukan permohonan penghapusan data profil dan alamat Anda kapan saja melalui menu Akun Saya atau menghubungi Tim Layanan Pelanggan kami di <strong>cs@uskistore.id</strong> / WhatsApp <strong>0859-6724-9718</strong>.
              </p>
            </div>
          ),
        };
      case 'terms':
        return {
          title: 'Syarat & Ketentuan Layanan (Terms & Conditions)',
          icon: FileText,
          content: (
            <div className="space-y-4 text-xs sm:text-sm text-body leading-relaxed">
              <p>
                Selamat datang di platform USKI STORE. Dengan mengakses, menjelajahi katalog, mendaftar akun, dan/atau melakukan transaksi pembelian di situs ini, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan di bawah ini.
              </p>
              <h4 className="font-bold text-[#101519]">1. Ketentuan Akun & Pemesanan:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pembeli wajib memberikan informasi identitas, kontak WhatsApp, dan alamat pengiriman yang akurat dan dapat dipertanggungjawabkan.</li>
                <li>Setiap transaksi yang telah diverifikasi dan masuk tahap pemrosesan gudang tidak dapat dibatalkan secara sepihak oleh pembeli.</li>
                <li>Untuk pemesanan jumlah besar (bulk order/RFQ pengadaan instansi), berlaku ketentuan masa penawaran resmi (Quotation) yang mengikat harga dan tenggat waktu pasokan.</li>
              </ul>
              <h4 className="font-bold text-[#101519]">2. Harga, Stok & Kebijakan Harga Pas Resmi:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Seluruh harga produk dicantumkan dalam mata uang Rupiah (IDR) dan merupakan harga pas resmi dari penerbit/distributor resmi. USKI STORE tidak menerapkan sistem tawar-menawar harga guna menjamin mutu produk 100% asli original.</li>
                <li>Kami senantiasa memperbarui ketersediaan stok produk secara real-time. Apabila sewaktu-waktu stok fisik tidak mencukupi saat proses picking gudang, staf CS kami akan segera menghubungi pembeli untuk konfirmasi penyesuaian atau pengembalian dana penuh (100% refund).</li>
              </ul>
              <h4 className="font-bold text-[#101519]">3. Pembayaran & Konfirmasi:</h4>
              <p>
                Pembayaran wajib diselesaikan melalui metode resmi yang disediakan: Transfer Bank Manual (BCA, Mandiri, BSI, BRI), QRIS Instant (semua e-wallet & m-banking), serta Payment Gateway Midtrans. Pada transfer bank manual, pembeli wajib mengunggah bukti transfer yang sah melalui halaman pesanan agar dapat diverifikasi oleh bagian keuangan.
              </p>
              <h4 className="font-bold text-[#101519]">4. Hak Kekayaan Intelektual:</h4>
              <p>
                Seluruh materi di situs web ini, mencakup namun tidak terbatas pada merek dagang USKI STORE, desain grafis antarmuka, foto produk resmi, deskripsi, dan tata letak adalah milik sah USKI STORE dan dilindungi oleh Undang-Undang Hak Cipta Republik Indonesia.
              </p>
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
                  CS WhatsApp: 0859-6724-9718
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
