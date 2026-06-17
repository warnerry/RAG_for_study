import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Flame,
  GraduationCap,
  Grid2X2,
  Home,
  Info,
  Layers3,
  LibraryBig,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Target,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import { uploadAndProcessDocuments } from "./api/documents";
import { generateStudy, listSavedResults, deleteSavedResult } from "./api/study";
import { askDocument } from "./api/chat";
import { apiLogin, apiRegister, apiUpdateName } from "./api/auth";
import logoUrl from "./assets/logo/zachetka-logo.png";
import orcaBadgeUrl from "./assets/illustrations/orca-badge.png";
import orcaFloatUrl from "./assets/illustrations/orca-float.png";
import orcaHeroUrl from "./assets/illustrations/orca-hero.png";
import orcaMiniUrl from "./assets/illustrations/orca-mini.png";
import orcaSideUrl from "./assets/illustrations/orca-side.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteId =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "upload"
  | "processing"
  | "materials"
  | "topics"
  | "flashcards"
  | "quiz"
  | "mnemonics"
  | "chat"
  | "progress"
  | "calendar"
  | "summary"
  | "settings"
  | "profile";

interface AuthUser {
  token: string;
  email: string;
  name: string;
}

interface SessionData {
  collectionId: string;
  files: Array<{ filename: string; status: string; chunks_count: number }>;
  uploadedAt: string;
  documentTitle: string;
}

interface StudyItem {
  [key: string]: unknown;
}

// ─── Auth storage ─────────────────────────────────────────────────────────────

const AUTH_KEY = "zachetka_auth";
const SESSION_KEY = "zachetka_session";

function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: SessionData | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ─── Routing ──────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set<RouteId>(["landing", "login", "register"]);

function routeFromLocation(): RouteId {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "") as RouteId;
  const known: RouteId[] = [
    "landing", "login", "register", "dashboard", "upload", "processing",
    "materials", "topics", "summary", "flashcards", "quiz", "mnemonics", "chat",
    "progress", "calendar", "settings", "profile",
  ];
  return known.includes(path) ? path : "landing";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function displayName(user: AuthUser | null): string {
  if (!user) return "";
  if (user.name) return user.name;
  return user.email.split("@")[0];
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function Button({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      className={cx("zButton", `zButton--${variant}`, className)}
      type="button"
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="spin" /> : null}
      {children}
    </button>
  );
}

