// shell.jsx — Top bar, sidebar nav, screen router scaffold

const ROLES = [
  { id: 'student', label: 'Сурагч',          en: 'Student' },
  { id: 'teacher', label: 'Багш',            en: 'Teacher' },
  { id: 'parent',  label: 'Эцэг эх',         en: 'Parent' },
  { id: 'admin',   label: 'Сургуулийн админ', en: 'School admin' },
  { id: 'platform',label: 'Системийн админ',  en: 'Platform admin' },
];

const NAV = {
  student: [
    { group: 'Суралцах' },
    { id: 'student-home',     label: 'Нүүр',                       icon: 'home' },
    { id: 'student-tutor',    label: 'ИИ Хичээлийн хөтөч',         icon: 'tutor' },
    { id: 'student-egsh',     label: 'ЭЕШ бэлтгэл',                icon: 'egsh' },
    { group: 'Олимпиад' },
    { id: 'student-olympiad', label: 'Олимпиадын каталог',         icon: 'oly' },
    { id: 'student-ticket',   label: 'Миний тасалбарууд',          icon: 'ticket' },
    { group: 'Гадаад' },
    { id: 'student-abroad',   label: 'Гадаад зам',                 icon: 'abroad' },
    { id: 'student-scholar',  label: 'Тэтгэлэг',                   icon: 'scholar' },
    { group: 'Сайн сайхан' },
    { id: 'student-wellbeing',label: 'Сэтгэлийн хэмжүүр',          icon: 'pulse' },
  ],
  teacher: [
    { group: 'Хос горим' },
    { id: 'teacher-dash',     label: 'Хяналтын самбар',            icon: 'home' },
    { id: 'teacher-roster',   label: 'Сурагчийн жагсаалт',         icon: 'roster' },
    { group: 'Хичээл' },
    { id: 'teacher-focus',    label: 'Анхаарлын горим',            icon: 'focus' },
    { id: 'teacher-academy',  label: 'Багшийн академи',            icon: 'academy' },
    { group: 'Хувийн' },
    { id: 'teacher-myoly',    label: 'Миний олимпиадууд',          icon: 'oly' },
  ],
  parent: [
    { id: 'parent-home',      label: 'Хүүхдийн самбар',            icon: 'home' },
    { id: 'parent-sms',       label: 'SMS / USSD холбоо',          icon: 'sms' },
  ],
  admin: [
    { id: 'admin-overview',   label: 'Сургуулийн ерөнхий',         icon: 'home' },
    { id: 'admin-risk',       label: 'Анхаарал татах хөвгүүд',     icon: 'risk' },
    { id: 'admin-wellbeing',  label: 'Дотуур байрны хэмжүүр',      icon: 'pulse' },
  ],
  platform: [
    { id: 'platform-home',    label: 'Платформын самбар',          icon: 'home' },
  ],
};

const ROLE_INITIAL = {
  student: 'student-home',
  teacher: 'teacher-dash',
  parent:  'parent-home',
  admin:   'admin-overview',
  platform:'platform-home',
};

