import { cn } from "@/lib/utils";

// Seeded PRNG so the star layout is fixed across re-renders — computed once
// at module load, not per-render. A plain Math.random() here would reshuffle
// every star each time AuthSplitLayout re-renders (e.g. on theme toggle).
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const STAR_COUNT = 50;
const rand = seededRandom(42);
const STARS = Array.from({ length: STAR_COUNT }, () => {
  const shape: "dot" | "sparkle" = rand() < 0.5 ? "dot" : "sparkle";
  return {
    shape,
    // Kept off the 0/100 edges so a star's own radius/scale can never push
    // it past the viewBox — belt-and-suspenders against edge bleed.
    cx: 3 + rand() * 94,
    cy: 3 + rand() * 94,
    // Sparkle's unit shape reaches further from center than a circle of the
    // same "size", so scale it down more to end up the same visual weight.
    scale: shape === "dot" ? 0.12 + rand() * 0.3 : 0.15 + rand() * 0.35,
    rotation: rand() * 45,
    opacity: 0.2 + rand() * 0.5,
    dur: 2 + rand() * 4,
    delay: -rand() * 5,
  };
});

// 4-point sparkle, centered on its own origin, unit-sized — placed per star
// via <use transform="translate(...) scale(...)">, so the shape is defined
// once instead of repeating a path string for every sparkle.
const SPARKLE_PATH = "M0,-1 L0.3,-0.3 L1,0 L0.3,0.3 L0,1 L-0.3,0.3 L-1,0 L-0.3,-0.3 Z";

// Background twinkle layer for AuthSplitLayout's image panel — a mix of
// round dots and 4-point sparkles. currentColor, same as KnowledgeLogo, so
// it follows the theme instead of a hardcoded white-on-dark "night sky".
export function Starfield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-foreground",
        className,
      )}
    >
      <defs>
        <path id="starfield-sparkle" d={SPARKLE_PATH} />
      </defs>
      {STARS.map((s, i) => {
        const opacityValues = `${s.opacity * 0.25};${s.opacity};${s.opacity * 0.25}`;
        const dur = `${s.dur.toFixed(2)}s`;
        const begin = `${s.delay.toFixed(2)}s`;

        if (s.shape === "dot") {
          return (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.scale} fill="currentColor" opacity={s.opacity}>
              <animate
                attributeName="opacity"
                values={opacityValues}
                dur={dur}
                begin={begin}
                repeatCount="indefinite"
              />
            </circle>
          );
        }

        return (
          <use
            key={i}
            href="#starfield-sparkle"
            fill="currentColor"
            opacity={s.opacity}
            transform={`translate(${s.cx} ${s.cy}) rotate(${s.rotation}) scale(${s.scale})`}
          >
            <animate
              attributeName="opacity"
              values={opacityValues}
              dur={dur}
              begin={begin}
              repeatCount="indefinite"
            />
          </use>
        );
      })}
    </svg>
  );
}
