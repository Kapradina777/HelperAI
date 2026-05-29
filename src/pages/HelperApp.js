import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext'

const s = {
  wrap: { minHeight:'100vh', background:'#f8f7ff', fontFamily:'sans-serif', padding:'1rem' },
  inner: { maxWidth:420, margin:'0 auto', paddingBottom:40 },
  header: { textAlign:'center', padding:'1.5rem 0 1rem' },
  h1: { fontSize:20, fontWeight:500, color:'#1a1a2e', margin:0 },
  sub: { fontSize:14, color:'#888', marginTop:4 },
  card: { background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  taskTitle: { fontSize:15, fontWeight:500, color:'#1a1a2e', marginBottom:6 },
  taskBody: { fontSize:14, color:'#555', lineHeight:1.6, marginBottom:12 },
  doneBtn: { padding:'8px 16px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer' },
  empty: { textAlign:'center', color:'#aaa', fontSize:14, padding:'2rem 0' },
  signOut: { width:'100%', padding:'11px', border:'1px solid #eee', borderRadius:10, background:'transparent', color:'#aaa', fontSize:13, cursor:'pointer', marginTop:8 }
}

export default function HelperApp() {
  const { profile, signOut } = useAuth()
  const [tasks, setTasks] = useState([])

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('target_user_id', profile.id)
      .eq('is_done', false)
      .order('created_at', { ascending: false })
    setTasks(data || [])
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ is_done: true }).eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <div style={s.header}>
          <div style={s.h1}>Привет, {profile?.name}</div>
          <div style={s.sub}>Твои задания для поддержки Ады</div>
        </div>
        {tasks.length === 0
          ? <div style={s.empty}>Заданий пока нет.<br/>Они появятся после анализа недели.</div>
          : tasks.map(task => (
            <div key={task.id} style={s.card}>
              <div style={s.taskTitle}>{task.title}</div>
              <div style={s.taskBody}>{task.body}</div>
              <button style={s.doneBtn} onClick={()=>markDone(task.id)}>Сделал(а) ✓</button>
            </div>
          ))
        }
        <button style={s.signOut} onClick={signOut}>Выйти</button>
      </div>
    </div>
  )
}
