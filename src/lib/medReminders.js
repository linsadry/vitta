// Lembretes locais de medicamentos.
// Como Web Push real exige servidor com chaves VAPID, usamos notificações
// locais agendadas enquanto o app/PWA está aberto. Para lembretes garantidos
// mesmo com o app fechado, seria necessário configurar VAPID + cron no Supabase.

import { supabase } from './supabase'

// Converte "Manhã", "08:00", "20h" em hora aproximada (0-23) ou null
function parseHour(timeStr) {
  if (!timeStr) return null
  const s = timeStr.toLowerCase().trim()
  if (s.includes('manhã') || s.includes('manha')) return 8
  if (s.includes('tarde')) return 14
  if (s.includes('noite')) return 20
  if (s.includes('almoço') || s.includes('almoco')) return 12
  const m = s.match(/(\d{1,2})[:h]?(\d{2})?/)
  if (m) {
    const h = parseInt(m[1])
    if (h >= 0 && h <= 23) return h
  }
  return null
}

let scheduledTimers = []

export function clearMedReminders() {
  scheduledTimers.forEach(t => clearTimeout(t))
  scheduledTimers = []
}

// Agenda as notificações de hoje para os medicamentos ativos
export async function scheduleMedReminders(userId) {
  if (!userId) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  clearMedReminders()

  const { data: meds } = await supabase
    .from('health_medications')
    .select('id,name,dose,time,tipo')
    .eq('user_id', userId)
    .eq('active', true)
    .neq('tipo', 'eventual')

  if (!meds?.length) return

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  // Quais já foram tomados hoje (não notificar esses)
  const { data: logs } = await supabase
    .from('vitta_med_logs')
    .select('medication_id')
    .eq('user_id', userId)
    .eq('date', todayStr)
  const takenIds = new Set((logs || []).map(l => l.medication_id))

  for (const med of meds) {
    if (takenIds.has(med.id)) continue
    const hour = parseHour(med.time)
    if (hour == null) continue

    const target = new Date()
    target.setHours(hour, 0, 0, 0)
    const delay = target.getTime() - now.getTime()

    // Só agenda se o horário ainda está por vir hoje (e dentro de ~16h)
    if (delay > 0 && delay < 16 * 3600 * 1000) {
      const timer = setTimeout(async () => {
        try {
          const reg = await navigator.serviceWorker?.ready
          const body = `Hora de tomar ${med.name}${med.dose ? ' ' + med.dose : ''}`
          if (reg) {
            reg.showNotification('Vitta+ — Lembrete', { body, icon: '/icon-192.png', tag: `med-${med.id}` })
          } else {
            new Notification('Vitta+ — Lembrete', { body, icon: '/icon-192.png' })
          }
        } catch (e) { /* silencioso */ }
      }, delay)
      scheduledTimers.push(timer)
    }
  }
}
