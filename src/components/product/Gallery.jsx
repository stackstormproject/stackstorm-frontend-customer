import { useState } from 'react';

/** FR004 image gallery: main image plus thumbnails; click a thumbnail to show it. */
export function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="gallery gallery--empty" aria-hidden="true" />;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="gallery">
      <div className="gallery__main">
        <img src={current} alt={name} />
      </div>
      {images.length > 1 && (
        <ul className="gallery__thumbs" aria-label="More images">
          {images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                className={index === active ? 'is-active' : ''}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <img src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
