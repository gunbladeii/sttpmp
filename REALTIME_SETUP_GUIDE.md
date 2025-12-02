# 🔴 REALTIME IMPLEMENTATION GUIDE - SYOR TABLE

## ✅ Step 1: Enable Realtime di Supabase Dashboard

1. Go to Supabase Dashboard → Database → Replication
2. Find table `syor`
3. Click "Enable realtime" button
4. Confirm dialog

**Status: COMPLETED** ✅

---

## 💻 Step 2: Use Realtime Hook dalam Components

### Example 1: Syor List Page (Auto Refresh)

```tsx
// src/app/syor/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSyorRealtime } from '@/hooks/useSyorRealtime'
import { supabase } from '@/lib/supabase'

export default function SyorPage() {
  const [syor, setSyor] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  const fetchSyor = async () => {
    const { data } = await supabase
      .from('syor')
      .select('*')
      .order('created_at', { ascending: false })
    
    setSyor(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSyor()
  }, [])

  // Subscribe to realtime changes
  useSyorRealtime({
    onInsert: (payload) => {
      // Add new syor to list
      setSyor(prev => [payload.new, ...prev])
      
      // Optional: Show notification
      toast.success('Syor baharu dicipta!')
    },
    onUpdate: (payload) => {
      // Update existing syor in list
      setSyor(prev => prev.map(s => 
        s.id === payload.new.id ? payload.new : s
      ))
      
      toast.info('Syor dikemaskini!')
    },
    onDelete: (payload) => {
      // Remove from list
      setSyor(prev => prev.filter(s => s.id !== payload.old.id))
      
      toast.warning('Syor dipadam!')
    },
    enabled: true // Set to false to disable
  })

  return (
    <div>
      {/* Your syor list UI */}
      {syor.map(s => (
        <SyorCard key={s.id} syor={s} />
      ))}
    </div>
  )
}
```

---

### Example 2: Syor Detail Page (Single Syor Updates)

```tsx
// src/app/syor/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSyorRealtimeById } from '@/hooks/useSyorRealtime'
import { supabase } from '@/lib/supabase'

export default function SyorDetailPage({ params }: { params: { id: string } }) {
  const [syor, setSyor] = useState(null)

  // Fetch syor details
  useEffect(() => {
    const fetchSyor = async () => {
      const { data } = await supabase
        .from('syor')
        .select('*')
        .eq('id', params.id)
        .single()
      
      setSyor(data)
    }
    
    fetchSyor()
  }, [params.id])

  // Subscribe to updates for this specific syor
  useSyorRealtimeById({
    syorId: params.id,
    onUpdate: (payload) => {
      // Auto update when syor changes
      setSyor(payload.new)
      
      // Show notification
      toast.info('Syor telah dikemaskini oleh pengguna lain!')
    },
    enabled: true
  })

  return (
    <div>
      {/* Syor details UI */}
      <h1>{syor?.title}</h1>
      <p>{syor?.description}</p>
      {/* ... */}
    </div>
  )
}
```

---

### Example 3: Dashboard with Real-time Counts

```tsx
// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSyorRealtime } from '@/hooks/useSyorRealtime'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    belumSelesai: 0,
    dalamTindakan: 0,
    selesai: 0
  })

  const fetchStats = async () => {
    const { data } = await supabase
      .from('syor')
      .select('id, status')
    
    const newStats = {
      total: data?.length || 0,
      belumSelesai: data?.filter(s => s.status === 'belum_selesai').length || 0,
      dalamTindakan: data?.filter(s => s.status === 'dalam_tindakan').length || 0,
      selesai: data?.filter(s => s.status === 'selesai').length || 0
    }
    
    setStats(newStats)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto refresh stats when syor changes
  useSyorRealtime({
    onInsert: () => fetchStats(),
    onUpdate: () => fetchStats(),
    onDelete: () => fetchStats(),
    enabled: true
  })

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatsCard title="Total Syor" value={stats.total} />
      <StatsCard title="Belum Selesai" value={stats.belumSelesai} color="red" />
      <StatsCard title="Dalam Tindakan" value={stats.dalamTindakan} color="yellow" />
      <StatsCard title="Selesai" value={stats.selesai} color="green" />
    </div>
  )
}
```

