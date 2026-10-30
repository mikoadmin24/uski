import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';

export const HeroBanner: React.FC = () => {
  const { banners } = useCategoryStore();
  const activeBanners = banners.filter((b) => b.is_active);
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerCount = activeBanners.length || 1;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [bannerCount, activeBanners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerCount);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + bannerCount) % bannerCount);

  if (activeBanners.length === 0) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-canvas aspect-[21/9] min-h-[220px] max-h-[460px] shadow-sm">
      {activeBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background Image */}
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-12">
            <div className="max-w-xl text-white space-y-2">
              {banner.badge_text && (
                <span className="inline-block px-2.5 py-1 bg-primary text-white text-[11px] font-extrabold uppercase tracking-wider rounded-md">
                  {banner.badge_text}
                </span>
              )}
              <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-xs md:text-sm text-neutral-2 line-clamp-2 max-w-lg">
                  {banner.subtitle}
                </p>
              )}
              <div className="pt-2">
                <Link
                  to={banner.link_url}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs md:text-sm font-extrabold rounded-xl transition-all"
                >
                  <span>Lihat Penawaran</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next Controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-canvas flex items-center justify-center transition-all shadow-md backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-canvas flex items-center justify-center transition-all shadow-md backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 right-6 z-20 flex gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