// ─────────── icon glyphs ───────────
function Icon({ name, size = 16, color = 'currentColor' }) {
  const s = size, c = color;
  const stroke = { stroke: c, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const fill = { fill: c };
  switch (name) {
    case 'home':     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 7 L8 2 L14 7 L14 14 L2 14 Z"/><path {...stroke} d="M6 14 L6 10 L10 10 L10 14"/></svg>;
    case 'tutor':    return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 4 H14 V11 H9 L6 14 V11 H2 Z"/><circle cx="6" cy="7.5" r="0.7" {...fill}/><circle cx="10" cy="7.5" r="0.7" {...fill}/></svg>;
    case 'egsh':     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 2 H13 V14 H3 Z"/><path {...stroke} d="M5 6 H11 M5 9 H11 M5 12 H8"/></svg>;
    case 'oly':      return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="8" cy="6" r="4" {...stroke}/><path {...stroke} d="M5 9 L4 14 L8 12 L12 14 L11 9"/></svg>;
    case 'ticket':   return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 4 H14 V7 A1 1 0 0 0 14 9 V12 H2 V9 A1 1 0 0 0 2 7 Z"/><path {...stroke} d="M6 4 V12"/></svg>;
    case 'abroad':   return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" {...stroke}/><path {...stroke} d="M2 8 H14 M8 2 C 10.5 5, 10.5 11, 8 14 M8 2 C 5.5 5, 5.5 11, 8 14"/></svg>;
    case 'scholar':  return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 6 L8 3 L14 6 L8 9 Z M4 7 V11 C 4 12, 12 12, 12 11 V7"/></svg>;
    case 'pulse':    return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 8 H5 L7 4 L9 12 L11 8 H14"/></svg>;
    case 'roster':   return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="5" cy="6" r="2" {...stroke}/><circle cx="11" cy="6" r="2" {...stroke}/><path {...stroke} d="M2 13 C 2 10, 8 10, 8 13 M8 13 C 8 10, 14 10, 14 13"/></svg>;
    case 'focus':    return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" {...stroke}/><circle cx="8" cy="8" r="3" {...stroke}/><circle cx="8" cy="8" r="1" {...fill}/></svg>;
    case 'academy':  return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 5 L8 2 L14 5 L8 8 Z"/><path {...stroke} d="M5 7 V11 L8 12.5 L11 11 V7"/></svg>;
    case 'sms':      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M2 3 H14 V11 H8 L5 14 V11 H2 Z"/><circle cx="6" cy="7" r=".7" {...fill}/><circle cx="8" cy="7" r=".7" {...fill}/><circle cx="10" cy="7" r=".7" {...fill}/></svg>;
    case 'risk':     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 2 L14 13 H2 Z"/><path {...stroke} d="M8 7 V10 M8 11.5 V12"/></svg>;
    default: return <svg width={s} height={s}/>;
  }
}

// ─────────── Sidebar ───────────
function Sidebar({ role, screen, onNavigate, decor }) {
  const items = NAV[role] || [];
  return (
    <aside className="st-sidebar">
      {decor && <div className="decor-band" style={{borderBottom:'1px solid var(--ink-line)'}}/>}
      <div style={{ padding: '14px 14px 4px' }}>
        <div className="st-eyebrow" style={{ color: 'var(--ink-3)' }}>
          {ROLES.find(r=>r.id===role)?.label}
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, color:'var(--ink)', marginTop:2 }}>
          {ROLES.find(r=>r.id===role)?.en}
        </div>
      </div>
      <nav style={{ padding: '8px 8px 24px' }}>
        {items.map((it, i) => it.group ? (
          <div key={'g'+i} className="st-eyebrow" style={{ padding: '14px 8px 6px' }}>{it.group}</div>
        ) : (
          <button key={it.id}
            onClick={() => onNavigate(it.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left',
              background: screen === it.id ? 'var(--paper)' : 'transparent',
              border: '1px solid ' + (screen === it.id ? 'var(--ink-line)' : 'transparent'),
              borderLeft: screen === it.id ? '3px solid var(--lacquer)' : '3px solid transparent',
              borderRadius: 4,
              color: screen === it.id ? 'var(--ink)' : 'var(--ink-2)',
              padding: '8px 10px',
              fontSize: 13,
              fontWeight: screen === it.id ? 600 : 500,
              cursor: 'pointer',
              boxShadow: screen === it.id ? 'var(--shadow-sm)' : 'none',
            }}>
            <Icon name={it.icon} color={screen===it.id ? 'var(--lacquer)' : 'var(--ink-3)'}/>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─────────── Top bar ───────────
function TopBar({ role, onRoleChange, decor }) {
  return (
    <header className="st-topbar" style={{
      borderBottom: 'none',
      boxShadow: 'inset 0 -1px 0 var(--ink-line)',
    }}>
      {/* Brand */}
      <div style={{
        width: 240, display:'flex', alignItems:'center', gap:10,
        padding: '0 16px',
        borderRight: '1px solid var(--ink-line)',
        position: 'relative',
      }}>
        <div style={{ width: 32, height: 32, position:'relative' }}>
          <ToonoMedallion size={32}/>
        </div>
        <div className="col" style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, letterSpacing:'-0.02em' }}>
            studyTeach
          </div>
          <div className="st-eyebrow" style={{ fontSize: 9 }}>сурах · сургах</div>
        </div>
      </div>

      {/* Role switcher */}
      <div style={{ display:'flex', alignItems:'center', gap: 4, padding: '0 16px', flex: 1 }}>
        <span className="st-eyebrow" style={{ marginRight: 8 }}>Дүрд орох</span>
        {ROLES.map(r => (
          <button key={r.id}
            onClick={() => onRoleChange(r.id)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid ' + (role === r.id ? 'var(--lacquer-deep)' : 'var(--ink-line)'),
              background: role === r.id ? 'var(--lacquer)' : 'var(--paper)',
              color: role === r.id ? 'var(--paper)' : 'var(--ink)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: '.15s',
              boxShadow: role === r.id ? '0 2px 0 var(--lacquer-deep)' : 'var(--shadow-sm)',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Right side: status + user */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 18px' }}>
        <div className="row" style={{ gap: 6, fontSize: 11 }}>
          <span className="brass-dot"/>
          <span style={{ fontFamily:'var(--font-mono)', color: 'var(--ink-2)' }}>Холбогдсон · 3G</span>
        </div>
        <div className="row" style={{ gap: 6, fontSize: 11, color: 'var(--ink-2)' }}>
          <span style={{ fontFamily:'var(--font-mono)' }}>Улаанбаатар, БЗД · 4-р сургууль</span>
        </div>
        <div style={{
          width:32, height:32, borderRadius:'50%',
          background: 'var(--lacquer)',
          color: 'var(--paper)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight: 600, fontFamily: 'var(--font-display)',
          border: '2px solid var(--brass)',
          fontSize: 13,
        }}>М</div>
      </div>
    </header>
  );
}

// ─────────── Section header used by pages ───────────
function PageHeader({ eyebrow, title, sub, actions, decor }) {
  return (
    <div style={{ padding: '28px 36px 18px', position:'relative' }}>
      {decor && (
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 4, background: 'var(--lacquer)' }}/>
      )}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap: 24 }}>
        <div>
          {eyebrow && <div className="st-eyebrow" style={{marginBottom: 8}}>{eyebrow}</div>}
          <h1 className="st-h1">{title}</h1>
          {sub && <div style={{ color:'var(--ink-2)', marginTop: 10, fontSize: 15, maxWidth: 640 }}>{sub}</div>}
        </div>
        {actions && <div style={{ display:'flex', gap: 10 }}>{actions}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, PageHeader, Icon, ROLES, NAV, ROLE_INITIAL });
