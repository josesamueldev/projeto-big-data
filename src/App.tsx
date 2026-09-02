import { useState } from "react";

function LoginPage({ onLogin }: { onLogin: (user: string) => void }) {
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricula || !senha) { setError("Preencha todos os campos."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (senha === "123456") {
        onLogin(matricula);
      } else {
        setError("Matrícula ou senha inválidos.");
      }
    }, 900);
  }

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <GovLogo />
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>Identificação e Busca de Veículos</div>
          <div className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--foreground)" }}>Projeto de Big Data</div>
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#ddeeff", border: "1px solid var(--primary)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1 className="text-base font-bold tracking-widest uppercase text-center" style={{ color: "var(--foreground)" }}>Acesso Restrito</h1>
              <p className="text-xs mt-1 text-center" style={{ color: "var(--muted)" }}>Autenticação obrigatória para acesso ao sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: "var(--muted)" }}>Matrícula / CPF</label>
                <input
                  value={matricula}
                  onChange={e => setMatricula(e.target.value)}
                  placeholder="Ex: 123456789"
                  autoComplete="username"
                  className="w-full rounded px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: "var(--muted)" }}>Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded px-3 py-2.5 text-sm outline-none pr-10"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--muted)" }}>
                    {showSenha
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ background: "rgba(218,54,51,0.1)", border: "1px solid rgba(218,54,51,0.3)", color: "var(--accent-red)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded text-sm font-bold tracking-widest uppercase transition-colors mt-1 disabled:opacity-60"
                style={{ background: "var(--primary)", color: "#fff" }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = "var(--primary-hover)")}
                onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Autenticando…
                  </span>
                ) : "Entrar"}
              </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: "var(--muted)" }}>
              Acesso exclusivo para servidores autorizados.<br />
              <span style={{ opacity: 0.6 }}>Senha de demonstração: <span style={{ fontFamily: "'DM Mono', monospace" }}>123456</span></span>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: "var(--muted)", opacity: 0.5 }}>
            Projeto de Big Data — Uso restrito ao serviço público
          </p>
        </div>
      </div>
    </div>
  );
}

