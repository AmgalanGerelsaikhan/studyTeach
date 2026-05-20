// screens-student-2.jsx — EGSh mock + score band, Olympiad directory

// ─────────────────── EGSh Prep ───────────────────
function StudentEGSh({ decor }) {
  return (
    <div>
      <PageHeader
        eyebrow="ЭЕШ — Элсэлтийн ерөнхий шалгалт · 2027"
        title="Бэлтгэлийн самбар"
        sub="2013 оноос хойших бүх жилийн шалгалт. Хугацаатай туршилт. Удирдамжтай засал. Үнэгүй."
        decor={decor}
        actions={<>
          <button className="st-btn"><Icon name="egsh"/> Архив</button>
          <button className="st-btn st-btn--primary">Шалгалт эхлүүлэх →</button>
        </>}
      />
      {decor && <div style={{ padding: '0 36px' }}><KheeBand height={14}/></div>}

      <div style={{ padding: '24px 36px 48px', display:'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Left: trajectory + subjects */}
        <div style={{ display:'grid', gap: 20 }}>
          {/* Trajectory chart */}
          <section className="st-card paper" style={{ padding: '22px 24px' }}>
            <div className="row" style={{ justifyContent:'space-between', marginBottom: 18 }}>
              <div>
                <span className="st-eyebrow">Туршилтын явц · 12 долоо хоног</span>
                <h3 className="st-h3" style={{marginTop:4}}>Оноо өсөж буй: +84 оноо</h3>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="st-btn st-btn--ghost" style={{fontSize:11}}>Математик</button>
                <button className="st-btn st-btn--ghost" style={{fontSize:11}}>Физик</button>
                <button className="st-btn st-btn--ghost" style={{fontSize:11}}>Эх хэл</button>
              </div>
            </div>
            <svg width="100%" height="200" viewBox="0 0 600 200" style={{display:'block'}}>
              {/* Grid */}
              {[40, 80, 120, 160].map(y => <line key={y} x1="40" y1={y} x2="600" y2={y} stroke="var(--ink-line)" strokeDasharray="2,4"/>)}
              {[40, 80, 120, 160].map((y, i) => <text key={'t'+y} x="32" y={y+3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{800 - i*100}</text>)}
              {/* Target zone */}
              <rect x="40" y="40" width="560" height="40" fill="var(--lacquer-tint)" opacity="0.5"/>
              <text x="56" y="56" fontSize="9" fontFamily="var(--font-mono)" fill="var(--lacquer-deep)" letterSpacing="0.1em">ЗОРИЛТ · 700+</text>
              {/* Trend line */}
              {(() => {
                const pts = [580, 555, 562, 540, 528, 510, 495, 488, 462, 450, 435, 416];
                const path = pts.map((p, i) => `${40 + i * 50} ${p / 4}`).join(' L ');
                return <>
                  <path d={`M ${path}`} stroke="var(--lacquer)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  {pts.map((p, i) => <circle key={i} cx={40 + i*50} cy={p/4} r="4" fill="var(--paper)" stroke="var(--lacquer)" strokeWidth="2"/>)}
                  {/* Latest */}
                  <circle cx={40 + 11*50} cy={416/4} r="7" fill="var(--lacquer)" stroke="var(--paper)" strokeWidth="2"/>
                </>;
              })()}
              {/* Cohort percentile band */}
              <path d="M 40 145 L 90 142 L 140 138 L 190 135 L 240 132 L 290 128 L 340 124 L 390 120 L 440 116 L 490 112 L 540 108 L 590 104"
                stroke="var(--sky)" strokeWidth="1.5" fill="none" strokeDasharray="4,3" opacity="0.7"/>
              <text x="566" y="100" fontSize="9" fontFamily="var(--font-mono)" fill="var(--sky)">бүлгийн дундаж</text>
            </svg>
            <div className="row" style={{ marginTop: 8, gap: 24, fontSize: 11, color: 'var(--ink-2)' }}>
              <span>1 сар</span><span>2 сар</span><span>3 сар</span><span>4 сар</span><span>5 сар</span><span style={{color:'var(--ink)', fontWeight:600}}>Одоо · 6 сар</span>
            </div>
          </section>

          {/* Subject grid */}
          <section>
            <div className="row" style={{ marginBottom: 14, justifyContent:'space-between' }}>
              <h3 className="st-h3">Хичээлүүд</h3>
              <span className="st-eyebrow">10 хичээл · 7 нь бүртгэлтэй</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12 }}>
              {[
                { name:'Монгол хэл',       must:true,  score: 712, papers: 14, color:'var(--lacquer)' },
                { name:'Математик',        must:false, score: 696, papers: 28, color:'var(--lacquer)' },
                { name:'Физик',            must:false, score: 642, papers: 17, color:'var(--brass-deep)' },
                { name:'Англи хэл',        must:false, score: 728, papers: 11, color:'var(--sky)' },
                { name:'Хими',             must:false, score: 0,   papers: 22, color:'var(--ink-3)', locked:true },
                { name:'Нийгмийн ухаан',   must:false, score: 0,   papers: 9,  color:'var(--ink-3)', locked:true },
              ].map((s, i) => (
                <div key={i} className="st-card" style={{ padding: 16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                      {s.must && <span style={{ background:'var(--lacquer)', color:'var(--paper)', fontFamily:'var(--font-mono)', fontSize: 9, padding: '1px 6px', letterSpacing:'.1em', textTransform:'uppercase' }}>заавал</span>}
                    </div>
                    <div className="st-eyebrow" style={{ color:'var(--ink-3)' }}>{s.papers} архивын материал</div>
                  </div>
                  {s.locked ? (
                    <button className="st-btn" style={{ fontSize: 11 }}>+ Нэмэх</button>
                  ) : (
                    <div className="col" style={{ alignItems:'flex-end' }}>
                      <span className="numerics" style={{ fontSize: 24, color: s.color }}>{s.score}</span>
                      <span className="st-eyebrow">сүүлийн оноо</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: live band + cohort + next */}
        <div style={{ display:'grid', gap: 20 }}>
          {/* Big band predictor */}
          <section className="st-card" style={{ padding: '24px', overflow:'hidden', position:'relative' }}>
            <div className="row" style={{ justifyContent:'space-between' }}>
              <div>
                <span className="st-eyebrow">Магадлалт оноогийн зурвас</span>
                <h3 className="st-h2" style={{marginTop:4}}>716 <span style={{fontSize:18,color:'var(--ink-3)',fontWeight:400}}>± 24</span></h3>
                <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 4 }}>Математикийн нэгдсэн магадлал · долоо хоног бүр шинэчлэгдэнэ</div>
              </div>
              <BrassDial value={716} min={400} max={800} label="" size={130}/>
            </div>
            {/* Distribution */}
            <div style={{ marginTop: 22 }}>
              <svg width="100%" height="80" viewBox="0 0 360 80">
                {(() => {
                  const bars = [];
                  for (let x = 0; x < 360; x += 4) {
                    const center = 250;
                    const sigma = 50;
                    const y = Math.exp(-Math.pow((x - center)/sigma, 2)) * 70;
                    const inBand = Math.abs(x - center) < 24;
                    bars.push(<rect key={x} x={x} y={75 - y} width="3" height={y}
                      fill={inBand ? 'var(--lacquer)' : 'var(--felt-3)'}/>);
                  }
                  return bars;
                })()}
                {/* axis */}
                <line x1="0" y1="76" x2="360" y2="76" stroke="var(--ink-line)"/>
                {[400, 500, 600, 700, 800].map((v, i) => (
                  <text key={v} x={i * 90} y="78" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-3)" textAnchor="middle" dominantBaseline="hanging">{v}</text>
                ))}
              </svg>
            </div>
            <div className="row" style={{ marginTop: 14, gap: 8, fontSize: 11, color:'var(--ink-2)' }}>
              <span className="brass-dot"/>
              <span>Тус бүлэгт <strong>дээд 12%</strong>-д багтаж байна</span>
            </div>
          </section>

          {/* Cohort comparison */}
          <section className="st-card paper" style={{ padding: '18px 20px' }}>
            <span className="st-eyebrow">Бүлгийн харьцуулалт · нэргүй</span>
            <h3 className="st-h3" style={{marginTop:4}}>Та хаана байна вэ?</h3>
            <div style={{ marginTop: 16, display:'grid', gap: 12 }}>
              {[
                {label:'Манай ангид',  me:78, n:32},
                {label:'УБ хотод',      me:62, n:18420},
                {label:'Улсын дунд',   me:74, n:42100},
              ].map((r, i) => (
                <div key={i}>
                  <div className="row" style={{ justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{r.label}</span>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--ink-3)' }}>{r.n.toLocaleString()} сурагч</span>
                  </div>
                  <div style={{ position:'relative', height: 16, background:'var(--felt-3)', borderRadius: 2 }}>
                    <div style={{ position:'absolute', left:0, top:0, bottom:0, width: `${r.me}%`, background:'var(--lacquer)' }}/>
                    <div style={{ position:'absolute', left:`${r.me}%`, top:-3, bottom:-3, width: 3, background:'var(--ink)' }}/>
                    <div style={{ position:'absolute', left:`${r.me}%`, top:-16, transform:'translateX(-50%)', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--ink)' }}>{r.me}%</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Next mock cta */}
          <section style={{
            border: '2px solid var(--ink)',
            background: 'var(--ink)', color: 'var(--paper)',
            padding: '22px',
            position:'relative',
          }}>
            <span className="st-eyebrow" style={{ color: 'var(--brass)' }}>Дараагийн бэлтгэл</span>
            <h3 className="st-h2" style={{ marginTop: 6, color: 'var(--paper)' }}>Бүтэн ЭЕШ — Math</h3>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>180 минут · хяналттай горим · камер шаардлагатай</div>
            <button className="st-btn" style={{ marginTop: 16, background: 'var(--brass)', color: 'var(--ink)', border: '1px solid var(--brass-deep)' }}>
              Эхлүүлэх →
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Olympiad Directory ───────────────────
function StudentOlympiad({ decor }) {
  const [activeSubject, setActiveSubject] = React.useState('all');
  const subjects = [
    ['all', 'Бүх хичээл'], ['math', 'Математик'], ['phys', 'Физик'], ['chem', 'Хими'],
    ['bio', 'Биологи'], ['inf', 'Информатик'], ['mn', 'Эх хэл'], ['eng', 'Англи хэл'],
  ];

  const olys = [
    { title:'"Эрдмийн оч"', subj:'Математикийн олимпиад', subjCode:'math', grade:'10-12', org:'AIAA + БСШУЯ', when:'6 сар 17', fee:8000, mode:'Бүсчилсэн · онлайн боломжтой', spots: 124, registered: true },
    { title:'"Од Эрдэнэ"',   subj:'Физикийн чөлөөт олимпиад', subjCode:'phys', grade:'11-12', org:'МУИС', when:'6 сар 24', fee:10000, mode:'УБ + Эрдэнэт', spots: 22, registered: false, hot:true },
    { title:'"Чингэлэг"',    subj:'Эх хэлний олимпиад', subjCode:'mn', grade:'8-12', org:'Соёлын төв', when:'7 сар 1', fee:5000, mode:'УБ + 21 аймаг + онлайн', spots: 480, registered: false },
    { title:'"Боржигин"',    subj:'Түүхийн олимпиад', subjCode:'hist', grade:'9-12', org:'ШУА', when:'7 сар 5', fee:6000, mode:'Бүсчилсэн', spots: 88, registered: false },
    { title:'"Хан Хэнтий"',  subj:'Биологийн төрөл бүрийн олимпиад', subjCode:'bio', grade:'10-12', org:'ХААИС', when:'7 сар 12', fee:7500, mode:'Онлайн зөвхөн', spots: 38, registered: false },
    { title:'"Шинэ нар"',    subj:'Англи хэлний олимпиад', subjCode:'eng', grade:'7-12', org:'British Council MN', when:'7 сар 19', fee:15000, mode:'УБ · 4 шат', spots: 16, registered: false },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Нэгдсэн олимпиадын каталог"
        title="Олимпиадууд · 142 үйл явдал"
        sub="Бүх олимпиадын бүртгэл, төлбөр, цахим тасалбар нэг газар. QPay-ээр төлсний дараа гарах тасалбар таны утсанд офлайн байдлаар хадгалагдана."
        decor={decor}
        actions={<>
          <button className="st-btn"><Icon name="ticket"/> Миний тасалбарууд</button>
          <button className="st-btn st-btn--primary"><Icon name="oly" color="currentColor"/> Дасгал хийх</button>
        </>}
      />
      {decor && <div style={{ padding: '0 36px' }}><DiamondChain height={10}/></div>}

      {/* Filter bar */}
      <div style={{ padding: '20px 36px 16px', borderBottom: '1px solid var(--ink-line)', background: 'var(--felt-2)' }}>
        <div className="row" style={{ gap: 6, flexWrap:'wrap', marginBottom: 14 }}>
          {subjects.map(([k, l]) => (
            <button key={k} onClick={() => setActiveSubject(k)}
              style={{
                padding:'6px 12px', fontSize: 12,
                background: activeSubject === k ? 'var(--ink)' : 'var(--paper)',
                color: activeSubject === k ? 'var(--paper)' : 'var(--ink)',
                border: '1px solid ' + (activeSubject === k ? 'var(--ink)' : 'var(--ink-line)'),
                fontWeight: 600,
                cursor:'pointer',
                borderRadius: 2,
              }}>{l}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 16, fontSize: 12 }}>
          <label className="row" style={{ gap: 6 }}>
            <span className="st-eyebrow">Анги</span>
            <select style={{ background:'var(--paper)', border:'1px solid var(--ink-line)', padding:'4px 10px', fontSize: 12 }}>
              <option>11-р анги</option><option>Бүгд</option>
            </select>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <span className="st-eyebrow">Горим</span>
            <select style={{ background:'var(--paper)', border:'1px solid var(--ink-line)', padding:'4px 10px', fontSize: 12 }}>
              <option>Бүгд</option><option>Зөвхөн онлайн</option><option>Зөвхөн биеэр</option>
            </select>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <span className="st-eyebrow">Хугацаа</span>
            <select style={{ background:'var(--paper)', border:'1px solid var(--ink-line)', padding:'4px 10px', fontSize: 12 }}>
              <option>14 хоногийн дотор</option><option>30 хоног</option><option>Энэ хичээлийн жил</option>
            </select>
          </label>
          <span className="spacer"/>
          <span style={{ color:'var(--ink-2)' }}>{olys.length} илэрц</span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '24px 36px 48px', display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 16 }}>
        {olys.map((o, i) => (
          <article key={i} className="st-card paper" style={{
            padding: 0, display:'grid', gridTemplateColumns:'1fr 100px',
            position:'relative', overflow:'hidden',
          }}>
            {/* Hot tag */}
            {o.hot && (
              <div style={{
                position:'absolute', top: -1, right: -1,
                background:'var(--lacquer)', color:'var(--paper)',
                fontFamily:'var(--font-mono)', fontSize: 10, padding: '4px 10px',
                letterSpacing:'.15em', textTransform:'uppercase',
              }}>чанарт</div>
            )}
            <div style={{ padding: '20px 22px' }}>
              <div className="st-eyebrow" style={{ color: 'var(--lacquer)' }}>{o.subj}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize: 22, fontWeight:600, marginTop: 4 }}>{o.title}</div>
              <div style={{ fontSize: 13, color:'var(--ink-2)', marginTop: 8, lineHeight: 1.6 }}>
                <div className="row" style={{ gap: 8 }}><span style={{width:80, color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontSize: 11}}>зохион</span>{o.org}</div>
                <div className="row" style={{ gap: 8 }}><span style={{width:80, color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontSize: 11}}>анги</span>{o.grade}-р анги</div>
                <div className="row" style={{ gap: 8 }}><span style={{width:80, color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontSize: 11}}>хэлбэр</span>{o.mode}</div>
              </div>
              <div className="row" style={{ marginTop: 16, gap: 10 }}>
                {o.registered ? (
                  <button className="st-btn st-btn--brass">✓ Бүртгэгдсэн · Тасалбар</button>
                ) : (
                  <button className="st-btn st-btn--primary">Бүртгүүлэх — ₮{o.fee.toLocaleString()}</button>
                )}
                <button className="st-btn st-btn--ghost">Дасгал →</button>
              </div>
            </div>
            {/* Date stub */}
            <div className="ticket-edge" style={{
              borderLeft: '1px dashed var(--ink-line)',
              background: o.registered ? 'var(--lacquer-tint)' : 'var(--felt-2)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding: '20px 0',
            }}>
              <div className="st-eyebrow">{o.when.split(' ')[0]} сар</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize: 32, fontWeight:600, lineHeight: 1, marginTop: 4 }}>{o.when.split(' ')[2]}</div>
              <div className="st-eyebrow" style={{marginTop: 6}}>{o.spots} суудал</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { StudentEGSh, StudentOlympiad });
