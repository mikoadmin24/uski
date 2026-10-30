import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Upload, CheckCircle2, ArrowRight } from 'lucide-react';

export const BulkOrderBanner: React.FC = () => {
  return (
    <div className="my-8 rounded-2xl bg-gradient-to-r from-[#0060AE] to-[#004C8C] text-white p-6 md:p-8 relative overflow-hidden shadow-sm">
      <div className="relative z-10 max-w-2xl space-y-3">
        <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-extrabold uppercase rounded-full backdrop-blur-sm">
          Layanan Spesial USKI STORE
        </span>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Punya Daftar Kebutuhan Sekolah, Kantor, atau Pesantren?
        </h2>

        <p className="text-xs md:text-sm text-neutral-2 leading-relaxed">
          Unggah daftar kebutuhan format Excel, CSV, atau PDF. Kami carikan buku langka, kitab khusus, cetak buku berlogo instansi, dan perlengkapan ATK grosir dengan layanan Pesan Request resmi toko harga pas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-2">
            <CheckCircle2 className="w-4 h-4 text-accent-2 shrink-0" />
            <span>Harga Pas Resmi Distributor</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-2">
            <CheckCircle2 className="w-4 h-4 text-accent-2 shrink-0" />
            <span>Cetak Logo Instansi</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-2">
            <CheckCircle2 className="w-4 h-4 text-accent-2 shrink-0" />
            <span>Faktur & Surat Jalan Resmi</span>
          </div>
        </div>

        <div className="pt-3 flex flex-wrap gap-3">
          <Link
            to="/bulk-order"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-2 hover:bg-[#e6b932] text-[#101519] font-extrabold text-sm rounded-xl transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Ajukan Pesan Request</span>
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all border border-white/20"
          >
            <span>Konsultasi Pengadaan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute right-[-40px] bottom-[-40px] opacity-10 hidden md:block">
        <FileSpreadsheet className="w-96 h-96 text-white" />
      </div>
    </div>
  );
};
