import React, { useState } from 'react';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  ArrowUpDown,
  AlertTriangle,
  History,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { InventoryMovement } from '@/types';

export const AdminInventory: React.FC = () => {
  const { products, inventoryMovements, adjustStock, getProductByBarcodeOrSku } = useProductStore();
  const { user } = useAuthStore();

  const [scanQuery, setScanQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [stockDelta, setStockDelta] = useState<string>('10');
  const [adjustmentType, setAdjustmentType] = useState<InventoryMovement['type']>('purchase_in');
  const [adjustmentNotes, setAdjustmentNotes] = useState('Restock pengadaan barang masuk');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    const found = getProductByBarcodeOrSku(scanQuery);
    if (found) {
      setScannedProduct(found);
      setSuccessMsg(null);
    } else {
      alert(`Produk dengan SKU / Barcode "${scanQuery}" tidak ditemukan.`);
      setScannedProduct(null);
    }
  };

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedProduct) return;

    const qty = Math.abs(Number(stockDelta) || 1);
    const delta = adjustmentType === 'sale_out' || adjustmentType === 'damaged' ? -qty : qty;

    adjustStock(
      scannedProduct.id,
      undefined,
      delta,
      adjustmentType,
      adjustmentNotes,
      user?.full_name || 'Admin Toko'
    );

    setSuccessMsg(`Stok ${scannedProduct.name} berhasil diperbarui (Perubahan: ${delta > 0 ? `+${delta}` : delta} pcs)`);
    // re-fetch updated product
    setScannedProduct(useProductStore.getState().getProductById(scannedProduct.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Inventaris & Operasi Barcode
        </h1>
        <p className="text-xs text-body mt-1">
          Pindai barcode produk untuk penambahan stok barang masuk, opname stok, dan catat riwayat mutasi
        </p>
      </div>

      {/* Barcode Scanner & Rapid Stock Tool Card */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-hairline pb-3">
          <Barcode className="w-5 h-5 text-primary" />
          <h2 className="text-base font-extrabold text-[#101519]">
            Pindai Barcode / Input SKU Manual
          </h2>
        </div>

        <form onSubmit={handleScanSubmit} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Arahkan barcode scanner atau ketik SKU / ISBN (e.g. BK-AH-001)..."
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-primary"
            />
            <Barcode className="w-4 h-4 text-body absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-6 h-11 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-dark transition-all"
          >
            Cari Produk
          </button>
        </form>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scanned Product Adjustment Form */}
        {scannedProduct && (
          <form
            onSubmit={handleExecuteAdjustment}
            className="p-5 bg-neutral-2/50 border border-hairline rounded-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-primary font-bold">{scannedProduct.sku_master}</span>
                <h3 className="text-sm font-extrabold text-[#101519]">{scannedProduct.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-body block text-[11px]">Stok Saat Ini:</span>
                <span className="text-xl font-extrabold text-primary">{scannedProduct.stock_quantity} pcs</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-bold text-body block mb-1">Jenis Mutasi *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-hairline rounded-xl font-semibold"
                >
                  <option value="purchase_in">Barang Masuk / Pembelian Supplier (+)</option>
                  <option value="manual_adjustment">Penyesuaian Fisik (Opname)</option>
                  <option value="damaged">Barang Rusak / Cacat (-)</option>
                  <option value="sale_out">Penjualan Manual Toko (-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Jumlah Unit *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 10"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                  className="w-full h-10 px-3 bg-white border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Keterangan / Alasan *</label>
                <input
                  type="text"
                  required
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Contoh: Faktur No. 2099 / Barang cacat sampul"
                  className="w-full h-10 px-3 bg-white border border-hairline rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
              >
                Konfirmasi Mutasi Stok
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Audit Movements History Table */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-hairline pb-3">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-base font-extrabold text-[#101519]">
            Catatan Riwayat Mutasi Stok (Audit Trail)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Produk & SKU</th>
                <th className="py-2.5 px-3 text-center">Tipe</th>
                <th className="py-2.5 px-3 text-center">Perubahan</th>
                <th className="py-2.5 px-3 text-center">Stok Akhir</th>
                <th className="py-2.5 px-3">Alasan / Catatan</th>
                <th className="py-2.5 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {inventoryMovements.map((mov) => (
                <tr key={mov.id} className="hover:bg-neutral-2/20">
                  <td className="py-3 px-3 text-body">{formatDate(mov.created_at)}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#101519] block">{mov.product_name}</span>
                    <span className="font-mono text-[10px] text-body">{mov.sku}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-neutral-2 text-body font-bold rounded text-[10px]">
                      {mov.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    <span className={mov.quantity_delta > 0 ? 'text-green-600' : 'text-badge-text'}>
                      {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-[#101519]">
                    {mov.stock_after}
                  </td>
                  <td className="py-3 px-3 text-body">{mov.notes}</td>
                  <td className="py-3 px-3 font-semibold text-[#101519]">{mov.operator_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
