import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    const { data } = await supabase
      .from('contractor_profiles')
      .select('*, insurance_certificates(id, expiry_date, is_active, insurer_name)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async ({ email, password, business_name, owner_name, phone, preferred_role }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    const { error: profileError } = await supabase.from('contractor_profiles').insert({
      id: data.user.id,
      business_name,
      owner_name,
      phone,
      preferred_role: preferred_role ?? 'both',
    })
    return { error: profileError }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const activeCOI = profile?.insurance_certificates?.find((c) => c.is_active && new Date(c.expiry_date) > new Date())

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasActiveCOI: !!activeCOI,
    isVerified: profile?.is_verified ?? false,
    refetchProfile: () => session && fetchProfile(session.user.id),
  }
}
