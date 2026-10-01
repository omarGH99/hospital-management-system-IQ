import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { adminApi, doctorApi, appointmentApi } from '../services/api';
import { LayoutDashboard, Calendar, Users, FileText, Receipt, Bell, LogOut, Stethoscope, Building2, X, Check, AlertCircle, Menu, Globe, ChevronDown } from 'lucide-react';
import { useT, useLanguage, LANGUAGES } from '../i18n';

// ── Sidebar ────────────────────────────────────────────────
const NAV_BY_ROLE = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
  ],
  doctor: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'records', label: 'Medical Records', icon: FileText },
  ],
  receptionist: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
  ],
  patient: [
    { id: 'dashboard', label: 'My Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'My Records', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
  ],
};

export function Sidebar({ page, setPage, open, onClose }) {
  const t = useT();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const nav = NAV_BY_ROLE[user?.role] || [];
  const roleColors = { admin: 'bg-brand-900', doctor: 'bg-emerald-900', receptionist: 'bg-violet-900', patient: 'bg-slate-900' };
  const bg = roleColors[user?.role] || 'bg-slate-900';

  return (
    <aside className={`${bg} ${collapsed ? 'lg:w-16' : ''} w-60 flex-shrink-0 flex flex-col h-screen fixed inset-y-0 start-0 z-40 lg:sticky lg:top-0 lg:z-auto transition-all duration-200 ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} lg:translate-x-0 lg:rtl:translate-x-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        {!collapsed && <div className="text-white font-bold text-sm leading-tight">{t("Riverside General")}<br/><span className="font-normal opacity-60 text-xs">{t("Hospital")}</span></div>}
        <button onClick={() => setCollapsed(c => !c)} className="ms-auto text-white/40 hover:text-white hidden lg:block"><Menu size={16} /></button>
        <button onClick={onClose} className="ms-auto text-white/60 hover:text-white lg:hidden" aria-label={t("Close menu")}><X size={18} /></button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {!collapsed && <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-4 py-2">{t(user?.role)}</div>}
        {nav.map(item => (
          <button key={item.id} onClick={() => { setPage(item.id); onClose?.(); }}
            className={`sidebar-link w-full ${page === item.id ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed ? t(item.label) : <span className="lg:hidden">{t(item.label)}</span>}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
              <div className="text-white/40 text-[10px] capitalize">{t(user?.role)}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-white/40 hover:text-white ms-auto">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Notification bell (built from data the app already loads) ─
function NotificationBell() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const role = user?.role;

  const { data: admin } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.stats().then(r => r.data), enabled: role === 'admin' || role === 'receptionist' });
  const { data: doc } = useQuery({ queryKey: ['doctor-dashboard'], queryFn: () => doctorApi.dashboard().then(r => r.data), enabled: role === 'doctor' });
  const { data: appts } = useQuery({ queryKey: ['patient-appointments'], queryFn: () => appointmentApi.list().then(r => r.data), enabled: role === 'patient' });

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const items = [];
  if (admin) {
    const waiting = (admin.appointments_by_status?.scheduled || 0) + (admin.appointments_by_status?.confirmed || 0);
    if (admin.pending_invoices > 0) items.push({ text: t('{{n}} unpaid invoices', { n: admin.pending_invoices }), to: '/invoices' });
    if (waiting > 0) items.push({ text: t('{{n}} appointments still waiting today', { n: waiting }), to: '/appointments' });
  }
  if (doc?.stats?.pending_today > 0) items.push({ text: t('{{n}} patients still to see today', { n: doc.stats.pending_today }), to: '/schedule' });
  if (appts?.data) {
    const next = appts.data
      .filter(a => a.status !== 'cancelled' && !dayjs(a.appointment_date).isBefore(dayjs(), 'day') && a.status !== 'completed')
      .sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time))[0];
    if (next) items.push({ text: t('Next visit: {{date}} at {{time}} with {{doctor}}', { date: dayjs(next.appointment_date).format('MMM D'), time: next.appointment_time?.slice(0, 5), doctor: next.doctor?.user?.name }), to: '/appointments' });
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} aria-label={t("Notifications")}
        className="relative w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-brand-300">
        <Bell size={17} />
        {items.length > 0 && <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800">{t("Notifications")}</div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">{t("You're all caught up")}</div>
          ) : items.map((it, i) => (
            <button key={i} onClick={() => { setOpen(false); navigate(it.to); }}
              className="w-full text-start px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0">
              {it.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Language switch (menu of every supported language) ─────
export function LanguageSwitcher({ className = '' }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} aria-label={t('Change language')} aria-expanded={open}
        className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-sm font-semibold ${className || 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}>
        <Globe size={15} />
        <span>{LANGUAGES[lang].label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {Object.entries(LANGUAGES).map(([code, meta]) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }} lang={code} dir={meta.dir}
              className={`w-full text-start px-4 py-2.5 text-sm hover:bg-slate-50 ${code === lang ? 'font-bold text-brand-600' : 'text-slate-600'}`}>
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────
export function Topbar({ title, subtitle, action, onMenu }) {
  const t = useT();
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
      <button onClick={onMenu} className="lg:hidden w-9 h-9 flex-shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600" aria-label={t("Open menu")}><Menu size={18} /></button>
      <div className="flex-1 min-w-0">
        <h1 className="page-title">{t(title)}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{t(subtitle)}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <LanguageSwitcher />
        <NotificationBell />
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  const t = useT();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-slide-up" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{t(title)}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
const STATUS_MAP = {
  scheduled:   'badge-blue',
  confirmed:   'badge-green',
  in_progress: 'badge-violet',
  completed:   'badge-green',
  cancelled:   'badge-red',
  no_show:     'badge-gray',
  paid:        'badge-green',
  unpaid:      'badge-red',
  partial:     'badge-yellow',
  pending:     'badge-yellow',
  active:      'badge-green',
};

export function StatusBadge({ status }) {
  const t = useT();
  return (
    <span className={STATUS_MAP[status] || 'badge-gray'}>
      {t(status?.replace('_', ' '))}
    </span>
  );
}

// ── Toast ──────────────────────────────────────────────────
export function Toast({ message, type, onClose }) {
  const t = useT();
  if (!message) return null;
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-brand-600' };
  const icons = { success: <Check size={15} />, error: <X size={15} />, info: <AlertCircle size={15} /> };
  return (
    <div className={`fixed bottom-6 end-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-slide-up ${colors[type] || colors.info}`}>
      {icons[type]} {t(message)}
      <button onClick={onClose} className="ms-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
// row: on phones, lay the card out horizontally (icon left, text right) so stacked cards stay short
export function StatCard({ label, value, sub, icon: Icon, color = 'brand', trend, row = false }) {
  const t = useT();
  const colors = {
    brand:   { bg: 'bg-brand-50',   text: 'text-brand-600',   icon: 'text-brand-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    icon: 'text-rose-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'text-amber-500' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  icon: 'text-violet-500' },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className={`stat-card ${row ? 'flex items-center gap-4 sm:block' : ''}`}>
      <div className={`flex items-start justify-between ${row ? 'sm:mb-3 flex-shrink-0' : 'mb-3'}`}>
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
          {Icon && <Icon size={22} className={c.icon} />}
        </div>
        {trend && <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
      <div className={row ? 'min-w-0' : ''}>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
        <div className="text-sm text-slate-500">{t(label)}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{t(sub)}</div>}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ message = 'No data found', icon: Icon }) {
  const t = useT();
  return (
    <div className="text-center py-16">
      {Icon && <Icon size={40} className="text-slate-300 mx-auto mb-3" />}
      <p className="text-slate-400 text-sm">{t(message)}</p>
    </div>
  );
}

// ── Loading Spinner ────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${s[size]} border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto`} />
  );
}

// ── Form Field ─────────────────────────────────────────────
export function Field({ label, required, children, error }) {
  const t = useT();
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t(label)}{required && <span className="text-rose-500 ms-0.5">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-rose-500 mt-1">{t(error)}</p>}
    </div>
  );
}
