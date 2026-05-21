import { useState, useEffect } from "preact/hooks";

export default function Gallery({ items = [], galleryId = "page-gallery" }) {
  const [index, setIndex] = useState(null);

  useEffect(() => {
    if (!items || items.length === 0) return;

    const handleClick = (event) => {
      const button = event.target.closest("[data-gallery-index]");
      if (!button) return;

      const container = button.closest(`[data-gallery-id="${galleryId}"]`);
      if (!container) return;

      const clickedIndex = Number(button.dataset.galleryIndex);
      if (Number.isNaN(clickedIndex)) return;

      event.preventDefault();
      setIndex(clickedIndex);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [galleryId, items]);

  useEffect(() => {
    if (index === null) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIndex(null);
      } else if (event.key === "ArrowLeft") {
        setIndex((current) => (current === 0 ? items.length - 1 : current - 1));
      } else if (event.key === "ArrowRight") {
        setIndex((current) => (current === items.length - 1 ? 0 : current + 1));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [index, items.length]);

  if (!items || items.length === 0 || index === null) {
    return null;
  }

  const item = items[index];

  const close = () => setIndex(null);

  const prev = (event) => {
    event?.stopPropagation();
    setIndex((current) => (current === 0 ? items.length - 1 : current - 1));
  };

  const next = (event) => {
    event?.stopPropagation();
    setIndex((current) => (current === items.length - 1 ? 0 : current + 1));
  };

  return (
    <div class="modal-overlay" onClick={close}>
      <div class="modal-content" onClick={(event) => event.stopPropagation()}>
        <button
          class="modal-close-button"
          type="button"
          onClick={close}
          aria-label="Close gallery"
        >
          X
        </button>

        <div class="modal-image-wrap" onClick={close}>
          <img src={item.image || item.src} alt={item.alt || ""} />
        </div>

        {items.length > 1 && (
          <div class="gallery-controls">
            <button type="button" onClick={prev} aria-label="Previous image">
              ←
            </button>
            <span class="gallery-counter">
              {index + 1}/{items.length}
            </span>
            <button type="button" onClick={next} aria-label="Next image">
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
