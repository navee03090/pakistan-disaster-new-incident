'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSupabaseRealtime(
  tables: string[],
  onChange: () => void
) {
  const refresh = useCallback(onChange, [onChange])

  useEffect(() => {
    const supabase = createClient()
    const channels = tables.map(table =>
      supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => refresh())
        .subscribe()
    )

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [tables, refresh])
}
