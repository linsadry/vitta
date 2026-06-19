import React from 'react'

/* ─── ATOMIC SHAPES ─────────────────────────────────────────────
   All coordinates are in a 1000×1000 space.
   Caller scales via SVG viewBox and preserveAspectRatio.
────────────────────────────────────────────────────────────────── */

// Single poppy-like flower: 5 rounded petals + stamen center
const Flower = ({ cx, cy, r = 40, angle = 0, fill = '#D4A5A5', opacity = 0.13 }) => {
  const petals = 5
  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`} opacity={opacity}>
      {Array.from({ length: petals }, (_, i) => {
        const rot = (i * 360) / petals
        return (
          <ellipse
            key={i}
            cx={0} cy={-r * 0.65}
            rx={r * 0.38} ry={r * 0.55}
            fill={fill}
            transform={`rotate(${rot})`}
          />
        )
      })}
      {/* Stamen center */}
      <circle cx={0} cy={0} r={r * 0.18} fill="#C9A96E" opacity={0.55} />
    </g>
  )
}

// Small 5-petal wildflower
const SmallFlower = ({ cx, cy, r = 16, fill = '#D4A5A5', opacity = 0.12 }) => (
  <Flower cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} angle={Math.random() * 36} />
)

// Gentle curved stem
const Stem = ({ x1, y1, x2, y2, bend = 0, stroke = '#8A9E8C', opacity = 0.1 }) => (
  <path
    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + bend} ${(y1 + y2) / 2} ${x2} ${y2}`}
    stroke={stroke} strokeWidth="3" fill="none"
    strokeLinecap="round" opacity={opacity}
  />
)

// Leaf: pointed oval
const Leaf = ({ cx, cy, rx = 12, ry = 28, angle = 0, fill = '#8A9E8C', opacity = 0.10 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill}
    transform={`rotate(${angle},${cx},${cy})`} opacity={opacity} />
)

// Delicate grass blade
const Blade = ({ x, y, h = 80, curve = 20, stroke = '#8A9E8C', opacity = 0.08 }) => (
  <path
    d={`M ${x} ${y} Q ${x + curve} ${y - h / 2} ${x + curve * 1.4} ${y - h}`}
    stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" opacity={opacity}
  />
)

// Small dot cluster (like wildflower buds)
const DotCluster = ({ cx, cy, count = 4, r = 4, spread = 18, fill = '#C9A96E', opacity = 0.12 }) => {
  const dots = Array.from({ length: count }, (_, i) => {
    const angle = (i * 360) / count * (Math.PI / 180)
    return { x: cx + spread * Math.cos(angle), y: cy + spread * Math.sin(angle) }
  })
  return (
    <g opacity={opacity}>
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={r} fill={fill} />)}
      <circle cx={cx} cy={cy} r={r * 1.2} fill={fill} />
    </g>
  )
}

/* ─── BOTANICAL COMPOSITIONS ─────────────────────────────────── */

// PIN screen: full botanical background with scattered florals
function PinBotanical() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Bottom-left corner composition */}
      <Stem x1={120} y1={980} x2={100} y2={620} bend={-25} opacity={0.09} />
      <Leaf cx={110} cy={820} rx={14} ry={32} angle={-30} opacity={0.09} />
      <Leaf cx={95}  cy={720} rx={12} ry={28} angle={20}  opacity={0.08} />
      <Flower cx={100} cy={590} r={42} fill="#D4A5A5" opacity={0.12} />
      <Stem x1={100} y1={590} x2={55} y2={490} bend={-30} opacity={0.07} />
      <SmallFlower cx={50} cy={470} r={22} fill="#C4B8D4" opacity={0.11} />

      {/* Bottom-right corner */}
      <Stem x1={880} y1={980} x2={900} y2={680} bend={20} opacity={0.09} />
      <Leaf cx={890} cy={830} rx={13} ry={30} angle={35} opacity={0.09} />
      <Leaf cx={905} cy={740} rx={11} ry={25} angle={-15} opacity={0.08} />
      <SmallFlower cx={905} cy={658} r={28} fill="#D4A5A5" opacity={0.11} />
      <DotCluster cx={860} cy={600} count={5} r={5} spread={20} fill="#C9A96E" opacity={0.10} />

      {/* Top-right scattered */}
      <Blade x={820} y={200} h={100} curve={25} opacity={0.07} />
      <Blade x={840} y={210} h={80} curve={-15} opacity={0.06} />
      <SmallFlower cx={870} cy={90} r={18} fill="#C4B8D4" opacity={0.10} />
      <Leaf cx={820} cy={130} rx={10} ry={22} angle={-40} opacity={0.08} />

      {/* Top-left scattered */}
      <SmallFlower cx={130} cy={120} r={20} fill="#D4A5A5" opacity={0.10} />
      <Stem x1={140} y1={200} x2={160} y2={300} bend={15} opacity={0.07} />
      <Leaf cx={152} cy={260} rx={9} ry={20} angle={20} opacity={0.08} />
      <DotCluster cx={90} cy={170} count={3} r={4} spread={15} fill="#D4A5A5" opacity={0.09} />

      {/* Mid floating accents */}
      <SmallFlower cx={500} cy={150} r={14} fill="#8A9E8C" opacity={0.07} />
      <SmallFlower cx={600} cy={280} r={10} fill="#C4B8D4" opacity={0.06} />
      <DotCluster cx={420} cy={880} count={4} r={3} spread={12} fill="#C9A96E" opacity={0.08} />
    </svg>
  )
}

