import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

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
  const { signOut } = useAuth()
  const [tab, setTab] = useState('graph')
  const [weekNum, setWeekNum] = useState(1)
  const [maxWeek, setMaxWeek] = useState(4)
  const [measurements, setMeasurements] = useState([])
  const [diary, setDiary] = useState([])
  const [helpers, setHelpers] = useState([])
  const [helperTasks, setHelperTasks] = useState([])
  const [questions, setQuestions] = useState([])
  const [copied, setCopied] = useState(false)
  const [newTask, setNewTask] = useState({ title:'', body:'', userId:'' })
  const [editQ, setEditQ] = useState(null)
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { loadAll() }, [weekNum])

  // Close sidebar on tab select (mobile)
  function selectTab(id) {
    setTab(id)
    setSidebarOpen(false)
  }

  async function loadAll() {
    const { data: ada } = await supabase.from('profiles').select('id,created_at').eq('role','ada').single()
    if (!ada) return
    const start = new Date(ada.created_at)
    const now = new Date()
    const max = Math.max(1, Math.floor((now - start) / (7*24*60*60*1000)) + 1)
    setMaxWeek(max)
    const { data: m } = await supabase.from('measurements').select('*').eq('user_id',ada.id).eq('week_number',weekNum).order('day_number').order('created_at')
    setMeasurements(m || [])
    const { data: d } = await supabase.from('diary_entries').select('*').eq('user_id',ada.id).eq('week_number',weekNum).order('created_at',{ascending:false})
    setDiary(d || [])
    const { data: h } = await supabase.from('profiles').select('*').eq('role','helper')
    setHelpers(h || [])
    const { data: ht } = await supabase.from('tasks').select('*,profiles(name)').order('created_at',{ascending:false})
    setHelperTasks(ht || [])
    const { data: q } = await supabase.from('questions').select('*').order('time_of_day').order('question_index')
    setQuestions(q || [])
  }

  const chartData = measurements.map(m => ({
    name: `Д${m.day_number} ${m.time_of_day==='morning'?'утро':m.time_of_day==='day'?'день':'вечер'}`,
    X: m.x_score, Y: m.y_score,
  }))

  const avgX = measurements.length ? Math.round(measurements.reduce((s,m)=>s+m.x_score,0)/measurements.length*10)/10 : null
  const avgY = measurements.length ? Math.round(measurements.reduce((s,m)=>s+m.y_score,0)/measurements.length*10)/10 : null
  const quadrant = avgX!==null ? getQuadrant(avgX,avgY) : null

  function buildCopyText() {
    const pts = measurements.map(m=>`День ${m.day_number}, ${m.time_of_day==='morning'?'утро':m.time_of_day==='day'?'день':'вечер'}: X=${m.x_score}, Y=${m.y_score}`).join('\n')
    const diaryText = diary.map(d=>`День ${d.day_number}:\n  Чувствует: ${d.feeling}\n  Не хватает: ${d.missing}`).join('\n')
    return `=== ДАННЫЕ АДЫ — НЕДЕЛЯ ${weekNum} ===\n\nЗАМЕРЫ (${measurements.length}/21):\n${pts||'Нет данных'}\n\nДНЕВНИК:\n${diaryText||'Нет записей'}\n\nСредние: X=${avgX??'—'}, Y=${avgY??'—'}\nКвадрант: ${quadrant?QUADRANT_TEXT[quadrant].label:'—'}`
  }

  function copyData() {
    navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(()=>setCopied(false),2500)
  }

  async function addTask() {
    if (!newTask.title||!newTask.body||!newTask.userId) return
    await supabase.from('tasks').insert({ target_user_id:newTask.userId, title:newTask.title, body:newTask.body, time_of_day:'weekly', week_number:weekNum })
    setNewTask({title:'',body:'',userId:''})
    loadAll()
  }

  async function saveQuestion(q) {
    await supabase.from('questions').update({ text:q.text, left_label:q.left_label, right_label:q.right_label }).eq('id',q.id)
    setEditQ(null)
    loadAll()
  }

  const weekBtns = Array.from({length:maxWeek},(_,i)=>i+1)
  const timeLabel = t => t==='morning'?'Утро':t==='day'?'День':'Вечер'

  const navItems = [
    {id:'graph',label:'📈 График'},
    {id:'history',label:'📋 История ответов'},
    {id:'diary',label:'📖 Дневник'},
    {id:'data',label:'🗂 Данные недели'},
    {id:'helpers',label:'👥 Помощники'},
    {id:'questions',label:'❓ Вопросы'},
  ]

  const sidebarContent = (
    <>
      <div style={{fontSize:20,fontWeight:700,color:'#7F77DD',letterSpacing:'-0.5px',marginBottom:2}}>MM</div>
      <div style={{fontSize:12,color:'#aaa',marginBottom:20}}>Панель администратора</div>
      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:10}}>
        <button style={wBtn} onClick={()=>setWeekNum(w=>Math.max(1,w-1))}>←</button>
        <span style={{fontSize:13,color:'#555'}}>Нед. {weekNum}</span>
        <button style={wBtn} onClick={()=>setWeekNum(w=>Math.min(maxWeek,w+1))}>→</button>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:16}}>
        {weekBtns.map(w=>(
          <button key={w} style={w===weekNum?wBtnActive:wBtn} onClick={()=>setWeekNum(w)}>{w}</button>
        ))}
      </div>
      {navItems.map(item=>(
        <div key={item.id}
          style={tab===item.id?navActive:navItem}
          onClick={()=>selectTab(item.id)}>
          {item.label}
        </div>
      ))}
      <div style={{marginTop:'auto'}}>
        <button style={signOutBtn} onClick={signOut}>Выйти</button>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; padding: 1rem !important; }
          .admin-topbar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-sidebar { display: flex !important; }
          .admin-topbar { display: none !important; }
          .sidebar-overlay { display: none !important; }
          .sidebar-drawer { display: none !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <div className="admin-sidebar" style={{...sidebarStyle, display:'flex', flexDirection:'column'}}>
        {sidebarContent}
      </div>

      {/* Mobile topbar */}
      <div className="admin-topbar" style={{display:'none', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#fff', borderBottom:'1px solid #eee', position:'sticky', top:0, zIndex:10}}>
        <img src="/logo.png" alt="MM" style={{width:40, height:40, objectFit:'contain', marginBottom:4}} />
        <button onClick={()=>setSidebarOpen(true)} style={{padding:'6px 10px', border:'1px solid #ddd', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:18}}>☰</button>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100}} />
      )}

      {/* Mobile drawer */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, width:260,
        background:'#fff', zIndex:101, padding:'1.5rem 1rem',
        display:'flex', flexDirection:'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        overflowY:'auto'
      }}>
        <button onClick={()=>setSidebarOpen(false)} style={{alignSelf:'flex-end', border:'none', background:'transparent', fontSize:20, cursor:'pointer', color:'#aaa', marginBottom:8}}>✕</button>
        {sidebarContent}
      </div>

      {/* Main content */}
      <div className="admin-main" style={{marginLeft:220, padding:'1.5rem', minHeight:'100vh', background:'#f0eff8', fontFamily:'sans-serif'}}>

        {tab==='graph' && <>
          <div style={h2}>График — неделя {weekNum}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16}}>
            <div style={metricCard}><div style={metricLabel}>Ср. настроение X</div><div style={{...metricVal,color:avgX>=0?'#1D9E75':'#D85A30'}}>{avgX??'—'}</div></div>
            <div style={metricCard}><div style={metricLabel}>Ср. мотивация Y</div><div style={{...metricVal,color:avgY>=0?'#1D9E75':'#D85A30'}}>{avgY??'—'}</div></div>
            <div style={metricCard}><div style={metricLabel}>Точек</div><div style={metricVal}>{measurements.length}/21</div></div>
            {quadrant&&<div style={{...metricCard,background:QUADRANT_TEXT[quadrant].bg}}><div style={metricLabel}>Квадрант</div><div style={{...metricVal,fontSize:16,color:QUADRANT_TEXT[quadrant].color}}>{QUADRANT_TEXT[quadrant].label}</div></div>}
          </div>
          <div style={card}>
            {chartData.length>0
              ? <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="name" tick={{fontSize:10}}/>
                    <YAxis domain={[-10,10]} tick={{fontSize:10}}/>
                    <Tooltip/><Legend/>
                    <ReferenceLine y={0} stroke="#ddd"/>
                    <Line type="monotone" dataKey="X" stroke="#7F77DD" strokeWidth={2} dot={{r:3}} name="X настроение"/>
                    <Line type="monotone" dataKey="Y" stroke="#1D9E75" strokeWidth={2} dot={{r:3}} name="Y мотивация"/>
                  </LineChart>
                </ResponsiveContainer>
              : <div style={{textAlign:'center',color:'#aaa',padding:'2rem',fontSize:14}}>Данных пока нет.</div>
            }
          </div>
        </>}

        {tab==='history' && <>
          <div style={h2}>История ответов — неделя {weekNum}</div>
          {measurements.length===0
            ? <div style={{color:'#aaa',fontSize:14}}>Нет данных.</div>
            : measurements.map(m=>(
              <div key={m.id} style={card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{fontWeight:500,fontSize:14}}>День {m.day_number} — {timeLabel(m.time_of_day)}</div>
                  <div style={{fontSize:13,color:'#888'}}>X={m.x_score} Y={m.y_score}</div>
                </div>
                {m.answers && Array.isArray(m.answers) && <>
                  <button style={{...btn,fontSize:12,padding:'5px 10px',marginBottom:8}} onClick={()=>setSelectedMeasurement(selectedMeasurement?.id===m.id?null:m)}>
                    {selectedMeasurement?.id===m.id?'Скрыть':'Показать ответы'}
                  </button>
                  {selectedMeasurement?.id===m.id && m.answers.map((a,i)=>(
                    <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #f5f5f5'}}>
                      <div style={{fontSize:13,color:'#555',marginBottom:3}}>{a.question}</div>
                      <div style={{fontSize:15,fontWeight:500,color:'#3C3489'}}>{a.answer} <span style={{fontSize:11,color:'#aaa'}}>({a.axis==='x'?'настроение':'мотивация'})</span></div>
                    </div>
                  ))}
                </>}
              </div>
            ))
          }
        </>}

        {tab==='diary' && <>
          <div style={h2}>Дневник Ады — неделя {weekNum}</div>
          {diary.length===0
            ? <div style={{color:'#aaa',fontSize:14}}>Записей пока нет.</div>
            : diary.map(d=>(
              <div key={d.id} style={card}>
                <div style={{fontSize:12,color:'#aaa',marginBottom:6}}>День {d.day_number}</div>
                <div style={{fontSize:13,color:'#888',marginBottom:3}}>Чувствует:</div>
                <div style={{fontSize:14,color:'#333',lineHeight:1.6,marginBottom:8}}>{d.feeling}</div>
                <div style={{fontSize:13,color:'#888',marginBottom:3}}>Не хватает:</div>
                <div style={{fontSize:14,color:'#333',lineHeight:1.6}}>{d.missing}</div>
              </div>
            ))
          }
        </>}

        {tab==='data' && <>
          <div style={h2}>Данные недели {weekNum}</div>
          <div style={{background:'#EEEDFE',borderRadius:12,padding:'1rem',fontSize:14,color:'#3C3489',lineHeight:1.7,marginBottom:16}}>
            Скопируй данные и вставь в чат с Claude — он сделает анализ и напишет задания.
          </div>
          {measurements.length===0
            ? <div style={{color:'#aaa',fontSize:14}}>Данных пока нет.</div>
            : <>
                <div style={{background:'#f8f7ff',borderRadius:12,padding:'1rem',fontSize:12,lineHeight:1.8,color:'#333',whiteSpace:'pre-wrap',fontFamily:'monospace',marginBottom:12}}>{buildCopyText()}</div>
                <button style={btnCopy} onClick={copyData}>{copied?'✓ Скопировано!':'📋 Скопировать данные'}</button>
              </>
          }
        </>}

        {tab==='helpers' && <>
          <div style={h2}>Помощники</div>
          <div style={card}>
            <div style={{fontSize:15,fontWeight:500,marginBottom:12}}>Задания</div>
            {helperTasks.length===0
              ? <div style={{color:'#aaa',fontSize:14}}>Заданий пока нет.</div>
              : helperTasks.map(t=>(
                <div key={t.id} style={{borderBottom:'1px solid #f5f5f5',paddingBottom:10,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:6}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                      <div style={{fontSize:12,color:'#888',marginTop:2}}>{t.profiles?.name} · Нед.{t.week_number}</div>
                    </div>
                    <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,...(t.is_done?{background:'#E1F5EE',color:'#085041'}:{background:'#FFF3CD',color:'#856404'})}}>{t.is_done?'✓ Сделано':'В процессе'}</span>
                  </div>
                  <div style={{fontSize:13,color:'#555',marginTop:4,lineHeight:1.5}}>{t.body}</div>
                  {t.completed_at&&<div style={{fontSize:11,color:'#aaa',marginTop:3}}>Выполнено: {new Date(t.completed_at).toLocaleDateString('ru')}</div>}
                </div>
              ))
            }
          </div>
          <div style={card}>
            <div style={{fontSize:15,fontWeight:500,marginBottom:12}}>Добавить задание</div>
            <select style={inputStyle} value={newTask.userId} onChange={e=>setNewTask({...newTask,userId:e.target.value})}>
              <option value="">Выбрать помощника...</option>
              {helpers.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <input style={inputStyle} placeholder="Название задания" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}/>
            <textarea style={{...inputStyle,minHeight:70,resize:'vertical',fontFamily:'sans-serif'}} placeholder="Описание..." value={newTask.body} onChange={e=>setNewTask({...newTask,body:e.target.value})}/>
            <button style={btnGreen} onClick={addTask}>Добавить ✓</button>
          </div>
        </>}

        {tab==='questions' && <>
          <div style={h2}>Вопросы для Ады</div>
          {['morning','day','evening'].map(tod=>(
            <div key={tod} style={card}>
              <div style={{fontSize:15,fontWeight:500,marginBottom:12}}>{timeLabel(tod)}</div>
              {questions.filter(q=>q.time_of_day===tod).map(q=>(
                <div key={q.id} style={{borderBottom:'1px solid #f5f5f5',paddingBottom:12,marginBottom:12}}>
                  {editQ?.id===q.id
                    ? <>
                        <textarea style={{...inputStyle,minHeight:60,fontFamily:'sans-serif'}} value={editQ.text} onChange={e=>setEditQ({...editQ,text:e.target.value})}/>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                          <input style={inputStyle} value={editQ.left_label} onChange={e=>setEditQ({...editQ,left_label:e.target.value})} placeholder="Левый ярлык"/>
                          <input style={inputStyle} value={editQ.right_label} onChange={e=>setEditQ({...editQ,right_label:e.target.value})} placeholder="Правый ярлык"/>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button style={btnGreen} onClick={()=>saveQuestion(editQ)}>Сохранить</button>
                          <button style={btn} onClick={()=>setEditQ(null)}>Отмена</button>
                        </div>
                      </>
                    : <>
                        <div style={{fontSize:13,color:'#333',marginBottom:4}}>{q.text}</div>
                        <div style={{fontSize:11,color:'#aaa',marginBottom:6}}>{q.left_label} → {q.right_label} · ось {q.axis}</div>
                        <button style={{...btn,fontSize:12,padding:'4px 10px'}} onClick={()=>setEditQ(q)}>Редактировать</button>
                      </>
                  }
                </div>
              ))}
            </div>
          ))}
        </>}

      </div>
    </>
  )
}

