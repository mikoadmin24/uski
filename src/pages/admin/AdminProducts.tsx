import React, { useState } from 'react';
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
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { mockCategories, mockBrands, mockPublishers } from '@/data/mockData';
import { formatRupiah } from '@/lib/utils';
import { Product } from '@/types';

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // New Product Form States (Empty strings by default so no leading '0' gets stuck!)
  const [name, setName] = useState('');
  const [skuMaster, setSkuMaster] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState(mockCategories[0].id);
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

  const resetForm = () => {
    setName('');
    setSkuMaster('');
    setIsbn('');
    setAuthor('');
    setCategoryId(mockCategories[0].id);
    setBasePrice('');
    setSalePrice('');
    setStockQuantity('');
    setMinStockAlert('');
    setWeightGrams('');
    setDescription('');
    setImageUrl('');
    setImagePreview(null);
    setImageUploadType('upload');
  };

  const handleOpenModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
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

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(q) ||
      p.sku_master.toLowerCase().includes(q) ||
      (p.isbn && p.isbn.includes(q));
    const matchCat = selectedCategory ? p.category_id === selectedCategory : true;
    return matchQuery && matchCat;
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
      category_id: categoryId,
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

    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">Katalog Master Produk</h1>
          <p className="text-xs text-body mt-1">
            Kelola master data buku, alat tulis, harga jual, dan status ketersediaan
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nama barang, SKU, atau ISBN..."
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
          {mockCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">SKU / ISBN</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-2/30 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-10 h-12 object-cover rounded-lg border border-hairline shrink-0"
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
                    {mockCategories.find((c) => c.id === p.category_id)?.name || '-'}
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
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        p.stock_quantity <= p.min_stock_alert
                          ? 'bg-red-100 text-badge-text'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => updateProduct(p.id, { is_active: !p.is_active })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                      }`}
                    >
                      {p.is_active ? 'Aktif' : 'Non-Aktif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="Edit Cepat Harga"
                        onClick={() => {
                          const newPrice = prompt('Masukkan harga baru (Rp):', String(p.base_price));
                          if (newPrice && !isNaN(Number(newPrice))) {
                            updateProduct(p.id, { base_price: Number(newPrice) });
                          }
                        }}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#101519]">Tambah Produk Baru</h3>
                <p className="text-xs text-body">Lengkapi data barang untuk katalog USKI STORE</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
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
                    {mockCategories.map((c) => (
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

              {/* Number fields - Clean inputs with NO default 0 */}
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

              {/* Foto Produk Upload & URL Tabs */}
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
                          <p className="text-[11px] text-body mt-0.5">
                            Gambar ini akan digunakan sebagai foto utama di katalog dan detail produk.
                          </p>
                          <div className="flex items-center gap-3 mt-2.5">
                            <label className="cursor-pointer text-xs font-bold text-primary hover:underline">
                              Ganti Foto
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
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
                        <span className="text-[11px] text-body mt-1">
                          Mendukung file PNG, JPG, JPEG, atau WEBP (Maksimal 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
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
                    {imageUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-neutral-2/60 rounded-xl border border-hairline">
                        <img
                          src={imageUrl}
                          alt="URL Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          className="w-12 h-14 object-cover rounded-lg border border-hairline bg-white shrink-0"
                        />
                        <span className="text-[11px] text-body truncate">{imageUrl}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi keunggulan, spesifikasi singkat, atau sinopsis..."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-badge-text flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#101519]">Hapus Produk?</h3>
              <p className="text-xs text-body mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus produk{' '}
                <span className="font-bold text-[#101519]">"{productToDelete.name}"</span>?
                Produk ini akan dihapus permanen dari katalog toko.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl hover:bg-neutral-2/80 transition-colors"
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
