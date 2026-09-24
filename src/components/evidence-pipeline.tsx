/**
 * The home composition: a double helix feeding three stacked stages.
 *
 * Drawn as a single SVG so it stays crisp at any size and needs no client
 * JavaScript. Motion is CSS-only and stops entirely under reduced-motion.
 * It is decorative — every figure it stands for is stated in text nearby — so
 * it is hidden from assistive technology.
 */

import { cn } from "@/lib/utils";

// The viewBox aspect is tuned to the column the composition sits in, so the
// artwork fills its space instead of letterboxing inside it.
const WIDTH = 420;
const HEIGHT = 660;
const CENTRE = 200;

const HELIX_TOP = 38;
const HELIX_BOTTOM = 352;
const AMPLITUDE = 54;
const TURNS = 2.6;

function helixPath(phase: number): string {
  const steps = 72;
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = HELIX_TOP + t * (HELIX_BOTTOM - HELIX_TOP);
    // The helix narrows toward the base so it reads as receding into the stack.
    const taper = 0.55 + 0.45 * (1 - t);
    const x = CENTRE + AMPLITUDE * taper * Math.sin(t * Math.PI * 2 * TURNS + phase);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ");
}

interface Rung {
  x1: number;
  x2: number;
  y: number;
  /** Depth cue: rungs facing the viewer are drawn more strongly. */
  depth: number;
}

function rungs(count: number): Rung[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const y = HELIX_TOP + t * (HELIX_BOTTOM - HELIX_TOP);
    const taper = 0.55 + 0.45 * (1 - t);
    const angle = t * Math.PI * 2 * TURNS;
    return {
      x1: CENTRE + AMPLITUDE * taper * Math.sin(angle),
      x2: CENTRE + AMPLITUDE * taper * Math.sin(angle + Math.PI),
      y,
      depth: Math.abs(Math.cos(angle)),
    };
  });
}

interface Stage {
  label: string;
  y: number;
  rx: number;
  ry: number;
  hue: string;
  delay: string;
}

const STAGES: Stage[] = [
  { label: "New evidence", y: 404, rx: 118, ry: 31, hue: "#6366F1", delay: "0s" },
  { label: "Analysis", y: 500, rx: 139, ry: 36, hue: "#7C6BEA", delay: "0.5s" },
  { label: "Affected patients", y: 596, rx: 160, ry: 41, hue: "#A855F7", delay: "1s" },
];

export function EvidencePipeline({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn("h-full w-full", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="vp-strand-a" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#93A5FD" />
          <stop offset="45%" stopColor="#5B5BD6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="vp-strand-b" x1="1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>

        <linearGradient id="vp-column" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
          <stop offset="55%" stopColor="#6366F1" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </linearGradient>

        {STAGES.map((stage, index) => (
          <radialGradient key={stage.label} id={`vp-disc-${index}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={stage.hue} stopOpacity="0.20" />
            <stop offset="62%" stopColor={stage.hue} stopOpacity="0.09" />
            <stop offset="100%" stopColor={stage.hue} stopOpacity="0" />
          </radialGradient>
        ))}

        <filter id="vp-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="vp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient wash behind the whole composition. */}
      <ellipse
        cx={CENTRE}
        cy={492}
        rx={192}
        ry={172}
        fill="#6366F1"
        opacity="0.07"
        filter="url(#vp-soft)"
      />

      {/* The column of light linking the helix to the stack. */}
      <rect x={CENTRE - 36} y={150} width={72} height={450} fill="url(#vp-column)" />

      {/* Stacked stages, back to front. */}
      {STAGES.map((stage, index) => (
        <g key={stage.label}>
          <ellipse
            cx={CENTRE}
            cy={stage.y + 6}
            rx={stage.rx}
            ry={stage.ry}
            fill={stage.hue}
            opacity="0.10"
            filter="url(#vp-soft)"
          />
          <ellipse
            cx={CENTRE}
            cy={stage.y}
            rx={stage.rx}
            ry={stage.ry}
            fill={`url(#vp-disc-${index})`}
          />
          <ellipse
            cx={CENTRE}
            cy={stage.y}
            rx={stage.rx}
            ry={stage.ry}
            fill="none"
            stroke={stage.hue}
            strokeOpacity="0.30"
            strokeWidth="1.1"
          />
          <ellipse
            cx={CENTRE}
            cy={stage.y}
            rx={stage.rx * 0.62}
            ry={stage.ry * 0.62}
            fill="none"
            stroke={stage.hue}
            strokeOpacity="0.16"
            strokeWidth="1"
          />
          <text
            x={CENTRE}
            y={stage.y + 4}
            textAnchor="middle"
            className="fill-ink-2"
            style={{ font: "500 12px var(--font-inter), sans-serif", letterSpacing: "0.01em" }}
          >
            {stage.label}
          </text>
          {/* A light pulse travelling the ring, one stage after another. */}
          <circle r="3" fill={stage.hue} opacity="0.85">
            <animateMotion
              dur="9s"
              begin={stage.delay}
              repeatCount="indefinite"
              path={`M ${CENTRE + stage.rx} ${stage.y} a ${stage.rx} ${stage.ry} 0 1 1 -0.1 0`}
            />
          </circle>
        </g>
      ))}

      {/* The helix. */}
      <g filter="url(#vp-glow)">
        {rungs(22).map((rung, index) => (
          <line
            key={index}
            x1={rung.x1}
            y1={rung.y}
            x2={rung.x2}
            y2={rung.y}
            stroke="#8B93F2"
            strokeWidth={1.2 + rung.depth * 1.3}
            strokeLinecap="round"
            opacity={0.2 + rung.depth * 0.45}
          />
        ))}
        <path
          d={helixPath(0)}
          fill="none"
          stroke="url(#vp-strand-a)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d={helixPath(Math.PI)}
          fill="none"
          stroke="url(#vp-strand-b)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </g>

      {/* Evidence arriving from the sources on the right. */}
      {[
        { y: 168, curve: 82 },
        { y: 244, curve: 58 },
        { y: 316, curve: 38 },
        { y: 382, curve: 20 },
      ].map((line, index) => (
        <g key={line.y}>
          <path
            d={`M ${WIDTH - 4} ${line.y} C ${WIDTH - 110} ${line.y}, ${CENTRE + line.curve + 64} ${404}, ${CENTRE + line.curve} ${404}`}
            fill="none"
            stroke="#94A3F5"
            strokeOpacity="0.4"
            strokeWidth="1.1"
          />
          <circle r="2.6" fill="#6366F1">
            <animateMotion
              dur="4.5s"
              begin={`${index * 0.9}s`}
              repeatCount="indefinite"
              path={`M ${WIDTH - 4} ${line.y} C ${WIDTH - 110} ${line.y}, ${CENTRE + line.curve + 64} ${404}, ${CENTRE + line.curve} ${404}`}
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
        { y: 538, curve: -100 },
        { y: 600, curve: -132 },
      ].map((line, index) => (
        <path
          key={line.y}
          d={`M ${CENTRE + line.curve} ${line.y} C ${CENTRE + line.curve - 70} ${line.y}, 70 ${line.y + 14}, 10 ${line.y + 18}`}
          fill="none"
          stroke="#A855F7"
          strokeOpacity={0.24 - index * 0.06}
          strokeWidth="1.1"
        />
      ))}
    </svg>
  );
}
