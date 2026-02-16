import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://elayubywsgrjlcanobfa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsYXl1Ynl3c2dyamxjYW5vYmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTgxMTksImV4cCI6MjA4NjU3NDExOX0.5Gibp4Ad2cOdzo3YsB9EiLoBhKEOtAuzsK5pmRHaJ1w'

export const supabase = createClient(supabaseUrl, supabaseKey)