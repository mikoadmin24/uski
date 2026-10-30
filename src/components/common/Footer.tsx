import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Headphones, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-hairline mt-12 sm:mt-16 text-[#2D3033] w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Value Proposition Highlights */}
      <div className="border-b border-hairline bg-neutral-2/50 py-6 sm:py-8">
        <div className="max-w-site mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#101519]">100% Produk Asli</h4>
              <p className="text-[11px] sm:text-xs text-body">Buku dan ATK original dari penerbit resmi.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#101519]">Pengiriman Luas</h4>
              <p className="text-[11px] sm:text-xs text-body">Mendukung ekspedisi reguler, kargo & kurir toko.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#101519]">Custom & Grosir</h4>
              <p className="text-[11px] sm:text-xs text-body">Pesanan instansi, cetak khusus & pengadaan.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#101519]">Bantuan Cepat</h4>
              <p className="text-[11px] sm:text-xs text-body">Layanan konsultasi WhatsApp setiap hari kerja.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-site mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-lg">
                U
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0060AE]">
                USKI <span className="text-[#2D3033]">STORE</span>
              </span>
            </Link>
            <p className="text-sm text-body leading-relaxed max-w-sm">
              Toko buku, alat tulis kantor (ATK), Al-Qur'an & kitab, serta perlengkapan edukasi dan umum. Melayani belanja retail satuan dan pengadaan skala besar untuk sekolah, universitas, pesantren, dan kantor.
            </p>
            <div className="space-y-1.5 text-xs text-body">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                Jl. Pendidikan No. 45, Komplek Perkantoran & Sentra Edukasi, Indonesia
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                +62 812-3456-7890 (WhatsApp Customer Service)
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                cs@uskistore.id
              </p>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-bold text-[#101519] mb-3 uppercase tracking-wider">Kategori Pilihan</h4>
            <ul className="space-y-2 text-sm text-body">
              <li><Link to="/products?category=buku-novel" className="hover:text-primary transition-colors">Buku & Novel</Link></li>
              <li><Link to="/products?category=alquran" className="hover:text-primary transition-colors">Al-Qur'an</Link></li>
              <li><Link to="/products?category=kitab" className="hover:text-primary transition-colors">Kitab Kuning & Pesantren</Link></li>
              <li><Link to="/products?category=atk" className="hover:text-primary transition-colors">Alat Tulis Kantor (ATK)</Link></li>
              <li><Link to="/products?category=buku-pelajaran" className="hover:text-primary transition-colors">Buku Pelajaran Sekolah</Link></li>
              <li><Link to="/products?category=perlengkapan-kantor" className="hover:text-primary transition-colors">Perlengkapan Kantor</Link></li>
            </ul>
          </div>

          {/* Layanan Toko */}
          <div>
            <h4 className="text-sm font-bold text-[#101519] mb-3 uppercase tracking-wider">Layanan Toko</h4>
            <ul className="space-y-2 text-sm text-body">
              <li><Link to="/bulk-order" className="hover:text-primary transition-colors font-semibold text-primary">Pesanan Custom & Grosir</Link></li>
              <li><Link to="/track-order" className="hover:text-primary transition-colors">Lacak Status Pesanan</Link></li>
              <li><Link to="/cart" className="hover:text-primary transition-colors">Keranjang Belanja</Link></li>
              <li><Link to="/account" className="hover:text-primary transition-colors">Akun Saya</Link></li>
              <li><Link to="/admin" className="hover:text-primary transition-colors">Panel Admin</Link></li>
            </ul>
          </div>

          {/* Kebijakan & Bantuan */}
          <div>
            <h4 className="text-sm font-bold text-[#101519] mb-3 uppercase tracking-wider">Kebijakan & Bantuan</h4>
            <ul className="space-y-2 text-sm text-body">
              <li><Link to="/policies/shipping" className="hover:text-primary transition-colors">Pengiriman & Logistik</Link></li>
              <li><Link to="/policies/payment" className="hover:text-primary transition-colors">Metode Pembayaran</Link></li>
              <li><Link to="/policies/returns" className="hover:text-primary transition-colors">Kebijakan Pengembalian</Link></li>
              <li><Link to="/policies/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link to="/policies/terms" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        {/* Payment & Logistics Badges */}
        <div className="pt-8 mt-8 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-body">
          <div>
            <p className="font-semibold text-[#101519] mb-1.5">Metode Pembayaran Resmi:</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">BCA</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">MANDIRI</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">BSI</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">BRI</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px] text-primary">QRIS INSTANT</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">MIDTRANS</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">COD</span>
            </div>
          </div>

          <div>
            <p className="font-semibold text-[#101519] mb-1.5">Partner Logistik & Ekspedisi:</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">J&T EXPRESS</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">SICEPAT</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">JNE</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">KARGO B2B</span>
              <span className="px-2 py-1 bg-neutral-2 rounded font-bold text-[10px]">KURIR TOKO</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 mt-6 border-t border-hairline text-center text-xs text-body">
          <p>© {new Date().getFullYear()} USKI STORE. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </footer>
  );
};
