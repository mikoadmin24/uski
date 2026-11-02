import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Tag,
  X,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertTriangle,
  Barcode,
  Camera,
  Printer,
  ArrowUpDown,
  History,
  Download,
  RotateCw,
  Eye,
  Star,
  Flame,
  Sparkles,
  Award,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useAuthStore } from '@/store/authStore';
import { uploadFileToStorage, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Product, InventoryMovement } from '@/types';
import { RealBarcodeScannerModal } from '@/components/admin/RealBarcodeScannerModal';
import { convertImageToWebP } from '@/lib/imageUtils';

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
  const [statusFilterTab, setStatusFilterTab] = useState<'all' | 'low_stock' | 'discount' | 'featured' | 'best_seller' | 'new_arrival' | 'inactive'>('all');

  // Barcode Scanning Input & Real Camera Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [printLabelProduct, setPrintLabelProduct] = useState<Product | null>(null);
  const [printCopies, setPrintCopies] = useState('1');

  // Quick Stock Adjustment Form States
  const [stockDelta, setStockDelta] = useState('10');
  const [adjustmentType, setAdjustmentType] = useState<InventoryMovement['type']>('purchase_in');
  const [adjustmentNotes, setAdjustmentNotes] = useState('Restock pengadaan barang baru');

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
  // Homepage Badges Form States
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Multi-Image & Automatic WebP Conversion States
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isConvertingWebP, setIsConvertingWebP] = useState(false);
  const [webpSavingsInfo, setWebpSavingsInfo] = useState<string | null>(null);
  const [imageUploadType, setImageUploadType] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
    setProductImages([]);
    setWebpSavingsInfo(null);
    setImageUploadType('upload');
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsNewArrival(false);
    setEditingProduct(null);
  };

  const handleOpenAddModal = () => {
    setSelectedProductDetail(null);
    setStockAdjustProduct(null);
    setShowCameraScanner(false);
    setPrintLabelProduct(null);
    setProductToDelete(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProductDetail(null);
    setStockAdjustProduct(null);
    setShowCameraScanner(false);
    setPrintLabelProduct(null);
    setProductToDelete(null);
    setShowAddModal(false);
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
    setProductImages(product.images && product.images.length > 0 ? product.images : []);
    setWebpSavingsInfo(null);
    setImageUrl('');
    setImageUploadType('upload');
    setIsFeatured(Boolean(product.is_featured));
    setIsBestSeller(Boolean(product.is_best_seller));
    setIsNewArrival(Boolean(product.is_new_arrival));
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    resetForm();
  };

  const handleOpenStockAdjust = (product: Product) => {
    setSelectedProductDetail(null);
    setShowAddModal(false);
    setEditingProduct(null);
    setShowCameraScanner(false);
    setPrintLabelProduct(null);
    setProductToDelete(null);
    setStockAdjustProduct(product);
    setStockDelta('10');
    setAdjustmentType('purchase_in');
    setAdjustmentNotes('Restock pengadaan barang baru');
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
  };

  const handleRealBarcodeScanned = (decodedCode: string) => {
    setShowCameraScanner(false);
    const found = getProductByBarcodeOrSku(decodedCode);
    if (found) {
      handleOpenStockAdjust(found);
    } else {
      const shouldAdd = window.confirm(
        `Barcode / ISBN "${decodedCode}" berhasil terbaca langsung oleh kamera, namun belum ada di katalog produk.\n\nApakah Anda ingin menambahkan produk baru dengan Barcode/ISBN ini sekarang?`
      );
      if (shouldAdd) {
        handleOpenAddModal();
        setSkuMaster(decodedCode);
        if (decodedCode.length === 13 && (decodedCode.startsWith('978') || decodedCode.startsWith('979'))) {
          setIsbn(decodedCode);
          setCategoryId('cat-1');
        }
      }
    }
  };

  // Multi-image upload with automatic client-side WebP conversion
  const handleMultiImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsConvertingWebP(true);
    setWebpSavingsInfo(null);

    try {
      let totalOriginal = 0;
      let totalWebp = 0;
      const newImages: string[] = [];

      for (const file of files) {
        totalOriginal += file.size;
        // Automatic client-side WebP conversion
        const converted = await convertImageToWebP(file, { maxWidth: 1600, quality: 0.85 });
        totalWebp += converted.webpSize;

        let finalUrl = converted.dataUrl;
        if (isSupabaseConfigured) {
          try {
            const cloudUrl = await uploadFileToStorage(converted.file, 'product-images');
            if (cloudUrl) finalUrl = cloudUrl;
          } catch (upErr) {
            console.warn('Storage upload fallback to WebP DataURL:', upErr);
          }
        }
        newImages.push(finalUrl);
      }

      setProductImages((prev) => [...prev, ...newImages]);
      const savedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalWebp) / totalOriginal) * 100) : 0;
      setWebpSavingsInfo(`${files.length} foto berhasil dikonversi ke WebP (Kompresi hemat ~${savedPct}%)`);
    } catch (err: any) {
      console.error('WebP conversion failed:', err);
      alert('Gagal memproses foto: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsConvertingWebP(false);
      e.target.value = '';
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryProductImage = (index: number) => {
    setProductImages((prev) => {
      const selected = prev[index];
      const others = prev.filter((_, idx) => idx !== index);
      return [selected, ...others];
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return;
    setProductImages((prev) => [...prev, imageUrl.trim()]);
    setImageUrl('');
  };

  // Filter calculations
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock_alert).length;
  const discountCount = products.filter((p) => p.sale_price && p.sale_price < p.base_price).length;
  const featuredCount = products.filter((p) => p.is_featured).length;
  const bestSellerCount = products.filter((p) => p.is_best_seller).length;
  const newArrivalCount = products.filter((p) => p.is_new_arrival).length;
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
    } else if (statusFilterTab === 'featured') {
      matchTab = Boolean(p.is_featured);
    } else if (statusFilterTab === 'best_seller') {
      matchTab = Boolean(p.is_best_seller);
    } else if (statusFilterTab === 'new_arrival') {
      matchTab = Boolean(p.is_new_arrival);
    } else if (statusFilterTab === 'inactive') {
      matchTab = !p.is_active;
    }

    return matchQuery && matchCat && matchTab;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !skuMaster.trim() || !basePrice) return;

    setIsUploading(true);
    const finalImages = productImages.length > 0
      ? productImages
      : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'];

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      await addProduct({
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
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_new_arrival: isNewArrival,
        images: finalImages,
      });

      alert('Alhamdulillah! Produk dan foto berhasil disimpan ke database.');
    } catch (err: any) {
      console.error('Error adding product:', err);
      alert('Gagal menyimpan produk: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploading(false);
      handleCloseAddModal();
    }
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name.trim() || !skuMaster.trim() || !basePrice) return;

    setIsUploading(true);
    const finalImages = productImages.length > 0
      ? productImages
      : (editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800']);

    try {
      await updateProduct(editingProduct.id, {
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
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_new_arrival: isNewArrival,
        images: finalImages,
      });
      alert('Perubahan produk dan foto WebP berhasil diperbarui.');
    } catch (err: any) {
      console.error('Error updating product:', err);
      alert('Gagal memperbarui produk: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploading(false);
      handleCloseEditModal();
    }
  };

  // CSV Export functions
  const handleExportProductsCSV = () => {
    const headers = ['SKU Master', 'ISBN', 'Nama Produk', 'Kategori', 'Harga Dasar', 'Harga Diskon', 'Stok', 'Batas Min', 'Status', 'Unggulan', 'Terlaris', 'Terbaru'];
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
      p.is_featured ? 'Ya' : 'Tidak',
      p.is_best_seller ? 'Ya' : 'Tidak',
      p.is_new_arrival ? 'Ya' : 'Tidak',
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
              <Tag className="w-3.5 h-3.5" />
              <span>Sedang Diskon ({discountCount})</span>
            </button>

            <button
              onClick={() => setStatusFilterTab('featured')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                statusFilterTab === 'featured'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Unggulan ({featuredCount})</span>
            </button>

            <button
              onClick={() => setStatusFilterTab('best_seller')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                statusFilterTab === 'best_seller'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Terlaris ({bestSellerCount})</span>
            </button>

            <button
              onClick={() => setStatusFilterTab('new_arrival')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                statusFilterTab === 'new_arrival'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Terbaru ({newArrivalCount})</span>
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
              <span>Geser tabel ke samping untuk melihat stok & aksi</span>
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
                    <th className="py-3 px-4 text-center">Lencana Beranda</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-body">
                        Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProductDetail(p)}
                        className="hover:bg-primary/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-lg border border-hairline shrink-0 bg-neutral-2"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#101519] truncate max-w-xs group-hover:underline">{p.name}</p>
                            <p className="text-[11px] text-body">{p.author || p.brand?.name || '-'}</p>

                            {/* Active Badge Indicators */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.is_featured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold" title="Produk Unggulan">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Unggulan
                                </span>
                              )}
                              {p.is_best_seller && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold" title="Produk Terlaris">
                                  <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                  Terlaris
                                </span>
                              )}
                              {p.is_new_arrival && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold" title="Produk Terbaru">
                                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                                  Terbaru
                                </span>
                              )}
                            </div>
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
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
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

                        {/* Lencana Beranda Quick 1-Click Toggles */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateProduct(p.id, { is_featured: !p.is_featured })}
                              title={`Produk Unggulan: ${p.is_featured ? 'Aktif (Klik untuk nonaktifkan)' : 'Nonaktif (Klik untuk aktifkan)'}`}
                              className={`p-1.5 rounded-lg border transition-all ${
                                p.is_featured
                                  ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-xs'
                                  : 'bg-white text-neutral-300 border-hairline hover:text-amber-500 hover:border-amber-200'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${p.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => updateProduct(p.id, { is_best_seller: !p.is_best_seller })}
                              title={`Produk Terlaris: ${p.is_best_seller ? 'Aktif (Klik untuk nonaktifkan)' : 'Nonaktif (Klik untuk aktifkan)'}`}
                              className={`p-1.5 rounded-lg border transition-all ${
                                p.is_best_seller
                                  ? 'bg-rose-50 text-rose-600 border-rose-300 shadow-xs'
                                  : 'bg-white text-neutral-300 border-hairline hover:text-rose-500 hover:border-rose-200'
                              }`}
                            >
                              <Flame className={`w-3.5 h-3.5 ${p.is_best_seller ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => updateProduct(p.id, { is_new_arrival: !p.is_new_arrival })}
                              title={`Produk Terbaru: ${p.is_new_arrival ? 'Aktif (Klik untuk nonaktifkan)' : 'Nonaktif (Klik untuk aktifkan)'}`}
                              className={`p-1.5 rounded-lg border transition-all ${
                                p.is_new_arrival
                                  ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-xs'
                                  : 'bg-white text-neutral-300 border-hairline hover:text-blue-500 hover:border-blue-200'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateProduct(p.id, { is_active: !p.is_active })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              p.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                            }`}
                          >
                            {p.is_active ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="Lihat Detail Lengkap Produk"
                              onClick={() => setSelectedProductDetail(p)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors font-bold text-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

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
            <span>Geser tabel riwayat ke samping untuk melihat rincian</span>
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

      {/* ========================================================================= */}
      {/* SATU POPUP LENGKAP: DETAIL PRODUK & QUICK ACTIONS                         */}
      {/* ========================================================================= */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#101519] line-clamp-1">
                    {selectedProductDetail.name}
                  </h3>
                  <p className="text-xs text-body font-mono">
                    SKU: {selectedProductDetail.sku_master} {selectedProductDetail.isbn ? `• ISBN: ${selectedProductDetail.isbn}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductDetail(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs flex-1">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-44 shrink-0">
                  <img
                    src={selectedProductDetail.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                    alt={selectedProductDetail.name}
                    className="w-full h-56 object-cover rounded-2xl border border-hairline shadow-xs bg-neutral-100"
                  />
                  <div className="mt-2 text-center space-y-1">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-block ${
                      selectedProductDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                    }`}>
                      {selectedProductDetail.is_active ? '● Produk Aktif di Toko' : '○ Non-Aktif'}
                    </span>
                    <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                      {selectedProductDetail.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Unggulan
                        </span>
                      )}
                      {selectedProductDetail.is_best_seller && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-bold">
                          <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                          Terlaris
                        </span>
                      )}
                      {selectedProductDetail.is_new_arrival && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[9px] font-bold">
                          <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                          Terbaru
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3.5">
                  <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body font-medium">Kategori:</span>
                      <strong className="text-primary">
                        {categories.find((c) => c.id === selectedProductDetail.category_id)?.name || '-'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body font-medium">Harga Toko:</span>
                      <div>
                        <span className="text-base font-black text-primary">
                          {formatRupiah(selectedProductDetail.sale_price ?? selectedProductDetail.base_price)}
                        </span>
                        {selectedProductDetail.sale_price && (
                          <span className="text-[11px] text-body line-through block text-right">
                            {formatRupiah(selectedProductDetail.base_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-hairline pt-2">
                      <span className="text-body font-medium">Stok Fisik Tersedia:</span>
                      <span className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                        selectedProductDetail.stock_quantity <= selectedProductDetail.min_stock_alert
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {selectedProductDetail.stock_quantity} pcs
                        {selectedProductDetail.stock_quantity <= selectedProductDetail.min_stock_alert ? ' (Menipis!)' : ' (Aman)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-body">
                      <span>Batas Alert Minimum:</span>
                      <span>{selectedProductDetail.min_stock_alert} pcs</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-body">
                      <span>Berat Barang:</span>
                      <span>{selectedProductDetail.weight_grams} gram</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-body block mb-1">Deskripsi Produk:</span>
                    <p className="p-3 bg-neutral-100/70 rounded-xl leading-relaxed text-[#101519] max-h-32 overflow-y-auto">
                      {selectedProductDetail.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 border-t border-hairline">
                <span className="font-bold text-body block mb-2">Aksi Cepat untuk Produk Ini:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductDetail;
                      setSelectedProductDetail(null);
                      handleOpenStockAdjust(p);
                    }}
                    className="py-2.5 px-3 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sesuaikan Stok</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductDetail;
                      setSelectedProductDetail(null);
                      setPrintLabelProduct(p);
                    }}
                    className="py-2.5 px-3 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-hairline"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Barcode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductDetail;
                      setSelectedProductDetail(null);
                      handleOpenEditModal(p);
                    }}
                    className="py-2.5 px-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Produk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductDetail;
                      setSelectedProductDetail(null);
                      setProductToDelete({ id: p.id, name: p.name });
                    }}
                    className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Produk</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-3 border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-body font-mono">
                ID: {selectedProductDetail.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductDetail(null)}
                className="px-5 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold transition-colors"
              >
                Tutup Popup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Penyesuaian & Opname Stok
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Product summary */}
            <div className="p-3 bg-neutral-2/50 border border-hairline rounded-2xl flex items-center gap-3">
              <img
                src={stockAdjustProduct.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
                  <option value="purchase_in">Barang Masuk / Restock Supplier (+)</option>
                  <option value="damaged">Barang Rusak / Cacat (-)</option>
                  <option value="manual_adjustment">Penyesuaian Fisik (Stok Opname Total)</option>
                  <option value="sale_out">Penjualan Manual Toko (-)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  {adjustmentType === 'manual_adjustment'
                    ? 'Total Stok Fisik Hasil Opname *'
                    : 'Jumlah Unit Perubahan *'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 20"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
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

      {/* REAL CAMERA BARCODE SCANNER MODAL */}
      <RealBarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleRealBarcodeScanned}
      />

      {/* PRINT BARCODE LABEL STICKER MODAL */}
      {printLabelProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Cetak Label Stiker Barcode
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintLabelProduct(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
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
                type="text"
                inputMode="numeric"
                value={printCopies}
                onChange={(e) => setPrintCopies(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg sm:max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto overscroll-contain space-y-4 sm:space-y-6 shadow-2xl border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#101519]">Tambah Produk Baru</h3>
                <p className="text-xs text-body">Lengkapi data barang untuk katalog USKI STORE</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
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
                    type="text"
                    inputMode="numeric"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 50000"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Harga Diskon (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Opsional"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Stok Awal *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 20"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Batas Minimum Stok</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    placeholder="Contoh: 5"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Berat Produk (Gram)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                  placeholder="Contoh: 300 (Default: 300g)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Foto Produk Multi-WebP */}
              <div className="space-y-3 pt-1 border-t border-hairline">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-[#101519] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Foto Produk ({productImages.length} Foto)</span>
                    </label>
                    <p className="text-[11px] text-body">
                      Bisa pilih lebih dari 1 foto. Otomatis dikonversi ke format <strong>WebP</strong> (ringan & cepat).
                    </p>
                  </div>
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
                      <span>Upload File</span>
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

                {webpSavingsInfo && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{webpSavingsInfo}</span>
                  </div>
                )}

                {imageUploadType === 'upload' ? (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all text-center cursor-pointer ${
                    isConvertingWebP ? 'bg-primary/5 border-primary animate-pulse' : 'border-hairline hover:border-primary bg-neutral-2/40 hover:bg-neutral-2/80'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-white border border-hairline flex items-center justify-center shadow-xs mb-1.5">
                      <UploadCloud className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-xs text-[#101519]">
                      {isConvertingWebP ? 'Sedang Mengonversi ke Format WebP...' : 'Klik untuk Pilih Foto (Bisa Banyak Sekaligus)'}
                    </span>
                    <span className="text-[11px] text-body mt-0.5">
                      JPG, PNG, JPEG otomatis dikonversi ke WebP berkualitas tinggi
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isConvertingWebP}
                      onChange={handleMultiImageFiles}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Tempel URL gambar (https://...)"
                      className="flex-1 h-9 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold text-xs focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim()}
                      className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                )}

                {/* Grid Galeri Multi-Foto */}
                {productImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {productImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-neutral-2 ${
                          idx === 0 ? 'border-primary shadow-xs ring-2 ring-primary/20' : 'border-hairline'
                        }`}
                      >
                        <img src={imgSrc} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover" />
                        
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            UTAMA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryProductImage(idx)}
                            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs"
                          >
                            Set Utama
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                          title="Hapus foto ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                          webp
                        </span>
                      </div>
                    ))}
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

              {/* Lencana & Tampilan Beranda */}
              <div className="space-y-2 pt-2 border-t border-hairline">
                <div>
                  <label className="font-extrabold text-[#101519] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Lencana & Tampilan Beranda (Homepage Badges)</span>
                  </label>
                  <p className="text-[11px] text-body">
                    Tandai produk untuk ditampilkan pada kurasi khusus dan carousel halaman utama toko
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. Produk Unggulan */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isFeatured
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-amber-500 focus:ring-amber-400 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Unggulan</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Koleksi Unggulan USKI"
                      </p>
                    </div>
                  </label>

                  {/* 2. Produk Terlaris */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isBestSeller
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Flame className={`w-3.5 h-3.5 ${isBestSeller ? 'fill-rose-500 text-rose-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Terlaris</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Pilihan Terlaris"
                      </p>
                    </div>
                  </label>

                  {/* 3. Produk Terbaru */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isNewArrival
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className={`w-3.5 h-3.5 ${isNewArrival ? 'text-blue-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Terbaru</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Rilisan Terbaru"
                      </p>
                    </div>
                  </label>
                </div>
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
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <RotateCw className="w-4 h-4 animate-spin" />}
                  <span>{isUploading ? 'Mengunggah & Menyimpan...' : 'Simpan Produk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg sm:max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto overscroll-contain space-y-4 sm:space-y-6 shadow-2xl border border-hairline touch-scroll">
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
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
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
                    type="text"
                    inputMode="numeric"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Harga Diskon (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Stok Tersedia *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Batas Min Stok</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Berat Produk (Gram)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, ''))}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Foto Produk Multi-WebP */}
              <div className="space-y-3 pt-1 border-t border-hairline">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-[#101519] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Foto Produk ({productImages.length} Foto)</span>
                    </label>
                    <p className="text-[11px] text-body">
                      Kelola banyak foto produk. Otomatis dikonversi ke format <strong>WebP</strong>.
                    </p>
                  </div>
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
                      <span>Upload File</span>
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

                {webpSavingsInfo && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{webpSavingsInfo}</span>
                  </div>
                )}

                {imageUploadType === 'upload' ? (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all text-center cursor-pointer ${
                    isConvertingWebP ? 'bg-primary/5 border-primary animate-pulse' : 'border-hairline hover:border-primary bg-neutral-2/40 hover:bg-neutral-2/80'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-white border border-hairline flex items-center justify-center shadow-xs mb-1.5">
                      <UploadCloud className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-xs text-[#101519]">
                      {isConvertingWebP ? 'Sedang Mengonversi ke Format WebP...' : 'Tambah Foto Lain (Bisa Banyak Sekaligus)'}
                    </span>
                    <span className="text-[11px] text-body mt-0.5">
                      JPG, PNG, JPEG otomatis dikonversi ke WebP berkualitas tinggi
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isConvertingWebP}
                      onChange={handleMultiImageFiles}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Tempel URL gambar (https://...)"
                      className="flex-1 h-9 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold text-xs focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim()}
                      className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                )}

                {/* Grid Galeri Multi-Foto */}
                {productImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {productImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-neutral-2 ${
                          idx === 0 ? 'border-primary shadow-xs ring-2 ring-primary/20' : 'border-hairline'
                        }`}
                      >
                        <img src={imgSrc} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover" />
                        
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            UTAMA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryProductImage(idx)}
                            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs"
                          >
                            Set Utama
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                          title="Hapus foto ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                          webp
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Lencana & Tampilan Beranda */}
              <div className="space-y-2 pt-2 border-t border-hairline">
                <div>
                  <label className="font-extrabold text-[#101519] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Lencana & Tampilan Beranda (Homepage Badges)</span>
                  </label>
                  <p className="text-[11px] text-body">
                    Tandai produk untuk ditampilkan pada kurasi khusus dan carousel halaman utama toko
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. Produk Unggulan */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isFeatured
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-amber-500 focus:ring-amber-400 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Unggulan</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Koleksi Unggulan USKI"
                      </p>
                    </div>
                  </label>

                  {/* 2. Produk Terlaris */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isBestSeller
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Flame className={`w-3.5 h-3.5 ${isBestSeller ? 'fill-rose-500 text-rose-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Terlaris</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Pilihan Terlaris"
                      </p>
                    </div>
                  </label>

                  {/* 3. Produk Terbaru */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isNewArrival
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                        : 'bg-neutral-2/40 border-hairline hover:bg-neutral-2/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="mt-0.5 rounded border-hairline text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className={`w-3.5 h-3.5 ${isNewArrival ? 'text-blue-500' : 'text-body'}`} />
                        <span className="font-bold text-xs text-[#101519]">Produk Terbaru</span>
                      </div>
                      <p className="text-[10px] text-body mt-0.5 leading-snug">
                        Tampil di carousel "Rilisan Terbaru"
                      </p>
                    </div>
                  </label>
                </div>
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
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <RotateCw className="w-4 h-4 animate-spin" />}
                  <span>{isUploading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl text-center max-h-[90vh] overflow-y-auto overscroll-contain border border-hairline touch-scroll">
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
                className="min-h-[40px] px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl hover:bg-neutral-3 transition-colors touch-manipulation"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="min-h-[40px] px-5 py-2.5 bg-badge-text text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-sm touch-manipulation"
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