// Home page: header botanical (top decoration strip)
function HomeHeaderBotanical() {
  return (
    <svg
      viewBox="0 0 1000 220"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Right cluster */}
      <Stem x1={920} y1={220} x2={910} y2={60} bend={15} opacity={0.10} />
      <Leaf cx={916} cy={160} rx={10} ry={24} angle={25} opacity={0.09} />
      <Flower cx={912} cy={42} r={32} fill="#D4A5A5" opacity={0.13} />
      <Stem x1={912} y1={42} x2={960} y2={10} bend={-5} opacity={0.08} />
      <SmallFlower cx={962} cy={8} r={16} fill="#C4B8D4" opacity={0.10} />

      {/* Left accent */}
      <Blade x={60} y={220} h={90} curve={20} opacity={0.08} />
      <Blade x={80} y={220} h={110} curve={-10} opacity={0.07} />
      <SmallFlower cx={70} cy={90} r={18} fill="#8A9E8C" opacity={0.09} />
      <DotCluster cx={100} cy={40} count={4} r={3} spread={14} fill="#C9A96E" opacity={0.09} />

      {/* Center whisper */}
      <SmallFlower cx={500} cy={30} r={10} fill="#C4B8D4" opacity={0.06} />
      <SmallFlower cx={720} cy={80} r={8}  fill="#D4A5A5" opacity={0.06} />
      <Leaf cx={270} cy={50} rx={8} ry={18} angle={15} fill="#8A9E8C" opacity={0.07} />
    </svg>
  )
}

// Card section botanical (faint background for cards)
function CardBotanical() {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMaxYMax meet"
      style={{ position: 'absolute', right: 0, bottom: 0, width: '60%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <SmallFlower cx={340} cy={40}  r={28} fill="#D4A5A5" opacity={0.10} />
      <SmallFlower cx={380} cy={110} r={18} fill="#C4B8D4" opacity={0.09} />
      <Leaf cx={310} cy={80}  rx={9}  ry={22} angle={-20} opacity={0.08} />
      <Stem x1={340} y1={200} x2={350} y2={60} bend={10} opacity={0.07} />
      <DotCluster cx={370} cy={160} count={3} r={3} spread={12} fill="#C9A96E" opacity={0.08} />
    </svg>
  )
}

// Page stub botanical (full-page gentle decoration)
function PageBotanical() {
  return (
    <svg
      viewBox="0 0 1000 800"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Stem x1={900} y1={800} x2={880} y2={500} bend={20} opacity={0.09} />
      <Leaf cx={888} cy={660} rx={12} ry={28} angle={30} opacity={0.09} />
      <Flower cx={882} cy={475} r={38} fill="#D4A5A5" opacity={0.11} />
      <SmallFlower cx={140} cy={180} r={22} fill="#C4B8D4" opacity={0.10} />
      <Blade x={130} y={350} h={100} curve={25} opacity={0.08} />
      <DotCluster cx={850} cy={200} count={4} r={4} spread={16} fill="#C9A96E" opacity={0.09} />
      <SmallFlower cx={500} cy={120} r={12} fill="#8A9E8C" opacity={0.07} />
    </svg>
  )
}

/* ─── APP ICON (botanical only, no text) ─────────────────────── */
export function VittaIcon({ size = 48, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      fill="none" className={className}
      style={{ borderRadius: '22%', overflow: 'visible' }}
      aria-label="Vitta+"
    >
      {/* Background */}
      <rect width="100" height="100" rx="22" fill="#FAF7F4" />
      {/* Botanical element: stem + flowers */}
      <line x1="50" y1="88" x2="50" y2="42" stroke="#8A9E8C" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left branch */}
      <path d="M 50 65 Q 32 55 24 44" stroke="#8A9E8C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Right branch */}
      <path d="M 50 58 Q 66 48 72 38" stroke="#8A9E8C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Main flower */}
      {[0, 72, 144, 216, 288].map((a, i) => (
        <ellipse key={i} cx={50} cy={29} rx={5.5} ry={9}
          fill="#D4A5A5"
          transform={`rotate(${a},50,42)`}
          opacity={0.85}
        />
      ))}
      <circle cx={50} cy={42} r={4.5} fill="#C9A96E" opacity={0.9} />
      {/* Left small flower */}
      {[0, 90, 180, 270].map((a, i) => (
        <ellipse key={i} cx={24} cy={38} rx={3.5} ry={5.5}
          fill="#C4B8D4"
          transform={`rotate(${a},24,44)`}
          opacity={0.8}
        />
      ))}
      <circle cx={24} cy={44} r={2.8} fill="#C9A96E" opacity={0.8} />
      {/* Right small flower */}
      {[0, 90, 180, 270].map((a, i) => (
        <ellipse key={i} cx={72} cy={32} rx={3} ry={5}
          fill="#D4A5A5"
          transform={`rotate(${a},72,38)`}
          opacity={0.8}
        />
      ))}
      <circle cx={72} cy={38} r={2.5} fill="#C9A96E" opacity={0.8} />
      {/* Leaves */}
      <ellipse cx={43} cy={72} rx={6} ry={12} fill="#8A9E8C"
        transform="rotate(-25,43,72)" opacity={0.5} />
      <ellipse cx={57} cy={78} rx={5.5} ry={11} fill="#8A9E8C"
        transform="rotate(20,57,78)" opacity={0.45} />
    </svg>
  )
}

/* ─── EXPORTS ────────────────────────────────────────────────── */
export { PinBotanical, HomeHeaderBotanical, CardBotanical, PageBotanical }
