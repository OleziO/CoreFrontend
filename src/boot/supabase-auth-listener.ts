import { supabase } from '@/api/client'

/**
 * Після успішного входу (Discord тощо) синхронізує дані гільдії через Edge Function.
 */
export function registerSupabaseAuthGuildSync (): void {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' || !session) return

    const { error } = await supabase.functions.invoke('sync-discord-guild', {
      body: { name: 'Functions' }
    })
    if (error) {
      console.warn('[sync-discord-guild]', error.message)
    }
  })
}
