import { useState, useEffect } from 'react'
import { supabase, getDayNumber, loadQuestions } from '../supabase'
import { useAuth } from '../AuthContext'

const TASKS = {
  morning: { icon: '🐾', title: 'Задание на утро', body: 'Лёжа в кровати, положи руку на собаку и просто почувствуй её дыхание. Не вставай сразу. Просто побудь с ней 3 минуты. Это точка отсчёта дня.' },
  day: { icon: '📝', title: 'Задание на день', body: 'Напиши в заметках телефона одну вещь, которую ты узнала сегодня — из видео, разговора, мысли. Любую. Это твой список знаний о мире.' },
  evening: { icon: '💜', title: 'Задание на вечер', body: 'Перед сном скажи собаке или себе вслух одно предложение: что ты сегодня существовала. Не оценивай день. Просто зафиксируй — ты была сегодня.' }
}

const s = {
  wrap: { minHeight:'100vh', background:'#f8f7ff', fontFamily:'sans-serif', padding:'1rem' },
  inner: { maxWidth:420, margin:'0 auto', paddingBottom:40 },
  header: { textAlign:'center', padding:'1.5rem 0 1rem' },
  logo: { fontSize:28, fontWeight:700, color:'#7F77DD', letterSpacing:'-1px', marginBottom:4 },
  sub: { fontSize:14, color:'#888', marginTop:4 },
  chips: { display:'flex', gap:8, justifyContent:'center', margin:'1rem 0', flexWrap:'wrap' },
  chip: { padding:'8px 18px', borderRadius:999, border:'1px solid #ddd', background:'transparent', cursor:'pointer', fontSize:13, color:'#666' },
  chipSel: { background:'#EEEDFE', color:'#3C3489', border:'1px solid #AFA9EC' },
  chipDone: { background:'#E1F5EE', color:'#085041', border:'1px solid #5DCAA5' },
  btn: { width:'100%', padding:'13px', background:'#7F77DD', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:500, cursor:'pointer', marginTop:8 },
  btnDisabled: { width:'100%', padding:'13px', background:'#eee', color:'#aaa', border:'none', borderRadius:12, fontSize:15, cursor:'default', marginTop:8 },
  card: { background:'#fff', borderRadius:16, padding:'1.25rem', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  prog: { height:3, background:'#eee', borderRadius:2, marginBottom:16 },
  progFill: { height:'100%', background:'#7F77DD', borderRadius:2, transition:'width 0.3s' },
  qNum: { fontSize:12, color:'#aaa', marginBottom:6 },
  qText: { fontSize:16, fontWeight:500, color:'#1a1a2e', lineHeight:1.6, marginBottom:20 },
  scaleVal: { textAlign:'center', fontSize:36, fontWeight:500, color:'#7F77DD', marginBottom:10 },
  scaleLabels: { display:'flex', justifyContent:'space-between', fontSize:11, color:'#aaa', marginTop:6 },
  range: { width:'100%', marginBottom:4 },
  navRow: { display:'flex', gap:8, marginTop:16 },
  navBtn: { flex:1, padding:'11px', border:'1px solid #ddd', borderRadius:10, background:'transparent', cursor:'pointer', fontSize:14, color:'#333' },
  navBtnPrimary: { flex:1, padding:'11px', border:'none', borderRadius:10, background:'#7F77DD', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:500 },
  taskIcon: { fontSize:36, textAlign:'center', marginBottom:12 },
  taskTitle: { fontSize:17, fontWeight:500, color:'#1a1a2e', textAlign:'center', marginBottom:10 },
  taskBody: { fontSize:14, color:'#555', lineHeight:1.7, textAlign:'center', marginBottom:20 },
  taskBtn: { width:'100%', padding:'13px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:500, cursor:'pointer' },
  diaryLabel: { fontSize:13, color:'#555', marginBottom:6, display:'block' },
  textarea: { width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, minHeight:80, resize:'vertical', marginBottom:12, boxSizing:'border-box', fontFamily:'sans-serif' },
  doneBox: { textAlign:'center', padding:'2rem 0' },
  doneIcon: { fontSize:40, marginBottom:12 },
  doneTitle: { fontSize:20, fontWeight:500, color:'#1a1a2e', marginBottom:8 },
  doneSub: { fontSize:14, color:'#888', lineHeight:1.6 },
  loading: { textAlign:'center', padding:'3rem 0', color:'#aaa', fontSize:14 }
}

export default function AdaApp() {
  const { profile, signOut } = useAuth()
  const [screen, setScreen] = useState('home')
  const [curTime, setCurTime] = useState(null)
  const [curQ, setCurQ] = useState(0)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [completed, setCompleted] = useState({})
  const [feeling, setFeeling] = useState('')
  const [missing, setMissing] = useState('')
  const [weekNum, setWeekNum] = useState(1)
  const [loadingQ, setLoadingQ] = useState(false)

  useEffect(() => {
    // Неделя считается от даты создания профиля
    if (profile?.created_at) {
      const start = new Date(profile.created_at)
      const now = new Date()
      const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000))
      setWeekNum(Math.max(1, diff + 1))
    }
  }, [profile])

  async function selectTime(t) {
    setCurTime(t)
    setLoadingQ(true)
    const qs = await loadQuestions(t)
    setQuestions(qs)
    setAnswers(new Array(qs.length).fill(0))
    setLoadingQ(false)
  }

  async function startSurvey() {
    setCurQ(0)
    setScreen('survey')
  }

  function nextQ() {
    if (curQ < questions.length - 1) setCurQ(curQ + 1)
    else setScreen('task')
  }

  function prevQ() {
    if (curQ > 0) setCurQ(curQ - 1)
    else setScreen('home')
  }

  function updateAnswer(val) {
    const a = [...answers]
    a[curQ] = parseInt(val)
    setAnswers(a)
  }

  async function finishTask() {
    const xVals = answers.filter((_, i) => questions[i]?.axis === 'x')
    const yVals = answers.filter((_, i) => questions[i]?.axis === 'y')
    const x = xVals.length ? Math.round(xVals.reduce((a,b)=>a+b,0)/xVals.length*10)/10 : 0
    const y = yVals.length ? Math.round(yVals.reduce((a,b)=>a+b,0)/yVals.length*10)/10 : 0

    // Сохраняем детальные ответы с вопросами
    const detailedAnswers = questions.map((q, i) => ({
      question: q.text,
      answer: answers[i],
      axis: q.axis
    }))

    await supabase.from('measurements').insert({
      user_id: profile.id,
      time_of_day: curTime,
      x_score: x,
      y_score: y,
      answers: detailedAnswers,
      week_number: weekNum,
      day_number: getDayNumber()
    })

    setCompleted({ ...completed, [curTime]: true })
    if (curTime === 'evening') setScreen('diary')
    else setScreen('home')
  }

  async function saveDiary() {
    await supabase.from('diary_entries').insert({
      user_id: profile.id,
      feeling,
      missing,
      week_number: weekNum,
      day_number: getDayNumber()
    })
    setScreen('done')
  }

  const currentQ = questions[curQ]

  if (screen === 'done') return (
    <div style={s.wrap}><div style={s.inner}>
      <div style={s.doneBox}>
        <div style={s.doneIcon}>✨</div>
        <div style={s.doneTitle}>Готово, {profile?.name}</div>
        <div style={s.doneSub}>Ты сделала всё на сегодня.<br/>Это важно.</div>
        <button style={{...s.btn, marginTop:24}} onClick={()=>setScreen('home')}>На главную</button>
      </div>
    </div></div>
  )

  if (screen === 'diary') return (
    <div style={s.wrap}><div style={s.inner}>
      <div style={{...s.header}}>
        <div style={s.logo}>MM</div>
        <div style={s.sub}>Конец дня — два вопроса</div>
      </div>
      <div style={s.card}>
        <label style={s.diaryLabel}>Как ты себя чувствуешь прямо сейчас?</label>
        <textarea style={s.textarea} value={feeling} onChange={e=>setFeeling(e.target.value)} placeholder="Напиши как есть..." />
        <label style={s.diaryLabel}>Чего тебе сегодня не хватало?</label>
        <textarea style={s.textarea} value={missing} onChange={e=>setMissing(e.target.value)} placeholder="Можно одно слово или целый абзац..." />
        <button style={feeling && missing ? s.taskBtn : {...s.taskBtn, background:'#ccc'}}
          onClick={saveDiary} disabled={!feeling || !missing}>Сохранить</button>
      </div>
    </div></div>
  )

  if (screen === 'task') {
    const task = TASKS[curTime]
    return (
      <div style={s.wrap}><div style={s.inner}>
        <div style={s.card}>
          <div style={s.taskIcon}>{task.icon}</div>
          <div style={s.taskTitle}>{task.title}</div>
          <div style={s.taskBody}>{task.body}</div>
          <button style={s.taskBtn} onClick={finishTask}>Сделала ✓</button>
        </div>
      </div></div>
    )
  }

  if (screen === 'survey') return (
    <div style={s.wrap}><div style={s.inner}>
      {loadingQ || !currentQ
        ? <div style={s.loading}>Загрузка...</div>
        : <div style={s.card}>
            <div style={s.prog}>
              <div style={{...s.progFill, width:((curQ+1)/questions.length*100)+'%'}} />
            </div>
            <div style={s.qNum}>Вопрос {curQ+1} из {questions.length}</div>
            <div style={s.qText}>{currentQ.text}</div>
            <div style={s.scaleVal}>{answers[curQ] ?? 0}</div>
            <input type="range" min="-10" max="10" step="1" value={answers[curQ] ?? 0}
              onChange={e=>updateAnswer(e.target.value)} style={s.range} />
            <div style={s.scaleLabels}>
              <span>{currentQ.left_label}</span>
              <span>{currentQ.right_label}</span>
            </div>
            <div style={s.navRow}>
              <button style={s.navBtn} onClick={prevQ}>← Назад</button>
              <button style={s.navBtnPrimary} onClick={nextQ}>
                {curQ === questions.length-1 ? 'Готово' : 'Далее →'}
              </button>
            </div>
          </div>
      }
    </div></div>
  )

  return (
    <div style={s.wrap}><div style={s.inner}>
      <div style={s.header}>
        <div style={s.logo}>MM</div>
        <div style={s.sub}>Три раза в день — пять вопросов.<br/>Это только для тебя.</div>
      </div>
      <div style={s.chips}>
        {['morning','day','evening'].map(t => {
          const labels = { morning:'☀️ Утро', day:'🌤 День', evening:'🌙 Вечер' }
          const style = completed[t] ? {...s.chip,...s.chipDone} : curTime===t ? {...s.chip,...s.chipSel} : s.chip
          return <button key={t} style={style} onClick={()=>selectTime(t)}>{labels[t]}</button>
        })}
      </div>
      {loadingQ && <div style={{textAlign:'center', color:'#aaa', fontSize:13, margin:'8px 0'}}>Загрузка вопросов...</div>}
      <button
        style={curTime && !completed[curTime] && !loadingQ ? s.btn : s.btnDisabled}
        disabled={!curTime || completed[curTime] || loadingQ}
        onClick={startSurvey}>
        {!curTime ? 'Выбери время дня' : completed[curTime] ? '✓ Уже отвечала' : 'Начать'}
      </button>
      <button style={{...s.btnDisabled, marginTop:8, background:'transparent', color:'#aaa', border:'1px solid #eee'}} onClick={signOut}>Выйти</button>
    </div></div>
  )
}
