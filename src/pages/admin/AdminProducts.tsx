import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  AlertCircle,
  X,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  Barcode,
  Camera,
  Printer,
  ArrowUpDown,
  History,
  Download,
  Box,
  RotateCw,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Product, InventoryMovement } from '@/types';

export const AdminProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'movements' ? 'movements' : 'products';

  const {
    products,
    inventoryMovements,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductByBarcodeOrSku,
  } = useProductStore();
  const { categories } = useCategoryStore();
  const { user } = useAuthStore();

  // Active Main Tab: Products Catalog vs Stock Movements Audit Trail
  const [mainTab, setMainTab] = useState<'products' | 'movements'>(initialTab);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilterTab, setStatusFilterTab] = useState<'all' | 'low_stock' | 'discount' | 'inactive'>('all');

  // Barcode Scanning Input & Camera Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraScanSimulating, setCameraScanSimulating] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [printLabelProduct, setPrintLabelProduct] = useState<Product | null>(null);
  const [printCopies, setPrintCopies] = useState('1');

  // Quick Stock Adjustment Form States
  const [stockDelta, setStockDelta] = useState('10');
  const [adjustmentType, setAdjustmentType] = useState<InventoryMovement['type']>('purchase_in');
  const [adjustmentNotes, setAdjustmentNotes] = useState('Restock pengadaan barang baru');
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);

  // Add / Edit Product Form States
  const [name, setName] = useState('');
  const [skuMaster, setSkuMaster] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [basePrice, setBasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [minStockAlert, setMinStockAlert] = useState<string>('');
  const [weightGrams, setWeightGrams] = useState<string>('');
  const [description, setDescription] = useState('');

  // Image Upload & URL States
  const [imageUploadType, setImageUploadType] = useState<'upload' | 'url'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Handle URL tab sync
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'movements') {
      setMainTab('movements');
    }
  }, [searchParams]);

  const resetForm = () => {
    setName('');
    setSkuMaster('');
    setIsbn('');
    setAuthor('');
    setCategoryId(categories[0]?.id || '');
    setBasePrice('');
    setSalePrice('');
    setStockQuantity('');
    setMinStockAlert('');
    setWeightGrams('');
    setDescription('');
    setImageUrl('');
    setImagePreview(null);
    setImageUploadType('upload');
    setEditingProduct(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSkuMaster(product.sku_master);
    setIsbn(product.isbn || '');
    setAuthor(product.author || '');
    setCategoryId(product.category_id);
    setBasePrice(String(product.base_price));
    setSalePrice(product.sale_price ? String(product.sale_price) : '');
    setStockQuantity(String(product.stock_quantity));
    setMinStockAlert(String(product.min_stock_alert));
    setWeightGrams(String(product.weight_grams || 300));
    setDescription(product.description || '');
    setImagePreview(product.images[0] || null);
    setImageUrl('');
    setImageUploadType('upload');
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    resetForm();
  };

  const handleOpenStockAdjust = (product: Product) => {
    setStockAdjustProduct(product);
    setStockDelta('10');
    setAdjustmentType('purchase_in');
    setAdjustmentNotes('Restock pengadaan barang baru');
    setStockSuccessMsg(null);
  };

  const handleExecuteStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    const qty = Math.abs(Number(stockDelta) || 1);
    let delta = qty;
    if (adjustmentType === 'sale_out' || adjustmentType === 'damaged') {
      delta = -qty;
    } else if (adjustmentType === 'manual_adjustment') {
      // difference from current stock
      delta = Number(stockDelta) - stockAdjustProduct.stock_quantity;
    }

    adjustStock(
      stockAdjustProduct.id,
      undefined,
      delta,
      adjustmentType,
      adjustmentNotes || 'Penyesuaian stok manual',
      user?.full_name || 'Admin Toko'
    );

    const updated = useProductStore.getState().getProductById(stockAdjustProduct.id);
    setStockAdjustProduct(null);
    alert(`Stok ${stockAdjustProduct.name} berhasil diperbarui! Stok sekarang: ${updated?.stock_quantity ?? (stockAdjustProduct.stock_quantity + delta)} pcs.`);
  };

  // Barcode Scan submission
  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = getProductByBarcodeOrSku(barcodeInput.trim());
    if (found) {
      handleOpenStockAdjust(found);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode / SKU / ISBN "${barcodeInput}" tidak ditemukan dalam katalog.`);
    }
  };

  // Camera Barcode Scanner trigger
  const handleStartCameraScan = () => {
    setShowCameraScanner(true);
    setCameraScanSimulating(true);

    // Try starting physical camera if permitted
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // fallback to simulated barcode scanning
        });
    }

    // Auto-detect a random product for smooth demo experience
    setTimeout(() => {
      const demoProd = products[0];
      if (demoProd) {
        setShowCameraScanner(false);
        setCameraScanSimulating(false);
        handleOpenStockAdjust(demoProd);
      }
    }, 2800);
  };

  const handleCloseCameraScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    }
    setShowCameraScanner(false);
    setCameraScanSimulating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter calculations
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock_alert).length;
  const discountCount = products.filter((p) => p.sale_price && p.sale_price < p.base_price).length;
  const inactiveCount = products.filter((p) => !p.is_active).length;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(q) ||
      p.sku_master.toLowerCase().includes(q) ||
      (p.isbn && p.isbn.includes(q)) ||
      (p.author && p.author.toLowerCase().includes(q));

    const matchCat = selectedCategory ? p.category_id === selectedCategory : true;

    let matchTab = true;
    if (statusFilterTab === 'low_stock') {
      matchTab = p.stock_quantity <= p.min_stock_alert;
    } else if (statusFilterTab === 'discount') {
      matchTab = Boolean(p.sale_price && p.sale_price < p.base_price);
    } else if (statusFilterTab === 'inactive') {
      matchTab = !p.is_active;
    }

    return matchQuery && matchCat && matchTab;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !skuMaster.trim() || !basePrice) return;

    const finalImage =
      (imageUploadType === 'upload' ? imagePreview : imageUrl.trim()) ||
      imagePreview ||
      imageUrl.trim() ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800';

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    addProduct({
      name: name.trim(),
      slug: `${slug}-${Date.now()}`,
      sku_master: skuMaster.trim().toUpperCase(),
      isbn: isbn.trim() || undefined,
      author: author.trim() || undefined,
      category_id: categoryId || categories[0]?.id || 'cat-1',
      base_price: Number(basePrice) || 0,
      sale_price: salePrice ? Number(salePrice) : null,
      stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
      min_stock_alert: minStockAlert ? Number(minStockAlert) : 5,
      weight_grams: weightGrams ? Number(weightGrams) : 300,
      description: description.trim() || 'Deskripsi produk resmi USKI STORE.',
      specifications: {
        'Kondisi': 'Baru & Original',
        'Garansi': 'Toko Resmi',
      },
      is_active: true,
      is_featured: false,
      images: [finalImage],
    });

    handleCloseAddModal();
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name.trim() || !skuMaster.trim() || !basePrice) return;

    const finalImage =
      (imageUploadType === 'upload' ? imagePreview : imageUrl.trim()) ||
      imagePreview ||
      imageUrl.trim() ||
      editingProduct.images[0];

    updateProduct(editingProduct.id, {
      name: name.trim(),
      sku_master: skuMaster.trim().toUpperCase(),
      isbn: isbn.trim() || undefined,
      author: author.trim() || undefined,
      category_id: categoryId,
      base_price: Number(basePrice) || 0,
      sale_price: salePrice ? Number(salePrice) : null,
      stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
      min_stock_alert: minStockAlert ? Number(minStockAlert) : 5,
      weight_grams: weightGrams ? Number(weightGrams) : 300,
      description: description.trim() || 'Deskripsi produk resmi USKI STORE.',
      images: [finalImage],
    });

    handleCloseEditModal();
  };

  // CSV Export functions
  const handleExportProductsCSV = () => {
    const headers = ['SKU Master', 'ISBN', 'Nama Produk', 'Kategori', 'Harga Dasar', 'Harga Diskon', 'Stok', 'Batas Min', 'Status'];
    const rows = products.map((p) => [
      `"${p.sku_master}"`,
      `"${p.isbn || '-'}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${categories.find((c) => c.id === p.category_id)?.name || '-'}"`,
      p.base_price,
      p.sale_price || '-',
      p.stock_quantity,
      p.min_stock_alert,
      p.is_active ? 'Aktif' : 'Nonaktif',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `USKI_STORE_Katalog_Produk_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportMovementsCSV = () => {
    const headers = ['Waktu', 'Produk', 'SKU', 'Tipe Mutasi', 'Perubahan Unit', 'Stok Akhir', 'Catatan / Alasan', 'Operator'];
    const rows = inventoryMovements.map((m) => [
      `"${formatDate(m.created_at)}"`,
      `"${m.product_name.replace(/"/g, '""')}"`,
      `"${m.sku}"`,
      m.type,
      m.quantity_delta,
      m.stock_after,
      `"${m.notes.replace(/"/g, '""')}"`,
      `"${m.operator_name}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `USKI_STORE_Audit_Mutasi_Stok_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Katalog Produk & Inventaris Stok
          </h1>
          <p className="text-xs text-body mt-1">
            Pusat master produk, pemindai barcode / opname stok, cetak label stiker, dan audit mutasi barang masuk/keluar
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportProductsCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl border border-hairline transition-all"
            title="Download file Excel/CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Katalog vs Riwayat Mutasi) */}
      <div className="flex border-b border-hairline gap-6 text-sm font-bold">
        <button
          onClick={() => {
            setMainTab('products');
            setSearchParams({});
          }}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            mainTab === 'products' ? 'text-primary' : 'text-body hover:text-[#101519]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog & Stok ({products.length})</span>
          {mainTab === 'products' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            setMainTab('movements');
            setSearchParams({ tab: 'movements' });
          }}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            mainTab === 'movements' ? 'text-primary' : 'text-body hover:text-[#101519]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi Stok (Audit Trail) ({inventoryMovements.length})</span>
          {mainTab === 'movements' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG & INTEGRATED SCANNER */}
      {mainTab === 'products' && (
        <div className="space-y-4">
          {/* Integrated Barcode & SKU Fast Scanner Tool Card */}
          <div className="bg-gradient-to-r from-primary/5 via-neutral-2/40 to-neutral-2/60 border border-primary/20 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-extrabold text-[#101519]">
                  Pindai Barcode / Scan SKU Cepat
                </h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                  Scanner Siap
                </span>
              </div>
              <p className="text-[11px] text-body">
                Gunakan scanner barcode fisik (gun) atau kamera HP untuk restock instan
              </p>
            </div>

            <form onSubmit={handleBarcodeScanSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Arahkan barcode scanner atau ketik SKU / ISBN (contoh: BK-AH-001)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-white border border-hairline rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-primary shadow-xs"
                />
                <Barcode className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-5 h-11 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm"
                >
                  Cari & Ubah Stok
                </button>

                <button
                  type="button"
                  onClick={handleStartCameraScan}
                  className="px-4 h-11 bg-white hover:bg-neutral-2 text-body font-bold text-xs rounded-xl border border-hairline transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Scan Kamera HP</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilterTab('all')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilterTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-body border border-hairline hover:bg-neutral-2'
              }`}
            >
              Semua Produk ({products.length})
            </button>

            <button
              onClick={() => setStatusFilterTab('low_stock')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                statusFilterTab === 'low_stock'
                  ? 'bg-badge-text text-white shadow-sm'
                  : 'bg-white text-badge-text border border-red-200 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stok Menipis / Kritis ({lowStockCount})</span>
            </button>

            <button
              onClick={() => setStatusFilterTab('discount')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                statusFilterTab === 'discount'
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sedang Diskon ({discountCount})</span>
            </button>

            <button
              onClick={() => setStatusFilterTab('inactive')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilterTab === 'inactive'
                  ? 'bg-[#2D3033] text-white shadow-sm'
                  : 'bg-white text-body border border-hairline hover:bg-neutral-2'
              }`}
            >
              Non-Aktif ({inactiveCount})
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari nama barang, SKU, ISBN, atau penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
            <div className="md:hidden px-4 py-2 bg-neutral-2/50 border-b border-hairline text-[10px] text-body flex items-center justify-between font-semibold">
              <span>👈 Geser tabel ke kanan untuk melihat stok & aksi 👉</span>
            </div>
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4 text-center">Stok & Mutasi Cepat</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-body">
                        Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-2/30 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-lg border border-hairline shrink-0 bg-neutral-2"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#101519] truncate max-w-xs">{p.name}</p>
                            <p className="text-[11px] text-body">{p.author || p.brand?.name || '-'}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-[#101519]">{p.sku_master}</span>
                          {p.isbn && <span className="block text-body text-[10px]">{p.isbn}</span>}
                        </td>

                        <td className="py-3.5 px-4 text-body">
                          {categories.find((c) => c.id === p.category_id)?.name || '-'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-primary">
                            {formatRupiah(p.sale_price ?? p.base_price)}
                          </span>
                          {p.sale_price && (
                            <span className="block text-body text-[10px] line-through">
                              {formatRupiah(p.base_price)}
                            </span>
                          )}
                        </td>

                        {/* Stok & Quick Adjust Button directly in Table */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenStockAdjust(p)}
                              title="Klik untuk ubah / tambah stok (Opname & Restock)"
                              className={`font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 border transition-all ${
                                p.stock_quantity <= p.min_stock_alert
                                  ? 'bg-red-50 text-badge-text border-red-200 hover:bg-red-100'
                                  : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                              }`}
                            >
                              <span>{p.stock_quantity} pcs</span>
                              <ArrowUpDown className="w-3 h-3 text-body" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => updateProduct(p.id, { is_active: !p.is_active })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              p.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                            }`}
                          >
                            {p.is_active ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="Cetak Label Stiker Barcode"
                              onClick={() => setPrintLabelProduct(p)}
                              className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              title="Edit Lengkap Produk"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              title="Hapus Produk"
                              onClick={() => setProductToDelete({ id: p.id, name: p.name })}
                              className="p-1.5 hover:text-badge-text text-body hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT MOVEMENTS HISTORY (MUTASI STOK) */}
      {mainTab === 'movements' && (
        <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#101519]">
                Catatan Riwayat Mutasi Stok (Audit Trail)
              </h2>
              <p className="text-xs text-body mt-0.5">
                Log kronologis setiap penambahan restock supplier, pengurangan barang rusak, penjualan, dan opname fisik
              </p>
            </div>
            <button
              onClick={handleExportMovementsCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl border border-hairline transition-all self-start"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Log Mutasi (CSV)</span>
            </button>
          </div>

          <div className="md:hidden px-4 py-2 bg-neutral-2/50 border border-hairline rounded-xl text-[10px] text-body flex items-center justify-between font-semibold">
            <span>👈 Geser tabel riwayat ke kanan untuk melihat rincian 👉</span>
          </div>
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Produk & SKU</th>
                  <th className="py-2.5 px-3 text-center">Tipe Mutasi</th>
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
                        {mov.type === 'purchase_in'
                          ? 'Restock Masuk (+)'
                          : mov.type === 'damaged'
                          ? 'Barang Cacat (-)'
                          : mov.type === 'sale_out'
                          ? 'Penjualan (-)'
                          : mov.type === 'initial'
                          ? 'Stok Awal'
                          : 'Opname Fisik'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={mov.quantity_delta > 0 ? 'text-green-600' : 'text-badge-text'}>
                        {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta} pcs
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-[#101519]">
                      {mov.stock_after} pcs
                    </td>
                    <td className="py-3 px-3 text-body">{mov.notes}</td>
                    <td className="py-3 px-3 font-semibold text-[#101519]">{mov.operator_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Penyesuaian & Opname Stok
                </h3>
              </div>
              <button onClick={() => setStockAdjustProduct(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Product summary */}
            <div className="p-3 bg-neutral-2/50 border border-hairline rounded-2xl flex items-center gap-3">
              <img
                src={stockAdjustProduct.images[0]}
                alt={stockAdjustProduct.name}
                className="w-12 h-14 object-cover rounded-xl border border-hairline bg-white shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-primary font-bold text-xs">
                  {stockAdjustProduct.sku_master}
                </span>
                <h4 className="font-extrabold text-xs text-[#101519] truncate">
                  {stockAdjustProduct.name}
                </h4>
                <p className="text-[11px] text-body">
                  Stok Saat Ini:{' '}
                  <strong className="text-primary text-sm font-extrabold">
                    {stockAdjustProduct.stock_quantity} pcs
                  </strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Jenis Mutasi Stok *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="purchase_in">🟢 Barang Masuk / Restock Supplier (+)</option>
                  <option value="damaged">🔴 Barang Rusak / Cacat (-)</option>
                  <option value="manual_adjustment">🔵 Penyesuaian Fisik (Stok Opname Total)</option>
                  <option value="sale_out">🟠 Penjualan Manual Toko (-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  {adjustmentType === 'manual_adjustment'
                    ? 'Total Stok Fisik Hasil Opname *'
                    : 'Jumlah Unit Perubahan *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 20"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Keterangan / Alasan Mutasi *</label>
                <input
                  type="text"
                  required
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Contoh: Faktur No. 2099 / Pengadaan SiDu"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">Scanner Kamera Barcode</h3>
              </div>
              <button onClick={handleCloseCameraScanner}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Video Viewport / Laser Scanner Frame */}
            <div className="relative bg-black rounded-2xl h-56 overflow-hidden flex items-center justify-center border-2 border-primary">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-x-8 h-0.5 bg-red-500 shadow-[0_0_12px_red] animate-pulse" />
              <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none" />
              <div className="absolute bottom-2 text-white/90 text-[10px] bg-black/60 px-2 py-0.5 rounded">
                Arahkan kamera ke garis barcode buku / ATK
              </div>
            </div>

            <p className="text-xs text-body animate-pulse">
              Mendeteksi kode batang barcode...
            </p>

            <button
              onClick={handleCloseCameraScanner}
              className="w-full py-2.5 bg-neutral-2 text-body font-bold rounded-xl text-xs"
            >
              Tutup Scanner
            </button>
          </div>
        </div>
      )}

      {/* PRINT BARCODE LABEL STICKER MODAL */}
      {printLabelProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Cetak Label Stiker Barcode
                </h3>
              </div>
              <button onClick={() => setPrintLabelProduct(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Sticker Preview Box */}
            <div className="p-4 bg-neutral-2/40 border border-hairline rounded-2xl flex flex-col items-center">
              <div
                id="printable-barcode-sticker"
                className="w-64 p-4 bg-white border-2 border-dashed border-[#101519] rounded-xl text-center space-y-1 shadow-sm font-sans"
              >
                <span className="font-extrabold text-[11px] tracking-wider uppercase text-[#101519] block">
                  USKI STORE
                </span>
                <p className="font-bold text-xs text-[#101519] line-clamp-1">
                  {printLabelProduct.name}
                </p>

                {/* Visual Barcode Pattern */}
                <div className="py-1 flex justify-center">
                  <svg className="w-48 h-12" viewBox="0 0 200 50">
                    {/* Simulated crisp barcode stripes */}
                    <rect x="5" y="0" width="3" height="40" fill="#000" />
                    <rect x="11" y="0" width="2" height="40" fill="#000" />
                    <rect x="16" y="0" width="4" height="40" fill="#000" />
                    <rect x="23" y="0" width="2" height="40" fill="#000" />
                    <rect x="28" y="0" width="5" height="40" fill="#000" />
                    <rect x="36" y="0" width="2" height="40" fill="#000" />
                    <rect x="42" y="0" width="3" height="40" fill="#000" />
                    <rect x="48" y="0" width="6" height="40" fill="#000" />
                    <rect x="58" y="0" width="2" height="40" fill="#000" />
                    <rect x="64" y="0" width="4" height="40" fill="#000" />
                    <rect x="72" y="0" width="3" height="40" fill="#000" />
                    <rect x="78" y="0" width="5" height="40" fill="#000" />
                    <rect x="86" y="0" width="2" height="40" fill="#000" />
                    <rect x="92" y="0" width="4" height="40" fill="#000" />
                    <rect x="100" y="0" width="3" height="40" fill="#000" />
                    <rect x="106" y="0" width="5" height="40" fill="#000" />
                    <rect x="115" y="0" width="2" height="40" fill="#000" />
                    <rect x="120" y="0" width="4" height="40" fill="#000" />
                    <rect x="128" y="0" width="3" height="40" fill="#000" />
                    <rect x="135" y="0" width="6" height="40" fill="#000" />
                    <rect x="145" y="0" width="2" height="40" fill="#000" />
                    <rect x="150" y="0" width="4" height="40" fill="#000" />
                    <rect x="158" y="0" width="3" height="40" fill="#000" />
                    <rect x="165" y="0" width="5" height="40" fill="#000" />
                    <rect x="174" y="0" width="2" height="40" fill="#000" />
                    <rect x="180" y="0" width="4" height="40" fill="#000" />
                    <rect x="188" y="0" width="3" height="40" fill="#000" />
                  </svg>
                </div>

                <div className="font-mono text-[10px] font-bold text-[#101519] tracking-widest">
                  {printLabelProduct.sku_master}
                  {printLabelProduct.isbn && ` • ${printLabelProduct.isbn}`}
                </div>

                <div className="font-extrabold text-sm text-primary pt-0.5">
                  {formatRupiah(printLabelProduct.sale_price ?? printLabelProduct.base_price)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-body">Jumlah Lembar Stiker:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={printCopies}
                onChange={(e) => setPrintCopies(e.target.value)}
                className="w-20 h-9 px-2 bg-neutral-2 border border-hairline rounded-xl font-bold text-center focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 border-t border-hairline flex gap-2">
              <button
                type="button"
                onClick={() => setPrintLabelProduct(null)}
                className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak {printCopies} Lembar Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-6 shadow-2xl touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#101519]">Tambah Produk Baru</h3>
                <p className="text-xs text-body">Lengkapi data barang untuk katalog USKI STORE</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1 rounded-lg text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Produk / Judul Buku *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Joyko Drawing Pen 0.5mm Hitam"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">SKU Master *</label>
                  <input
                    type="text"
                    required
                    value={skuMaster}
                    onChange={(e) => setSkuMaster(e.target.value)}
                    placeholder="Contoh: ATK-JYK-05"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono uppercase font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">ISBN (Khusus Buku)</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-602-..."
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Penulis / Merek</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nama Penulis atau Brand"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Number fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Harga Dasar (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Harga Diskon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Opsional"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Contoh: 20"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    placeholder="Contoh: 5"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Berat Produk (Gram)</label>
                <input
                  type="number"
                  min="0"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  placeholder="Contoh: 300 (Default: 300g)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Foto Produk */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-body">Foto Produk *</label>
                  <div className="flex items-center gap-1 bg-neutral-2 p-1 rounded-xl border border-hairline text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageUploadType('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                        imageUploadType === 'upload'
                          ? 'bg-white text-primary shadow-xs'
                          : 'text-body hover:text-[#101519]'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload dari File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadType('url')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                        imageUploadType === 'url'
                          ? 'bg-white text-primary shadow-xs'
                          : 'text-body hover:text-[#101519]'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Tempel URL</span>
                    </button>
                  </div>
                </div>

                {imageUploadType === 'upload' ? (
                  <div>
                    {imagePreview ? (
                      <div className="relative border-2 border-hairline rounded-2xl p-4 bg-neutral-2/30 flex items-center gap-4">
                        <img
                          src={imagePreview}
                          alt="Preview Produk"
                          className="w-20 h-24 object-cover rounded-xl border border-hairline shadow-sm bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#101519] text-xs">Foto Produk Berhasil Dimuat</p>
                          <div className="flex items-center gap-3 mt-2.5">
                            <label className="cursor-pointer text-xs font-bold text-primary hover:underline">
                              Ganti Foto
                              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                            <span className="text-hairline">•</span>
                            <button
                              type="button"
                              onClick={() => setImagePreview(null)}
                              className="text-xs font-bold text-badge-text hover:underline"
                            >
                              Hapus Foto
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-6 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center group">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-hairline flex items-center justify-center shadow-xs mb-2 group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-6 h-6 text-primary" />
                        </div>
                        <span className="font-bold text-xs text-[#101519]">
                          Klik untuk Upload Foto dari Komputer atau HP
                        </span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-5 py-2.5 bg-neutral-2 text-body font-bold rounded-xl hover:bg-neutral-2/80 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-6 shadow-2xl touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#101519]">Edit Data Produk</h3>
                <p className="text-xs text-body">
                  Perbarui informasi, harga, stok, atau foto produk USKI STORE
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1 rounded-lg text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Produk / Judul Buku *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">SKU Master *</label>
                  <input
                    type="text"
                    required
                    value={skuMaster}
                    onChange={(e) => setSkuMaster(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono uppercase font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">ISBN (Khusus Buku)</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Penulis / Merek</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Harga Dasar (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Harga Diskon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Stok Tersedia *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Batas Min Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Berat Produk (Gram)</label>
                <input
                  type="number"
                  min="0"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Foto Produk */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-body">Foto Produk</label>
                </div>
                <div>
                  {imagePreview ? (
                    <div className="relative border-2 border-hairline rounded-2xl p-4 bg-neutral-2/30 flex items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="Preview Produk"
                        className="w-20 h-24 object-cover rounded-xl border border-hairline shadow-sm bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#101519] text-xs">Foto Saat Ini</p>
                        <div className="flex items-center gap-3 mt-2.5">
                          <label className="cursor-pointer text-xs font-bold text-primary hover:underline">
                            Ganti Foto
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          </label>
                          <span className="text-hairline">•</span>
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="text-xs font-bold text-badge-text hover:underline"
                          >
                            Hapus Foto
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-6 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center">
                      <UploadCloud className="w-6 h-6 text-primary mb-1" />
                      <span className="font-bold text-xs text-[#101519]">Upload Foto Baru dari Komputer</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-5 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-badge-text flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#101519]">Hapus Produk?</h3>
              <p className="text-xs text-body mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus produk{' '}
                <span className="font-bold text-[#101519]">"{productToDelete.name}"</span>?
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-5 py-2.5 bg-badge-text text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
