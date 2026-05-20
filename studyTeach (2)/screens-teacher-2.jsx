// screens-teacher-2.jsx — Teacher Academy course, Focus Mode (teacher + student)

// ─────────────────── Teacher Academy course ───────────────────
function TeacherAcademy({ decor }) {
  return (
    <div>
      <PageHeader
        eyebrow="Багшийн академи · Курс 04"
        title="Идэвхтэй сургалтын арга"
        sub="Б.Сарангэрэл багштай 10 микро-хичээл, 1 тестүүд. Бэлгэдлийн CPD кредит: 4.0 (БСШУЯ-тай хамтрагдсаны дараа баталгаажна)."
        decor={decor}
        actions={<>
          <button className="st-btn"><Icon name="academy"/> Курс жагсаалт</button>
          <button className="st-btn st-btn--primary">Үргэлжлүүлэх →</button>
        </>}
      />
      {decor && <div style={{ padding: '0 36px' }}><UulenBand height={14}/></div>}

      <div style={{ padding:'24px 36px 48px', display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 24 }}>
        {/* Left — current lesson */}
        <div>
          {/* Video / lesson player */}
          <div className="st-card" style={{ overflow: 'hidden', padding: 0 }}>
            <PhotoSlot w="100%" h={320} label="хичээлийн бичлэг — 18:42"/>
            <div style={{ padding: '18px 22px' }}>
              <div className="st-eyebrow" style={{color:'var(--lacquer)'}}>Хичээл 06 · 18 мин</div>
              <h2 className="st-h2" style={{ marginTop: 4 }}>Бүх сурагчийг хариулт өгөхөд оруулах 5 техник</h2>
              <div style={{ color:'var(--ink-2)', fontSize: 14, marginTop: 10, lineHeight: 1.7 }}>
                Энэ хичээлд бид олон сурагчдыг нэг зэрэг идэвхтэй болгох арга техникүүдийг үзнэ — "Бүгд бичих", "Хосоор солилцох", "Дугаарласан толгой", "Гар өргөлтгүй санамсаргүй сонголт", "Бүлгийн зөвшилцөл".
              </div>
              <div className="row" style={{ gap: 10, marginTop: 16 }}>
                <button className="st-btn st-btn--primary">▶ Үргэлжлүүлэх 6:48</button>
                <button className="st-btn">📝 Тэмдэглэлүүд</button>
                <button className="st-btn st-btn--ghost">↓ Офлайн татах</button>
              </div>
            </div>
          </div>

          {/* Embedded quiz preview */}
          <div className="st-card paper" style={{ marginTop: 18, padding: '20px 22px' }}>
            <span className="st-eyebrow">Хичээл доторх асуумж · асуулт 2 / 4</span>
            <h3 className="st-h3" style={{marginTop:6}}>Дугаарласан толгойг хэзээ ашиглах нь үр дүнтэй вэ?</h3>
            <div style={{ display:'grid', gap: 10, marginTop: 14 }}>
              {[
                ['А', 'Анги бүхэлдээ ижил түвшинтэй үед'],
                ['Б', 'Бүлгүүд хариуцлагатай байх ёстой үед', true],
                ['В', 'Зөвхөн математикийн хичээлд'],
                ['Г', 'Сурагчид яаралтай гарах хэрэгтэй үед'],
              ].map((c, i) => (
                <div key={i} style={{
                  padding:'10px 14px',
                  border:'1px solid ' + (c[2] ? 'var(--good)' : 'var(--ink-line)'),
                  background: c[2] ? 'rgba(80,150,90,0.06)' : 'var(--paper)',
                  borderRadius: 4,
                  fontSize: 13,
                  display:'flex', alignItems:'center', gap: 14,
                }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: c[2] ? 'var(--good)' : 'var(--felt-3)', color: c[2] ? 'var(--paper)' : 'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight: 700, fontSize: 12 }}>{c[0]}</span>
                  <span>{c[1]}</span>
                  {c[2] && <span className="spacer"/>}
                  {c[2] && <span style={{color:'var(--good)', fontFamily:'var(--font-mono)', fontSize:11}}>✓ зөв</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — course list */}
        <aside>
          {/* Progress card */}
          <div className="st-card" style={{ padding: '18px 20px' }}>
            <span className="st-eyebrow">Курсийн явц</span>
            <div className="row" style={{ marginTop: 8, justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 600 }}>6 / 10</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--ink-2)' }}>60%</span>
            </div>
            <div style={{ marginTop: 10, height: 8, background:'var(--felt-3)' }}>
              <div style={{ width: '60%', height: '100%', background:'linear-gradient(90deg, var(--lacquer), var(--lacquer-deep))' }}/>
            </div>
            <div className="row" style={{ marginTop: 12, gap: 14 }}>
              <div className="col" style={{lineHeight:1.2}}>
                <span className="st-eyebrow">Хүлээгдэж буй</span>
                <span style={{ fontWeight: 600 }}>2 цаг 14 мин</span>
              </div>
              <div className="col" style={{lineHeight:1.2}}>
                <span className="st-eyebrow">CPD</span>
                <span style={{ fontWeight: 600 }}>2.4 / 4.0</span>
              </div>
            </div>
          </div>

          {/* Lesson list */}
          <div className="st-card" style={{ marginTop: 16, padding: 0 }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--ink-line)' }}>
              <span className="st-eyebrow">Хичээлүүд</span>
            </div>
            <div>
              {[
                { n:1, title:'Идэвхтэй сургалтын суурь', dur:'15 мин', done:true },
                { n:2, title:'Сурах зорилго бичих',     dur:'18 мин', done:true },
                { n:3, title:'Анхаарлыг барих 7 техник', dur:'22 мин', done:true },
                { n:4, title:'Хосоор солилцох арга',    dur:'14 мин', done:true },
                { n:5, title:'Бүлгийн ажиллагаа',       dur:'20 мин', done:true },
                { n:6, title:'Бүх сурагчийг оруулах',   dur:'18 мин', done:false, active:true },
                { n:7, title:'Сэдвийг сайтар уях',      dur:'17 мин', done:false },
                { n:8, title:'Формат шалгалт',          dur:'20 мин', done:false },
                { n:9, title:'Засал ба үнэлгээ',        dur:'24 мин', done:false },
                { n:10,title:'Эцсийн шалгалт',          dur:'30 мин', done:false, exam:true },
              ].map((l) => (
                <div key={l.n} style={{
                  padding:'12px 18px',
                  borderBottom:'1px solid var(--ink-line)',
                  background: l.active ? 'var(--lacquer-tint)' : 'transparent',
                  borderLeft: l.active ? '3px solid var(--lacquer)' : '3px solid transparent',
                  display:'flex', alignItems:'center', gap: 12,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius:'50%',
                    background: l.done ? 'var(--good)' : l.exam ? 'var(--ink)' : 'var(--felt-3)',
                    color: l.done || l.exam ? 'var(--paper)' : 'var(--ink-2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  }}>{l.done ? '✓' : l.exam ? '★' : l.n}</span>
                  <div className="col" style={{ flex: 1, lineHeight: 1.2 }}>
                    <span style={{ fontSize: 13, fontWeight: l.active ? 600 : 500 }}>{l.title}</span>
                    <span className="st-eyebrow" style={{ marginTop: 2 }}>{l.dur}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cohort */}
          <div className="st-card st-card--felt" style={{ marginTop: 16, padding: '16px 18px' }}>
            <span className="st-eyebrow">Хамтран суралцаж буй багш нар</span>
            <div className="row" style={{ marginTop: 10 }}>
              {['Б','Н','Г','М','Д'].map((l, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: ['var(--lacquer)','var(--brass)','var(--sky)','var(--lacquer-deep)','var(--good)'][i],
                  color:'var(--paper)', marginLeft: i ? -8 : 0,
                  border:'2px solid var(--felt-2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-display)', fontWeight: 700, fontSize: 12,
                }}>{l}</div>
              ))}
              <span style={{ marginLeft: 14, fontSize: 12, color:'var(--ink-2)' }}>+ 18 өөр аймгаас</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────── Focus Mode (teacher start) ───────────────────
function TeacherFocus({ decor }) {
  const [stage, setStage] = React.useState('setup'); // 'setup' | 'running'
  const [duration, setDuration] = React.useState(35);
  const [activity, setActivity] = React.useState('quiz');

  return (
    <div>
      <PageHeader
        eyebrow="Анхаарлын горим · ангид зориулсан"
        title={stage === 'setup' ? 'Хичээлээ эхлүүлэх' : 'Анги ажиллаж байна'}
        sub={stage === 'setup'
          ? 'Сурагчдын утсыг тухайн нэг даалгавар руу холбож, бусдыг түгжинэ. Хичээл дуусахад эсвэл та зогсооход автоматаар сулрана.'
          : 'Хичээл явагдаж байна. Үргэлжлэх хугацааг дуусгахад утсууд хэвийн төлөвт буцна.'}
        decor={decor}
      />

      {stage === 'setup' && (
        <div style={{ padding:'24px 36px 48px', display:'grid', gridTemplateColumns:'1fr 360px', gap: 24 }}>
          {/* Setup */}
          <div className="st-card" style={{ padding: '24px 28px' }}>
            <span className="st-eyebrow">1. Үйл ажиллагаа сонгох</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
              {[
                ['quiz', 'Шуурхай тест', 'EGSh-ийн загвараар 12 асуулт'],
                ['tutor','ИИ хөтчтэй ажил', 'Тогтсон сэдвээр хичээл'],
                ['read','Уншлага',         'PDF дотор тэмдэглэх'],
              ].map(o => (
                <button key={o[0]} onClick={() => setActivity(o[0])} style={{
                  textAlign: 'left',
                  padding: 16,
                  background: activity === o[0] ? 'var(--lacquer-tint)' : 'var(--paper)',
                  border: '2px solid ' + (activity === o[0] ? 'var(--lacquer)' : 'var(--ink-line)'),
                  borderRadius: 4,
                  cursor: 'pointer',
                }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize: 15 }}>{o[1]}</div>
                  <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 4 }}>{o[2]}</div>
                </button>
              ))}
            </div>

            <div className="hr"/>

            <span className="st-eyebrow">2. Сэдэв</span>
            <div style={{ marginTop: 8, padding: '12px 16px', border:'1px solid var(--ink-line)', borderRadius: 4, background:'var(--felt-2)' }}>
              Математик · Логарифм — дасгал 4 (11-р анги)
            </div>

            <div className="hr"/>

            <span className="st-eyebrow">3. Хугацаа</span>
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              {[15, 25, 35, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding:'8px 16px',
                  background: duration === d ? 'var(--ink)' : 'var(--paper)',
                  color: duration === d ? 'var(--paper)' : 'var(--ink)',
                  border: '1px solid ' + (duration === d ? 'var(--ink)' : 'var(--ink-line)'),
                  fontFamily:'var(--font-mono)', fontSize: 13,
                  cursor: 'pointer',
                  borderRadius: 2,
                }}>{d} мин</button>
              ))}
            </div>

            <div className="hr"/>

            <span className="st-eyebrow">4. Сурагчид</span>
            <div className="row" style={{ marginTop: 10, gap: 14 }}>
              <div className="col" style={{lineHeight: 1.2}}>
                <span style={{ fontFamily:'var(--font-display)', fontSize: 28, fontWeight: 600 }}>11А</span>
                <span className="st-eyebrow">32 сурагч</span>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', border:'1px dashed var(--ink-line)', background:'var(--felt-2)' }}>
                <span className="st-eyebrow">Хичээлийн код</span>
                <div style={{ fontFamily:'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--lacquer)', letterSpacing: '0.2em' }}>BZ-4F2K</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color:'var(--ink-3)', marginTop: 8 }}>
              Энэ кодыг самбар дээр харуулна. Сурагчид нэвтрэхэд утас нь түгжих горимд орно.
            </div>

            <button onClick={() => setStage('running')}
              className="st-btn st-btn--primary"
              style={{ marginTop: 22, width: '100%', justifyContent:'center', fontSize: 15, padding: '14px' }}>
              🚪 Ангийг ажиллуулах
            </button>
          </div>

          {/* Side: phone preview */}
          <aside>
            <span className="st-eyebrow">Сурагчийн утсанд харагдах байдал</span>
            <div style={{ marginTop: 12 }}>
              <FocusStudentPhone state="locked" />
            </div>
          </aside>
        </div>
      )}

      {stage === 'running' && (
        <div style={{ padding:'24px 36px 48px' }}>
          <div className="st-card" style={{ padding: '28px 32px', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 32, alignItems:'center' }}>
            <div>
              <span className="st-eyebrow" style={{color:'var(--lacquer)'}}>Анги ажиллаж байна</span>
              <h2 className="st-h1" style={{ marginTop: 8 }}>Логарифмын дасгал 4</h2>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>
                11А · 32 сурагч · бүгд холбогдсон
              </div>
              <div style={{ marginTop: 28, fontFamily:'var(--font-display)', fontSize: 64, fontWeight: 600, color: 'var(--lacquer)' }}>
                21:43
              </div>
              <div className="st-eyebrow">үлдсэн хугацаа</div>

              <div className="row" style={{ gap: 10, marginTop: 24 }}>
                <button className="st-btn">+ 5 минут</button>
                <button onClick={() => setStage('setup')} className="st-btn" style={{ background: 'var(--bad)', color: 'var(--paper)', borderColor: 'var(--bad)' }}>Зогсоох</button>
              </div>
            </div>

            <div>
              <div className="st-eyebrow">Анги дотор</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap: 6, marginTop: 10 }}>
                {Array.from({length: 32}).map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: 1,
                    background: i === 17 || i === 22 ? 'var(--warn)' : 'var(--lacquer)',
                    borderRadius: 4,
                    border: '1px solid '+(i === 17 || i === 22 ? 'var(--warn)' : 'var(--lacquer-deep)'),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'var(--paper)', fontFamily:'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  }}>{i+1}</div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 14, gap: 18, fontSize: 11, color:'var(--ink-2)' }}>
                <span><span className="brass-dot" style={{background:'var(--lacquer)'}}/> идэвхтэй 30</span>
                <span><span className="brass-dot" style={{background:'var(--warn)'}}/> зогссон 2</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────── Focus Mode student phone (used here + on mobile screens page) ───────────────────
function FocusStudentPhone({ state = 'locked' }) {
  return (
    <div className="phone-shadow" style={{
      width: 280, margin: '0 auto', borderRadius: 36,
      padding: 10, background: 'var(--ink)', border: '1px solid #000',
    }}>
      <div style={{
        borderRadius: 28, background:'var(--lacquer)',
        height: 540, position:'relative', overflow:'hidden',
        color: 'var(--paper)',
      }}>
        {/* status bar */}
        <div style={{ padding: '14px 22px 6px', display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize:11 }}>
          <span>10:24</span>
          <span>◌ 3G · 78%</span>
        </div>
        {/* notch */}
        <div style={{ position:'absolute', top: 10, left: '50%', transform:'translateX(-50%)', width: 100, height: 22, background:'#000', borderRadius: 12 }}/>
        {/* Focus crest */}
        <div style={{ padding: '36px 22px 0', textAlign: 'center' }}>
          <ToonoMedallion size={68}/>
          <div className="st-eyebrow" style={{color:'rgba(255,255,255,0.7)', marginTop: 10}}>Анхаарлын горим</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 8 }}>Логарифм 4</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Б.Нарантуяа багштай · 11А</div>
          <div style={{ marginTop: 30, fontFamily:'var(--font-display)', fontSize: 56, fontWeight: 600, lineHeight: 1 }}>21:43</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>үлдсэн хугацаа</div>
          <div style={{ marginTop: 28, padding: 14, background:'rgba(0,0,0,0.2)', borderRadius: 10, textAlign:'left' }}>
            <div className="st-eyebrow" style={{color:'rgba(255,255,255,0.7)'}}>Одоо хийгдэж байна</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>Дасгал 4 · асуулт 3 / 12</div>
            <div style={{ marginTop: 10, height: 4, background:'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <div style={{ width: '25%', height: '100%', background:'var(--brass)', borderRadius: 2 }}/>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 11, opacity: 0.7 }}>
            🔒 Бусад апп хязгаарлагдсан байна
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TeacherAcademy, TeacherFocus, FocusStudentPhone });
