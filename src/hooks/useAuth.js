import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { hashPin, randomSalt } from '../lib/utils'

const SESSION_KEY = 'vitta_pin_ok'

export function useAuth() {
  const [state, setState] = useState({
    loading: true,
    supaUser: null,
    pinVerified: sessionStorage.getItem(SESSION_KEY) === '1',
    pinExists: false,
    error: null,
  })

  // Listen for Supabase auth changes
  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (user) {
        const { data: settings } = await supabase
          .from('fitness_settings')
          .select('pin_hash, pin_salt')
          .eq('user_id', user.id)
          .maybeSingle()

        setState(s => ({
          ...s,
          loading: false,
          supaUser: user,
          pinExists: !!(settings?.pin_hash),
        }))
      } else {
        setState(s => ({ ...s, loading: false, supaUser: null }))
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setState(s => ({ ...s, supaUser: session.user, loading: false }))
        }
      }
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(SESSION_KEY)
        setState({ loading: false, supaUser: null, pinVerified: false, pinExists: false, error: null })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Verify PIN
  const verifyPin = useCallback(async (pin) => {
    if (!state.supaUser) return { ok: false, error: 'Não autenticado' }

    const { data: settings } = await supabase
      .from('fitness_settings')
      .select('pin_hash, pin_salt')
      .eq('user_id', state.supaUser.id)
      .maybeSingle()

    if (!settings?.pin_hash) {
      // No PIN set — create one
      const salt = randomSalt()
      const hash = await hashPin(pin, salt)
      await supabase.from('fitness_settings')
        .upsert({ user_id: state.supaUser.id, pin_hash: hash, pin_salt: salt },
          { onConflict: 'user_id' })
      sessionStorage.setItem(SESSION_KEY, '1')
      setState(s => ({ ...s, pinVerified: true, pinExists: true }))
      return { ok: true }
    }

    const hash = await hashPin(pin, settings.pin_salt)
    if (hash === settings.pin_hash) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setState(s => ({ ...s, pinVerified: true }))
      return { ok: true }
    }
    return { ok: false, error: 'PIN incorreto' }
  }, [state.supaUser])

  // Sign in with OTP (email magic link)
  const sendOtp = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    return { error }
  }, [])

  const verifyOtp = useCallback(async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email, token, type: 'email'
    })
    return { data, error }
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setState(s => ({ ...s, pinVerified: false }))
  }, [])

  return { ...state, verifyPin, sendOtp, verifyOtp, lock }
}
