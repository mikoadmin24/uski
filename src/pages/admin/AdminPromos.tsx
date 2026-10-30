import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  X,
  Ticket,
} from 'lucide-react';
import { usePromoStore } from '@/store/promoStore';
import { formatRupiah } from '@/lib/utils';
import { Voucher } from '@/types';

export const AdminPromos: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher, toggleVoucherStatus } = usePromoStore();

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Form states (String states to prevent stuck zeroes)
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [minSpend, setMinSpend] = useState<string>('');
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('2026-12-31');

  // Simulation calculator
  const [simSubtotal, setSimSubtotal] = useState<string>('150000');
  const [simCode, setSimCode] = useState('');
  const [simResult, setSimResult] = useState<string | null>(null);

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinSpend('');
    setMaxDiscount('');
    setUsageLimit('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('2026-12-31');
    setEditingVoucher(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setDescription(v.description || '');
    setDiscountType(v.discount_type);
    setDiscountValue(String(v.discount_value));
    setMinSpend(String(v.min_spend));
    setMaxDiscount(v.max_discount ? String(v.max_discount) : '');
    setUsageLimit(v.usage_limit ? String(v.usage_limit) : '');
    setStartDate(v.start_date);
    setEndDate(v.end_date);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    if (editingVoucher) {
      updateVoucher(editingVoucher.id, {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_spend: Number(minSpend) || 0,
        max_discount: maxDiscount ? Number(maxDiscount) : undefined,
        usage_limit: usageLimit ? Number(usageLimit) : 500,
        start_date: startDate,
        end_date: endDate,
      });
    } else {
      addVoucher({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_spend: Number(minSpend) || 0,
        max_discount: maxDiscount ? Number(maxDiscount) : undefined,
        usage_limit: usageLimit ? Number(usageLimit) : 500,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });
    }

    setShowModal(false);
    resetForm();
  };

  const handleRunSim = () => {
    const v = vouchers.find((item) => item.code.toUpperCase() === simCode.trim().toUpperCase());
    const subtotal = Number(simSubtotal) || 0;

    if (!v) {
      setSimResult('Voucher tidak ditemukan');
      return;
    }
    if (!v.is_active) {
      setSimResult('Voucher sedang tidak aktif');
      return;
    }
    if (subtotal < v.min_spend) {
      setSimResult(`Belanja kurang dari minimal Rp ${v.min_spend.toLocaleString('id-ID')}`);
      return;
    }

    let cut = v.discount_type === 'percentage' ? (subtotal * v.discount_value) / 100 : v.discount_value;
    if (v.max_discount && cut > v.max_discount) cut = v.max_discount;
    cut = Math.min(cut, subtotal);

    setSimResult(`Valid! Potongan: ${formatRupiah(cut)} (Total bayar: ${formatRupiah(subtotal - cut)})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Voucher & Promo Diskon
          </h1>
          <p className="text-xs text-body mt-1">
            Buat kode kupon diskon untuk kampanye promo musiman, potongan harga toko, dan retensi pelanggan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* Simulator Quick Check */}
      <div className="bg-white border border-hairline rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-extrabold text-[#101519]">
            Kalkulator Simulasi Validasi Kupon Checkout
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Ketik kode kupon (e.g. USKIBARU)"
            value={simCode}
            onChange={(e) => setSimCode(e.target.value)}
            className="h-9 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-primary flex-1"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Subtotal Belanja (Rp)"
            value={simSubtotal}
            onChange={(e) => setSimSubtotal(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
            className="h-9 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary w-44"
          />
          <button
            onClick={handleRunSim}
            className="px-4 h-9 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl transition-colors shrink-0"
          >
            Uji Potongan
          </button>
        </div>
        {simResult && (
          <p className="text-xs font-semibold text-primary bg-primary/5 p-2 rounded-xl border border-primary/20">
            Hasil: {simResult}
          </p>
        )}
      </div>

      {/* Vouchers Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode Kupon</th>
                <th className="py-3 px-4">Nilai Diskon</th>
                <th className="py-3 px-4">Ketentuan Belanja</th>
                <th className="py-3 px-4">Masa Berlaku</th>
                <th className="py-3 px-4 text-center">Pemakaian</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-2/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        {v.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-body mt-1 max-w-xs">{v.description}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-[#101519] block">
                      {v.discount_type === 'percentage'
                        ? `${v.discount_value}%`
                        : formatRupiah(v.discount_value)}
                    </span>
                    {v.max_discount && (
                      <span className="text-[10px] text-body">
                        Maks: {formatRupiah(v.max_discount)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-body">
                    <div>Min Belanja: {formatRupiah(v.min_spend)}</div>
                    {v.usage_limit && (
                      <div className="text-[10px]">Kuota: {v.usage_limit} klaim</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-body">
                    <div>{v.start_date}</div>
                    <div>s/d {v.end_date}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#101519]">
                    {v.usage_count}x
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleVoucherStatus(v.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                      }`}
                    >
                      {v.is_active ? 'Aktif' : 'Non-Aktif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="Edit Voucher"
                        onClick={() => handleOpenEdit(v)}
                        className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        title="Hapus Voucher"
                        onClick={() => {
                          if (confirm(`Hapus voucher "${v.code}"?`)) {
                            deleteVoucher(v.id);
                          }
                        }}
                        className="p-1.5 hover:text-badge-text text-body hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519]">
                {editingVoucher ? 'Edit Voucher Promo' : 'Buat Voucher Promo Baru'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Kode Voucher *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: USKIBARU / LEBARANHEMAT"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono uppercase font-bold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Promo</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Diskon 10% untuk buku & ATK pelanggan baru"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Tipe Diskon *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">
                    Nilai Diskon ({discountType === 'percentage' ? '%' : 'Rp'}) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder={discountType === 'percentage' ? 'Contoh: 15' : 'Contoh: 20000'}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Minimal Belanja (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 50000"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Maksimal Diskon (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 25000 (Opsional)"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Mulai Berlaku</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Berakhir Pada</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
