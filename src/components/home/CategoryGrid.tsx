import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BookMarked,
  GraduationCap,
  Smile,
  PenTool,
  FileText,
  Briefcase,
  Folder,
  Compass,
  Palette,
  Scroll,
} from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  BookMarked,
  GraduationCap,
  Smile,
  PenTool,
  FileText,
  Briefcase,
  Folder,
  Compass,
  Palette,
  Scroll,
};

export const CategoryGrid: React.FC = () => {
  const { categories } = useCategoryStore();

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101519]">
            Jelajahi Kategori
          </h2>
          <p className="text-xs sm:text-sm text-body">
            Pilih kategori buku, alat tulis, dan perlengkapan kebutuhan Anda
          </p>
        </div>
        <Link
          to="/products"
          className="text-xs sm:text-sm font-bold text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const Icon = (cat.icon && iconMap[cat.icon]) || BookOpen;

          return (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="bg-white border border-hairline rounded-2xl p-4 flex flex-col items-center text-center group hover:border-primary hover:shadow-sm transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-2 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-[#2D3033] transition-colors mb-2.5">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#101519] group-hover:text-primary line-clamp-1 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] text-body line-clamp-1 mt-0.5">
                {cat.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