const MOCK_RESULTS = [
  { id: 1, placa: "XLG-3842", chassi: "9BWZZZ377VT004251", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "RED_ALERT", alert_desc: "VEÍCULO ENVOLVIDO EM CRIME", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
  { id: 2, placa: "XLG-4517", chassi: "9BWZZZ377VT008823", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876"] },
  { id: 3, placa: "XLG-2291", chassi: "9BWZZZ377VT012409", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876"] },
  { id: 4, placa: "XLG-5503", chassi: "9BWZZZ377VT019944", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876"] },
  { id: 5, placa: "XLG-7780", chassi: "9BWZZZ377VT023311", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
  { id: 6, placa: "XLG-6614", chassi: "9BWZZZ377VT031087", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
  { id: 7, placa: "XLG-8829", chassi: "9BWZZZ377VT037652", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "ATENCAO", alert_desc: "RESTRIÇÃO ADMINISTRATIVA", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
  { id: 8, placa: "XLG-1058", chassi: "9BWZZZ377VT041293", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
  { id: 9, placa: "XLG-3371", chassi: "9BWZZZ377VT049876", modelo: "Honda Civic", cor: "Preto", proprietario: "Carlos Silva", cpf: "***.***.***-12", status: "SEM_RESTRICAO", alert_desc: "", ocorrencias: ["BO-2026-9876", "BO-2026-1102"] },
];

type Result = typeof MOCK_RESULTS[0];

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  );
}

function IconSort() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 3 18 9"/>
      <polyline points="6 15 12 21 18 15"/>
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function GovLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="21" fill="#1565c0" stroke="#1976d2" strokeWidth="1"/>
      <circle cx="22" cy="22" r="13" fill="none" stroke="#90caf9" strokeWidth="1.5"/>
      <circle cx="22" cy="22" r="6" fill="#90caf9" opacity="0.9"/>
      <path d="M22 9 L22 35 M9 22 L35 22" stroke="#90caf9" strokeWidth="0.8" opacity="0.6"/>
      <path d="M13 13 L31 31 M31 13 L13 31" stroke="#90caf9" strokeWidth="0.8" opacity="0.4"/>
    </svg>
  );
}

function StatusBadge({ status, desc }: { status: string; desc: string }) {
  if (status === "RED_ALERT") {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent-red)" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <span className="font-semibold text-xs tracking-widest" style={{ color: "var(--accent-red)" }}>RED ALERT</span>
        </div>
        {desc && <span className="text-xs pl-5.5" style={{ color: "var(--muted)", fontSize: "10px" }}>{desc}</span>}
      </div>
    );
  }
  if (status === "ATENCAO") {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent-orange)" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <span className="font-semibold text-xs tracking-widest" style={{ color: "var(--accent-orange)" }}>ATENÇÃO</span>
        </div>
        {desc && <span className="text-xs" style={{ color: "var(--muted)", fontSize: "10px" }}>{desc}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent-green)" }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span className="font-medium text-xs tracking-widest" style={{ color: "var(--accent-green)" }}>SEM RESTRIÇÃO</span>
    </div>
  );
}

function DetailModal({ result, onClose }: { result: Result; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(13,31,60,0.5)" }} onClick={onClose}>
      <div className="rounded-lg p-6 w-full max-w-lg" style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base tracking-wide" style={{ color: "var(--foreground)" }}>Detalhes do Veículo</h2>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded hover:opacity-80" style={{ color: "var(--muted)", background: "var(--surface-2)" }}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Placa", result.placa],
            ["Chassi/VIN", result.chassi],
            ["Modelo", result.modelo],
            ["Cor", result.cor],
            ["Proprietário", result.proprietario],
            ["CPF/CNPJ", result.cpf],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs mb-1 font-medium tracking-wider uppercase" style={{ color: "var(--muted)" }}>{label}</div>
              <div style={{ color: "var(--foreground)", fontFamily: label === "Placa" || label === "Chassi/VIN" ? "'DM Mono', monospace" : undefined }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="text-xs mb-2 font-medium tracking-wider uppercase" style={{ color: "var(--muted)" }}>Status Criminal</div>
          <StatusBadge status={result.status} desc={result.alert_desc} />
        </div>
        {result.ocorrencias.length > 0 && (
          <div className="mt-4">
            <div className="text-xs mb-2 font-medium tracking-wider uppercase" style={{ color: "var(--muted)" }}>Ocorrências Vinculadas</div>
            <div className="flex flex-wrap gap-2">
              {result.ocorrencias.map(bo => (
                <span key={bo} className="text-xs px-2 py-1 rounded font-mono" style={{ background: "var(--tag-bg)", color: "var(--accent-blue)", border: "1px solid var(--border)" }}>{bo}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [loggedUser, setLoggedUser] = useState<string | null>(null);

  if (!loggedUser) return <LoginPage onLogin={setLoggedUser} />;

  return <Dashboard user={loggedUser} onLogout={() => setLoggedUser(null)} />;
}

function Dashboard({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [placa, setPlaca] = useState("");
  const [chassi, setChassi] = useState("");
  const [parcial, setParcial] = useState(true);
  const [inicio, setInicio] = useState("");
  const [meio, setMeio] = useState("");
  const [fim, setFim] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [cpf, setCpf] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<Result | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const TOTAL_PAGES = 15;
  const TOTAL = 72;

  function handleSearch() {
    setResults([...MOCK_RESULTS]);
    setSearched(true);
    setPage(1);
  }

  function handleClear() {
    setPlaca(""); setChassi(""); setInicio(""); setMeio(""); setFim("");
    setModelo(""); setCor(""); setProprietario(""); setCpf("");
    setSearched(false); setResults([]);
  }

  const sorted = sortAsc ? results : [...results].reverse();

  const initials = user.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 shrink-0" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <GovLogo />
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>Identificação e Busca de Veículos</div>
            <div className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--foreground)" }}>Projeto de Big Data</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--primary)", color: "#fff" }}>{initials}</div>
          <div className="text-sm font-medium" style={{ color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}>{user}</div>
          <button onClick={onLogout} className="ml-2 text-xs px-2.5 py-1 rounded transition-colors" style={{ color: "var(--muted)", border: "1px solid var(--border)", background: "var(--surface-2)" }}
            onMouseOver={e => (e.currentTarget.style.color = "var(--accent-red)")}
            onMouseOut={e => (e.currentTarget.style.color = "var(--muted)")}
            title="Sair">
            Sair
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 gap-0 overflow-hidden">
        {/* Search Panel */}
        <aside className="w-72 shrink-0 overflow-y-auto p-5 flex flex-col gap-5" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          <div>
            <h2 className="font-bold text-sm tracking-wide mb-4" style={{ color: "var(--foreground)" }}>Painel de Pesquisa Avançada</h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>Placa</label>
                <input value={placa} onChange={e => setPlaca(e.target.value)} placeholder="ex: ABC-1234"
                  className="w-full rounded px-3 py-2 text-sm outline-none transition-colors"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>Chassi / VIN</label>
                <input value={chassi} onChange={e => setChassi(e.target.value)} placeholder="Chassi/VIN"
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Partial search toggle */}
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--muted)" }}>Pesquisa Parcial</label>
                <button
                  onClick={() => setParcial(!parcial)}
                  className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200"
                  style={{ background: parcial ? "var(--primary)" : "var(--border-strong)" }}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${parcial ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {parcial && (
                <div className="grid grid-cols-3 gap-2">
                  {[["Início", inicio, setInicio], ["Meio", meio, setMeio], ["Fim", fim, setFim]].map(([label, val, setter]) => (
                    <div key={label as string}>
                      <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>{label as string}</label>
                      <input value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} placeholder={label as string}
                        className="w-full rounded px-2 py-1.5 text-xs outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}
                        onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                        onBlur={e => (e.target.style.borderColor = "var(--border)")}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>Marca / Modelo</label>
                <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Marca/Modelo"
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>Cor</label>
                <input value={cor} onChange={e => setCor(e.target.value)} placeholder="Cor"
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>Proprietário</label>
                <input value={proprietario} onChange={e => setProprietario(e.target.value)} placeholder="Nome do proprietário"
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wider uppercase" style={{ color: "var(--muted)" }}>CPF / CNPJ</label>
                <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="CPF/CNPJ"
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'DM Mono', monospace" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold tracking-widest uppercase transition-colors"
              style={{ background: "var(--primary)", color: "#fff" }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--primary-hover)")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
            >
              <IconSearch />
              Pesquisar
            </button>
            <button onClick={handleClear}
              className="px-4 py-2.5 rounded text-sm font-medium tracking-wide transition-colors"
              style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--muted)")}
            >
              Limpar
            </button>
          </div>
        </aside>

        {/* Results Panel */}
        <section className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm tracking-wide" style={{ color: "var(--foreground)" }}>
              Resultados da Pesquisa
              {searched && <span className="ml-3 text-xs font-normal" style={{ color: "var(--muted)" }}>{TOTAL} registros encontrados</span>}
            </h2>
            {searched && (
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Página {page} de {TOTAL_PAGES}
              </div>
            )}
          </div>

          {!searched ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-sm tracking-wide">Utilize o painel de pesquisa para buscar veículos</span>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                      {["Ações", "Placa", "Chassi", "Modelo", "Cor", "Proprietário", "Status Criminal", "Ocorrências Vinculadas"].map((col) => (
                        <th key={col} className="px-4 py-3 text-left whitespace-nowrap" style={{ color: "var(--muted)", fontWeight: 600, fontSize: "11px", letterSpacing: "0.08em" }}>
                          <div className="flex items-center gap-1.5">
                            {col}
                            {col === "Placa" && (
                              <button onClick={() => setSortAsc(!sortAsc)} className="opacity-50 hover:opacity-100 transition-opacity">
                                <IconSort />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr key={row.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: row.status === "RED_ALERT" ? "rgba(198,40,40,0.06)" : i % 2 === 0 ? "transparent" : "rgba(21,101,192,0.03)"
                        }}
                        className="transition-colors"
                        onMouseOver={e => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseOut={e => (e.currentTarget.style.background = row.status === "RED_ALERT" ? "rgba(218,54,51,0.05)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setDetailRow(row)} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--accent-blue)" }} title="Ver detalhes">
                              <IconEye />
                            </button>
                            <button className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: row.status === "RED_ALERT" ? "var(--accent-red)" : "var(--accent-orange)" }} title="Alertas">
                              <IconAlert />
                            </button>
                            <button className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} title="Histórico">
                              <IconHistory />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-sm tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "var(--foreground)" }}>{row.placa}</span>
                          {row.status === "RED_ALERT" && (
                            <div className="mt-0.5 h-0.5 w-12 rounded-full" style={{ background: "var(--accent-red)" }} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace", color: "var(--muted)" }}>{row.chassi.slice(0, 8)}…</span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{row.modelo}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{row.cor}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{row.proprietario}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} desc={row.alert_desc} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {row.ocorrencias.map(bo => (
                              <span key={bo} className="text-xs px-2 py-0.5 rounded w-fit" style={{ fontFamily: "'DM Mono', monospace", background: "var(--tag-bg)", color: "var(--accent-blue)", border: "1px solid var(--border)" }}>{bo}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Página {page} de {TOTAL_PAGES} &nbsp;|&nbsp; Total: {TOTAL} resultados
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded transition-colors disabled:opacity-30"
                    style={{ color: "var(--muted)", border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <IconChevronLeft />
                  </button>
                  {[...Array(Math.min(5, TOTAL_PAGES))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-7 h-7 rounded text-xs font-medium transition-colors"
                        style={{
                          background: page === p ? "var(--primary)" : "var(--surface-2)",
                          color: page === p ? "#fff" : "var(--muted)",
                          border: "1px solid var(--border)"
                        }}>
                        {p}
                      </button>
                    );
                  })}
                  {TOTAL_PAGES > 5 && <span className="px-1" style={{ color: "var(--muted)" }}>…</span>}
                  {TOTAL_PAGES > 5 && (
                    <button onClick={() => setPage(TOTAL_PAGES)}
                      className="w-7 h-7 rounded text-xs font-medium transition-colors"
                      style={{
                        background: page === TOTAL_PAGES ? "var(--primary)" : "var(--surface-2)",
                        color: page === TOTAL_PAGES ? "#fff" : "var(--muted)",
                        border: "1px solid var(--border)"
                      }}>
                      {TOTAL_PAGES}
                    </button>
                  )}
                  <button onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))} disabled={page === TOTAL_PAGES}
                    className="p-1.5 rounded transition-colors disabled:opacity-30"
                    style={{ color: "var(--muted)", border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <IconChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {detailRow && <DetailModal result={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  );
}
