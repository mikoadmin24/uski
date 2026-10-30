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
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { mockCategories, mockBrands, mockPublishers } from '@/data/mockData';
import { formatRupiah } from '@/lib/utils';
import { Product } from '@/types';

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product Form
  const [name, setName] = useState('');
  const [skuMaster, setSkuMaster] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState(mockCategories[0].id);
  const [basePrice, setBasePrice] = useState<number>(50000);
  const [salePrice, setSalePrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [weightGrams, setWeightGrams] = useState<number>(300);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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
    if (!name || !skuMaster || !basePrice) return;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    addProduct({
      name,
      slug: `${slug}-${Date.now()}`,
      sku_master: skuMaster.toUpperCase(),
      isbn: isbn.trim() || undefined,
      author: author.trim() || undefined,
      category_id: categoryId,
      base_price: Number(basePrice),
      sale_price: salePrice ? Number(salePrice) : null,
      stock_quantity: Number(stockQuantity),
      min_stock_alert: Number(minStockAlert),
      weight_grams: Number(weightGrams),
      description: description || 'Deskripsi produk resmi USKI STORE.',
      specifications: {
        'Kondisi': 'Baru & Original',
        'Garansi': 'Toko Resmi',
      },
      is_active: true,
      is_featured: false,
      images: [
        imageUrl ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      ],
    });

    setShowAddModal(false);
    setName('');
    setSkuMaster('');
    setIsbn('');
    setAuthor('');
    setBasePrice(50000);
    setSalePrice('');
    setStockQuantity(20);
    setDescription('');
    setImageUrl('');
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
          onClick={() => setShowAddModal(true)}
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        title="Edit Cepat Harga"
                        onClick={() => {
                          const newPrice = prompt('Masukkan harga baru (Rp):', String(p.base_price));
                          if (newPrice && !isNaN(Number(newPrice))) {
                            updateProduct(p.id, { base_price: Number(newPrice) });
                          }
                        }}
                        className="p-1 hover:text-primary text-body"
                      >
                        <Edit className="w-4 h-4" />
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-lg font-extrabold text-[#101519]">Tambah Produk Baru</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-body" />
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">SKU Master *</label>
                  <input
                    type="text"
                    required
                    value={skuMaster}
                    onChange={(e) => setSkuMaster(e.target.value)}
                    placeholder="Contoh: ATK-JYK-05"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">ISBN (Khusus Buku)</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-602-..."
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Harga Dasar (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Harga Diskon (Rp)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Opsional"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">URL Gambar Produk</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
