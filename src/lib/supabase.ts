import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isDemo } from '@/demo'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null = isDemo ? null : createClient(supabaseUrl, supabaseKey)

export const getSupabase = () => {
  if (!supabase) throw new Error('Supabase is disabled in demo mode')
  return supabase
}

export type Quiz = {
  id: string
  title: string
  description: string | null
  code: string
  host_id: string
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
  updated_at: string
}

export type Question = {
  id: string
  quiz_id: string
  text: string
  time_limit: number
  points: number
  sort_order: number
  created_at: string
}

export type Answer = {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  color: 'red' | 'blue' | 'yellow' | 'green'
  sort_order: number
  created_at: string
}

export type PublicAnswer = {
  id: string
  question_id: string
  text: string
  color: 'red' | 'blue' | 'yellow' | 'green'
  sort_order: number
}

export type GameSession = {
  id: string
  quiz_id: string
  code: string
  status: 'waiting' | 'playing' | 'finished'
  phase: 'question' | 'results' | 'scoreboard'
  current_question_index: number
  host_id: string
  question_started_at: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export type Player = {
  id: string
  session_id: string
  user_id: string | null
  name: string
  score: number
  is_host: boolean
  joined_at: string
}

export type PlayerAnswer = {
  id: string
  player_id: string
  question_id: string
  answer_id: string | null
  time_remaining: number | null
  is_correct: boolean
  points_earned: number
  answered_at: string
}
