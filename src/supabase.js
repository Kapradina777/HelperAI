import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Получить текущий профиль
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

// Получить номер текущей недели (с момента регистрации)
export function getWeekNumber() {
  const start = new Date('2025-01-01')
  const now = new Date()
  return Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1
}

// Получить номер дня недели (1-7)
export function getDayNumber() {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}
