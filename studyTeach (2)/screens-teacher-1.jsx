// screens-teacher.jsx — Teacher dashboard (dual mode), roster, academy, focus mode

// ─────────────────── Teacher dual-mode dashboard ───────────────────
function TeacherDash({ decor }) {
  const [mode, setMode] = React.useState('admin'); // 'admin' = my students, 'compete' = my competitions

  return (
    <div>
      <PageHeader
        eyebrow="Багшийн ажлын байр"
        title={mode === 'admin' ? 'Миний сурагчид' : 'Миний өрсөлдөөн'}
        sub={mode === 'admin'
          ? '11-А ангийн 32 сурагч · математикийн багш Б.Нарантуяа. Анги бүрийн явц, сул хичээл, бүртгэлийн төлвийг нэг дороос.'
          : 'Багш-нарын өрсөлдөөний шат, мэргэжил дээшлүүлэх олимпиад, эх хэлний болон арга зүйн уралдаанууд.'}
        decor={decor}
        actions={
          <div style={{ display:'flex', background:'var(--paper)', border:'2px solid var(--ink)', padding: 3, borderRadius: 2 }}>
            <button onClick={() => setMode('admin')} style={{
              padding:'8px 16px', fontSize: 12, fontWeight: 700, border: 'none',
              background: mode === 'admin' ? 'var(--ink)' : 'transparent',
              color: mode === 'admin' ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase',
              cursor:'pointer',
            }}>Удирдан зохион</button>
            <button onClick={() => setMode('compete')} style={{
              padding:'8px 16px', fontSize: 12, fontWeight: 700, border: 'none',
              background: mode === 'compete' ? 'var(--ink)' : 'transparent',
              color: mode === 'compete' ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase',
              cursor:'pointer',
            }}>Өрсөлдөгч</button>
          </div>
        }
      />
      {decor && <div style={{ padding: '0 36px' }}><UlziiBand height={16}/></div>}

      {mode === 'admin' ? <TeacherAdminMode/> : <TeacherCompeteMode/>}
    </div>
  );
}

