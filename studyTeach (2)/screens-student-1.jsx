// screens-student.jsx — Student-facing screens

// ─────────────────────────── HOME ───────────────────────────
function StudentHome({ decor }) {
  return (
    <div>
      <PageHeader
        eyebrow="2025/26 оны хичээлийн жил · 11-р анги"
        title="Сайн уу, Мөнхбаяр"
        sub="Өнөөдрийн зорилт: математикийн 3 дасгал, англи хэлний унших дасгал нэг."
        actions={<>
          <button className="st-btn st-btn--ghost"><Icon name="ticket"/> Тасалбар</button>
          <button className="st-btn st-btn--primary"><Icon name="tutor" color="currentColor"/> Хичээл үргэлжлүүлэх</button>
        </>}
        decor={decor}
      />

      {decor && <div style={{ padding: '0 36px' }}><UlziiBand height={18}/></div>}

      <div style={{ padding: '24px 36px 48px', display:'grid', gridTemplateColumns:'2fr 1fr', gap: 24 }}>
        {/* Left column */}
        <div style={{ display:'grid', gap: 20 }}>
          {/* Today's plan */}
          <section className="st-card paper" style={{ padding: 0, overflow:'hidden' }}>
            <div style={{ padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--ink-line)' }}>
              <div className="col" style={{lineHeight:1.2}}>
                <span className="st-eyebrow">Өнөөдрийн төлөвлөгөө</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize: 20, fontWeight: 600 }}>4 даалгавар · 45 минут</span>
              </div>
              <div className="row" style={{ gap: 6, fontSize: 11, color:'var(--ink-2)' }}>
                <span style={{ fontFamily:'var(--font-mono)' }}>Лхагва · 6 сар 3</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)' }}>
              {[
                {tag:'ЭЕШ · Математик', title:'Логарифм — дасгал багц 4', sub:'15 мин · ИИ хөтөч санал болгов', done: true,  color:'var(--lacquer)'},
                {tag:'ИИ хөтөч',         title:'Тоосон, шингэн биеийн нягт', sub:'10 мин · ойлголтын засал',    done: false, color:'var(--sky)'},
                {tag:'Олимпиад · Физик',title:'2019 оны 11-р анги, 4-р бодлого', sub:'15 мин · хугацаатай',    done: false, color:'var(--brass-deep)'},
                {tag:'Уншлага',         title:'Эх хэл — "Хүн хүний хүүхэд"', sub:'5 мин · 2 хуудас',            done: false, color:'var(--ink-2)'},
              ].map((t, i) => (
                <div key={i} style={{
                  padding:'18px 22px',
                  borderRight: i % 2 === 0 ? '1px solid var(--ink-line)' : 'none',
                  borderBottom: i < 2 ? '1px solid var(--ink-line)' : 'none',
                  display:'flex', flexDirection:'column', gap: 6,
                  opacity: t.done ? 0.55 : 1,
                  position:'relative',
                }}>
                  {t.done && <div style={{ position:'absolute', top:18, right:18, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--good)', letterSpacing:'.1em', textTransform:'uppercase' }}>✓ дууссан</div>}
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display:'inline-block', boxShadow:'0 0 0 2px var(--paper), 0 0 0 3px '+t.color }}/>
                    <span className="st-eyebrow" style={{ color: t.color }}>{t.tag}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize: 17, fontWeight:600, marginTop: 4, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                  <div style={{ fontSize: 12, color:'var(--ink-2)' }}>{t.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Mastery map */}
          <section className="st-card" style={{ padding: '20px 22px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 14 }}>
              <div>
                <span className="st-eyebrow">Ойлголтын зураг · 8-р долоо хоног</span>
                <h3 className="st-h3" style={{marginTop:4}}>Чадварын явц</h3>
              </div>
              <button className="st-btn st-btn--ghost" style={{fontSize: 11}}>Бүгдийг харах →</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16 }}>
              {[
                { subj: 'Математик', topics: [
                  ['Логарифм', 4], ['Тригонометр', 5], ['Дараалал', 3], ['Бодолтын аргууд', 2],
                ]},
                { subj: 'Физик', topics: [
                  ['Кинематик', 5], ['Динамик', 4], ['Цахилгаан', 2], ['Оптик', 1],
                ]},
                { subj: 'Эх хэл', topics: [
                  ['Зөв бичих', 5], ['Үг зүй', 4], ['Найруулга', 3], ['Уран зохиол', 4],
                ]},
              ].map((c, i) => (
                <div key={i} style={{ border: '1px solid var(--ink-line)', padding: 14, borderRadius: 6 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize: 14, marginBottom: 10 }}>{c.subj}</div>
                  {c.topics.map((t, j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color:'var(--ink-2)' }}>{t[0]}</span>
                      <span style={{ display: 'inline-flex', gap: 2 }}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} style={{
                            width: 8, height: 12,
                            background: n <= t[1] ? 'var(--lacquer)' : 'var(--felt-3)',
                            borderRadius: 1,
                          }}/>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div style={{ display:'grid', gap: 20 }}>
          {/* Score band predictor card */}
          <section className="st-card" style={{ padding: '20px 22px', position:'relative', overflow:'hidden' }}>
            <span className="st-eyebrow">ЭЕШ урьдчилсан оноо · Математик</span>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop: 6 }}>
              <BrassDial value={732} min={400} max={800} label="Магадлалт оноо" size={200}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, color:'var(--ink-2)', marginTop: -10 }}>
              <span>±18 оноо</span>
              <span>дээд тус 4%</span>
            </div>
          </section>

          {/* Upcoming Olympiad */}
          <section className="st-card paper" style={{ padding: 0, overflow:'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom:'1px solid var(--ink-line)', display:'flex', justifyContent:'space-between' }}>
              <span className="st-eyebrow">Дараагийн олимпиад</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--lacquer)' }}>14 өдөр</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize: 16, fontWeight:600 }}>"Эрдмийн оч" Математикийн олимпиад</div>
              <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 4 }}>11-р анги · бүсчилсэн шат · онлайн боломжтой</div>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 12 }}>
                <span className="brass-dot"/>
                <span style={{ fontFamily:'var(--font-mono)', fontSize: 11 }}>2026 оны 6 сарын 17 · 09:00</span>
              </div>
              <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
                <button className="st-btn st-btn--primary" style={{flex:1, justifyContent:'center'}}>Бүртгүүлэх — ₮8,000</button>
                <button className="st-btn">Дасгал</button>
              </div>
            </div>
          </section>

          {/* Wellbeing nudge */}
          <section className="st-card st-card--felt" style={{ padding: '16px 20px' }}>
            <span className="st-eyebrow">Сэтгэлийн хэмжүүр</span>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-2)' }}>
              Дотуур байрны 7 хоногийн асуумжид хариулаагүй байна.
            </div>
            <button className="st-btn" style={{ marginTop: 12, width: '100%', justifyContent:'center' }}>5 минутын асуумж →</button>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── AI TUTOR ───────────────────────────
