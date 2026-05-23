'use client';

const DELIVERY_LABEL = 'Free delivery';

const SCROLL_ITEMS = Array.from({ length: 8 }, () => DELIVERY_LABEL);

/** Bottom green bar — text scrolls continuously left to right */
export default function FreeDeliveryBar() {
  return (
    <div className="pc-delivery-bar" aria-label={DELIVERY_LABEL}>
      <div className="pc-delivery-bar__track">
        {SCROLL_ITEMS.map((label, i) => (
          <span
            key={i}
            className="pc-delivery-bar__item"
            aria-hidden={i > 0 ? true : undefined}
          >
            {label}
            <span className="pc-delivery-bar__dot" aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
