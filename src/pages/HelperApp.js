import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext'

const s = {
  wrap: { minHeight:'100vh', background:'#f8f7ff', fontFamily:'sans-serif', padding:'1rem' },
  inner: { maxWidth:420, margin:'0 auto', paddingBottom:40 },
  header: { textAlign:'center', padding:'1.5rem 0 1rem' },
  logo: { fontSize:28, fontWeight:700, color:'#7F77DD', letterSpacing:'-1px', marginBottom:4 },
  sub: { fontSize:14, color:'#888', marginTop:4 },
  card: { background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  taskTitle: { fontSize:15, fontWeight:500, color:'#1a1a2e', marginBottom:6 },
  taskBody: { fontSize:14, color:'#555', lineHeight:1.6, marginBottom:12 },
  doneBtn: { padding:'10px 20px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  doneTag: { display:'inline-block', padding:'4px 12px', background:'#E1F5EE', color:'#085041', borderRadius:999, fontSize:13 },
  doneDate: { fontSize:11, color:'#aaa', marginTop:4 },
  empty: { textAlign:'center', color:'#aaa', fontSize:14, padding:'2rem 0' },
  signOut: { width:'100%', padding:'11px', border:'1px solid #eee', borderRadius:10, background:'transparent', color:'#aaa', fontSize:13, cursor:'pointer', marginTop:8 },
  tabs: { display:'flex', gap:8, marginBottom:16 },
  tab: { padding:'7px 16px', border:'1px solid #ddd', borderRadius:999, background:'transparent', cursor:'pointer', fontSize:13, color:'#666' },
  tabActive: { padding:'7px 16px', border:'1px solid #AFA9EC', borderRadius:999, background:'#EEEDFE', cursor:'pointer', fontSize:13, color:'#3C3489', fontWeight:500 },
}

export default function HelperApp() {
  const { profile, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [showDone, setShowDone] = useState(false)

  // eslint-disable-next-line
  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('target_user_id', profile.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ is_done: true, completed_at: new Date().toISOString() }).eq('id', id)
    loadTasks()
  }

  const pending = tasks.filter(t => !t.is_done)
  const done = tasks.filter(t => t.is_done)
  const shown = showDone ? done : pending

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <div style={s.header}>
          <img src="/logo.png" alt="MM" style={{width:48, height:48, objectFit:'contain'}} />
          <div style={s.sub}>Привет, {profile?.name}</div>
        </div>

        <div style={s.tabs}>
          <button style={!showDone?s.tabActive:s.tab} onClick={()=>setShowDone(false)}>
            Активные {pending.length>0&&`(${pending.length})`}
          </button>
          <button style={showDone?s.tabActive:s.tab} onClick={()=>setShowDone(true)}>
            Выполненные {done.length>0&&`(${done.length})`}
          </button>
        </div>

        {shown.length===0
          ? <div style={s.empty}>{showDone?'Выполненных заданий пока нет.':'Активных заданий нет.\nОни появятся после анализа недели.'}</div>
          : shown.map(task=>(
            <div key={task.id} style={s.card}>
              <div style={s.taskTitle}>{task.title}</div>
              <div style={s.taskBody}>{task.body}</div>
              {task.is_done
                ? <>
                    <span style={s.doneTag}>✓ Выполнено</span>
                    {task.completed_at && <div style={s.doneDate}>{new Date(task.completed_at).toLocaleDateString('ru')}</div>}
                  </>
                : <button style={s.doneBtn} onClick={()=>markDone(task.id)}>Отметить выполненным ✓</button>
              }
            </div>
          ))
        }

        <button style={s.signOut} onClick={signOut}>Выйти</button>
      </div>
    </div>
  )
}
