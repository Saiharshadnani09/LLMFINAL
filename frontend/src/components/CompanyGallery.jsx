import React, { useEffect, useRef } from "react";

const base = import.meta.env.BASE_URL || "/";
const images = [
  { path: "peopletech/building.jpg", alt: "People Tech building" },
  { path: "peopletech/lobby.png", alt: "People Tech lobby" },
  { path: "peopletech/neon-sign.png", alt: "People Tech neon sign" },
  { path: "peopletech/front-glass.jpg", alt: "People Tech front glass" },
  { path: "peopletech/logo-square.png", alt: "People Tech Group logo" },
  { path: "peopletech/logo-wide.png", alt: "People Tech Group wordmark" },
];

function resolvePublicUrl(relativePath) {
  const normalized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${base}${normalized}`;
}

function ImageWithFallback({ path, alt }) {
  const [src, setSrc] = React.useState(resolvePublicUrl(path));
  const triedRef = React.useRef(false);

  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-36 sm:h-40 lg:h-48 object-cover rounded-xl transition-transform duration-500 hover:scale-105 ${
        /logo/i.test(path) ? "object-contain p-4 bg-white" : ""
      }`}
      loading="lazy"
      onError={() => {
        if (triedRef.current) return;
        triedRef.current = true;
        if (src.endsWith(".jpg")) setSrc(src.replace(/\.jpg$/, ".png"));
        else if (src.endsWith(".png")) setSrc(src.replace(/\.png$/, ".jpg"));
      }}
    />
  );
}

export default function CompanyGallery() {
  const sliderRef = useRef(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let direction = 1;
    const speed = 2.5; // visible but smooth speed
    let rafId;

    const autoScroll = () => {
      if (!slider) return;
      slider.scrollLeft += direction * speed;
      const maxScroll = slider.scrollWidth - slider.clientWidth;

      if (slider.scrollLeft >= maxScroll - 2) direction = -1;
      if (slider.scrollLeft <= 0) direction = 1;

      rafId = requestAnimationFrame(autoScroll);
    };

    rafId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const scrollByAmount = (amount) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mb-8 select-none relative">
      <h2 className="text-2xl font-bold mb-2 text-center">
        About People Tech Group
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Technology | Consulting | Outsourcing
      </p>

      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scrollByAmount(-sliderRef.current.clientWidth / 2)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
        >
          ◀
        </button>

        {/* Image Slider */}
        <div
          ref={sliderRef}
          className="flex overflow-hidden scroll-smooth gap-4 snap-x snap-mandatory pb-2 px-2"
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="min-w-[30%] sm:min-w-[28%] lg:min-w-[25%] flex-shrink-0 snap-center border bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all duration-500"
            >
              <ImageWithFallback path={img.path} alt={img.alt} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollByAmount(sliderRef.current.clientWidth / 2)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
