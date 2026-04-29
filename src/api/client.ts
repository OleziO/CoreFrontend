import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Задайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY (або VITE_SUPABASE_PUBLISHABLE_KEY) у .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/** База Nest/OpenAPI (teams, matches, tournaments…). Без змінної середовища запити не виконуються — використовуйте Supabase у відповідних сервісах. */
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL?.trim()?.replace(/\/$/, '') ?? ''

const apiClient = axios.create(
  apiPublicUrl
    ? { baseURL: `${apiPublicUrl}/api/v1` }
    : {}
)

apiClient.interceptors.request.use((config) => {
  if (!apiPublicUrl) {
    return Promise.reject(
      new Error(
        'VITE_API_PUBLIC_URL не заданий у .env. Цей запит іде через Axios до Nest API; додайте URL бекенду або переведіть модуль на Supabase.'
      )
    )
  }
  return config
})

export default apiClient
