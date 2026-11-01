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
  Users,
  UserCheck,
  Shield,
  BookOpen,
  Layers,
  Check,
  Eye,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { usePromoStore } from '@/store/promoStore';
import { formatRupiah } from '@/lib/utils';
import { Voucher, VoucherTargetAudience } from '@/types';

export const AdminPromos: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher, toggleVoucherStatus } = usePromoStore();

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<Voucher | null>(null);

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

  // TARGET PENGGUNA (YANG BISA MENGGUNAKAN VOUCHER)
  const [targetAudience, setTargetAudience] = useState<VoucherTargetAudience>('all');
  const [specificPhones, setSpecificPhones] = useState('');
  const [usagePerUser, setUsagePerUser] = useState<string>('1');
  const [applicableCategory, setApplicableCategory] = useState<string>('all');

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
    setTargetAudience('all');
    setSpecificPhones('');
    setUsagePerUser('1');
    setApplicableCategory('all');
    setEditingVoucher(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setSelectedVoucherDetail(null);
    setShowModal(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setSelectedVoucherDetail(null);
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
    setTargetAudience(v.target_audience || 'all');
    setSpecificPhones(v.specific_phones || '');
    setUsagePerUser(String(v.usage_per_user || 1));
    setApplicableCategory(v.applicable_category || 'all');
    setShowModal(true);
  };

  const handleOpenDetail = (v: Voucher) => {
    setShowModal(false);
    setSelectedVoucherDetail(v);
  };

  const getTargetAudienceLabel = (target: VoucherTargetAudience): string => {
    switch (target) {
      case 'new_customer':
        return 'Khusus Pelanggan Baru (Transaksi Pertama)';
      case 'santri_pesantren':
        return 'Khusus Santri, Asrama & Pondok Pesantren';
      case 'guru_pengajar':
        return 'Khusus Guru, Ustadz & Tenaga Pendidik';
      case 'vip_member':
        return 'Khusus Member VIP / Pelanggan Setia';
      case 'specific_phones':
        return 'Khusus Nomor WhatsApp Tertentu';
      default:
        return 'Semua Pelanggan (Publik)';
    }
  };

  const getTargetBadge = (v: Voucher) => {
    const target = v.target_audience || 'all';
    switch (target) {
      case 'new_customer':
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" />
            <span>Pelanggan Baru (1st Order)</span>
          </span>
        );
      case 'santri_pesantren':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-emerald-600" />
            <span>Santri & Pesantren</span>
          </span>
        );
      case 'guru_pengajar':
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-amber-600" />
            <span>Guru & Ustadz</span>
          </span>
        );
      case 'vip_member':
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Member VIP Setia</span>
          </span>
        );
      case 'specific_phones':
        return (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
            <Phone className="w-3 h-3 text-rose-600" />
            <span>No. HP Tertentu</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-neutral-100 text-[#101519] border border-hairline rounded font-bold text-[10px] inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-body" />
            <span>Semua Pelanggan (Publik)</span>
          </span>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    const targetLabel = getTargetAudienceLabel(targetAudience);

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
        target_audience: targetAudience,
        target_audience_label: targetLabel,
        specific_phones: targetAudience === 'specific_phones' ? specificPhones.trim() : undefined,
        usage_per_user: Number(usagePerUser) || 1,
        applicable_category: applicableCategory,
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
        target_audience: targetAudience,
        target_audience_label: targetLabel,
        specific_phones: targetAudience === 'specific_phones' ? specificPhones.trim() : undefined,
        usage_per_user: Number(usagePerUser) || 1,
        applicable_category: applicableCategory,
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

    const targetDesc = v.target_audience_label || 'Semua Pelanggan';
    setSimResult(`Valid! [${targetDesc}] Potongan: ${formatRupiah(cut)} (Total bayar: ${formatRupiah(subtotal - cut)})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Voucher Promo & Hak Akses Pengguna
          </h1>
          <p className="text-xs text-body mt-1">
            Buat kupon promo diskon dan tentukan siapa yang berhak menggunakannya (Semua Pelanggan, Pelanggan Baru, Santri, Guru, dll.)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-xs self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Voucher Baru</span>
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
            placeholder="Ketik kode kupon (e.g. USKIBARU / GURUBERKAH)"
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
        <div className="px-4 py-2 bg-neutral-2/40 border-b border-hairline text-xs text-body flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Eye className="w-4 h-4" />
            Tips: Klik baris kupon untuk membuka Popup Rincian Voucher & Target Pengguna
          </span>
          <span className="text-[11px] text-body hidden sm:inline">
            Total {vouchers.length} voucher aktif & terdaftar
          </span>
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[780px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode Kupon</th>
                <th className="py-3 px-4">Nilai Diskon</th>
                <th className="py-3 px-4">Yang Berhak Menggunakan</th>
                <th className="py-3 px-4">Ketentuan Belanja</th>
                <th className="py-3 px-4">Masa Berlaku</th>
                <th className="py-3 px-4 text-center">Pemakaian</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {vouchers.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => handleOpenDetail(v)}
                  className="hover:bg-primary/5 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-lg group-hover:underline">
                        {v.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-body mt-1 max-w-xs line-clamp-1">{v.description}</p>
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

                  {/* Yang Berhak Menggunakan */}
                  <td className="py-3.5 px-4">
                    <div>{getTargetBadge(v)}</div>
                    <span className="text-[10px] text-body block mt-0.5">
                      Batas: <strong>{v.usage_per_user || 1}x per akun</strong>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-body">
                    <div>Min Belanja: <strong className="text-[#101519]">{formatRupiah(v.min_spend)}</strong></div>
                    {v.usage_limit && (
                      <div className="text-[10px]">Total Kuota: {v.usage_limit} klaim</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-body">
                    <div>{v.start_date}</div>
                    <div>s/d {v.end_date}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-[#101519]">
                    {v.usage_count}x
                  </td>

                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleVoucherStatus(v.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                      }`}
                    >
                      {v.is_active ? 'Aktif' : 'Non-Aktif'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        title="Lihat Detail Voucher"
                        onClick={() => handleOpenDetail(v)}
                        className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

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

      {/* ========================================================================= */}
      {/* POPUP DETAIL VOUCHER & TARGET PENGGUNA                                    */}
      {/* ========================================================================= */}
      {selectedVoucherDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-5 shadow-2xl border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-extrabold text-base text-primary">
                    {selectedVoucherDetail.code}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedVoucherDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                  }`}>
                    {selectedVoucherDetail.is_active ? '● Voucher Aktif' : '○ Non-Aktif'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVoucherDetail(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-body font-medium leading-relaxed bg-neutral-2/50 p-3 rounded-2xl border border-hairline">
                {selectedVoucherDetail.description || 'Tidak ada deskripsi.'}
              </p>

              {/* Box: Yang Berhak Menggunakan Voucher */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                <span className="font-extrabold text-[#101519] flex items-center gap-1.5 text-xs">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Target Pengguna (Yang Berhak Klaim)
                </span>
                <div className="pt-1">
                  {getTargetBadge(selectedVoucherDetail)}
                </div>
                <div className="text-[11px] text-body space-y-1 pt-1">
                  <p>Ketentuan: <strong>{selectedVoucherDetail.target_audience_label || 'Semua Pelanggan (Publik)'}</strong></p>
                  <p>Maksimal Klaim per Akun: <strong>{selectedVoucherDetail.usage_per_user || 1} kali</strong></p>
                  {selectedVoucherDetail.specific_phones && (
                    <div className="mt-1 p-2 bg-white rounded-xl border border-hairline">
                      <span className="font-bold text-[10px] block text-body">Nomor HP yang Terdaftar Berhak:</span>
                      <span className="font-mono text-[11px] text-[#101519] break-all">{selectedVoucherDetail.specific_phones}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Diskon & Kuota */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-neutral-2/50 rounded-xl border border-hairline">
                  <span className="text-[10px] text-body block font-medium">Nilai Potongan</span>
                  <strong className="text-sm text-primary block">
                    {selectedVoucherDetail.discount_type === 'percentage'
                      ? `${selectedVoucherDetail.discount_value}%`
                      : formatRupiah(selectedVoucherDetail.discount_value)}
                  </strong>
                  {selectedVoucherDetail.max_discount && (
                    <span className="text-[10px] text-body">Maks: {formatRupiah(selectedVoucherDetail.max_discount)}</span>
                  )}
                </div>

                <div className="p-3 bg-neutral-2/50 rounded-xl border border-hairline">
                  <span className="text-[10px] text-body block font-medium">Min. Belanja</span>
                  <strong className="text-sm text-[#101519] block">
                    {formatRupiah(selectedVoucherDetail.min_spend)}
                  </strong>
                  <span className="text-[10px] text-body">Periode s/d {selectedVoucherDetail.end_date}</span>
                </div>
              </div>

              {/* Kuota Penggunaan */}
              <div className="p-3 bg-neutral-2/50 rounded-xl border border-hairline space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-body font-semibold">Total Penggunaan:</span>
                  <span className="font-bold text-[#101519]">
                    {selectedVoucherDetail.usage_count} / {selectedVoucherDetail.usage_limit || '∞'} Kuota
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        selectedVoucherDetail.usage_limit
                          ? (selectedVoucherDetail.usage_count / selectedVoucherDetail.usage_limit) * 100
                          : 20
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const v = selectedVoucherDetail;
                  setSelectedVoucherDetail(null);
                  handleOpenEdit(v);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Voucher Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucherDetail(null)}
                className="px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT VOUCHER MODAL                                                  */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519] flex items-center gap-1.5">
                <Ticket className="w-5 h-5 text-primary" />
                <span>{editingVoucher ? 'Edit Voucher Promo' : 'Buat Voucher Promo Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Kode Voucher *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: USKIBARU / SANTRIBERKAH"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono uppercase font-bold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Singkat Voucher</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Diskon 10% untuk buku & ATK pelanggan baru"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* ========================================================= */}
              {/* TARGET PENGGUNA (YANG BISA MENGGUNAKAN VOUCHER)            */}
              {/* ========================================================= */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 font-extrabold text-[#101519]">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Siapa yang Bisa Menggunakan Voucher Ini? *</span>
                </div>

                <div>
                  <label className="font-bold text-body block mb-1">Target Segmen Pelanggan:</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as VoucherTargetAudience)}
                    className="w-full h-10 px-3 bg-white border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="all">Semua Pelanggan (Publik / Tanpa Batasan)</option>
                    <option value="new_customer">Khusus Pelanggan Baru (Transaksi Pertama)</option>
                    <option value="santri_pesantren">Khusus Santri, Asrama & Pondok Pesantren</option>
                    <option value="guru_pengajar">Khusus Guru, Ustadz & Tenaga Pendidik</option>
                    <option value="vip_member">Khusus Member VIP / Pelanggan Setia</option>
                    <option value="specific_phones">Khusus Nomor WhatsApp Tertentu</option>
                  </select>
                </div>

                {/* Input Khusus Nomor HP jika memilih specific_phones */}
                {targetAudience === 'specific_phones' && (
                  <div className="space-y-1">
                    <label className="font-bold text-body block text-[11px]">
                      Masukkan Nomor HP / WhatsApp (Pisahkan dengan Koma):
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={specificPhones}
                      onChange={(e) => setSpecificPhones(e.target.value)}
                      placeholder="Contoh: 081298765432, 085712345678"
                      className="w-full p-2.5 bg-white border border-hairline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="font-bold text-body block mb-1 text-[11px]">Maks. Klaim per Akun:</label>
                    <select
                      value={usagePerUser}
                      onChange={(e) => setUsagePerUser(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-hairline rounded-xl font-semibold"
                    >
                      <option value="1">1 kali per akun</option>
                      <option value="2">2 kali per akun</option>
                      <option value="500">Tanpa batas (Bebas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-body block mb-1 text-[11px]">Kategori Berlaku:</label>
                    <select
                      value={applicableCategory}
                      onChange={(e) => setApplicableCategory(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-hairline rounded-xl font-semibold"
                    >
                      <option value="all">Semua Kategori Produk</option>
                      <option value="buku-novel">Khusus Buku & Novel</option>
                      <option value="alquran">Khusus Al-Qur&apos;an & Kitab</option>
                      <option value="atk">Khusus ATK & Kertas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Diskon & Ketentuan Belanja */}
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

              <div>
                <label className="font-bold text-body block mb-1">Total Kuota Pemakaian (Klaim)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                  placeholder="Contoh: 500 (Batas total seluruh pelanggan)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-[40px] px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl hover:bg-neutral-3 transition-colors touch-manipulation"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-colors touch-manipulation"
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