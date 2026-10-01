import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminApi, appointmentApi } from '../../services/api';
import { StatCard, Spinner, StatusBadge } from '../../components/shared';
import { Users, Stethoscope, Calendar, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { useT } from '../../i18n';

const PIE_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e'];

const fmt = n => new Intl.NumberFormat('en').format(n);

export default function AdminDashboard({ setPage }) {
  const t = useT();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: apptStats } = useQuery({
    queryKey: ['appt-stats'],
    queryFn: () => appointmentApi.stats().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: todayAppts } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => appointmentApi.list({ today: 1 }).then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const statusData = stats?.appointments_by_status
    ? Object.entries(stats.appointments_by_status).map(([name, value]) => ({ name: t(name.replace('_', ' ')), value }))
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-slide-up">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients"      value={fmt(stats?.total_patients || 0)}      icon={Users}       color="brand" />
        <StatCard label="Total Doctors"       value={fmt(stats?.total_doctors || 0)}        icon={Stethoscope} color="emerald" />
        <StatCard label="Today's Appointments" value={fmt(stats?.today_appointments || 0)} icon={Calendar}    color="violet" />
        <StatCard label="Monthly Revenue"     value={t('{{n}}M IQD', { n: ((stats?.monthly_revenue || 0) / 1000000).toFixed(1) })} icon={DollarSign} color="amber" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard row label="Today Completed" value={fmt(apptStats?.today_completed || 0)} icon={TrendingUp} color="emerald" sub={t('of {{n}} total', { n: apptStats?.today_total || 0 })} />
        <StatCard row label="Pending Today"   value={fmt(apptStats?.today_pending || 0)}   icon={Calendar}   color="amber"  />
        <StatCard row label="Unpaid Invoices" value={fmt(stats?.pending_invoices || 0)}     icon={Receipt}    color="rose"   />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">{t("Revenue & Patients (last 6 months)")}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(stats?.monthly || []).map(m => ({ ...m, month: t(m.month) }))} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <YAxis yAxisId="patients" orientation="right" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={v => <span style={{ color: '#475569' }}>{t(v)}</span>} />
              <Tooltip formatter={(v, n) => [n === t('Revenue') ? t('{{n}}M IQD', { n: (v/1000000).toFixed(1) }) : v, n]} />
              <Bar yAxisId="left" dataKey="revenue" name={t('Revenue')} fill="#7dd3fc" radius={[6,6,0,0]} />
              <Bar yAxisId="patients" dataKey="patients" name={t('Patients')} fill="#0ea5e9" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h3 className="section-title">{t("Today by Status")}</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 capitalize">{t(d.name.replace('_', ' '))}</span>
                    </div>
                    <span className="font-bold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">{t("No appointments today")}</div>
          )}
        </div>
      </div>

      {/* Today's appointments table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="section-title mb-0">{t("Today's Appointments")}</h3>
          <button onClick={() => setPage('appointments')} className="text-xs text-brand-600 font-semibold hover:underline">{t("View all →")}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Patient', 'Doctor', 'Department', 'Time', 'Status', 'Payment'].map(h => (
                  <th key={h} className="table-th">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayAppts?.data?.slice(0, 8).map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="table-td font-medium">{a.patient?.user?.name}</td>
                  <td className="table-td text-slate-500">{a.doctor?.user?.name}</td>
                  <td className="table-td text-slate-500">{t(a.department?.name)}</td>
                  <td className="table-td font-mono text-xs">{a.appointment_time?.slice(0,5)}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  <td className="table-td"><StatusBadge status={a.payment_status} /></td>
                </tr>
              ))}
              {(!todayAppts?.data || todayAppts.data.length === 0) && (
                <tr><td colSpan={6} className="table-td text-center text-slate-400 py-8">{t("No appointments today")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
