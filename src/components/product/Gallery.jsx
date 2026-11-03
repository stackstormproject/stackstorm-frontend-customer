import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * FR004 image gallery: the main photo and up to three more (#177). Thumbnails and arrows
 * switch photos; the counter says which one is showing.
 */
export function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="gallery gallery--empty" aria-hidden="true" />;
  const count = images.length;
  const index = Math.min(active, count - 1);
  const go = (next) => setActive((next + count) % count);

  return (
    <div className="gallery">
      <div
        className="gallery__main"
        role={count > 1 ? 'group' : undefined}
        aria-label={count > 1 ? `${name} photos` : undefined}
      >
        <img key={images[index]} src={images[index]} alt={name} className="gallery__image" />
        {count > 1 && (
          <>
            <button
              type="button"
              className="gallery__arrow gallery__arrow--prev"
              aria-label="Previous photo"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gallery__arrow gallery__arrow--next"
              aria-label="Next photo"
              onClick={() => go(index + 1)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <span className="gallery__count" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="gallery__thumbs" aria-label="More images">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={i === index ? 'is-active' : ''}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-pressed={i === index}
                onClick={() => setActive(i)}
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
