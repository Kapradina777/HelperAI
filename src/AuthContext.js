import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile()
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) loadProfile()
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile() {
    const p = await getProfile()
    setProfile(p)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signUp(email, password, name, role = 'helper') {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } }
    })
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
