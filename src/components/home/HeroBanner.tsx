import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';

export const HeroBanner: React.FC = () => {
  const { banners } = useCategoryStore();
  const activeBanners = banners.filter((b) => b.is_active);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStart(null);
  };

  if (activeBanners.length === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 aspect-[16/6] sm:aspect-[21/9] lg:aspect-[16/6] max-h-[460px] shadow-sm select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {activeBanners.map((banner, index) => {
        const isCurrent = index === currentSlide;
        const hasLink = Boolean(banner.link_url && banner.link_url.trim() !== '');
        const showDesktopOverlay =
          banner.badge_text !== '__NO_OVERLAY__' &&
          Boolean(banner.title || banner.subtitle || (banner.badge_text && banner.badge_text.trim() !== ''));

        const SlideContent = (
          <div className="relative w-full h-full">
            {/* Background Image - Responsive, Center-Aligned, No Mobile Cropping */}
            <img
              src={banner.image_url}
              alt={banner.title || 'Promo Banner USKI'}
              className="w-full h-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            {/* Desktop / Tablet Rich Text Overlay */}
            {showDesktopOverlay && (
              <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex-col justify-end p-6 md:p-12 pointer-events-none">
                <div className="max-w-xl text-white space-y-2 pointer-events-auto">
                  {banner.badge_text && banner.badge_text !== '__NO_OVERLAY__' && (
                    <span className="inline-block px-2.5 py-1 bg-primary text-white text-[11px] font-extrabold uppercase tracking-wider rounded-md">
                      {banner.badge_text}
                    </span>
                  )}
                  {banner.title && (
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      {banner.title}
                    </h2>
                  )}
                  {banner.subtitle && (
                    <p className="text-xs md:text-sm text-neutral-2 line-clamp-2 max-w-lg">
                      {banner.subtitle}
                    </p>
                  )}
                  {hasLink && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-sm">
                        <span>Lihat Promo & Produk</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {hasLink ? (
              <Link to={banner.link_url} className="block w-full h-full" aria-label={banner.title || 'Banner Promo'}>
                {SlideContent}
              </Link>
            ) : (
              SlideContent
            )}
          </div>
        );
      })}

      {/* Prev / Next Controls (Desktop/Tablet) */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#101519] items-center justify-center transition-all shadow-md backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#101519] items-center justify-center transition-all shadow-md backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-2.5 sm:bottom-4 right-4 sm:right-6 z-20 flex gap-1.5 sm:gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-5 sm:w-6 bg-primary' : 'w-1.5 sm:w-2 bg-white/60'
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