function TeacherAdminMode() {
  return (
    <div style={{ padding: '24px 36px 48px' }}>
      {/* Stat row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { eyebrow:'Идэвхтэй сурагч', value:'32 / 34', sub:'2 өвчтэй чөлөөнд', tone:'good' },
          { eyebrow:'Дундаж ЭЕШ оноо',  value:'658',     sub:'+24 сүүлийн сард', tone:'lacquer' },
          { eyebrow:'Анхаарал шаардсан', value:'4',     sub:'хичээлийн дутагдалтай', tone:'warn' },
          { eyebrow:'Бүртгэл хүлээж буй',value:'7',     sub:'2 олимпиад · 1 цаг', tone:'sky' },
        ].map((s, i) => (
          <div key={i} className="st-card" style={{ padding: '14px 16px' }}>
            <div className="st-eyebrow">{s.eyebrow}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize: 32, fontWeight:600, marginTop: 4, color: s.tone === 'warn' ? 'var(--warn)' : 'var(--ink)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color:'var(--ink-2)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 24 }}>
        {/* Student matrix */}
        <section className="st-card paper" style={{ padding: 0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--ink-line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 className="st-h3">Сурагчийн матриц · 11-А</h3>
            <div className="row" style={{ gap: 8 }}>
              <button className="st-btn st-btn--ghost" style={{fontSize:11}}>Excel татах</button>
              <button className="st-btn" style={{fontSize:11}}>Шүүлтүүр</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse:'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background:'var(--felt-2)' }}>
                {['Сурагч','Чадвар','Мат','Физ','Англ','Олимпиад'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Сурагч' ? 'left' : 'center', padding: '10px 12px', fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing:'.1em', color:'var(--ink-3)', borderBottom:'1px solid var(--ink-line)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Б.Алтан-Учрал', 4, 712, 685, 720, 2, false],
                ['Г.Мөнхбаяр', 4, 696, 642, 728, 3, false],
                ['Д.Сарангэрэл', 5, 758, 740, 762, 4, true],
                ['Ж.Тэмүүлэн', 2, 542, 510, 580, 0, true],
                ['Л.Энхжаргал', 3, 642, 620, 660, 1, false],
                ['М.Билгүүн', 4, 708, 696, 690, 2, false],
                ['Н.Эрдэнэбулган', 1, 488, 460, 520, 0, true],
                ['О.Гэрэлмаа', 3, 624, 612, 648, 1, false],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--ink-line)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                    {row[6] && <span style={{ display:'inline-block', width: 6, height: 6, background: 'var(--lacquer)', borderRadius: '50%', marginRight: 8 }}/>}
                    {row[0]}
                  </td>
                  <td style={{ textAlign:'center', padding:'10px 12px' }}>
                    <span style={{ display:'inline-flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ width: 6, height: 10, background: n <= row[1] ? 'var(--lacquer)' : 'var(--felt-3)', borderRadius: 1 }}/>
                      ))}
                    </span>
                  </td>
                  <td className="numerics" style={{ textAlign:'center', padding:'10px 12px', color: row[2] >= 700 ? 'var(--good)' : row[2] < 550 ? 'var(--bad)' : 'var(--ink)' }}>{row[2]}</td>
                  <td className="numerics" style={{ textAlign:'center', padding:'10px 12px', color: row[3] >= 700 ? 'var(--good)' : row[3] < 550 ? 'var(--bad)' : 'var(--ink)' }}>{row[3]}</td>
                  <td className="numerics" style={{ textAlign:'center', padding:'10px 12px', color: row[4] >= 700 ? 'var(--good)' : row[4] < 550 ? 'var(--bad)' : 'var(--ink)' }}>{row[4]}</td>
                  <td style={{ textAlign:'center', padding:'10px 12px' }}>
                    {row[5] > 0 ? <span className="st-eyebrow" style={{color:'var(--lacquer)'}}>{row[5]} бүртг.</span> : <span style={{color:'var(--ink-3)'}}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'14px 20px', background:'var(--felt-2)', borderTop:'1px solid var(--ink-line)', display:'flex', justifyContent:'space-between', fontSize: 11, color:'var(--ink-2)' }}>
            <span>32 сурагч харуулж байна</span>
            <span style={{ fontFamily:'var(--font-mono)' }}>сүүлийн шинэчлэл · 6-р сар 3, 14:42</span>
          </div>
        </section>

        {/* Side column */}
        <div style={{ display:'grid', gap: 16 }}>
          {/* Weak concepts */}
          <section className="st-card" style={{ padding:'16px 18px' }}>
            <span className="st-eyebrow">Сул ойлголтууд · ангиараа</span>
            <h3 className="st-h3" style={{marginTop:6}}>Үүн дээр анхаар</h3>
            <div style={{ marginTop: 14, display:'grid', gap: 10 }}>
              {[
                ['Логарифмын хууль', 18, 'Математик'],
                ['Цахилгаан соронзон', 14, 'Физик'],
                ['Үг бүтэх ёс', 11, 'Эх хэл'],
              ].map((w, i) => (
                <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--ink-line)', borderRadius: 4 }}>
                  <div className="row" style={{ justifyContent:'space-between', fontSize: 13, fontWeight: 600 }}>
                    {w[0]}
                    <span className="numerics" style={{ color:'var(--bad)' }}>{w[1]}/32</span>
                  </div>
                  <div className="st-eyebrow" style={{ marginTop: 4 }}>{w[2]} · 2 хоног үлдсэн</div>
                </div>
              ))}
            </div>
            <button className="st-btn" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Засал хичээл бэлдэх</button>
          </section>

          {/* Quick action: focus mode */}
          <section style={{ border: '2px solid var(--lacquer-deep)', background: 'var(--lacquer-tint)', padding: '18px 20px' }}>
            <span className="st-eyebrow" style={{color:'var(--lacquer-deep)'}}>Хичээл түргэн</span>
            <h3 className="st-h3" style={{marginTop:4}}>Анхаарлын горим эхлүүлэх</h3>
            <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 6 }}>
              Сурагчдын утсыг даалгавар руу холбож, бусдыг хязгаарлана.
            </div>
            <button className="st-btn st-btn--primary" style={{marginTop:14, width:'100%', justifyContent:'center'}}>
              Анги ажиллуулах →
            </button>
          </section>

          {/* CPD progress */}
          <section className="st-card" style={{ padding:'16px 18px' }}>
            <span className="st-eyebrow">Багшийн академи</span>
            <div style={{ marginTop: 8, fontSize: 13 }}><strong>"Идэвхтэй сургалт"</strong> курс</div>
            <div style={{ marginTop: 10, height: 6, background:'var(--felt-3)', borderRadius: 3, overflow:'hidden' }}>
              <div style={{ width: '60%', height: '100%', background:'var(--lacquer)' }}/>
            </div>
            <div className="row" style={{ justifyContent:'space-between', marginTop: 6, fontSize: 11, color:'var(--ink-2)' }}>
              <span>6 / 10 хичээл</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>2.4 CPD кредит</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TeacherCompeteMode() {
  return (
    <div style={{ padding: '24px 36px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
      {[
        { title:'"Багшийн билиг"', subj:'Сургалтын арга зүйн чөлөөт уралдаан', when:'7 сар 8', spots:'48 багш', signed: true },
        { title:'"Эрдэнэт сурвалж"', subj:'Математик багш нарын мастер шат', when:'7 сар 14', spots:'120 багш', signed: false },
        { title:'"Уг сэдэв"', subj:'Сургалтын төлөвлөгөө боловсруулах уралдаан', when:'7 сар 22', spots:'30 баг', signed: false },
        { title:'English for Teachers · B1', subj:'6 сарын суурин сургалт', when:'Эхэлж байна', spots:'rolling', signed: false },
      ].map((o, i) => (
        <article key={i} className="st-card paper" style={{ padding:'18px 20px' }}>
          <span className="st-eyebrow" style={{color:'var(--brass-deep)'}}>{o.subj}</span>
          <div style={{ fontFamily:'var(--font-display)', fontSize: 20, fontWeight:600, marginTop: 4 }}>{o.title}</div>
          <div className="row" style={{ marginTop: 10, gap: 16, fontSize: 12, color:'var(--ink-2)' }}>
            <span>📅 {o.when}</span>
            <span>· {o.spots}</span>
          </div>
          <button className={'st-btn ' + (o.signed ? 'st-btn--brass' : 'st-btn--primary')} style={{ marginTop:14 }}>
            {o.signed ? '✓ Бүртгэгдсэн' : 'Бүртгүүлэх'}
          </button>
        </article>
      ))}
    </div>
  );
}

// ─────────────────── Bulk Roster Upload ───────────────────
function TeacherRoster({ decor }) {
  const [stage, setStage] = React.useState('preview'); // 'drop' | 'preview' | 'done'

  return (
    <div>
      <PageHeader
        eyebrow="Сурагч бүлэгээр оруулах"
        title="Анги бүрийн жагсаалт"
        sub="Excel эсвэл CSV файлыг чирж тавиад баталгаажуулна. Регистрийн чек цифр шалгаж, давтагдсан мөрийг сэрэмжлүүлнэ."
        decor={decor}
      />

      <div style={{ padding: '24px 36px 48px', display:'grid', gridTemplateColumns:'1fr 320px', gap: 24 }}>
        <div>
          {/* Drop zone */}
          {stage === 'drop' && (
            <div style={{
              border: '2px dashed var(--ink-line)', background:'var(--felt-2)',
              padding: 60, textAlign:'center', borderRadius: 8,
            }} onClick={() => setStage('preview')}>
              <div style={{ fontFamily:'var(--font-display)', fontSize: 18, fontWeight:600 }}>Файл энд чирнэ үү</div>
              <div style={{ fontSize: 13, color:'var(--ink-2)', marginTop: 6 }}>.xlsx, .csv · 5MB хүртэл</div>
              <button className="st-btn st-btn--primary" style={{marginTop: 18}}>Файл сонгох</button>
            </div>
          )}

          {/* Preview */}
          {stage === 'preview' && (
            <div className="st-card paper" style={{ overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--ink-line)', background:'var(--felt-2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ width: 24, height: 28, background:'var(--paper)', border:'1px solid var(--ink-line)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize: 9, fontWeight: 700 }}>XLS</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>11A_сурагчид_2026.xlsx</div>
                    <div className="st-eyebrow">34 мөр · 6 багана</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--good)' }}>✓ 31 баталгаажсан</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--warn)' }}>⚠ 2 анхааруулга</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--bad)' }}>✕ 1 алдаа</span>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--felt-2)' }}>
                    {['#','Овог Нэр','Регистр','Анги','Олимпиад','Төлөв'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 12px', fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing:'.1em', color:'var(--ink-3)', borderBottom:'1px solid var(--ink-line)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [1, 'Б.Алтан-Учрал', 'УБ12345678', '11А', 'Мат, Физ', 'ok'],
                    [2, 'Г.Мөнхбаяр',    'УБ23456789', '11А', 'Мат, Физ, Англ', 'ok'],
                    [3, 'Д.Сарангэрэл',  'УБ34567890', '11А', 'Мат, Англ', 'ok'],
                    [4, 'Ж.Тэмүүлэн',    'УБ4567890',  '11А', 'Эх хэл', 'err'],
                    [5, 'Л.Энхжаргал',   'УБ56789012', '11А', '', 'warn'],
                    [6, 'М.Билгүүн',     'УБ67890123', '11А', 'Мат, Биол', 'ok'],
                    [7, 'Н.Эрдэнэбулган','УБ78901234', '11А', 'Эх хэл, Түүх', 'warn'],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ink-line)',
                      background: row[5] === 'err' ? 'rgba(180,50,40,0.04)' : row[5] === 'warn' ? 'rgba(220,150,60,0.04)' : 'transparent' }}>
                      <td style={{ padding:'10px 12px', color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontSize: 11 }}>{row[0]}</td>
                      <td style={{ padding:'10px 12px', fontWeight: 500 }}>{row[1]}</td>
                      <td style={{ padding:'10px 12px', fontFamily:'var(--font-mono)' }}>
                        {row[2]}
                        {row[5] === 'err' && <span style={{ color: 'var(--bad)', marginLeft: 8 }}>✕ цифр буруу</span>}
                      </td>
                      <td style={{ padding:'10px 12px' }}>{row[3]}</td>
                      <td style={{ padding:'10px 12px', color: row[4] ? 'var(--ink-2)' : 'var(--ink-3)' }}>
                        {row[4] || <em>сонгоогүй</em>}
                        {row[5] === 'warn' && row[4] === '' && <span style={{ color: 'var(--warn)', marginLeft: 8, fontSize:11 }}>⚠ дутуу</span>}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        {row[5] === 'ok' && <span style={{color:'var(--good)'}}>✓</span>}
                        {row[5] === 'warn' && <span style={{color:'var(--warn)'}}>анхаарал</span>}
                        {row[5] === 'err' && <span style={{color:'var(--bad)'}}>засах</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding:'14px 18px', background:'var(--felt-2)', borderTop:'1px solid var(--ink-line)', display:'flex', justifyContent:'flex-end', gap: 10 }}>
                <button className="st-btn">Цуцлах</button>
                <button className="st-btn st-btn--primary" disabled={false}>Баталгаажуулах · 31 сурагч</button>
              </div>
            </div>
          )}
        </div>

        <aside className="col" style={{ gap: 16 }}>
          <div className="st-card" style={{ padding:'16px 18px' }}>
            <span className="st-eyebrow">Загвар</span>
            <h3 className="st-h3" style={{marginTop:4}}>Excel загвар</h3>
            <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 6 }}>
              Овог нэр · Регистрийн дугаар · Анги · Олимпиад
            </div>
            <button className="st-btn" style={{marginTop: 12, width:'100%', justifyContent:'center'}}>Загвар татах ↓</button>
          </div>
          <div className="st-card st-card--felt" style={{ padding:'16px 18px' }}>
            <span className="st-eyebrow">Аюулгүй байдал</span>
            <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 8, lineHeight: 1.6 }}>
              Регистрийн дугаар нь хэшээр хадгалагдана. Зөвхөн сургуулийн админ болон холбогдох багш харах боломжтой.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { TeacherDash, TeacherRoster });
