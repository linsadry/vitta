// ─── PBKDF2 PIN HASHING ─────────────────────────────────────────

export async function hashPin(pin, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomSalt() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── DATE HELPERS ────────────────────────────────────────────────

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function today() {
  return localISO(new Date())
}

export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localISO(d)
}

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', ...opts })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export function formatDatetime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function weekDates() {
  const result = []
  for (let i = 6; i >= 0; i--) {
    result.push(daysAgo(i))
  }
  return result
}

export function last35Days() {
  const result = []
  for (let i = 34; i >= 0; i--) {
    result.push(daysAgo(i))
  }
  return result
}

// ─── GREETING ────────────────────────────────────────────────────

const PHRASES = [
  'O cuidado de si é o fundamento de tudo.',
  'Cada pequeno passo importa na jornada longa.',
  'Você está construindo a melhor versão de si.',
  'A consistência é mais poderosa que a perfeição.',
  'Hoje é uma nova chance de cuidar bem de você.',
  'O corpo responde quando você o escuta.',
  'Pequenos rituais criam grandes transformações.',
  'Cuidar de si não é egoísmo — é sabedoria.',
]

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function dailyPhrase() {
  const idx = new Date().getDate() % PHRASES.length
  return PHRASES[idx]
}

// ─── CYCLE PHASE ────────────────────────────────────────────────

export function cyclePhaseLabel(phase) {
  const map = {
    menstrual:   'Fase Menstrual',
    folicular:   'Fase Folicular',
    ovulatoria:  'Fase Ovulatória',
    lutea:       'Fase Lútea',
    follicular:  'Fase Folicular',
    ovulatory:   'Fase Ovulatória',
    luteal:      'Fase Lútea',
  }
  return map[phase?.toLowerCase()] || phase || '—'
}

// ─── WEIGHT FORMATTING ──────────────────────────────────────────

export function fmtWeight(kg) {
  if (kg == null) return '—'
  return parseFloat(kg).toFixed(1).replace('.', ',') + ' kg'
}

// ─── WATER FORMATTING ───────────────────────────────────────────

export function fmtWater(ml) {
  if (!ml) return '—'
  if (ml >= 1000) return (ml / 1000).toFixed(1).replace('.', ',') + ' L'
  return ml + ' ml'
}

// ─── SLEEP FORMATTING ───────────────────────────────────────────

export function fmtSleep(h) {
  if (!h) return '—'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