function IconBtn({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={cx("iconButton", className)} aria-label={label} type="button" title={label} {...props}>
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "violet" | "cyan" | "green" | "orange" | "red" | "muted";
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={cx("chip", active && "isActive")} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function ProgressBar({ value, thin = false }: { value: number; thin?: boolean }) {
  return (
    <div className={cx("progressBar", thin && "progressBar--thin")}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function ProgressRing({
  value,
  label = "готовность",
  size = "md",
}: {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cx("progressRing", `progressRing--${size}`)}
      style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}
    >
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function FileBadge({ type }: { type: string }) {
  return (
    <span className={`fileBadge fileBadge--${type.toLowerCase()}`}>
      <FileText size={14} />
      {type}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="emptyState">
      <Icon size={48} />
      <h2>{title}</h2>
      <p>{text}</p>
      {action && onAction ? <Button onClick={onAction}>{action}</Button> : null}
    </div>
  );
}

function SpinnerOverlay({ text }: { text: string }) {
  return (
    <div className="spinnerOverlay">
      <Loader2 size={42} className="spin" />
      <p>{text}</p>
    </div>
  );
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="errorBanner" role="alert">
      <Info size={18} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Закрыть">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  return (
    <button
      className={cx("logoLockup", compact && "logoLockup--compact")}
      type="button"
      onClick={onClick}
    >
      <img src={logoUrl} alt="Логотип Зачётки" />
      {!compact ? (
        <span>
          <strong>Зачётка</strong>
          <small>от конспекта до конкурса</small>
        </span>
      ) : null}
    </button>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard" as RouteId, label: "Дашборд", icon: Home },
  { id: "materials" as RouteId, label: "Мои материалы", icon: FileText },
  { id: "topics" as RouteId, label: "Темы", icon: Layers3 },
  { id: "summary" as RouteId, label: "Краткий пересказ", icon: BookOpen },
  { id: "flashcards" as RouteId, label: "Карточки", icon: LibraryBig },
  { id: "quiz" as RouteId, label: "Тесты", icon: ClipboardCheck },
  { id: "mnemonics" as RouteId, label: "Мнемоники и рифмы", icon: Brain },
  { id: "chat" as RouteId, label: "Чат по материалам", icon: MessageCircle },
  { id: "progress" as RouteId, label: "Прогресс", icon: Grid2X2 },
  { id: "calendar" as RouteId, label: "Календарь", icon: CalendarDays },
  { id: "settings" as RouteId, label: "Настройки", icon: Settings },
  { id: "profile" as RouteId, label: "Профиль", icon: User },
];

function Topbar({
  user,
  onOpenMenu,
  onNavigate,
  onLogout,
}: {
  user: AuthUser;
  onOpenMenu: () => void;
  onNavigate: (r: RouteId) => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="topbar">
      <IconBtn className="mobileMenuButton" label="Открыть меню" onClick={onOpenMenu}>
        <Menu size={20} />
      </IconBtn>
      <label className="searchBox">
        <Search size={18} />
        <input placeholder="Поиск по темам, материалам, тестам..." aria-label="Поиск" />
        <kbd>⌘K</kbd>
      </label>
      <div className="topbarProfile" ref={ref}>
        <IconBtn label="Уведомления" className="notificationButton">
          <Bell size={21} />
        </IconBtn>
        <button
          className="profileButton"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          <User size={20} className="profileIcon" />
          <span className="profileName">{displayName(user)}</span>
          <ChevronDown size={16} />
        </button>
        {menuOpen ? (
          <div className="profileDropdown">
            <p className="profileEmail">{user.email}</p>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNavigate("profile");
              }}
            >
              <User size={16} /> Профиль
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNavigate("settings");
              }}
            >
              <Settings size={16} /> Настройки
            </button>
            <hr />
            <button type="button" className="logoutBtn" onClick={onLogout}>
              <LogOut size={16} /> Выйти
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function Sidebar({
  active,
  hasSession,
  onNavigate,
  onLogout,
  open,
  onClose,
}: {
  active: RouteId;
  hasSession: boolean;
  onNavigate: (r: RouteId) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={cx("sidebar", open && "isOpen")}>
        <Logo onClick={() => onNavigate("dashboard")} />
        <Button
          className="sidebarUpload"
          onClick={() => {
            onNavigate("upload");
            onClose();
          }}
        >
          <Plus size={18} /> Загрузить материалы
        </Button>
        <nav className="sideNav" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cx(active === id && "active")}
              type="button"
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {hasSession ? (
          <div className="sidebarPromo">
            <strong>Материалы загружены ✓</strong>
            <p>Продолжай подготовку — карточки, тесты и чат уже готовы.</p>
            <Button variant="secondary" onClick={() => { onNavigate("flashcards"); onClose(); }}>
              Продолжить
            </Button>
            <img src={orcaMiniUrl} alt="Орка Зачётки" />
          </div>
        ) : (
          <div className="sidebarPromo">
            <strong>Загрузи первый материал ✨</strong>
            <p>Конспект, лекция, учебник — превратим в тесты, карточки и рифмы.</p>
            <Button variant="secondary" onClick={() => { onNavigate("upload"); onClose(); }}>
              Загрузить
            </Button>
            <img src={orcaMiniUrl} alt="Орка Зачётки" />
          </div>
        )}
      </aside>
      {open ? (
        <button className="sidebarBackdrop" aria-label="Закрыть меню" type="button" onClick={onClose} />
      ) : null}
    </>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

function AppLayout({
  route,
  user,
  hasSession,
  onNavigate,
  onLogout,
  children,
}: {
  route: RouteId;
  user: AuthUser;
  hasSession: boolean;
  onNavigate: (r: RouteId) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="appFrame">
      <Sidebar
        active={route}
        hasSession={hasSession}
        onNavigate={onNavigate}
        onLogout={onLogout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="appMain">
        <Topbar
          user={user}
          onOpenMenu={() => setMenuOpen(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <div className="pageTransition" key={route}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Auth pages ───────────────────────────────────────────────────────────────

function AuthPage({
  mode,
  onSuccess,
  onSwitch,
}: {
  mode: "login" | "register";
  onSuccess: (user: AuthUser) => void;
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (password !== confirm) {
        setError("Пароли не совпадают.");
        return;
      }
      if (password.length < 6) {
        setError("Пароль — минимум 6 символов.");
        return;
      }
    }
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await apiLogin(email, password)
          : await apiRegister(email, password, name);
      onSuccess({ token: result.access_token, email: result.email, name: result.name });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка. Попробуй снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authLogo">
          <img src={logoUrl} alt="Зачётка" />
          <strong>Зачётка</strong>
        </div>
        <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
        <p className="authSub">
          {mode === "login"
            ? "Введи email и пароль, чтобы продолжить подготовку"
            : "Создай аккаунт и начни подготовку прямо сейчас"}
        </p>
        {error ? (
          <div className="authError">
            <Info size={16} /> {error}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="authForm">
          {mode === "register" ? (
            <label className="authField">
              <span>Имя (необязательно)</span>
              <div className="inputWrap">
                <User size={18} />
                <input
                  type="text"
                  placeholder="Как тебя зовут?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </label>
          ) : null}
          <label className="authField">
            <span>Email</span>
            <div className="inputWrap">
              <Mail size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </label>
          <label className="authField">
            <span>Пароль</span>
            <div className="inputWrap">
              <input
                type={showPwd ? "text" : "password"}
                placeholder={mode === "register" ? "Минимум 6 символов" : "Твой пароль"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {mode === "register" ? (
            <label className="authField">
              <span>Повтор пароля</span>
              <div className="inputWrap">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Повтори пароль"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </label>
          ) : null}
          <Button className="authSubmit" type="submit" loading={loading} disabled={!email || !password}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>
        <p className="authSwitch">
          {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
          <button type="button" onClick={onSwitch}>
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
      <img src={orcaFloatUrl} alt="" className="authOrca" />
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({ onNavigate }: { onNavigate: (r: RouteId) => void }) {
  return (
    <div className="landingPage">
      <header className="landingNav">
        <Logo compact onClick={() => onNavigate("landing")} />
        <nav>
          <a href="#how">Как это работает</a>
          <a href="#features">Возможности</a>
          <a href="#goals">Для кого</a>
        </nav>
        <div className="landingNavActions">
          <Button variant="secondary" onClick={() => onNavigate("login")}>Войти</Button>
          <Button onClick={() => onNavigate("register")}>Начать бесплатно</Button>
        </div>
      </header>

      <main className="landingHero">
        <section className="landingCopy">
          <Badge>AI-ассистент для учёбы</Badge>
          <h1>Загрузи материалы — <span>соберём подготовку за тебя</span></h1>
          <p>
            Превратим конспекты, методички и лекции в карточки, тесты, рифмы и планы.
            Ты экономишь время и получаешь максимум пользы.
          </p>
          <div className="heroActions">
            <Button onClick={() => onNavigate("register")}>
              <Upload size={18} /> Попробовать бесплатно
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("login")}>
              Войти в аккаунт
            </Button>
          </div>
          <small>Поддерживаем PDF, DOCX, PPTX, TXT и другие форматы</small>
        </section>
        <section className="landingVisual">
          <img src={orcaHeroUrl} alt="Орка с зачёткой" />
          <div className="floatCard floatCard--one">
            <Clock3 size={20} /><strong>Экономия времени</strong><span>Подготовка за минуты</span>
          </div>
          <div className="floatCard floatCard--two">
            <Brain size={20} /><strong>Запоминается легко</strong><span>Карточки, тесты и рифмы</span>
          </div>
          <div className="floatCard floatCard--three">
            <GraduationCap size={20} /><strong>Твой результат</strong><span>Выше уверенность</span>
          </div>
        </section>
      </main>

      <section id="how" className="landingBand howBand">
        <div className="bandHeading"><h2>Как это работает</h2><p>Три шага до готовой подготовки</p></div>
        {[
          [Upload, "1. Загрузи материалы", "PDF, DOCX, PPTX, TXT — что угодно"],
          [Sparkles, "2. Зачётка анализирует", "Выделяем главное и создаём контент"],
          [GraduationCap, "3. Тренируйся и сдавай", "Карточки, тесты, рифмы и чат"],
        ].map(([Icon, title, text]) => (
          <article key={String(title)}>
            <Icon size={32} />
            <strong>{String(title)}</strong>
            <span>{String(text)}</span>
          </article>
        ))}
      </section>

      <section id="features" className="landingBand featureBand">
        <div className="bandHeading"><h2>Почему выбирают Зачётку</h2></div>
        {[
          [BookOpen, "Точность", "AI выделяет ключевое из твоих материалов"],
          [Brain, "Разные форматы", "Карточки, тесты, рифмы, планы"],
          [Target, "Персонализация", "Всё строится только на твоих файлах"],
          [Trophy, "Результат", "Ты сдаёшь уверенно — мы рядом"],
        ].map(([Icon, title, text]) => (
          <article key={String(title)}>
            <Icon size={28} />
            <strong>{String(title)}</strong>
            <span>{String(text)}</span>
          </article>
        ))}
      </section>

      <section id="goals" className="landingCta">
        <img src={orcaBadgeUrl} alt="" />
        <h2>Загрузи материалы — соберём подготовку за тебя</h2>
        <p>Учись умнее, а не больше.</p>
        <Button onClick={() => onNavigate("register")}>Начать бесплатно</Button>
      </section>

      <footer className="landingFooter">
        <Logo compact onClick={() => onNavigate("landing")} />
        <p>© 2025 Зачётка. Все права защищены.</p>
      </footer>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardPage({
  user,
  session,
  onNavigate,
}: {
  user: AuthUser;
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  const name = displayName(user);

  return (
    <div className="dashboardPage">
      <div className="pageIntro">
        <div>
          <h1>Привет{name ? `, ${name}` : ""}! 👋</h1>
          <p>
            {session
              ? "Твои материалы обработаны — продолжай подготовку."
              : "Загрузи первый материал, чтобы начать подготовку."}
          </p>
        </div>
        <img src={orcaFloatUrl} alt="" />
      </div>

      {!session ? (
        <div className="dashboardEmpty">
          <EmptyState
            icon={Upload}
            title="Материалов пока нет"
            text="Загрузи конспект, лекцию или учебник — Зачётка превратит их в карточки, тесты и мнемоники."
            action="Загрузить первый материал"
            onAction={() => onNavigate("upload")}
          />
        </div>
      ) : (
        <>
          <div className="dashboardFiles glassPanel">
            <div className="panelHeader">
              <h2>Загруженные материалы</h2>
              <button type="button" onClick={() => onNavigate("materials")}>
                Все материалы <ChevronRight size={16} />
              </button>
            </div>
            <div className="fileList">
              {session.files.slice(0, 4).map((f) => (
                <div className="fileListRow" key={f.filename}>
                  <FileBadge type={f.filename.split(".").pop()?.toUpperCase() ?? "FILE"} />
                  <span className="fileListName">{f.filename}</span>
                  <Badge tone={f.status === "processed" ? "green" : "orange"}>
                    {f.status === "processed" ? "Обработан" : "Обрабатывается"}
                  </Badge>
                  <span className="fileListChunks">{f.chunks_count} фр.</span>
                </div>
              ))}
            </div>
          </div>

          <div className="quickGrid">
            {[
              { label: "Карточки", icon: LibraryBig, route: "flashcards" as RouteId, desc: "Термины и определения" },
              { label: "Тесты", icon: ClipboardCheck, route: "quiz" as RouteId, desc: "Проверь себя" },
              { label: "Мнемоники", icon: Brain, route: "mnemonics" as RouteId, desc: "Запомни легко" },
              { label: "Чат", icon: MessageCircle, route: "chat" as RouteId, desc: "Задай вопрос по материалу" },
            ].map(({ label, icon: Icon, route, desc }) => (
              <button key={label} className="quickCard" type="button" onClick={() => onNavigate(route)}>
                <div>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
                <Icon size={46} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────

interface UploadItem {
  name: string;
  type: string;
  size: string;
  status: string;
  progress: number;
}

function UploadPage({
  onNavigate,
  onSessionReady,
}: {
  onNavigate: (r: RouteId) => void;
  onSessionReady: (session: SessionData) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(true);
    setError("");
    const newItems: UploadItem[] = list.map((f) => ({
      name: f.name,
      type: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
      size: `${(f.size / 1024 / 1024).toFixed(1)} МБ`,
      status: "Загружаем...",
      progress: 10,
    }));
    setItems(newItems);
    onNavigate("processing");
    try {
      const result = await uploadAndProcessDocuments(list);
      const mappedFiles = result.files.map((f) => ({
        filename: f.filename,
        status: f.status,
        chunks_count: f.chunks_count,
      }));
      const firstTitle = mappedFiles[0]?.filename.replace(/\.[^.]+$/, "") ?? "Материал";
      const documentTitle =
        mappedFiles.length === 1
          ? firstTitle
          : mappedFiles.map((f) => f.filename.replace(/\.[^.]+$/, "")).join(", ");
      const session: SessionData = {
        collectionId: result.collection_id,
        files: mappedFiles,
        uploadedAt: new Date().toISOString(),
        documentTitle,
      };
      onSessionReady(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка загрузки.";
      setError(msg);
      setItems((cur) => cur.map((i) => ({ ...i, status: "Ошибка", progress: 0 })));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="uploadPage">
      <div className="pageIntro">
        <div>
          <h1>Загрузить материалы</h1>
          <p>Загрузи конспекты, лекции или учебники — мы разберём их и соберём подготовку за тебя.</p>
        </div>
      </div>

      {error ? <ErrorBanner message={error} onClose={() => setError("")} /> : null}

      <div className="twoCol">
        <main>
          <label
            className={cx("uploadZone", dragging && "isDragging")}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple accept=".pdf,.docx,.txt,.pptx,.xlsx,.md" onChange={(e) => handleFiles(e.target.files)} />
            <img src={orcaBadgeUrl} alt="" />
            <h2>Перетащи файлы сюда</h2>
            <p>или нажми, чтобы выбрать</p>
            <div className="formatRow">
              {["PDF", "DOCX", "PPTX", "XLSX", "TXT"].map((f) => (
                <FileBadge key={f} type={f} />
              ))}
            </div>
            <small>Максимальный размер — 20 МБ на файл</small>
          </label>

          {items.length > 0 ? (
            <div className="fileTable">
              <div className="sectionHeader"><h2>Файлы</h2></div>
              {items.map((item) => (
                <div className="fileRow" key={item.name}>
                  <FileBadge type={item.type} />
                  <span className="fileRowName">{item.name}</span>
                  <span className="fileRowSize">{item.size}</span>
                  <Badge tone={item.progress >= 100 ? "green" : item.status === "Ошибка" ? "red" : "orange"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </main>

        <aside>
          <article className="glassPanel processInfo">
            <h2>Что происходит после загрузки</h2>
            {[
              [Brain, "Анализируем содержание", "Выделяем ключевые темы"],
              [Sparkles, "Создаём материалы", "Карточки, тесты и мнемоники"],
              [Target, "Строим план", "Персональный путь подготовки"],
              [Bell, "Всё готово", "Можно начинать тренироваться"],
            ].map(([Icon, title, text]) => (
              <div key={String(title)}>
                <Icon size={20} />
                <span>
                  <strong>{String(title)}</strong>
                  <small>{String(text)}</small>
                </span>
              </div>
            ))}
          </article>
          <article className="glassPanel tipsCard">
            <h2>Советы</h2>
            {[
              "Загружай лекции, конспекты, презентации",
              "Чем больше материала — тем точнее результат",
              "Твои файлы в безопасности",
            ].map((tip) => (
              <p key={tip}><Check size={16} /> {tip}</p>
            ))}
          </article>
        </aside>
      </div>
    </div>
  );
}

// ─── Processing ───────────────────────────────────────────────────────────────

function ProcessingPage({
  session,
  onNavigate,
}: {
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  const steps = [
    "Читаем материал",
    "Выделяем главное",
    "Строим структуру",
    "Готовим карточки и тесты",
    "Всё готово",
  ];
  const isDone = !!session;

  useEffect(() => {
    if (isDone) {
      const t = setTimeout(() => onNavigate("dashboard"), 2000);
      return () => clearTimeout(t);
    }
  }, [isDone, onNavigate]);

  return (
    <div className="processingPage">
      <section className="processingHero glassPanel">
        <Sparkles className="decor decor--one" size={22} />
        <Sparkles className="decor decor--two" size={16} />
        <img src={orcaBadgeUrl} alt="Орка Зачётки" />
        <h1>{isDone ? "Готово! ✓" : "Зачётка работает над материалами..."}</h1>
        <p>
          {isDone
            ? "Материалы обработаны — переходим к подготовке."
            : "Анализируем, структурируем и создаём всё для эффективной подготовки."}
        </p>
        <div className="pipeline">
          {steps.map((step, i) => (
            <article
              key={step}
              className={cx(
                isDone || i < 4 ? "done" : "",
                !isDone && i === 1 ? "active" : ""
              )}
            >
              <span>{isDone || i < 1 ? <Check size={20} /> : !isDone && i === 1 ? <Loader2 size={20} className="spin" /> : <i />}</span>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
        {isDone ? null : (
          <div className="processingProgress">
            <ProgressBar value={40} />
          </div>
        )}
        <blockquote>Ты на шаг ближе к своей цели. Мы рядом!</blockquote>
      </section>
    </div>
  );
}

// ─── Materials ────────────────────────────────────────────────────────────────

function MaterialsPage({
  session,
  onNavigate,
}: {
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>Мои материалы</h1><p>Здесь будут твои загруженные файлы.</p></div></div>
        <EmptyState
          icon={FileText}
          title="Материалов пока нет"
          text="Загрузи первый конспект — мы обработаем его и создадим карточки, тесты и мнемоники."
          action="Загрузить материалы"
          onAction={() => onNavigate("upload")}
        />
      </div>
    );
  }

  return (
    <div className="pageWithIntro">
      <div className="pageIntro">
        <div>
          <h1>Мои материалы</h1>
          <p>
            Загружено {session.files.length} файл{session.files.length === 1 ? "" : "а"} ·{" "}
            {new Date(session.uploadedAt).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <Button onClick={() => onNavigate("upload")}><Plus size={17} /> Загрузить ещё</Button>
      </div>
      <div className="materialCards">
        {session.files.map((f) => (
          <article className="materialCard glassPanel" key={f.filename}>
            <FileBadge type={f.filename.split(".").pop()?.toUpperCase() ?? "FILE"} />
            <strong className="materialCardName">{f.filename}</strong>
            <div className="materialCardMeta">
              <Badge tone={f.status === "processed" ? "green" : "orange"}>
                {f.status === "processed" ? "Обработан" : "Обрабатывается"}
              </Badge>
              <span>{f.chunks_count} фрагментов</span>
            </div>
            <div className="materialCardActions">
              <Button variant="secondary" onClick={() => onNavigate("flashcards")}>Карточки</Button>
              <Button variant="secondary" onClick={() => onNavigate("quiz")}>Тест</Button>
              <Button variant="ghost" onClick={() => onNavigate("chat")}>Чат</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Topics (stub — реальная генерация идёт через Study) ─────────────────────

function TopicsPage({
  session,
  onNavigate,
}: {
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>Темы</h1><p>Темы появятся после загрузки материалов.</p></div></div>
        <EmptyState
          icon={Layers3}
          title="Тем пока нет"
          text="Темы появятся после обработки материалов."
          action="Загрузить материалы"
          onAction={() => onNavigate("upload")}
        />
      </div>
    );
  }

  return (
    <div className="pageWithIntro">
      <div className="pageIntro">
        <div><h1>Темы</h1><p>Темы извлечены из твоих материалов. Выбери, с чего начать.</p></div>
      </div>
      <div className="topicHint glassPanel">
        <Sparkles size={22} />
        <div>
          <strong>Зачётка проанализировала материалы</strong>
          <p>Используй карточки, тесты, мнемоники или чат — они уже построены на основе твоих файлов.</p>
        </div>
      </div>
      <div className="quickGrid">
        {[
          { label: "Карточки", icon: LibraryBig, route: "flashcards" as RouteId, desc: "Термины и определения" },
          { label: "Тесты", icon: ClipboardCheck, route: "quiz" as RouteId, desc: "Проверь знания" },
          { label: "Мнемоники", icon: Brain, route: "mnemonics" as RouteId, desc: "Запомни легко" },
          { label: "Чат", icon: MessageCircle, route: "chat" as RouteId, desc: "Задай вопрос" },
        ].map(({ label, icon: Icon, route, desc }) => (
          <button key={label} className="quickCard" type="button" onClick={() => onNavigate(route)}>
            <div><strong>{label}</strong><span>{desc}</span></div>
            <Icon size={46} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Study pages (flashcards / quiz / mnemonics) ──────────────────────────────

type StudyMode = "flashcards" | "quiz" | "mnemonics";

const STUDY_MODE_META: Record<StudyMode, { label: string; apiMode: string; count: number; emptyText: string; itemWord: (n: number) => string }> = {
  flashcards: { label: "Карточки", apiMode: "flashcards", count: 15, emptyText: "Карточки появятся после загрузки и анализа материалов.", itemWord: (n) => `${n} карточ${n === 1 ? "ка" : n < 5 ? "ки" : "ек"}` },
  quiz:       { label: "Тесты",    apiMode: "exam_questions", count: 10, emptyText: "Вопросы для теста появятся после загрузки материалов.",   itemWord: (n) => `${n} вопрос${n === 1 ? "" : n < 5 ? "а" : "ов"}` },
  mnemonics:  { label: "Мнемоники и рифмы", apiMode: "mnemonics", count: 10, emptyText: "Мнемоники появятся после загрузки материалов.", itemWord: (n) => `${n} мнемоник${n === 1 ? "а" : n < 5 ? "и" : ""}` },
};

// Тип сохранённого результата (упрощённый, без импорта из api/types для краткости)
interface LocalSavedResult {
  id: string;
  mode: string;
  document_title: string;
  collection_id: string;
  item_count: number;
  items: StudyItem[];
  sections?: Record<string, unknown>[] | null;
  title?: string | null;
  created_at: string;
  updated_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function StudyPage({
  mode,
  session,
  user,
  onNavigate,
}: {
  mode: StudyMode;
  session: SessionData | null;
  user: AuthUser;
  onNavigate: (r: RouteId) => void;
}) {
  const meta = STUDY_MODE_META[mode];
  const [items, setItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [savedResults, setSavedResults] = useState<LocalSavedResult[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Загружаем сохранённые результаты при монтировании
  useEffect(() => {
    listSavedResults(user.token)
      .then((all) => setSavedResults(all.filter((r) => r.mode === meta.apiMode) as LocalSavedResult[]))
      .catch(() => {/* тихо игнорируем */});
  }, [user.token, meta.apiMode]);

  useEffect(() => {
    setItems([]);
    setGenerated(false);
    setError("");
    setCardIndex(0);
    setFlipped(false);
    setSelectedAnswer(null);
  }, [mode, session?.collectionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "flashcards" || !generated || items.length === 0) return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((v) => !v); }
      if (e.key.toLowerCase() === "a") { setCardIndex((c) => (c - 1 + items.length) % items.length); setFlipped(false); }
      if (e.key.toLowerCase() === "d") { setCardIndex((c) => (c + 1) % items.length); setFlipped(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, generated, items.length]);

  async function generate() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateStudy(
        session.collectionId,
        meta.apiMode as "flashcards" | "exam_questions" | "mnemonics" | "summary",
        false,
        meta.count,
        user.token,
        session.documentTitle,
      );
      const newItems = (result.items ?? []) as StudyItem[];
      setItems(newItems);
      setGenerated(true);
      if (result.warning) setError(result.warning);
      // Обновляем список сохранённых (overwrite или добавить)
      if (result.result_id) {
        const saved: LocalSavedResult = {
          id: result.result_id,
          mode: meta.apiMode,
          document_title: session.documentTitle,
          collection_id: session.collectionId,
          item_count: newItems.length,
          items: newItems,
          created_at: result.created_at ?? new Date().toISOString(),
          updated_at: result.updated_at ?? new Date().toISOString(),
        };
        setSavedResults((prev) => {
          const without = prev.filter((r) => r.id !== saved.id);
          return [saved, ...without];
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка генерации.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSavedResult(user.token, id);
      setSavedResults((prev) => prev.filter((r) => r.id !== id));
      if (generated && items.length > 0) {
        // если открытый результат удалён — закрываем
        setGenerated(false);
        setItems([]);
      }
    } catch {
      // тихо
    } finally {
      setDeletingId(null);
    }
  }

  function openSaved(r: LocalSavedResult) {
    setItems(r.items);
    setGenerated(true);
    setCardIndex(0);
    setFlipped(false);
    setSelectedAnswer(null);
    setError("");
  }

  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>{meta.label}</h1><p>{meta.emptyText}</p></div></div>
        {savedResults.length > 0 ? (
          <SavedResultsList
            results={savedResults}
            deletingId={deletingId}
            onOpen={openSaved}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState icon={LibraryBig} title={`${meta.label} недоступны`} text={meta.emptyText} action="Загрузить материалы" onAction={() => onNavigate("upload")} />
        )}
      </div>
    );
  }

  return (
    <div className="pageWithIntro studyPage">
      <div className="pageIntro">
        <div>
          <h1>{meta.label}</h1>
          <p>
            {generated
              ? `${meta.itemWord(items.length)} по «${session.documentTitle}»`
              : `Материал: «${session.documentTitle}»`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {generated ? (
            <Button variant="secondary" onClick={() => { setGenerated(false); setItems([]); setCardIndex(0); setFlipped(false); setSelectedAnswer(null); }}>
              <RotateCcw size={17} /> К списку
            </Button>
          ) : null}
          <Button onClick={generate} loading={loading} disabled={loading}>
            <Sparkles size={17} /> {generated ? "Обновить" : "Сгенерировать"}
          </Button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} onClose={() => setError("")} /> : null}
      {loading ? <SpinnerOverlay text="Зачётка анализирует материалы и генерирует контент..." /> : null}

      {/* Сохранённые результаты — список блоков */}
      {!generated && savedResults.length > 0 ? (
        <SavedResultsList
          results={savedResults}
          deletingId={deletingId}
          onOpen={openSaved}
          onDelete={handleDelete}
        />
      ) : null}

      {/* Пустое состояние до первой генерации */}
      {!generated && savedResults.length === 0 && !loading ? (
        <EmptyState icon={Sparkles} title={`Здесь появятся ${meta.label.toLowerCase()} после генерации`} text="Нажми «Сгенерировать», чтобы создать материал по загруженным файлам." />
      ) : null}

      {/* Пустой результат после генерации */}
      {generated && items.length === 0 && !loading ? (
        <EmptyState icon={Sparkles} title="Ничего не нашлось" text="По этим материалам не удалось создать контент. Попробуй загрузить другие файлы." />
      ) : null}

      {mode === "flashcards" && generated && items.length > 0 ? (
        <FlashcardsView items={items} cardIndex={cardIndex} flipped={flipped} setCardIndex={setCardIndex} setFlipped={setFlipped} />
      ) : null}

      {mode === "quiz" && generated && items.length > 0 ? (
        <QuizView items={items} selected={selectedAnswer} onSelect={setSelectedAnswer} />
      ) : null}

      {mode === "mnemonics" && generated && items.length > 0 ? (
        <MnemonicsView items={items} />
      ) : null}
    </div>
  );
}

// ─── Список сохранённых результатов ──────────────────────────────────────────

function SavedResultsList({
  results,
  deletingId,
  onOpen,
  onDelete,
}: {
  results: LocalSavedResult[];
  deletingId: string | null;
  onOpen: (r: LocalSavedResult) => void;
  onDelete: (id: string) => void;
}) {
  const modeLabel: Record<string, string> = {
    flashcards: "Карточки",
    exam_questions: "Тест",
    mnemonics: "Мнемоники",
    summary: "Краткий пересказ",
  };
  const itemNoun: Record<string, string> = {
    flashcards: "карточек",
    exam_questions: "вопросов",
    mnemonics: "мнемоник",
    summary: "раздел",
  };
  return (
    <div className="savedResultsList">
      {results.map((r) => (
        <article className="savedResultCard glassPanel" key={r.id}>
          <div className="savedResultHeader">
            <strong className="savedResultTitle">
              {modeLabel[r.mode] ?? r.mode} по «{r.document_title}»
            </strong>
            <span className="savedResultMeta">
              {r.item_count} {itemNoun[r.mode] ?? "элементов"} · обновлено {formatDate(r.updated_at)}
            </span>
          </div>
          <div className="savedResultActions">
            <Button onClick={() => onOpen(r)}>Открыть</Button>
            <Button
              variant="ghost"
              loading={deletingId === r.id}
              onClick={() => onDelete(r.id)}
            >
              Удалить
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function FlashcardsView({
  items,
  cardIndex,
  flipped,
  setCardIndex,
  setFlipped,
}: {
  items: StudyItem[];
  cardIndex: number;
  flipped: boolean;
  setCardIndex: React.Dispatch<React.SetStateAction<number>>;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const card = items[cardIndex] ?? {};
  const front = String(card.front ?? card.term ?? card.question ?? "");
  const back = String(card.back ?? card.answer ?? card.definition ?? "");

  function move(delta: number) {
    setCardIndex((c) => (c + delta + items.length) % items.length);
    setFlipped(false);
  }

  return (
    <div className="flashcardLayout">
      <main>
        <div className="cardMeta">
          <span>Карточка {cardIndex + 1} из {items.length}</span>
          <ProgressBar value={Math.round(((cardIndex + 1) / items.length) * 100)} />
        </div>
        <button
          className={cx("trainerCard", flipped && "flipped")}
          type="button"
          onClick={() => setFlipped((v) => !v)}
          aria-label={flipped ? "Показать вопрос" : "Показать ответ"}
        >
          <div className="trainerCardInner">
            <section className="trainerFace trainerFace--front">
              <Badge>ТЕРМИН / ВОПРОС</Badge>
              <h2>{front}</h2>
              <CircleHelp size={100} className="cardDecorIcon" />
              <span className="cardHint">Нажми, чтобы перевернуть</span>
            </section>
            <section className="trainerFace trainerFace--back">
              <Badge tone="cyan">ОТВЕТ</Badge>
              <h2>{back}</h2>
            </section>
          </div>
        </button>
        <div className="cardControls">
          <Button variant="secondary" onClick={() => move(-1)}>
            <ChevronLeft size={18} /> Предыдущая
          </Button>
          <Button onClick={() => setFlipped((v) => !v)}>
            <RotateCcw size={18} /> Перевернуть
          </Button>
          <Button variant="secondary" onClick={() => move(1)}>
            Следующая <ChevronRight size={18} />
          </Button>
        </div>
        <div className="hotkeys">
          <span>Горячие клавиши:</span>
          <kbd>A</kbd><span>←</span>
          <kbd>Пробел</kbd><span>перевернуть</span>
          <kbd>D</kbd><span>→</span>
        </div>
      </main>
      <aside className="studySidebar">
        {back ? (
          <article className="glassPanel">
            <Badge tone="cyan">ОТВЕТ</Badge>
            <p className="sideAnswerText">{back}</p>
          </article>
        ) : null}
        {card.hint ? (
          <article className="glassPanel">
            <Badge tone="muted">ПОДСКАЗКА</Badge>
            <p className="sideAnswerText">{String(card.hint)}</p>
          </article>
        ) : null}
      </aside>
    </div>
  );
}

function QuizView({
  items,
  selected,
  onSelect,
}: {
  items: StudyItem[];
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);

  const q = items[qIndex] ?? {};
  const question = String(q.question ?? "");
  const answer = String(q.answer ?? "");
  const hint = String(q.hint ?? "");
  const options = Array.isArray(q.options) ? (q.options as string[]) : [];
  const hasOptions = options.length > 0;

  function handleAnswer(idx: number) {
    if (answered) return;
    onSelect(idx);
    setAnswered(true);
    if (hasOptions && idx === 0) setScore((s) => s + 1);
  }

  function next() {
    if (qIndex + 1 >= items.length) { setDone(true); return; }
    setQIndex((i) => i + 1);
    onSelect(-1 as unknown as number);
    setAnswered(false);
  }

  if (done) {
    return (
      <div className="quizDone glassPanel">
        <Trophy size={54} />
        <h2>Тест завершён!</h2>
        <p>Ты ответил на {items.length} вопрос{items.length === 1 ? "" : "ов"}.</p>
        <Button onClick={() => { setQIndex(0); setScore(0); setAnswered(false); setDone(false); onSelect(-1 as unknown as number); }}>
          <RotateCcw size={17} /> Пройти ещё раз
        </Button>
      </div>
    );
  }

  return (
    <div className="quizLayout">
      <main className="quizCard glassPanel">
        <div className="quizProgress">
          <span>Вопрос {qIndex + 1} из {items.length}</span>
          <ProgressBar value={Math.round(((qIndex) / items.length) * 100)} />
        </div>
        <h2 className="quizQuestion">{question}</h2>
        {hasOptions ? (
          <div className="answerList">
            {options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                className={cx(
                  answered && idx === 0 && "correct",
                  answered && selected === idx && idx !== 0 && "wrong",
                  selected === idx && "selected"
                )}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
              >
                <span>{["А", "Б", "В", "Г"][idx] ?? idx + 1}</span>
                {opt}
                {answered && idx === 0 ? <Check size={18} /> : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="quizOpenAnswer">
            <div className="answerReveal glassPanel">
              <Badge>Ответ</Badge>
              <p>{answer}</p>
              {hint ? <><Badge tone="muted">Подсказка</Badge><p>{hint}</p></> : null}
            </div>
          </div>
        )}
        {answered || !hasOptions ? (
          <div className="quizExplanation">
            {answer && !hasOptions ? null : (
              <div className="explanation">
                <Check size={22} />
                <div>
                  <strong>Ответ:</strong>
                  <p>{answer}</p>
                  {hint ? <p className="quizHint">{hint}</p> : null}
                </div>
              </div>
            )}
            <Button onClick={next}>
              {qIndex + 1 >= items.length ? "Завершить тест" : "Следующий вопрос"} <ChevronRight size={17} />
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function MnemonicsView({ items }: { items: StudyItem[] }) {
  return (
    <div className="mnemonicGrid">
      {items.map((item, i) => {
        const concept     = String(item.concept ?? item.term ?? item.title ?? `Понятие ${i + 1}`);
        const hardPart    = String(item.hard_part ?? "");
        const association = String(item.association ?? "");
        const meme        = String(item.meme ?? "");
        const rhyme       = String(item.rhyme ?? item.memory_phrase ?? "");
        const explanation = String(item.explanation ?? item.why_it_works ?? "");
        const example     = String(item.example ?? "");
        return (
          <article className="mnemonicCard glassPanel" key={i}>
            <h2 className="mnemonicConcept">{concept}</h2>
            {hardPart    ? <div className="mnemonicField"><span className="mnemonicLabel">Что сложно запомнить</span><p>{hardPart}</p></div>    : null}
            {association ? <div className="mnemonicField"><span className="mnemonicLabel">Ассоциация</span><p>{association}</p></div>            : null}
            {meme        ? <div className="mnemonicField mnemonicMeme"><span className="mnemonicLabel">Мем</span><p>{meme}</p></div>              : null}
            {rhyme       ? <div className="mnemonicField mnemonicRhyme"><span className="mnemonicLabel">Рифма</span><p>{rhyme}</p></div>          : null}
            {explanation ? <div className="mnemonicField"><span className="mnemonicLabel">Объяснение</span><p>{explanation}</p></div>             : null}
            {example     ? <div className="mnemonicField mnemonicExample"><span className="mnemonicLabel">Пример</span><p>{example}</p></div>     : null}
          </article>
        );
      })}
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

// ─── Summary page ─────────────────────────────────────────────────────────────

function SummaryPage({
  session,
  user,
  onNavigate,
}: {
  session: SessionData | null;
  user: AuthUser;
  onNavigate: (r: RouteId) => void;
}) {
  const [sections, setSections] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const [savedResults, setSavedResults] = useState<LocalSavedResult[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listSavedResults(user.token)
      .then((all) => setSavedResults(all.filter((r) => r.mode === "summary") as LocalSavedResult[]))
      .catch(() => {});
  }, [user.token]);

  useEffect(() => {
    setSections([]);
    setGenerated(false);
    setError("");
  }, [session?.collectionId]);

  async function generate() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateStudy(
        session.collectionId,
        "summary",
        false,
        undefined,
        user.token,
        session.documentTitle,
      );
      const secs = (result.sections ?? result.items ?? []) as Record<string, unknown>[];
      setSections(secs);
      setGenerated(true);
      if (result.result_id) {
        const saved: LocalSavedResult = {
          id: result.result_id,
          mode: "summary",
          document_title: session.documentTitle,
          collection_id: session.collectionId,
          item_count: secs.length,
          items: secs as StudyItem[],
          sections: secs,
          title: result.title ?? undefined,
          created_at: result.created_at ?? new Date().toISOString(),
          updated_at: result.updated_at ?? new Date().toISOString(),
        };
        setSavedResults((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка генерации.");
    } finally {
      setLoading(false);
    }
  }

  function openSaved(r: LocalSavedResult) {
    setSections((r.sections ?? r.items ?? []) as Record<string, unknown>[]);
    setGenerated(true);
    setError("");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSavedResult(user.token, id);
      setSavedResults((prev) => prev.filter((r) => r.id !== id));
      if (generated) { setGenerated(false); setSections([]); }
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  const noSession = !session;

  return (
    <div className="pageWithIntro">
      <div className="pageIntro">
        <div>
          <h1>Краткий пересказ</h1>
          <p>{session ? `Материал: «${session.documentTitle}»` : "Загрузи материалы, чтобы получить пересказ."}</p>
        </div>
        {session ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {generated ? (
              <Button variant="secondary" onClick={() => { setGenerated(false); setSections([]); }}>
                <RotateCcw size={17} /> К списку
              </Button>
            ) : null}
            <Button onClick={generate} loading={loading} disabled={loading || noSession}>
              <Sparkles size={17} /> {generated ? "Обновить" : "Сгенерировать"}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? <ErrorBanner message={error} onClose={() => setError("")} /> : null}
      {loading ? <SpinnerOverlay text="Зачётка составляет краткий пересказ..." /> : null}

      {!generated && savedResults.length > 0 ? (
        <SavedResultsList results={savedResults} deletingId={deletingId} onOpen={openSaved} onDelete={handleDelete} />
      ) : null}

      {!generated && savedResults.length === 0 && !loading ? (
        <EmptyState
          icon={BookOpen}
          title="Здесь появятся пересказы после генерации"
          text={noSession ? "Загрузи материалы, чтобы получить краткий пересказ." : "Нажми «Сгенерировать», чтобы создать пересказ по загруженным файлам."}
          action={noSession ? "Загрузить материалы" : undefined}
          onAction={noSession ? () => onNavigate("upload") : undefined}
        />
      ) : null}

      {generated && sections.length > 0 ? (
        <div className="summaryContent glassPanel">
          {sections.map((sec, i) => {
            const title = String(sec.title ?? "");
            const content = String(sec.content ?? "");
            const secItems = Array.isArray(sec.items) ? sec.items as string[] : [];
            return (
              <section key={i} className="summarySection">
                {title ? <h3>{title}</h3> : null}
                {content ? <p>{content}</p> : null}
                {secItems.length > 0 ? (
                  <ul>{secItems.map((it, j) => <li key={j}>{String(it)}</li>)}</ul>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}

      {generated && sections.length === 0 && !loading ? (
        <EmptyState icon={BookOpen} title="Пересказ не получился" text="По этим материалам не удалось составить пересказ. Попробуй другие файлы." />
      ) : null}
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function ChatPage({
  session,
  onNavigate,
}: {
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>Чат по материалам</h1><p>Загрузи материалы, чтобы задавать вопросы.</p></div></div>
        <EmptyState icon={MessageCircle} title="Чат недоступен" text="Загрузи материалы — после обработки ты сможешь задавать вопросы по ним." action="Загрузить материалы" onAction={() => onNavigate("upload")} />
      </div>
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    setError("");
    try {
      const result = await askDocument(session!.collectionId, text);
      setMessages((m) => [...m, { role: "assistant", text: result.answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="chatPage">
      <div className="pageIntro">
        <div><h1>Чат по материалам</h1><p>Задавай вопросы — нейросеть ответит строго по твоим файлам.</p></div>
      </div>

      {error ? <ErrorBanner message={error} onClose={() => setError("")} /> : null}

      <div className="chatLayout glassPanel">
        <div className="chatMessages">
          {messages.length === 0 ? (
            <div className="chatEmpty">
              <MessageCircle size={44} />
              <p>Напиши вопрос по материалам, которые ты загрузил.</p>
              <p className="chatEmptyHint">Если чего-то нет в материалах — нейросеть честно об этом скажет.</p>
            </div>
          ) : null}
          {messages.map((msg, i) => (
            <div key={i} className={cx("chatMsg", msg.role === "user" ? "chatMsg--user" : "chatMsg--assistant")}>
              {msg.role === "assistant" ? <Brain size={18} /> : null}
              <p>{msg.text}</p>
            </div>
          ))}
          {loading ? (
            <div className="chatMsg chatMsg--assistant">
              <Brain size={18} />
              <Loader2 size={18} className="spin" />
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <div className="chatInput">
          <textarea
            placeholder="Задай вопрос по твоим материалам..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            disabled={loading}
          />
          <Button onClick={send} disabled={!input.trim() || loading} loading={loading} aria-label="Отправить">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress, Calendar, Settings, Profile (clean empty states) ───────────────

function ProgressPage({ session, onNavigate }: { session: SessionData | null; onNavigate: (r: RouteId) => void }) {
  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>Прогресс</h1><p>Прогресс появится после первой тренировки.</p></div></div>
        <EmptyState icon={Grid2X2} title="Прогресса пока нет" text="Пройди тест или потренируйся с карточками — и здесь появится твоя статистика." action="Начать тренировку" onAction={() => onNavigate("flashcards")} />
      </div>
    );
  }
  return (
    <div className="pageWithIntro">
      <div className="pageIntro"><div><h1>Прогресс</h1><p>Следи за своей подготовкой.</p></div></div>
      <div className="glassPanel progressHint">
        <Trophy size={28} />
        <div>
          <strong>Материалы загружены и обработаны</strong>
          <p>Тренируйся с карточками и тестами — прогресс будет накапливаться здесь.</p>
        </div>
        <Button onClick={() => onNavigate("flashcards")}>Начать тренировку</Button>
      </div>
    </div>
  );
}

function CalendarPage({ session, onNavigate }: { session: SessionData | null; onNavigate: (r: RouteId) => void }) {
  if (!session) {
    return (
      <div className="pageWithIntro">
        <div className="pageIntro"><div><h1>Календарь</h1><p>Здесь появятся твои занятия и повторения.</p></div></div>
        <EmptyState icon={CalendarDays} title="Календарь пуст" text="Здесь появятся твои занятия и повторения после начала тренировок." action="Загрузить материалы" onAction={() => onNavigate("upload")} />
      </div>
    );
  }
  return (
    <div className="pageWithIntro">
      <div className="pageIntro"><div><h1>Календарь</h1><p>Планируй повторения и занятия.</p></div></div>
      <div className="glassPanel progressHint">
        <CalendarDays size={28} />
        <div>
          <strong>Материалы готовы к изучению</strong>
          <p>Начни тренировку сегодня — и занятие появится в календаре.</p>
        </div>
        <Button onClick={() => onNavigate("quiz")}>Пройти тест</Button>
      </div>
    </div>
  );
}

function SettingsPage({ user, onUserUpdate }: { user: AuthUser; onUserUpdate: (u: AuthUser) => void }) {
  const [name, setName] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await apiUpdateName(user.token, name);
      const updated = { ...user, name };
      onUserUpdate(updated);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pageWithIntro">
      <div className="pageIntro"><div><h1>Настройки</h1><p>Управляй профилем и предпочтениями.</p></div></div>
      <div className="settingsGrid">
        <article className="glassPanel settingsForm">
          <h2>Профиль</h2>
          {error ? <div className="authError"><Info size={16} /> {error}</div> : null}
          {saved ? <div className="successBanner"><Check size={16} /> Сохранено</div> : null}
          <label className="settingsField">
            <span>Имя</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как тебя зовут?" />
          </label>
          <label className="settingsField">
            <span>Email</span>
            <input type="email" value={user.email} disabled />
          </label>
          <Button onClick={save} loading={loading}>Сохранить изменения</Button>
        </article>
      </div>
    </div>
  );
}

function ProfilePage({
  user,
  session,
  onNavigate,
}: {
  user: AuthUser;
  session: SessionData | null;
  onNavigate: (r: RouteId) => void;
}) {
  const name = displayName(user);
  return (
    <div className="pageWithIntro">
      <div className="pageIntro"><div><h1>Мой профиль</h1><p>Следи за прогрессом и достигай новых высот.</p></div></div>
      <article className="profileHero glassPanel">
        <div className="profileAvatar"><User size={44} /></div>
        <div>
          <h2>{name || "Пользователь"}</h2>
          <p className="profileEmail">{user.email}</p>
          {session ? (
            <p>Загружено файлов: <strong>{session.files.length}</strong></p>
          ) : (
            <p className="mutedText">Материалов пока нет</p>
          )}
        </div>
        {session ? (
          <Button onClick={() => onNavigate("flashcards")}>Продолжить подготовку</Button>
        ) : (
          <Button onClick={() => onNavigate("upload")}>Загрузить материалы</Button>
        )}
      </article>
      {!session ? (
        <EmptyState
          icon={Star}
          title="Прогресса пока нет"
          text="Загрузи материалы и начни тренироваться — здесь появятся твои достижения."
          action="Загрузить первый материал"
          onAction={() => onNavigate("upload")}
        />
      ) : (
        <div className="quickGrid" style={{ marginTop: 20 }}>
          {[
            { label: "Карточки", icon: LibraryBig, route: "flashcards" as RouteId, desc: "Продолжить изучение" },
            { label: "Тесты", icon: ClipboardCheck, route: "quiz" as RouteId, desc: "Проверить знания" },
            { label: "Мнемоники", icon: Brain, route: "mnemonics" as RouteId, desc: "Запомнить легко" },
            { label: "Настройки", icon: Settings, route: "settings" as RouteId, desc: "Изменить профиль" },
          ].map(({ label, icon: Icon, route, desc }) => (
            <button key={label} className="quickCard" type="button" onClick={() => onNavigate(route)}>
              <div><strong>{label}</strong><span>{desc}</span></div>
              <Icon size={46} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [route, setRoute] = useState<RouteId>(routeFromLocation);
  const [user, setUser] = useState<AuthUser | null>(loadAuth);
  const [session, setSession] = useState<SessionData | null>(loadSession);

  const navigate = useCallback((next: RouteId) => {
    setRoute(next);
    window.history.pushState(null, "", next === "landing" ? "/" : `/${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const titles: Partial<Record<RouteId, string>> = {
      landing: "Зачётка — от конспекта до конкурса",
      login: "Вход — Зачётка",
      register: "Регистрация — Зачётка",
      dashboard: "Дашборд — Зачётка",
      upload: "Загрузить материалы — Зачётка",
      processing: "Обработка — Зачётка",
      materials: "Мои материалы — Зачётка",
      summary: "Краткий пересказ — Зачётка",
      flashcards: "Карточки — Зачётка",
      quiz: "Тесты — Зачётка",
      mnemonics: "Мнемоники — Зачётка",
      chat: "Чат — Зачётка",
      progress: "Прогресс — Зачётка",
      settings: "Настройки — Зачётка",
      profile: "Профиль — Зачётка",
    };
    document.title = titles[route] ?? "Зачётка";
  }, [route]);

  function handleAuth(newUser: AuthUser) {
    saveAuth(newUser);
    setUser(newUser);
    navigate("dashboard");
  }

  function handleLogout() {
    saveAuth(null);
    setUser(null);
    navigate("landing");
  }

  function handleSessionReady(s: SessionData) {
    saveSession(s);
    setSession(s);
  }

  function handleUserUpdate(u: AuthUser) {
    saveAuth(u);
    setUser(u);
  }

  // Redirect unauthenticated users from protected routes (effect, not render)
  useEffect(() => {
    if (!user && !PUBLIC_ROUTES.has(route)) {
      navigate("login");
    }
  }, [user, route, navigate]);

  // Auth pages (public)
  if (route === "landing") return <LandingPage onNavigate={navigate} />;
  if (route === "login") {
    return (
      <AuthPage
        mode="login"
        onSuccess={handleAuth}
        onSwitch={() => navigate("register")}
      />
    );
  }
  if (route === "register") {
    return (
      <AuthPage
        mode="register"
        onSuccess={handleAuth}
        onSwitch={() => navigate("login")}
      />
    );
  }

  // While effect hasn't fired yet for unauthenticated user
  if (!user) return null;

  function renderPage() {
    if (!user) return null;
    switch (route) {
      case "dashboard": return <DashboardPage user={user} session={session} onNavigate={navigate} />;
      case "upload": return <UploadPage onNavigate={navigate} onSessionReady={handleSessionReady} />;
      case "processing": return <ProcessingPage session={session} onNavigate={navigate} />;
      case "materials": return <MaterialsPage session={session} onNavigate={navigate} />;
      case "topics": return <TopicsPage session={session} onNavigate={navigate} />;
      case "summary": return <SummaryPage session={session} user={user} onNavigate={navigate} />;
      case "flashcards": return <StudyPage mode="flashcards" session={session} user={user} onNavigate={navigate} />;
      case "quiz": return <StudyPage mode="quiz" session={session} user={user} onNavigate={navigate} />;
      case "mnemonics": return <StudyPage mode="mnemonics" session={session} user={user} onNavigate={navigate} />;
      case "chat": return <ChatPage session={session} onNavigate={navigate} />;
      case "progress": return <ProgressPage session={session} onNavigate={navigate} />;
      case "calendar": return <CalendarPage session={session} onNavigate={navigate} />;
      case "settings": return <SettingsPage user={user} onUserUpdate={handleUserUpdate} />;
      case "profile": return <ProfilePage user={user} session={session} onNavigate={navigate} />;
      default: return <DashboardPage user={user} session={session} onNavigate={navigate} />;
    }
  }

  return (
    <AppLayout
      route={route}
      user={user}
      hasSession={!!session}
      onNavigate={navigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