---

## 🎯 Use Cases untuk Realtime Syor

### ✅ Scenarios yang akan auto-update:

1. **Admin creates new syor** → All users see new syor appear instantly
2. **Penyelaras updates status** → Dashboard stats update in real-time
3. **User adds comment** → Other viewers see comment appear
4. **Status changed** (belum_selesai → dalam_tindakan) → Traffic light updates
5. **Syor deleted** → Removed from all users' lists
6. **Due date approaching** → Alert badges update automatically

---

## ⚡ Performance Tips

### 1. Enable/Disable Realtime Conditionally

```tsx
// Only enable when user is on the page
const [isVisible, setIsVisible] = useState(true)

useEffect(() => {
  const handleVisibility = () => {
    setIsVisible(!document.hidden)
  }
  
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])

useSyorRealtime({
  onUpdate: handleUpdate,
  enabled: isVisible // Disable when tab not active
})
```

### 2. Debounce Updates

```tsx
import { debounce } from 'lodash'

const debouncedFetch = useMemo(
  () => debounce(fetchSyor, 300),
  []
)

useSyorRealtime({
  onUpdate: () => debouncedFetch(),
  enabled: true
})
```

### 3. Filter by User Role

```tsx
// Only subscribe to relevant syor
useSyorRealtime({
  onUpdate: (payload) => {
    // Only update if syor is assigned to user's department
    if (payload.new.assigned_to_department === user.department_id) {
      handleUpdate(payload)
    }
  }
})
```

---

## 🔒 Security Notes

- ✅ Realtime follows RLS policies automatically
- ✅ Users only receive updates for syor they can access
- ✅ No additional security setup needed
- ⚠️ Large payloads can impact performance - consider pagination

---

## 🐛 Debugging

### Check if subscription is active:

```tsx
useSyorRealtime({
  onInsert: (payload) => {
    console.log('INSERT event received:', payload)
  },
  onUpdate: (payload) => {
    console.log('UPDATE event received:', payload)
  },
  enabled: true
})
```

Check browser console for:
- `✅ Realtime subscription active untuk syor table`
- `🆕 Syor baru dicipta:` (when INSERT happens)
- `📝 Syor dikemaskini:` (when UPDATE happens)

---

## 📦 What's Included

### Files Created:
1. **`src/hooks/useSyorRealtime.ts`**
   - `useSyorRealtime()` - Subscribe to all syor changes
   - `useSyorRealtimeById()` - Subscribe to specific syor

### Features:
- ✅ Auto-subscribe/unsubscribe
- ✅ Console logging for debugging
- ✅ INSERT/UPDATE/DELETE event handling
- ✅ Optional enable/disable
- ✅ Cleanup on unmount
- ✅ TypeScript support

---

## 🚀 Next Steps

1. ✅ Enable realtime in Supabase Dashboard
2. ✅ Import hook in your components
3. ✅ Test with multiple browser windows
4. ✅ Add toast notifications for user feedback
5. ✅ Deploy and enjoy real-time updates! 🎉

---

## 💡 Pro Tips

**Want notifications for status_tracking table too?**
Create similar hook: `useStatusTrackingRealtime.ts`

**Want to broadcast custom events?**
Use Supabase Broadcast API:
```tsx
const channel = supabase.channel('custom')
channel.send({
  type: 'broadcast',
  event: 'cursor-pos',
  payload: { x: 123, y: 456 }
})
```

**Want presence (who's online)?**
Use Supabase Presence API to show active users!

---

**Status: READY TO USE** 🚀
