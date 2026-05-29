import { useState } from 'react'
import { useAuth } from '../AuthContext'

const s = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f7ff', fontFamily:'sans-serif' },
  card: { background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:380, boxShadow:'0 2px 16px rgba(0,0,0,0.08)' },
  title: { fontSize:22, fontWeight:500, marginBottom:4, color:'#1a1a2e' },
  sub: { fontSize:14, color:'#888', marginBottom:24 },
  label: { fontSize:13, color:'#555', marginBottom:4, display:'block' },
  input: { width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:12, boxSizing:'border-box', outline:'none' },
  btn: { width:'100%', padding:'12px', background:'#7F77DD', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:500, cursor:'pointer', marginTop:4 },
  toggle: { textAlign:'center', marginTop:16, fontSize:13, color:'#888' },
  link: { color:'#7F77DD', cursor:'pointer', textDecoration:'underline' },
  err: { color:'#D85A30', fontSize:13, marginBottom:12 }
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(''); setLoading(true)
    let err
    if (isLogin) {
      err = await signIn(email, password)
    } else {
      err = await signUp(email, password, name)
    }
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.title}>{isLogin ? 'Войти' : 'Регистрация'}</div>
        <div style={s.sub}>{isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}</div>
        {error && <div style={s.err}>{error}</div>}
        {!isLogin && (
          <>
            <label style={s.label}>Имя</label>
            <input style={s.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ада" />
          </>
        )}
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" />
        <label style={s.label}>Пароль</label>
        <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <div style={s.toggle}>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <span style={s.link} onClick={()=>setIsLogin(!isLogin)}>
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </div>
      </div>
    </div>
  )
}