function StudentTutor({ decor }) {
  const [messages, setMessages] = React.useState([
    { from: 'ai', body: 'Сайн байна уу, Мөнхбаяр. Өнөөдөр юу дээр анхаарах вэ?', cite: '11-р анги · Математик · Алгебр-7.3' },
    { from: 'me', body: 'Логарифм өөрчилбөл log₂(8x) — log₂(2) яаж бодох вэ?' },
    { from: 'ai',
      body: 'Сайн асуулт. log₂(8x) − log₂(2) = log₂(8x/2) = log₂(4x). 4x-ийг 2² · x болгож хувиргавал = 2 + log₂(x). Алхам алхамаар:',
      cite: 'Сургалтын төлөвлөгөө · 11-р анги · Алгебр 7.3',
      steps: [
        'log_a M − log_a N = log_a(M/N)',
        '8x / 2 = 4x',
        '4 = 2² учир log₂(4x) = log₂(2²) + log₂(x) = 2 + log₂(x)',
      ],
    },
  ]);
  const [input, setInput] = React.useState('');

  return (
    <div style={{ display:'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <PageHeader
        eyebrow="ИИ Хичээлийн хөтөч · Математик"
        title="Логарифмын дасгал"
        sub="Эх сурвалж: Боловсрол шинжлэх ухааны яамны сургалтын төлөвлөгөө, 11-р анги. Энэ хичээл нь ЭЕШ-ийн өмнөх засалттай холбогдсон."
        decor={decor}
        actions={<>
          <button className="st-btn st-btn--ghost"><Icon name="egsh"/> ЭЕШ горим</button>
          <button className="st-btn">Цаасан дэвтэр</button>
        </>}
      />

      <div style={{ padding: '4px 36px 16px', overflowY: 'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Chat thread */}
          <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
              }}>
                {m.from === 'ai' && (
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--brass)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize: 12, fontWeight:600, border:'1px solid var(--brass-deep)' }}>Б</div>
                    <span className="st-eyebrow" style={{ fontSize: 9 }}>Багш Аи · хариулт</span>
                  </div>
                )}
                <div className="paper" style={{
                  padding: '14px 16px',
                  border: '1px solid var(--ink-line)',
                  borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: m.from === 'me' ? 'var(--lacquer)' : 'var(--paper)',
                  color: m.from === 'me' ? 'var(--paper)' : 'var(--ink)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}>
                  {m.body}
                  {m.steps && (
                    <ol style={{ margin: '12px 0 4px', paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)' }}>
                      {m.steps.map((s, j) => <li key={j} style={{ marginBottom: 4 }}>{s}</li>)}
                    </ol>
                  )}
                  {m.cite && (
                    <div style={{
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px dashed var(--ink-line)',
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      color: m.from === 'me' ? 'rgba(255,255,255,0.7)' : 'var(--ink-3)',
                    }}>↳ {m.cite}</div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ alignSelf:'flex-start', display:'flex', gap: 8 }}>
              <button className="st-btn st-btn--brass" style={{fontSize: 11}}>Дасгал өг</button>
              <button className="st-btn" style={{fontSize: 11}}>Илүү энгийн</button>
              <button className="st-btn" style={{fontSize: 11}}>Жишээ</button>
            </div>
          </div>

          {/* Right panel: session context */}
          <aside className="col" style={{ gap: 16 }}>
            <div className="st-card" style={{ padding: '14px 16px' }}>
              <span className="st-eyebrow">Энэ долоо хоногийн квот</span>
              <div className="row" style={{ marginTop: 6, gap: 4 }}>
                {Array.from({length: 20}).map((_, i) => (
                  <span key={i} style={{
                    width: 8, height: 16,
                    background: i < 7 ? 'var(--lacquer)' : 'var(--felt-3)',
                    borderRadius: 1,
                  }}/>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-2)' }}>
                <strong>7/20</strong> хичээл ашигласан · 13 үлдсэн
              </div>
              <div style={{ marginTop: 10, fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--ink-3)' }}>
                Сургуулийн код Б-1142 · үнэгүй
              </div>
            </div>

            <div className="st-card" style={{ padding: '14px 16px' }}>
              <span className="st-eyebrow">Засал зөвлөмж</span>
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--bad)', borderRadius:'50%' }}/>
                  Логарифмын хууль · 3-р шат
                </div>
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--warn)', borderRadius:'50%' }}/>
                  Илтгэгчтэй тэгшитгэл · 2-р шат
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--good)', borderRadius:'50%' }}/>
                  Тригонометр · бат
                </div>
              </div>
            </div>

            <div className="st-card st-card--felt" style={{ padding: '14px 16px' }}>
              <span className="st-eyebrow">Аюулгүй байдал</span>
              <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
                Багш Аи нь ЭЕШ-ийн идэвхтэй шалгалтын үед хариулт өгөхгүй. Сурагчид зориулсан зохион бичих ажлыг хийхгүй.
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid var(--ink-line)',
        background: 'var(--paper)',
        padding: '14px 36px',
        display: 'flex', alignItems:'center', gap: 12,
      }}>
        <div style={{
          flex: 1, display:'flex', alignItems:'center', gap: 8,
          background: 'var(--felt-2)', border: '1px solid var(--ink-line)',
          borderRadius: 6, padding: '10px 14px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Асуултаа Монгол хэлээр бичнэ үү…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14 }}
          />
          <span className="st-eyebrow">Кириллээр</span>
        </div>
        <button className="st-btn st-btn--primary" onClick={() => {
          if (!input.trim()) return;
          setMessages(m => [...m, { from:'me', body: input }]);
          setInput('');
        }}>Илгээх ↵</button>
      </div>
    </div>
  );
}

Object.assign(window, { StudentHome, StudentTutor });
