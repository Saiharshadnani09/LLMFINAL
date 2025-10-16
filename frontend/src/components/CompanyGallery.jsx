import React from "react";

// Reusable responsive company gallery for Student/Admin home pages
// Place images under public/peopletech/ with the following names
// [1] logo-wide.png, [2] logo-square.png, [3] neon-sign.jpg,
// [4] building.jpg, [5] lobby.jpg, [6] front-glass.jpg

const base = import.meta.env.BASE_URL || "/";
// Use the exact filenames detected in your public/peopletech folder
const images = [
  { path: "peopletech/building.jpg", alt: "People Tech building" },
  { path: "peopletech/lobby.png", alt: "People Tech lobby" },
  { path: "peopletech/neon-sign.png", alt: "People Tech neon sign" },
  { path: "peopletech/front-glass.jpg", alt: "People Tech front glass" },
  { path: "peopletech/logo-square.png", alt: "People Tech Group logo" },
  { path: "peopletech/logo-wide.png", alt: "People Tech Group wordmark" },
];

function resolvePublicUrl(relativePath) {
  // Ensure leading slash relative to Vite base
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
      className={`w-full h-56 ${/logo/i.test(path) ? "object-contain p-4 bg-white" : "object-cover"}`}
      loading="lazy"
      onError={() => {
        if (triedRef.current) return;
        triedRef.current = true;
        // Swap extension between .jpg and .png as a fallback
        if (src.endsWith('.jpg')) setSrc(src.replace(/\.jpg$/, '.png'));
        else if (src.endsWith('.png')) setSrc(src.replace(/\.png$/, '.jpg'));
      }}
    />
  );
}

export default function CompanyGallery() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">About People Tech Group</h2>
      <p className="text-gray-600 mb-6">
        Technology | Consulting | Outsourcing
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden border bg-white shadow-sm">
            <ImageWithFallback path={img.path} alt={img.alt} />
          </div>
        ))}
      </div>
    </section>
  );
}


