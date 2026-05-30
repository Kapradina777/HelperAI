import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Неделя считается от первого замера, начиная с 1
export function getWeekNumber(startDate) {
  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, diff + 1)
}

export function getDayNumber(startDate) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1)
}

// Загрузить вопросы из базы
export async function loadQuestions(timeOfDay) {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('time_of_day', timeOfDay)
    .eq('is_active', true)
    .order('question_index')
  return data || []
}
