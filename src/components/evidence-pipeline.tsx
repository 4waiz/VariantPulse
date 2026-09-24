/**
 * The home composition: a double helix feeding three stacked stages.
 *
 * The helix is drawn as individually depth-sorted pieces rather than two flat
 * paths. Every piece carries a z derived from its phase, and the whole set is
 * painted back to front, so strands genuinely pass behind one another. Stroke
 * weight, bead radius and opacity all scale with depth, and near segments get a
 * white halo so a crossing reads as one strand passing in front of the other.
 *
 * Base-pair rungs are split at the axis. Each half inherits the depth of the
 * strand it attaches to, so a rung is not a flat bar lying at mid-depth: its
 * near half paints in front of the near strand and its far half behind the far
 * one. That single detail is most of what makes the form read as solid.
 *
 * Rotation is a translation, not a recomputation: the geometry is periodic in y
 * with a period of one PITCH, so sliding the group down by exactly that
 * distance lands every element on a position of identical phase. The loop is
 * seamless, the depth ordering stays correct, and it costs no JavaScript.
 *
 * It is decorative — every figure it stands for is stated in text nearby — so
 * it is hidden from assistive technology.
 */

import { cn } from "@/lib/utils";

// The viewBox aspect is tuned to the column the composition sits in, so the
// artwork fills its space rather than letterboxing inside it.
const WIDTH = 460;
const HEIGHT = 673;
const CENTRE = 230;

const HELIX_TOP = 10;
const HELIX_BOTTOM = 412;
const AMPLITUDE = 118;
const TURNS = 2.5;

/** Vertical distance covered by one full turn. The animation slides by this. */
const PITCH = (HELIX_BOTTOM - HELIX_TOP) / TURNS;
/** Spacing between sample points, in user units. */
const STEP = 6;
/** A rung (base pair) every nth sample. */
const RUNG_EVERY = 3;

interface Node {
  x: number;
  y: number;
  /** Depth: +1 nearest the viewer, -1 furthest. */
  z: number;
}

/**
 * Samples one strand from a full turn above the visible top, so the group has
 * somewhere to slide in from.
 */
function strandNodes(strand: 0 | 1): Node[] {
  const phase = strand === 0 ? 0 : Math.PI;
  const start = HELIX_TOP - PITCH;
  const count = Math.round((HELIX_BOTTOM - start) / STEP);

  return Array.from({ length: count + 1 }, (_, i) => {
    const y = start + i * STEP;
    // The angle advances with absolute y, which is what makes the pattern
    // periodic and the slide seamless.
    const angle = ((y - HELIX_TOP) / PITCH) * Math.PI * 2 + phase;
    return { x: CENTRE + AMPLITUDE * Math.sin(angle), y, z: Math.cos(angle) };
  });
}

type Item =
  | { kind: "seg"; z: number; strand: 0 | 1; x1: number; y1: number; x2: number; y2: number }
  | { kind: "rung"; z: number; pair: 0 | 1; x1: number; y1: number; x2: number; y2: number }
  | { kind: "bead"; z: number; strand: 0 | 1; x: number; y: number };

function buildHelix(): Item[] {
  const a = strandNodes(0);
  const b = strandNodes(1);
  const items: Item[] = [];

  for (let i = 0; i < a.length - 1; i += 1) {
    items.push({
      kind: "seg",
      strand: 0,
      z: (a[i].z + a[i + 1].z) / 2,
      x1: a[i].x,
      y1: a[i].y,
      x2: a[i + 1].x,
      y2: a[i + 1].y,
    });
    items.push({
      kind: "seg",
      strand: 1,
      z: (b[i].z + b[i + 1].z) / 2,
      x1: b[i].x,
      y1: b[i].y,
      x2: b[i + 1].x,
      y2: b[i + 1].y,
    });
  }

  for (let i = 0; i < a.length; i += RUNG_EVERY) {
    const pair = ((i / RUNG_EVERY) % 2) as 0 | 1;
    const midY = (a[i].y + b[i].y) / 2;

    // Split at the axis so each half sorts with the strand it belongs to.
    items.push({
      kind: "rung",
      pair,
      z: a[i].z * 0.72,
      x1: a[i].x,
      y1: a[i].y,
      x2: CENTRE,
      y2: midY,
    });
    items.push({
      kind: "rung",
      pair,
      z: b[i].z * 0.72,
      x1: CENTRE,
      y1: midY,
      x2: b[i].x,
      y2: b[i].y,
    });

    items.push({ kind: "bead", strand: 0, z: a[i].z, x: a[i].x, y: a[i].y });
    items.push({ kind: "bead", strand: 1, z: b[i].z, x: b[i].x, y: b[i].y });
  }

  return items.sort((p, q) => p.z - q.z);
}

