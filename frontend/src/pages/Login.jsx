import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useT } from '../i18n';
import { LanguageSwitcher } from '../components/shared';

export default function Login({ onLogin }) {
  const t = useT();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DEMO_ACCOUNTS = [
    { role: 'Admin',         email: 'admin@hospital.com',        pw: 'password', color: 'bg-brand-50 border-brand-200 text-brand-700' },
    { role: 'Doctor',        email: 'dr.omar@hospital.com',       pw: 'password', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { role: 'Receptionist',  email: 'receptionist@hospital.com',  pw: 'password', color: 'bg-violet-50 border-violet-200 text-violet-700' },
    { role: 'Patient',       email: 'dashni@email.com',           pw: 'password', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  ];

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const quickLogin = (acc) => setForm({ email: acc.email, password: acc.pw });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-10"><LanguageSwitcher className="border-white/20 bg-white/10 text-white hover:bg-white/20" /></div>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left — Branding */}
        <div className="text-white hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-xl">{t("Riverside General Hospital")}</div>
              <div className="text-white/60 text-sm">{t("Management System")}</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">{t("Healthcare")}<br/>{t("Management")}<br/>{t("Made Simple")}</h1>
          <p className="text-white/60 text-lg leading-relaxed">{t("Complete hospital management — appointments, medical records, prescriptions, billing and more in one unified platform.")}</p>
          <div className="flex gap-6 mt-8">
            {[['4 Roles', 'Admin, Doctor, Receptionist, Patient'], ['Real-time', 'Live appointment tracking'], ['PDF Export', 'Prescriptions & invoices']].map(([head, desc]) => (
              <div key={head}>
                <div className="font-bold text-white">{t(head)}</div>
                <div className="text-white/50 text-xs mt-0.5">{t(desc)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login form */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <Stethoscope size={20} className="text-brand-600" />
            <span className="font-bold text-slate-800">{t("Hospital System")}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{t("Sign in")}</h2>
          <p className="text-slate-400 text-sm mb-6">{t("Enter your credentials to access the system")}</p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-4">{t(error)}</div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t("Email")}</label>
              <input type="email" className="input" placeholder={t("doctor@hospital.com")}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t("Password")}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pe-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('Sign in')}
            </button>
          </form>

          {/* Demo accounts (dev builds only) */}
          {import.meta.env.DEV && <div className="mt-6">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium">{t("DEMO ACCOUNTS — click to fill")}</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={() => quickLogin(acc)}
                  className={`text-start px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] ${acc.color}`}>
                  <div>{t(acc.role)}</div>
                  <div className="font-normal opacity-70 mt-0.5 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
