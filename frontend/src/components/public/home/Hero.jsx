import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Media from "../shell/Media.jsx";
import { ArrowForward } from "../shell/icons.jsx";

const INTERVAL_MS = 7000;

/**
 * Admin-managed hero. Slides cross-fade rather than slide, autoplay pauses on
 * hover, focus and any manual move, and the arrows/dots are real buttons so the
 * whole thing is operable from the keyboard.
 */
export default function Hero({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const count = slides.length;
  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    timer.current = setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer.current);
  }, [count, paused]);

  if (!count) return null;

  return (
    <section
      className="vs-hero"
      aria-roledescription="carousel"
      aria-label="عروض المتجر"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;
        return (
          <div
            key={slide.id}
            className="vs-hero__slide"
            data-active={active}
            aria-hidden={!active}
            role="group"
            aria-roledescription="شريحة"
            aria-label={`${slideIndex + 1} من ${count}`}
          >
            <Media
              className="vs-hero__media"
              src={slide.imageUrl}
              fallback={slide.fallback}
              alt=""
              eager={slideIndex === 0}
            />
            <span className="vs-hero__veil" />
            <div className="vs-hero__body">
              {slide.subtitle && <span className="vs-hero__eyebrow">{slide.subtitle}</span>}
              <h2 className="vs-hero__title">{slide.title}</h2>
              {slide.desc && <p className="vs-hero__desc">{slide.desc}</p>}
              {slide.cta && (
                <Link
                  to={slide.href}
                  className="vs-btn vs-btn--primary vs-btn--lg vs-hero__cta"
                  tabIndex={active ? 0 : -1}
                >
                  {slide.cta}
                  <ArrowForward size={16} />
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="vs-hero__dots" role="tablist" aria-label="شرائح العرض">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                className="vs-hero__dot"
                aria-current={slideIndex === index}
                aria-label={`الشريحة ${slideIndex + 1}`}
                onClick={() => {
                  setPaused(true);
                  go(slideIndex);
                }}
              />
            ))}
          </div>
          <div className="vs-hero__arrows">
            <button
              type="button"
              className="vs-hero__arrow"
              aria-label="الشريحة السابقة"
              onClick={() => {
                setPaused(true);
                go(index - 1);
              }}
            >
              <ArrowForward size={17} style={{ transform: "scaleX(-1)" }} />
            </button>
            <button
              type="button"
              className="vs-hero__arrow"
              aria-label="الشريحة التالية"
              onClick={() => {
                setPaused(true);
                go(index + 1);
              }}
            >
              <ArrowForward size={17} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
