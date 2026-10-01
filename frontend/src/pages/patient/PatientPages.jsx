import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi, patientApi, invoiceApi, prescriptionApi } from '../../services/api';
import { StatCard, Modal, StatusBadge, Spinner, EmptyState } from '../../components/shared';
import { Calendar, FileText, Receipt, Pill, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import { useT } from '../../i18n';

const fmt = n => new Intl.NumberFormat('en').format(n);

export function PatientDashboard({ setPage }) {
  const t = useT();
  const { user, profile } = useAuth();

  const { data: history } = useQuery({
    queryKey: ['patient-history', profile?.id],
    queryFn: () => patientApi.history(profile.id).then(r => r.data),
    enabled: !!profile?.id,
  });

  const { data: appts } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => appointmentApi.list().then(r => r.data),
  });

  const upcoming = appts?.data?.filter(a => !dayjs(a.appointment_date).isBefore(dayjs(), 'day') && a.status !== 'cancelled') || [];
  const past = appts?.data?.filter(a => a.status === 'completed') || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-6 text-white mb-6">
        <div className="text-white/70 text-sm mb-1">{t("Welcome back")}</div>
        <div className="text-2xl font-bold">{t(user?.name || 'Patient')}</div>
        <div className="flex gap-6 mt-4 text-sm">
          {[['Blood Type', profile?.blood_type || '—'], ['Age', t('{{n}}y', { n: dayjs().diff(profile?.date_of_birth, 'year') })], ['ID', profile?.national_id]].map(([k,v]) => (
            <div key={k}><div className="text-white/60">{t(k)}</div><div className="font-semibold" dir="auto">{t(v)}</div></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard row label="Upcoming Appointments" value={upcoming.length} icon={Calendar} color="brand" />
        <StatCard row label="Past Visits" value={past.length} icon={FileText} color="emerald" />
        <StatCard row label="Active Prescriptions" value={history?.prescriptions?.filter(x => x.status === 'active' && (!x.valid_until || !dayjs(x.valid_until).isBefore(dayjs(), 'day'))).length ?? '—'} icon={Pill} color="violet" />
      </div>

      {/* Upcoming */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{t("Upcoming Appointments")}</h3>
          <button onClick={() => setPage('appointments')} className="text-xs text-brand-600 font-semibold hover:underline">{t("View all")}</button>
        </div>
        {upcoming.length === 0 ? <EmptyState message="No upcoming appointments" icon={Calendar} /> : (
          <div className="divide-y divide-slate-100">
            {upcoming.slice(0,4).map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-brand-600">{dayjs(a.appointment_date).format('MMM').toUpperCase()}</div>
                  <div className="text-lg font-bold text-brand-700 leading-none">{dayjs(a.appointment_date).format('D')}</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{a.doctor?.user?.name}</div>
                  <div className="text-xs text-slate-400">{t(a.department?.name)} · {a.appointment_time?.slice(0,5)}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PatientAppointments() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => appointmentApi.list().then(r => r.data),
  });

  const appts = data?.data || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : appts.length === 0 ? (
          <EmptyState message="No appointments found" icon={Calendar} />
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Date','Time','Doctor','Department','Status','Reason'].map(h=><th key={h} className="table-th">{t(h)}</th>)}</tr></thead>
            <tbody>
              {appts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="table-td font-medium">{dayjs(a.appointment_date).format('MMM D, YYYY')}</td>
                  <td className="table-td font-mono text-xs">{a.appointment_time?.slice(0,5)}</td>
                  <td className="table-td">{a.doctor?.user?.name}</td>
                  <td className="table-td text-slate-500 text-xs">{t(a.department?.name)}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  <td className="table-td text-slate-500 text-xs truncate max-w-xs">{t(a.reason || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

export function PatientRecords() {
  const t = useT();
  const { profile } = useAuth();
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-history'],
    queryFn: () => patientApi.history(profile?.id).then(r => r.data),
    enabled: !!profile?.id,
  });

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800">{t('Medical Records ({{n}})', { n: data?.records?.length || 0 })}</div>
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : (
          <div className="divide-y divide-slate-100">
            {data?.records?.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(r)}>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><FileText size={18} className="text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{t(r.diagnosis)}</div>
                  <div className="text-xs text-slate-400">{r.doctor?.user?.name} · {dayjs(r.visit_date).format('MMM D, YYYY')}</div>
                </div>
                <span className="text-xs text-brand-600 font-semibold">{t("View →")}</span>
              </div>
            ))}
            {(!data?.records || data.records.length === 0) && <EmptyState message="No medical records" icon={FileText} />}
          </div>
        )}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Medical Record"
          footer={<button className="btn-secondary" onClick={() => setSelected(null)}>{t("Close")}</button>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Visit Date', dayjs(selected.visit_date).format('MMM D, YYYY')], ['Doctor', selected.doctor?.user?.name]].map(([k,v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">{t(k)}</div><div className="font-semibold text-slate-800 mt-1 text-sm">{t(v)}</div></div>
              ))}
            </div>
            {selected.vital_signs && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(selected.vital_signs).filter(([,v])=>v).map(([k,v]) => (
                  <div key={k} className="bg-brand-50 rounded-xl p-2 text-center">
                    <div className="text-[10px] text-brand-500 capitalize">{t(k.replace('_',' '))}</div>
                    <div className="font-bold text-brand-700 text-sm mt-0.5">{t(v)}</div>
                  </div>
                ))}
              </div>
            )}
            {[['Chief Complaint', selected.chief_complaint], ['Diagnosis', selected.diagnosis], ['Treatment Plan', selected.treatment_plan]].map(([k,v]) => v && (
              <div key={k}><div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t(k)}</div>
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">{t(v)}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function PatientInvoices() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-invoices'],
    queryFn: () => invoiceApi.list().then(r => r.data),
  });

  const downloadPdf = async (id, num) => {
    const res = await invoiceApi.downloadPdf(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `invoice-${num}.pdf`; a.click();
  };

  const invoices = data?.data || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : invoices.length === 0 ? (
          <EmptyState message="No invoices found" icon={Receipt} />
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Invoice #','Date','Amount','Status','Actions'].map(h=><th key={h} className="table-th">{t(h)}</th>)}</tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-xs font-bold text-brand-700">{inv.invoice_number}</td>
                  <td className="table-td text-slate-500">{dayjs(inv.created_at).format('MMM D, YYYY')}</td>
                  <td className="table-td font-bold">{t('{{n}} IQD', { n: fmt(inv.total) })}</td>
                  <td className="table-td"><StatusBadge status={inv.status} /></td>
                  <td className="table-td">
                    <button onClick={() => downloadPdf(inv.id, inv.invoice_number)} className="btn-secondary text-xs py-1 px-2">
                      <Download size={12} /> {t("PDF")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

export function PatientPrescriptions() {
  const t = useT();
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['patient-history', profile?.id],
    queryFn: () => patientApi.history(profile.id).then(r => r.data),
    enabled: !!profile?.id,
  });
  const prescriptions = data?.prescriptions || [];

  const downloadPdf = async (id) => {
    const res = await prescriptionApi.downloadPdf(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `prescription-${id}.pdf`; a.click();
  };

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800">{t('Prescriptions ({{n}})', { n: prescriptions.length })}</div>
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : prescriptions.length === 0 ? (
          <EmptyState message="No prescriptions yet" icon={Pill} />
        ) : (
          <div className="divide-y divide-slate-100">
            {prescriptions.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><Pill size={18} className="text-violet-600" /></div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{(p.medications || []).map(m => `${m.name} ${m.dosage}`).join(', ')}</div>
                  <div className="text-xs text-slate-400">{t('{{doctor}} · {{date}} · valid until {{until}}', { doctor: p.doctor?.user?.name, date: dayjs(p.prescribed_date).format('MMM D, YYYY'), until: dayjs(p.valid_until).format('MMM D, YYYY') })}</div>
                </div>
                <StatusBadge status={p.status} />
                <button onClick={() => downloadPdf(p.id)} className="btn-secondary text-xs py-1 px-2"><Download size={12} /> {t("PDF")}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
