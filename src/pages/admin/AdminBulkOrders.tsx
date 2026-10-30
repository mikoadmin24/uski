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
} from 'lucide-react';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { CustomRequest, CustomQuoteItem } from '@/types';

export const AdminBulkOrders: React.FC = () => {
  const { requests, createOrUpdateQuote } = useCustomOrderStore();

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

  const handleOpenQuoteBuilder = (req: CustomRequest) => {
    setSelectedReqForQuote(req);
    setQuoteItems([
      {
        description: req.title,
        quantity: req.quantity,
        cogs_price: 15000,
        unit_price: 22000,
      },
    ]);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Manajemen Permintaan Custom & Quotation Builder
        </h1>
        <p className="text-xs text-body mt-1">
          Tinjau dokumen pengadaan grosir pelanggan, hitung margin modal (COGS), dan terbitkan surat penawaran harga resmi
        </p>
      </div>

      {/* Requests List Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Pemohon & Instansi</th>
                <th className="py-3 px-4">Judul Pengadaan</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Penawaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-2/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {r.reference_number}
                    <span className="block font-normal text-body text-[10px]">
                      {formatDate(r.created_at)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#101519] block">{r.customer_name}</span>
                    <span className="text-body text-[11px]">{r.institution_name || 'Perorangan'} ({r.customer_phone})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#101519] block">{r.title}</span>
                    <span className="text-body text-[11px] line-clamp-1">{r.description}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-primary">
                    {r.quantity} pcs
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.status === 'converted_to_order'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'quote_sent'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleOpenQuoteBuilder(r)}
                      className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-[11px] transition-all"
                    >
                      {r.quote ? 'Edit Penawaran' : '+ Buat Penawaran'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <div className="text-right shrink-0 ml-3">
                <span className="block text-[10px] text-body">Estimasi Laba Kotor:</span>
                <span className="font-extrabold text-green-700 text-sm">
                  {formatRupiah(estimatedProfit)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-6 text-xs">
              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#101519]">Daftar Item & Rincian Harga</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-hairline rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-2/60 text-body font-bold">
                      <tr>
                        <th className="p-3">Deskripsi Barang / Layanan</th>
                        <th className="p-3 w-20 text-center">Jumlah</th>
                        <th className="p-3 w-32 text-right bg-amber-50/60">Modal COGS (Internal)</th>
                        <th className="p-3 w-32 text-right">Harga Jual Satuan</th>
                        <th className="p-3 w-32 text-right">Subtotal Penawaran</th>
                        <th className="p-3 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {quoteItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full h-9 px-2 bg-neutral-2 border border-hairline rounded-lg font-semibold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              required
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                                handleItemChange(idx, 'quantity', val ? parseInt(val, 10) : 0);
                              }}
                              placeholder="1"
                              className="w-full h-9 px-1 text-center bg-neutral-2 border border-hairline rounded-lg font-semibold"
                            />
                          </td>
                          <td className="p-2 bg-amber-50/40">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.cogs_price || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                                handleItemChange(idx, 'cogs_price', val ? parseInt(val, 10) : 0);
                              }}
                              placeholder="0"
                              className="w-full h-9 px-2 text-right bg-white border border-amber-200 rounded-lg font-semibold text-amber-800"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              required
                              value={item.unit_price || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                                handleItemChange(idx, 'unit_price', val ? parseInt(val, 10) : 0);
                              }}
                              placeholder="0"
                              className="w-full h-9 px-2 text-right bg-neutral-2 border border-hairline rounded-lg font-bold text-primary"
                            />
                          </td>
                          <td className="p-2 text-right font-extrabold text-[#101519]">
                            {formatRupiah(item.unit_price * item.quantity)}
                          </td>
                          <td className="p-2 text-center">
                            {quoteItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-body hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-body block mb-1">Biaya Jasa Cetak / Khusus (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={additionalServiceFee}
                    onChange={(e) => setAdditionalServiceFee(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Ongkos Kirim Kargo (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="0"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Estimasi Pengerjaan (Hari)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="1"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Masa Berlaku Penawaran (Hari)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="1"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Catatan Tambahan untuk Pelanggan</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              {/* Summary and Submit */}
              <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-body block">Total Nilai Penawaran Resmi:</span>
                  <span className="text-2xl font-extrabold text-primary">{formatRupiah(grandTotal)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReqForQuote(null)}
                    className="px-5 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Terbitkan & Kirim Penawaran</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