// Styles
const sidebarStyle = { width:220, background:'#fff', borderRight:'1px solid #eee', position:'fixed', top:0, left:0, bottom:0, padding:'1.5rem 1rem', overflowY:'auto' }
const navItem = { padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:14, color:'#555', marginBottom:2 }
const navActive = { padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:14, color:'#3C3489', background:'#EEEDFE', marginBottom:2, fontWeight:500 }
const wBtn = { padding:'5px 10px', border:'1px solid #ddd', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12, color:'#555' }
const wBtnActive = { padding:'5px 10px', border:'1px solid #7F77DD', borderRadius:6, background:'#EEEDFE', cursor:'pointer', fontSize:12, color:'#3C3489', fontWeight:500 }
const signOutBtn = { width:'100%', padding:'9px', border:'1px solid #eee', borderRadius:8, background:'transparent', color:'#aaa', fontSize:13, cursor:'pointer', marginTop:16 }
const card = { background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:16, boxShadow:'0 1px 8px rgba(0,0,0,0.05)' }
const h2 = { fontSize:20, fontWeight:500, color:'#1a1a2e', marginBottom:16 }
const metricCard = { background:'#f8f7ff', borderRadius:12, padding:'1rem', textAlign:'center' }
const metricLabel = { fontSize:12, color:'#888', marginBottom:4 }
const metricVal = { fontSize:22, fontWeight:500, color:'#3C3489' }
const btn = { padding:'9px 18px', background:'#7F77DD', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:500 }
const btnGreen = { padding:'9px 18px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:500 }
const btnCopy = { padding:'9px 18px', background:'#f8f7ff', color:'#3C3489', border:'1px solid #AFA9EC', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:500 }
const inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:8, boxSizing:'border-box' }