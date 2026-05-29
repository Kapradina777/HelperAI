import { useState, useEffect } from 'react'
import { supabase, getWeekNumber } from '../supabase'
import { useAuth } from '../AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const s = {
  wrap: { minHeight:'100vh', background:'#f0eff8', fontFamily:'sans-serif' },
  sidebar: { width:220, background:'#fff', borderRight:'1px solid #eee', position:'fixed', top:0, left:0, bottom:0, padding:'1.5rem 1rem', display:'flex', flexDirection:'column' },
  sideTitle: { fontSize:16, fontWeight:500, color:'#1a1a2e', marginBottom:4 },
  sideSub: { fontSize:12, color:'#aaa', marginBottom:24 },
  navItem: { padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:14, color:'#555', marginBottom:2 },
  navItemActive: { padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:14, color:'#3C3489', background:'#EEEDFE', marginBottom:2, fontWeight:500 },
  main: { marginLeft:220, padding:'1.5rem' },
  h2: { fontSize:20, fontWeight:500, color:'#1a1a2e', marginBottom:16 },
  card: { background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:16, boxShadow:'0 1px 8px rgba(0,0,0,0.05)' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 },
  metricCard: { background:'#f8f7ff', borderRadius:12, padding:'1rem', textAlign:'center' },
  metricLabel: { fontSize:12, color:'#888', marginBottom:4 },
  metricVal: { fontSize:24, fontWeight:500, color:'#3C3489' },
  btn: { padding:'10px 20px', background:'#7F77DD', color:'#fff', border:'none', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  btnGreen: { padding:'10px 20px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  btnCopy: { padding:'10px 20px', background:'#f8f7ff', color:'#3C3489', border:'1px solid #AFA9EC', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:500 },
  diaryText: { fontSize:14, color:'#333', lineHeight:1.6 },
  textarea: { width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, minHeight:80, resize:'vertical', boxSizing:'border-box', fontFamily:'sans-serif', marginBottom:8 },
  helperCard: { background:'#fff', border:'1px solid #eee', borderRadius:12, padding:'1rem', marginBottom:8 },
  signOut: { marginTop:'auto', padding:'9px', border:'1px solid #eee', borderRadius:8, background:'transparent', color:'#aaa', fontSize:13, cursor:'pointer' },
  copyBox: { background:'#f8f7ff', borderRadius:12, padding:'1rem', fontSize:13, lineHeight:1.8, color:'#333', whiteSpace:'pre-wrap', fontFamily:'monospace', marginBottom:12 },
  infoBox: { background:'#EEEDFE', borderRadius:12, padding:'1rem', fontSize:14, color:'#3C3489', lineHeight:1.7, marginBottom:16 },
}

const QUADRANT_TEXT = {
  q1: { label: 'Идеал', color: '#085041', bg: '#E1F5EE' },
  q2: { label: 'X+ Y−', color: '#0C447C', bg: '#E6F1FB' },
  q3: { label: 'X− Y+', color: '#633806', bg: '#FAEEDA' },
  q4: { label: 'X− Y−', color: '#791F1F', bg: '#FCEBEB' },
}

function getQuadrant(x, y) {
  if (x >= 0 && y >= 0) return 'q1'
  if (x >= 0 && y < 0) return 'q2'
  if (x < 0 && y >= 0) return 'q3'
  return 'q4'
}

export default function AdminApp() {
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState('graph')
  const [measurements, setMeasurements] = useState([])
  const [diary, setDiary] = useState([])
  const [helpers, setHelpers] = useState([])
  const [weekNum, setWeekNum] = useState(getWeekNumber())
  const [newTask, setNewTask] = useState({ title:'', body:'', userId:'' })
  const [addingTask, setAddingTask] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadAll() }, [weekNum])

  async function loadAll() {
    const { data: ada } = await supabase.from('profiles').select('id').eq('role', 'ada').single()
    if (!ada) return
    const { data: m } = await supabase.from('measurements').select('*').eq('user_id', ada.id).eq('week_number', weekNum).order('day_number').order('created_at')
    setMeasurements(m || [])
    const { data: d } = await supabase.from('diary_entries').select('*').eq('user_id', ada.id).eq('week_number', weekNum).order('created_at', { ascending: false })
    setDiary(d || [])
    const { data: h } = await supabase.from('profiles').select('*').eq('role', 'helper')
    setHelpers(h || [])
  }

  const chartData = measurements.map(m => ({
    name: `Д${m.day_number} ${m.time_of_day === 'morning' ? 'утро' : m.time_of_day === 'day' ? 'день' : 'вечер'}`,
    X: m.x_score, Y: m.y_score,
  }))

  const avgX = measurements.length ? Math.round(measurements.reduce((s,m)=>s+m.x_score,0)/measurements.length*10)/10 : null
  const avgY = measurements.length ? Math.round(measurements.reduce((s,m)=>s+m.y_score,0)/measurements.length*10)/10 : null
  const quadrant = avgX !== null ? getQuadrant(avgX, avgY) : null

  function buildCopyText() {
    const pts = measurements.map(m =>
      `День ${m.day_number}, ${m.time_of_day === 'morning' ? 'утро' : m.time_of_day === 'day' ? 'день' : 'вечер'}: X=${m.x_score}, Y=${m.y_score}`
    ).join('\n')
    const diaryText = diary.map(d =>
      `День ${d.day_number}:\n  Чувствует: ${d.feeling}\n  Не хватает: ${d.missing}`
    ).join('\n')
    return `=== ДАННЫЕ АДЫ — НЕДЕЛЯ ${weekNum} ===\n\nЗАМЕРЫ (${measurements.length}/21):\n${pts || 'Нет данных'}\n\nДНЕВНИК:\n${diaryText || 'Нет записей'}\n\nСредние: X=${avgX ?? '—'}, Y=${avgY ?? '—'}\nКвадрант: ${quadrant ? QUADRANT_TEXT[quadrant].label : '—'}`
  }

  function copyData() {
    navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  async function addTask() {
    if (!newTask.title || !newTask.body || !newTask.userId) return
    setAddingTask(true)
    await supabase.from('tasks').insert({ target_user_id: newTask.userId, title: newTask.title, body: newTask.body, time_of_day: 'weekly', week_number: weekNum })
    setNewTask({ title:'', body:'', userId:'' })
    setAddingTask(false)
    alert('Задание добавлено')
  }

  const navItems = [
    { id:'graph', label:'📈 График' },
    { id:'diary', label:'📖 Дневник' },
    { id:'data', label:'📋 Данные недели' },
    { id:'helpers', label:'👥 Помощники' },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.sidebar}>
        <div style={s.sideTitle}>Ada Tracker</div>
        <div style={s.sideSub}>Панель администратора</div>
        <div style={{display:'flex', gap:8, marginBottom:16, alignItems:'center'}}>
          <button style={{padding:'4px 8px', border:'1px solid #ddd', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12}} onClick={()=>setWeekNum(w=>w-1)}>←</button>
          <span style={{fontSize:13, color:'#555'}}>Неделя {weekNum}</span>
          <button style={{padding:'4px 8px', border:'1px solid #ddd', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12}} onClick={()=>setWeekNum(w=>w+1)}>→</button>
        </div>
        {navItems.map(item => (
          <div key={item.id} style={tab===item.id ? s.navItemActive : s.navItem} onClick={()=>setTab(item.id)}>{item.label}</div>
        ))}
        <button style={s.signOut} onClick={signOut}>Выйти</button>
      </div>

      <div style={s.main}>
        {tab === 'graph' && (
          <>
            <div style={s.h2}>График — неделя {weekNum}</div>
            <div style={s.grid}>
              <div style={s.metricCard}><div style={s.metricLabel}>Ср. настроение X</div><div style={{...s.metricVal, color: avgX >= 0 ? '#1D9E75' : '#D85A30'}}>{avgX ?? '—'}</div></div>
              <div style={s.metricCard}><div style={s.metricLabel}>Ср. мотивация Y</div><div style={{...s.metricVal, color: avgY >= 0 ? '#1D9E75' : '#D85A30'}}>{avgY ?? '—'}</div></div>
              <div style={s.metricCard}><div style={s.metricLabel}>Точек собрано</div><div style={s.metricVal}>{measurements.length}/21</div></div>
              {quadrant && <div style={{...s.metricCard, background: QUADRANT_TEXT[quadrant].bg}}><div style={s.metricLabel}>Квадрант</div><div style={{...s.metricVal, fontSize:18, color: QUADRANT_TEXT[quadrant].color}}>{QUADRANT_TEXT[quadrant].label}</div></div>}
            </div>
            <div style={s.card}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize:11}} />
                    <YAxis domain={[-10,10]} tick={{fontSize:11}} />
                    <Tooltip /><Legend />
                    <ReferenceLine y={0} stroke="#ddd" />
                    <Line type="monotone" dataKey="X" stroke="#7F77DD" strokeWidth={2} dot={{r:3}} name="X настроение" />
                    <Line type="monotone" dataKey="Y" stroke="#1D9E75" strokeWidth={2} dot={{r:3}} name="Y мотивация" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center', color:'#aaa', padding:'2rem', fontSize:14}}>Данных пока нет.</div>}
            </div>
          </>
        )}

        {tab === 'diary' && (
          <>
            <div style={s.h2}>Дневник Ады — неделя {weekNum}</div>
            {diary.length === 0
              ? <div style={{color:'#aaa', fontSize:14}}>Записей пока нет.</div>
              : diary.map(d => (
                <div key={d.id} style={s.card}>
                  <div style={{fontSize:12, color:'#aaa', marginBottom:4}}>День {d.day_number}</div>
                  <div style={{fontSize:13, color:'#888', marginBottom:4}}>Чувствует:</div>
                  <div style={s.diaryText}>{d.feeling}</div>
                  <div style={{fontSize:13, color:'#888', margin:'8px 0 4px'}}>Не хватает:</div>
                  <div style={s.diaryText}>{d.missing}</div>
                </div>
              ))
            }
          </>
        )}

        {tab === 'data' && (
          <>
            <div style={s.h2}>Данные недели {weekNum}</div>
            <div style={s.infoBox}>
              Скопируй данные ниже и вставь их в чат с Claude — он сделает анализ и напишет конкретные задания для Ады и помощников.
            </div>
            {measurements.length === 0
              ? <div style={{color:'#aaa', fontSize:14}}>Данных пока нет.</div>
              : <>
                  <div style={s.copyBox}>{buildCopyText()}</div>
                  <button style={s.btnCopy} onClick={copyData}>{copied ? '✓ Скопировано! Вставь в чат с Claude' : '📋 Скопировать данные'}</button>
                </>
            }
          </>
        )}

        {tab === 'helpers' && (
          <>
            <div style={s.h2}>Помощники</div>
            {helpers.length === 0
              ? <div style={{color:'#aaa', fontSize:14, marginBottom:16}}>Помощников пока нет. Зарегистрируй их через форму входа, потом в Supabase → profiles измени role на helper.</div>
              : helpers.map(h => <div key={h.id} style={s.helperCard}><div style={{fontWeight:500, fontSize:14}}>{h.name}</div></div>)
            }
            <div style={{...s.card, marginTop:16}}>
              <div style={{fontSize:15, fontWeight:500, marginBottom:12}}>Добавить задание помощнику</div>
              <select style={{width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:8, boxSizing:'border-box'}} value={newTask.userId} onChange={e=>setNewTask({...newTask, userId:e.target.value})}>
                <option value="">Выбрать помощника...</option>
                {helpers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input style={{width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:8, boxSizing:'border-box'}} placeholder="Название задания" value={newTask.title} onChange={e=>setNewTask({...newTask, title:e.target.value})} />
              <textarea style={s.textarea} placeholder="Описание задания..." value={newTask.body} onChange={e=>setNewTask({...newTask, body:e.target.value})} />
              <button style={s.btnGreen} onClick={addTask} disabled={addingTask}>{addingTask ? 'Добавляю...' : 'Добавить задание'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}