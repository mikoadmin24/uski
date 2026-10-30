import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Building,
  Shield,
  FileText,
  X,
  MessageSquare,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Download,
} from 'lucide-react';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { CustomRequest, CustomQuoteItem, CustomRequestStatus } from '@/types';

export const AdminBulkOrders: React.FC = () => {
  const { requests, createOrUpdateQuote, updateStatus } = useCustomOrderStore();

  // Modals
  const [selectedDetailReq, setSelectedDetailReq] = useState<CustomRequest | null>(null);
  const [selectedReqForQuote, setSelectedReqForQuote] = useState<CustomRequest | null>(null);

  // Quote items form state
  const [quoteItems, setQuoteItems] = useState<
    { description: string; quantity: number; cogs_price: number; unit_price: number }[]
  >([
    { description: 'Item Barang / Pengadaan', quantity: 100, cogs_price: 15000, unit_price: 20000 },
  ]);

  const [additionalServiceFee, setAdditionalServiceFee] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<string>('50000');
  const [leadTimeDays, setLeadTimeDays] = useState<string>('5');
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [adminNotes, setAdminNotes] = useState('Stok siap dikirim dari gudang supplier pusat.');

  // Live reference to selected request
  const liveSelectedReq = selectedDetailReq
    ? requests.find((r) => r.id === selectedDetailReq.id) || selectedDetailReq
    : null;

  const handleOpenQuoteBuilder = (req: CustomRequest) => {
    setSelectedDetailReq(null);
    setSelectedReqForQuote(req);
    if (req.quote && req.quote.items?.length > 0) {
      setQuoteItems(
        req.quote.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          cogs_price: it.cogs_price,
          unit_price: it.unit_price,
        }))
      );
      setAdditionalServiceFee(String(req.quote.additional_services_fee || ''));
      setShippingFee(String(req.quote.shipping_fee || ''));
      setLeadTimeDays(String(req.quote.lead_time_days || '5'));
      setAdminNotes(req.quote.admin_notes || '');
    } else {
      setQuoteItems([
        {
          description: req.title,
          quantity: req.quantity,
          cogs_price: 15000,
          unit_price: 22000,
        },
      ]);
      setAdditionalServiceFee('');
      setShippingFee('50000');
      setLeadTimeDays('5');
      setAdminNotes('Stok siap dikirim dari gudang supplier pusat.');
    }
  };

  const handleAddItem = () => {
    setQuoteItems([
      ...quoteItems,
      { description: 'Item Tambahan / Custom', quantity: 1, cogs_price: 5000, unit_price: 8000 },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...quoteItems];
    (updated[idx] as any)[field] = val;
    setQuoteItems(updated);
  };

  // Totals calculations
  const totalCogs = quoteItems.reduce((sum, it) => sum + it.cogs_price * it.quantity, 0);
  const subtotal = quoteItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
  const grandTotal = subtotal + Number(additionalServiceFee) + Number(shippingFee);
  const estimatedProfit = grandTotal - totalCogs - Number(shippingFee);

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForQuote) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));

    const finalItems: CustomQuoteItem[] = quoteItems.map((it, idx) => ({
      id: `qi-${Date.now()}-${idx}`,
      description: it.description,
      quantity: Number(it.quantity),
      cogs_price: Number(it.cogs_price),
      unit_price: Number(it.unit_price),
      subtotal: Number(it.unit_price) * Number(it.quantity),
    }));

    createOrUpdateQuote(selectedReqForQuote.id, {
      items: finalItems,
      cogs_total: totalCogs,
      subtotal,
      additional_services_fee: Number(additionalServiceFee),
      shipping_fee: Number(shippingFee),
      grand_total: grandTotal,
      lead_time_days: Number(leadTimeDays),
      expires_at: expiresAt.toISOString(),
      admin_notes: adminNotes,
    });

    setSelectedReqForQuote(null);
  };

  const getStatusBadge = (status: CustomRequestStatus) => {
    switch (status) {
      case 'converted_to_order':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full font-bold text-[10px]">Telah Jadi Pesanan</span>;
      case 'quote_sent':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">Penawaran Terkirim</span>;
      case 'checking_supplier':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full font-bold text-[10px]">Cek Distributor</span>;
      case 'approved':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">Disetujui Pemesan</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">Menunggu Review</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Manajemen Pesan Request & Pengadaan Kustom
        </h1>
        <p className="text-xs text-body mt-1">
          Klik baris tiket untuk membuka popup detail pengadaan, lampiran dokumen, data sekolah/instansi, dan pembuatan penawaran harga pas resmi
        </p>
      </div>

      {/* Requests List Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-neutral-2/40 border-b border-hairline text-xs text-body flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Eye className="w-4 h-4" />
            Tips: Klik baris tiket atau tombol &quot;Detail Tiket&quot; untuk membuka Satu Popup lengkap
          </span>
          <span className="text-[11px] text-body hidden sm:inline">
            Total {requests.length} tiket pengadaan
          </span>
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[760px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Pemohon & Instansi</th>
                <th className="py-3 px-4">Judul Pengadaan</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4 text-center">Status Tiket</th>
                <th className="py-3 px-4 text-center">Aksi Penawaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {requests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedDetailReq(r)}
                  className="hover:bg-primary/5 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-primary group-hover:underline">
                    {r.reference_number}
                    <span className="block font-normal text-body text-[10px]">
                      {formatDate(r.created_at)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#101519] block">{r.customer_name}</span>
                    <span className="text-body text-[11px]">
                      {r.institution_name || 'Perorangan'} ({r.customer_phone})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#101519] block">{r.title}</span>
                    <span className="text-body text-[11px] line-clamp-1">{r.description}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-primary">
                    {r.quantity} pcs
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(r.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDetailReq(r)}
                        className="px-2.5 py-1 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                      <button
                        onClick={() => handleOpenQuoteBuilder(r)}
                        className="px-3.5 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xs transition-all shadow-xs"
                      >
                        {r.quote ? 'Edit Penawaran' : '+ Buat Penawaran'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SATU POPUP LENGKAP: DETAIL TIKET PERMINTAAN RFQ & STATUS PENAWARAN         */}
      {/* ========================================================================= */}
      {liveSelectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#101519] font-mono">
                      Tiket #{liveSelectedReq.reference_number}
                    </h2>
                    {getStatusBadge(liveSelectedReq.status)}
                  </div>
                  <p className="text-xs text-body mt-0.5">
                    {liveSelectedReq.institution_name ? `Instansi: ${liveSelectedReq.institution_name} • ` : ''}Diajukan {formatDate(liveSelectedReq.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailReq(null)}
                className="p-2 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Quick Status Bar */}
              <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-body">Ubah Status Tiket:</span>
                  <select
                    value={liveSelectedReq.status}
                    onChange={(e) => updateStatus(liveSelectedReq.id, e.target.value as CustomRequestStatus)}
                    className="h-8 px-3 bg-white border border-hairline rounded-lg font-bold text-primary focus:outline-none focus:border-primary shadow-xs"
                  >
                    <option value="pending_review">⏳ Menunggu Review</option>
                    <option value="checking_supplier">🔍 Cek Stok Supplier / Distributor</option>
                    <option value="quote_sent">📩 Penawaran Harga Terkirim</option>
                    <option value="approved">✅ Disetujui Pemesan</option>
                    <option value="converted_to_order">📦 Jadi Pesanan Resmi</option>
                    <option value="rejected">❌ Ditolak / Dibatalkan</option>
                  </select>
                </div>

                <a
                  href={`https://wa.me/${liveSelectedReq.customer_phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20kak%20${encodeURIComponent(liveSelectedReq.customer_name)},%20kami%20dari%20Admin%20USKI%20STORE%20ingin%20mengonfirmasi%20pengajuan%20request%20pengadaan%20${liveSelectedReq.reference_number}%20(${encodeURIComponent(liveSelectedReq.title)}).`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp Pemohon ({liveSelectedReq.customer_phone})</span>
                </a>
              </div>

              {/* Grid 2 Kolom: Detail Tiket & Penawaran */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Kolom Kiri: Detail Permintaan Pemohon */}
                <div className="space-y-4">
                  {/* Card Data Instansi / Pemohon */}
                  <div className="border border-hairline rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
                    <span className="font-extrabold text-[#101519] block border-b border-hairline pb-2 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-primary" />
                      Informasi Pemohon & Lembaga
                    </span>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-body block">Nama Kontak:</span>
                        <strong className="text-xs text-[#101519]">{liveSelectedReq.customer_name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Nama Instansi/Pesantren:</span>
                        <strong className="text-xs text-[#101519]">{liveSelectedReq.institution_name || 'Perorangan'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Nomor Telepon:</span>
                        <span className="font-mono text-body">{liveSelectedReq.customer_phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Email Kontak:</span>
                        <span className="text-body truncate block">{liveSelectedReq.customer_email || '-'}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-hairline">
                      <span className="text-[10px] text-body block">Alamat Tujuan Pengiriman:</span>
                      <p className="text-[#101519] leading-snug">{liveSelectedReq.shipping_address || 'Belum diisi'}</p>
                    </div>
                  </div>

                  {/* Card Spesifikasi Barang yang Diminta */}
                  <div className="border border-hairline rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
                    <span className="font-extrabold text-[#101519] block border-b border-hairline pb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      Rincian Kebutuhan Pengadaan
                    </span>
                    <div>
                      <span className="text-[10px] text-body block">Judul Kebutuhan:</span>
                      <h4 className="font-bold text-sm text-[#101519]">{liveSelectedReq.title}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-neutral-2/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-body block">Kategori Produk:</span>
                        <strong className="text-primary">{liveSelectedReq.category}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Jumlah Unit Diminta:</span>
                        <strong className="text-base text-primary font-black">{liveSelectedReq.quantity} pcs</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Target Tanggal Kirim:</span>
                        <strong>{liveSelectedReq.target_date ? formatDate(liveSelectedReq.target_date) : '-'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-body block">Alokasi Anggaran Pemohon:</span>
                        <strong>{liveSelectedReq.estimated_budget ? formatRupiah(liveSelectedReq.estimated_budget) : 'Sesuai Harga Toko'}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-body block font-bold">Deskripsi & Kebutuhan:</span>
                      <p className="p-2.5 bg-neutral-100/70 rounded-xl leading-relaxed text-[#101519]">
                        {liveSelectedReq.description}
                      </p>
                    </div>

                    {liveSelectedReq.specifications && (
                      <div>
                        <span className="text-[10px] text-body block font-bold">Catatan Spesifikasi Khusus:</span>
                        <p className="p-2.5 bg-neutral-100/70 rounded-xl leading-relaxed italic text-body">
                          {liveSelectedReq.specifications}
                        </p>
                      </div>
                    )}

                    {/* Lampiran File */}
                    {liveSelectedReq.attachments && liveSelectedReq.attachments.length > 0 && (
                      <div className="pt-2 border-t border-hairline">
                        <span className="text-[10px] text-body block font-bold mb-1">Dokumen Lampiran Pengadaan:</span>
                        <div className="flex flex-col gap-1.5">
                          {liveSelectedReq.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-primary font-bold transition-colors"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kolom Kanan: Rincian Penawaran Harga Resmi Toko USKI */}
                <div className="space-y-4">
                  <div className="border-2 border-primary/20 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-hairline pb-2">
                      <span className="font-extrabold text-[#101519] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Rincian Penawaran Harga Resmi
                      </span>
                      {liveSelectedReq.quote && (
                        <span className="font-mono text-[10px] text-primary font-bold">
                          #{liveSelectedReq.quote.quote_number}
                        </span>
                      )}
                    </div>

                    {liveSelectedReq.quote ? (
                      <div className="space-y-3">
                        <div className="divide-y divide-hairline">
                          {liveSelectedReq.quote.items.map((it) => (
                            <div key={it.id} className="py-2 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-[#101519]">{it.description}</p>
                                <span className="text-[10px] text-body">
                                  {it.quantity} unit x {formatRupiah(it.unit_price)}
                                </span>
                              </div>
                              <span className="font-extrabold text-[#101519]">{formatRupiah(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Rincian Total */}
                        <div className="border-t border-hairline pt-2 space-y-1 bg-neutral-2/40 p-2.5 rounded-xl">
                          <div className="flex justify-between text-body">
                            <span>Subtotal Barang:</span>
                            <span className="font-bold text-[#101519]">{formatRupiah(liveSelectedReq.quote.subtotal)}</span>
                          </div>
                          {liveSelectedReq.quote.additional_services_fee > 0 && (
                            <div className="flex justify-between text-body">
                              <span>Biaya Jasa / Layanan Khusus:</span>
                              <span className="font-bold text-[#101519]">{formatRupiah(liveSelectedReq.quote.additional_services_fee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-body">
                            <span>Estimasi Ongkir:</span>
                            <span className="font-bold text-[#101519]">{formatRupiah(liveSelectedReq.quote.shipping_fee)}</span>
                          </div>
                          <div className="flex justify-between border-t border-hairline pt-1.5 text-sm font-extrabold text-primary">
                            <span>Total Penawaran Resmi:</span>
                            <span>{formatRupiah(liveSelectedReq.quote.grand_total)}</span>
                          </div>
                        </div>

                        {/* Internal Margin View (Khusus Admin) */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                          <span className="font-bold text-[10px] flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-600" />
                            Margin Laba Internal (Rahasia Admin)
                          </span>
                          <div className="flex justify-between text-[11px]">
                            <span>Modal Distributor (COGS):</span>
                            <strong>{formatRupiah(liveSelectedReq.quote.cogs_total)}</strong>
                          </div>
                          <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                            <span>Estimasi Laba Bersih Toko:</span>
                            <span>+{formatRupiah(liveSelectedReq.quote.grand_total - liveSelectedReq.quote.cogs_total - liveSelectedReq.quote.shipping_fee)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-body pt-1">
                          <span>Waktu Pengerjaan: <strong>{liveSelectedReq.quote.lead_time_days} Hari Kerja</strong></span>
                          <span>Berlaku s/d: <strong>{liveSelectedReq.quote.expires_at ? formatDate(liveSelectedReq.quote.expires_at) : '-'}</strong></span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenQuoteBuilder(liveSelectedReq)}
                          className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-xs"
                        >
                          Edit Rincian Penawaran Harga
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <FileSpreadsheet className="w-10 h-10 text-body/40 mx-auto" />
                        <div>
                          <p className="font-bold text-[#101519]">Belum Diterbitkan Penawaran Resmi</p>
                          <p className="text-body text-[11px]">
                            Hitung modal distributor dan buat surat penawaran harga pas resmi untuk instansi ini.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenQuoteBuilder(liveSelectedReq)}
                          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-xs"
                        >
                          + Terbitkan Penawaran Harga Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-body font-mono">
                Tiket ID: {liveSelectedReq.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDetailReq(null)}
                className="px-5 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold transition-colors"
              >
                Tutup Popup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quotation Builder Modal */}
      {selectedReqForQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <span className="text-xs font-bold text-primary block">QUOTATION BUILDER</span>
                <h3 className="text-lg font-extrabold text-[#101519]">
                  Penawaran Harga: {selectedReqForQuote.reference_number}
                </h3>
                <span className="text-xs text-body">
                  Pemohon: {selectedReqForQuote.customer_name} ({selectedReqForQuote.institution_name || 'Instansi'})
                </span>
              </div>
              <button onClick={() => setSelectedReqForQuote(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Secret COGS & Profit Margin Alert for Admin */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Keamanan Data:</strong> Kolom Modal Internal (COGS) dan Estimasi Laba Bersih <strong>hanya terlihat oleh Admin</strong> dan dirahasiakan dari pelanggan.
                </span>
              </div>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-6 text-xs">
              {/* Dynamic Quote Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#101519]">
                    Rincian Item Pengadaan
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-2 hover:bg-primary hover:text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-hairline rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-2 border-b border-hairline text-body font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Deskripsi Barang</th>
                        <th className="py-2.5 px-3 w-20 text-center">Jumlah</th>
                        <th className="py-2.5 px-3 w-28 bg-amber-50/70 text-amber-900">Modal Satuan (COGS)</th>
                        <th className="py-2.5 px-3 w-28">Harga Jual Satuan</th>
                        <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {quoteItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-2 border border-hairline rounded-lg font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-2 border border-hairline rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 bg-amber-50/40">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.cogs_price}
                              onChange={(e) => handleItemChange(idx, 'cogs_price', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-amber-900 font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                              className="w-full px-2 py-1 bg-neutral-2 border border-hairline rounded-lg font-bold text-primary"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-[#101519]">
                            {formatRupiah(item.unit_price * item.quantity)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {quoteItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-body hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Cost Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="font-bold text-body block mb-1">Biaya Layanan / Packaging</label>
                  <input
                    type="number"
                    value={additionalServiceFee}
                    onChange={(e) => setAdditionalServiceFee(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Ongkos Kirim Estimasi</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Lead Time Produksi / Kirim</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      className="w-full h-10 pl-3 pr-12 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body font-bold">Hari</span>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Masa Berlaku Penawaran</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="w-full h-10 pl-3 pr-12 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body font-bold">Hari</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="font-bold text-body block mb-1">Catatan Tambahan untuk Pelanggan</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              {/* Summary Cards: Grand Total & Secret Profit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-neutral-2/60 rounded-2xl border border-hairline">
                <div className="space-y-1">
                  <span className="text-body font-bold block">Grand Total Penawaran Pelanggan:</span>
                  <div className="text-2xl font-extrabold text-primary">
                    {formatRupiah(grandTotal)}
                  </div>
                  <span className="text-[11px] text-body block">
                    (Subtotal {formatRupiah(subtotal)} + Layanan {formatRupiah(Number(additionalServiceFee))} + Ongkir {formatRupiah(Number(shippingFee))})
                  </span>
                </div>

                <div className="space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-5">
                  <span className="text-amber-900 font-bold block flex sm:justify-end items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Estimasi Laba Bersih Toko (Margin Admin):
                  </span>
                  <div className="text-2xl font-extrabold text-green-600">
                    +{formatRupiah(estimatedProfit)}
                  </div>
                  <span className="text-[11px] text-body block">
                    Margin: {grandTotal > 0 ? ((estimatedProfit / grandTotal) * 100).toFixed(1) : 0}% dari nilai total transaksi
                  </span>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReqForQuote(null)}
                  className="px-5 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Terbitkan & Kirim Penawaran Resmi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};