const HELIX = buildHelix();

/** Maps depth to 0 (furthest) … 1 (nearest). */
const near = (z: number) => (z + 1) / 2;

interface Stage {
  label: string;
  y: number;
  rx: number;
  ry: number;
  hue: string;
  shade: string;
  delay: string;
}

const STAGES: Stage[] = [
  { label: "New evidence", y: 445, rx: 140, ry: 34, hue: "#6366F1", shade: "#4F46E5", delay: "0s" },
  { label: "Analysis", y: 530, rx: 162, ry: 40, hue: "#7C6BEA", shade: "#6D28D9", delay: "0.5s" },
  { label: "Affected patients", y: 614, rx: 184, ry: 46, hue: "#A855F7", shade: "#8B2FD6", delay: "1s" },
];

export function EvidencePipeline({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn("block h-full w-full", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Each strand keeps to its own hue family so the two stay legible
            wherever they cross. */}
        <linearGradient id="vp-strand-a" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="vp-strand-b" x1="0.9" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>

        {/* Beads are lit from the upper left, which is what reads as spherical. */}
        <radialGradient id="vp-bead-a" cx="33%" cy="27%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="26%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </radialGradient>
        <radialGradient id="vp-bead-b" cx="33%" cy="27%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="26%" stopColor="#D8B4FE" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>

        <linearGradient id="vp-column" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </linearGradient>

        {STAGES.map((stage, index) => (
          <radialGradient key={stage.label} id={`vp-disc-${index}`} cx="50%" cy="36%" r="64%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="42%" stopColor={stage.hue} stopOpacity="0.24" />
            <stop offset="100%" stopColor={stage.shade} stopOpacity="0.12" />
          </radialGradient>
        ))}

        {/* Fades the helix into the stack at the base. The top barely fades so
            the form does not look cropped. */}
        <linearGradient id="vp-helix-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="3%" stopColor="#fff" stopOpacity="1" />
          <stop offset="90%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <mask id="vp-helix-mask">
          <rect
            x="0"
            y={HELIX_TOP - 10}
            width={WIDTH}
            height={HELIX_BOTTOM - HELIX_TOP + 24}
            fill="url(#vp-helix-fade)"
          />
        </mask>

        <filter id="vp-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="vp-contact" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Ambient wash behind the whole composition. */}
      <ellipse cx={CENTRE} cy={514} rx={216} ry={172} fill="#6366F1" opacity="0.07" filter="url(#vp-soft)" />

      {/* The column of light linking the helix to the stack. */}
      <rect x={CENTRE - 44} y={175} width={88} height={430} fill="url(#vp-column)" />

      {/* Stacked stages, back to front. Each disc gets a cast shadow, a side
          wall for thickness, a lit top face and a rim highlight. */}
      {STAGES.map((stage, index) => (
        <g key={stage.label}>
          <ellipse
            cx={CENTRE}
            cy={stage.y + 17}
            rx={stage.rx * 0.92}
            ry={stage.ry * 0.7}
            fill={stage.shade}
            opacity="0.17"
            filter="url(#vp-soft)"
          />
          <ellipse cx={CENTRE} cy={stage.y + 8} rx={stage.rx} ry={stage.ry} fill={stage.shade} opacity="0.15" />
          <ellipse cx={CENTRE} cy={stage.y} rx={stage.rx} ry={stage.ry} fill={`url(#vp-disc-${index})`} />
          <ellipse
            cx={CENTRE}
            cy={stage.y}
            rx={stage.rx}
            ry={stage.ry}
            fill="none"
            stroke={stage.hue}
            strokeOpacity="0.46"
            strokeWidth="1.3"
          />
          {/* Rim highlight along the upper edge only. */}
          <path
            d={`M ${CENTRE - stage.rx} ${stage.y} A ${stage.rx} ${stage.ry} 0 0 1 ${CENTRE + stage.rx} ${stage.y}`}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.85"
            strokeWidth="1.7"
          />
          <ellipse
            cx={CENTRE}
            cy={stage.y}
            rx={stage.rx * 0.6}
            ry={stage.ry * 0.6}
            fill="none"
            stroke={stage.hue}
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <text
            x={CENTRE}
            y={stage.y + 4}
            textAnchor="middle"
            className="fill-ink-2"
            style={{ font: "500 12.5px var(--font-inter), sans-serif", letterSpacing: "0.01em" }}
          >
            {stage.label}
          </text>
          <circle r="3.2" fill={stage.hue} opacity="0.9">
            <animateMotion
              dur="9s"
              begin={stage.delay}
              repeatCount="indefinite"
              path={`M ${CENTRE + stage.rx} ${stage.y} a ${stage.rx} ${stage.ry} 0 1 1 -0.1 0`}
            />
          </circle>
        </g>
      ))}

      {/* Where the helix meets the top disc. */}
      <ellipse cx={CENTRE} cy={HELIX_BOTTOM + 10} rx={86} ry={15} fill="#4F46E5" opacity="0.22" filter="url(#vp-contact)" />

      {/* The helix. Depth-sorted, and sliding by exactly one turn. */}
      <g mask="url(#vp-helix-mask)">
        <g className="vp-helix" style={{ ["--vp-pitch" as string]: `${PITCH}px` }}>
          {HELIX.map((item, index) => {
            const n = near(item.z);

            if (item.kind === "seg") {
              const width = 4.4 + 8 * n;
              return (
                <g key={index}>
                  {/* A halo on near segments separates them from whatever they
                      cross in front of. Far segments do not need one. */}
                  {n > 0.55 ? (
                    <line
                      x1={item.x1}
                      y1={item.y1}
                      x2={item.x2}
                      y2={item.y2}
                      stroke="#FFFFFF"
                      strokeWidth={width + 6}
                      strokeLinecap="round"
                      opacity={(n - 0.55) * 2.1}
                    />
                  ) : null}
                  <line
                    x1={item.x1}
                    y1={item.y1}
                    x2={item.x2}
                    y2={item.y2}
                    stroke={item.strand === 0 ? "url(#vp-strand-a)" : "url(#vp-strand-b)"}
                    strokeWidth={width}
                    strokeLinecap="round"
                    opacity={0.14 + 0.86 * n}
                  />
                </g>
              );
            }

            if (item.kind === "rung") {
              return (
                <line
                  key={index}
                  x1={item.x1}
                  y1={item.y1}
                  x2={item.x2}
                  y2={item.y2}
                  stroke={item.pair === 0 ? "#818CF8" : "#C4B5FD"}
                  strokeWidth={1.5 + 1.6 * n}
                  strokeLinecap="round"
                  opacity={0.1 + 0.44 * n}
                />
              );
            }

            return (
              <circle
                key={index}
                cx={item.x}
                cy={item.y}
                r={2.2 + 4.8 * n}
                fill={item.strand === 0 ? "url(#vp-bead-a)" : "url(#vp-bead-b)"}
                opacity={0.16 + 0.84 * n}
              />
            );
          })}
        </g>
      </g>

      {/* Evidence arriving from the sources on the right. */}
      {[
        { y: 172, curve: 96 },
        { y: 252, curve: 68 },
        { y: 330, curve: 44 },
        { y: 400, curve: 20 },
      ].map((line, index) => (
        <g key={line.y}>
          <path
            d={`M ${WIDTH - 4} ${line.y} C ${WIDTH - 112} ${line.y}, ${CENTRE + line.curve + 70} ${445}, ${CENTRE + line.curve} ${445}`}
            fill="none"
            stroke="#94A3F5"
            strokeOpacity="0.38"
            strokeWidth="1.1"
          />
          <circle r="2.8" fill="#6366F1">
            <animateMotion
              dur="4.5s"
              begin={`${index * 0.9}s`}
              repeatCount="indefinite"
              path={`M ${WIDTH - 4} ${line.y} C ${WIDTH - 112} ${line.y}, ${CENTRE + line.curve + 70} ${445}, ${CENTRE + line.curve} ${445}`}
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="4.5s"
              begin={`${index * 0.9}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Records flowing out to the left, toward the patient panel. */}
      {[
        { y: 556, curve: -120 },
        { y: 618, curve: -152 },
      ].map((line, index) => (
        <path
          key={line.y}
          d={`M ${CENTRE + line.curve} ${line.y} C ${CENTRE + line.curve - 70} ${line.y}, 66 ${line.y + 14}, 6 ${line.y + 18}`}
          fill="none"
          stroke="#A855F7"
          strokeOpacity={0.24 - index * 0.06}
          strokeWidth="1.1"
        />
      ))}
    </svg>
  );
}
