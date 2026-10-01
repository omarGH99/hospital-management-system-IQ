import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi, doctorApi, patientApi, invoiceApi } from '../../services/api';
import { Modal, StatusBadge, Spinner, Toast, Field, StatCard } from '../../components/shared';
import { Receipt, Search, Plus, Download } from 'lucide-react';
import dayjs from 'dayjs';
import { useT } from '../../i18n';

const fmt = n => new Intl.NumberFormat('en').format(n);

// ── Doctors Page ────────────────────────────────────────────
export function Doctors() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const qc = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => doctorApi.list({ search }).then(r => r.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data),
  });

  const [form, setForm] = useState({
    name:'', email:'', password:'password', phone:'', department_id:'', specialty:'',
    qualification:'MBBS, MD', experience_years:5, consultation_fee:50000,
    license_number:'', available_days:['Monday','Tuesday','Wednesday','Thursday'],
    shift_start:'08:00', shift_end:'16:00', bio:'',
  });

  const addMutation = useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => { qc.invalidateQueries(['doctors']); setShowAdd(false); setToast({ message:'Doctor added!', type:'success' }); },
    onError: e => setToast({ message: e.response?.data?.message || 'Error', type:'error' }),
  });

  const SPECIALTIES = ['General Physician','Cardiologist','Orthopedic Surgeon','Pediatrician','Neurologist','Dermatologist','Ophthalmologist'];
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const toggleDay = d => setForm(f => ({
    ...f, available_days: f.available_days.includes(d) ? f.available_days.filter(x=>x!==d) : [...f.available_days, d]
  }));

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input ps-9" placeholder={t("Search doctors...")} value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> {t("Add Doctor")}</button>
      </div>

      {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors?.map(d => (
            <div key={d.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(d)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {d.user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{d.user?.name}</div>
                  <div className="text-xs text-slate-400">{t(d.specialty)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[['Department', d.department?.name], ['Experience', t('{{n}}y', { n: d.experience_years })], ['Fee', t('{{n}} IQD', { n: fmt(d.consultation_fee) })], ['License', d.license_number]].map(([k,v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">{t(k)}</div>
                    <div className="font-semibold text-slate-700 truncate">{t(v)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.available_days?.slice(0,3).map(day => <span key={day} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">{t(day.slice(0,3))}</span>)}
                {d.available_days?.length > 3 && <span className="text-[10px] text-slate-400">+{d.available_days.length-3}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Detail Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.user?.name} footer={<button className="btn-secondary" onClick={() => setSelected(null)}>{t("Close")}</button>}>
          <div className="space-y-3">
            {[['Email', selected.user?.email], ['Phone', selected.user?.phone], ['Specialty', selected.specialty], ['Qualification', selected.qualification], ['Experience', t('{{n}} years', { n: selected.experience_years })], ['Consultation Fee', t('{{n}} IQD', { n: fmt(selected.consultation_fee) })], ['License', selected.license_number], ['Shift', `${selected.shift_start} — ${selected.shift_end}`]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">{t(k)}</span><span className="font-semibold text-slate-800">{v || '—'}</span>
              </div>
            ))}
            <div>
              <div className="text-slate-500 text-sm mb-2">{t("Available Days")}</div>
              <div className="flex flex-wrap gap-2">{selected.available_days?.map(d => <span key={d} className="badge-blue">{t(d)}</span>)}</div>
            </div>
            {selected.bio && <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">{t(selected.bio)}</div>}
          </div>
        </Modal>
      )}

      {/* Add Doctor Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Doctor"
        footer={<><button className="btn-secondary" onClick={() => setShowAdd(false)}>{t("Cancel")}</button><button className="btn-primary" disabled={addMutation.isPending} onClick={() => addMutation.mutate(form)}>{addMutation.isPending ? t('Adding...') : t('Add Doctor')}</button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name" required><input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></Field>
            <Field label="Email" required><input type="email" className="input" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></Field>
            <Field label="Department" required>
              <select className="select" value={form.department_id} onChange={e => setForm(f=>({...f,department_id:e.target.value}))}>
                <option value="">{t("Select")}</option>{departments?.map(d => <option key={d.id} value={d.id}>{t(d.name)}</option>)}
              </select>
            </Field>
            <Field label="Specialty" required>
              <select className="select" value={form.specialty} onChange={e => setForm(f=>({...f,specialty:e.target.value}))}>
                <option value="">{t("Select")}</option>{SPECIALTIES.map(s => <option key={s}>{t(s)}</option>)}
              </select>
            </Field>
            <Field label="Experience (years)"><input type="number" className="input" value={form.experience_years} onChange={e => setForm(f=>({...f,experience_years:parseInt(e.target.value)}))} /></Field>
            <Field label="Consultation Fee (IQD)"><input type="number" className="input" value={form.consultation_fee} onChange={e => setForm(f=>({...f,consultation_fee:parseInt(e.target.value)}))} /></Field>
            <Field label="License Number" required><input className="input" value={form.license_number} onChange={e => setForm(f=>({...f,license_number:e.target.value}))} /></Field>
            <Field label="Shift"><div className="flex gap-2"><input type="time" className="input" value={form.shift_start} onChange={e => setForm(f=>({...f,shift_start:e.target.value}))} /><input type="time" className="input" value={form.shift_end} onChange={e => setForm(f=>({...f,shift_end:e.target.value}))} /></div></Field>
          </div>
          <Field label="Available Days">
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map(d => <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.available_days.includes(d) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>{t(d.slice(0,3))}</button>)}
            </div>
          </Field>
          <Field label="Bio"><textarea className="input resize-none h-16" value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} /></Field>
        </div>
      </Modal>
    </div>
  );
}

// ── Patients Page ───────────────────────────────────────────
export function Patients() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => patientApi.list({ search }).then(r => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['patient-detail', selected?.id],
    queryFn: () => patientApi.get(selected.id).then(r => r.data),
    enabled: !!selected,
  });

  const patients = data?.data || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input ps-9" placeholder={t("Search patients by name, email, national ID...")} value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="text-sm text-slate-400">{t('{{n}} patients', { n: patients.length })}</div>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Patient','Gender','Age','Blood','National ID','Actions'].map(h => <th key={h} className="table-th">{t(h)}</th>)}</tr></thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="table-td"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">{p.user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div><div className="font-semibold text-sm">{p.user?.name}</div><div className="text-xs text-slate-400">{p.user?.email}</div></div></div></td>
                  <td className="table-td capitalize text-slate-500">{t(p.gender)}</td>
                  <td className="table-td">{t('{{n}}y', { n: dayjs().diff(p.date_of_birth,'year') })}</td>
                  <td className="table-td"><span className="badge-red" dir="auto">{p.blood_type || '—'}</span></td>
                  <td className="table-td font-mono text-xs text-slate-600">{p.national_id}</td>
                  <td className="table-td"><button className="btn-secondary text-xs py-1 px-3" onClick={() => setSelected(p)}>{t("View History")}</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={t('{{name}} — Medical History', { name: selected.user?.name })} footer={<button className="btn-secondary" onClick={() => setSelected(null)}>{t("Close")}</button>}>
          {!detail ? <div className="py-8 flex justify-center"><Spinner /></div> : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[['Blood Type', detail.blood_type || '—'], ['Age', t('{{n}}y', { n: dayjs().diff(detail.date_of_birth,'year') })], ['Gender', detail.gender]].map(([k,v]) => (
                  <div key={k} className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-xs text-slate-400">{t(k)}</div><div className="font-bold text-slate-800 mt-1 capitalize" dir="auto">{t(v)}</div></div>
                ))}
              </div>
              {detail.allergies && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm"><strong className="text-rose-700">{t("Allergies:")}</strong> <span className="text-rose-600">{t(detail.allergies)}</span></div>}
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">{t('Recent Appointments ({{n}})', { n: detail.appointments?.length || 0 })}</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detail.appointments?.slice(0,5).map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                      <span className="font-medium">{dayjs(a.appointment_date).format('MMM D, YYYY')}</span>
                      <span className="text-slate-500">{a.doctor?.user?.name}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">{t('Medical Records ({{n}})', { n: detail.medical_records?.length || 0 })}</div>
                <div className="space-y-2">
                  {detail.medical_records?.slice(0,3).map(r => (
                    <div key={r.id} className="bg-slate-50 rounded-lg p-3 text-xs">
                      <div className="font-semibold mb-1">{t(r.diagnosis)}</div>
                      <div className="text-slate-400">{dayjs(r.visit_date).format('MMM D, YYYY')} · {r.doctor?.user?.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Invoices Page ───────────────────────────────────────────
export function Invoices() {
  const t = useT();
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => invoiceApi.list({ status: filter }).then(r => r.data),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }) => invoiceApi.markPaid(id, { payment_method: method }),
    onSuccess: () => { qc.invalidateQueries(['invoices']); setToast({ message:'Payment recorded!', type:'success' }); },
  });

  const downloadPdf = async (id, num) => {
    const res = await invoiceApi.downloadPdf(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `invoice-${num}.pdf`; a.click();
  };

  const invoices = data?.data || [];
  const unpaid = data?.summary?.outstanding ?? 0;
  const paid = data?.summary?.collected ?? 0;

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard row label="Total Invoices" value={data?.summary?.total ?? invoices.length} icon={Receipt} color="brand" />
        <StatCard row label="Collected" value={t('{{n}}M IQD', { n: (paid/1000000).toFixed(1) })} icon={Receipt} color="emerald" />
        <StatCard row label="Outstanding" value={t('{{n}}M IQD', { n: (unpaid/1000000).toFixed(1) })} icon={Receipt} color="rose" />
      </div>
      <div className="flex gap-3 mb-4">
        <select className="select w-44" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">{t("All Status")}</option>
          {['unpaid','paid','partial','cancelled'].map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Invoice #','Patient','Date','Total','Status','Payment Method','Actions'].map(h => <th key={h} className="table-th">{t(h)}</th>)}</tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono text-xs font-semibold text-brand-700">{inv.invoice_number}</td>
                  <td className="table-td font-medium">{inv.patient?.user?.name}</td>
                  <td className="table-td text-slate-500 text-xs">{dayjs(inv.created_at).format('MMM D, YYYY')}</td>
                  <td className="table-td font-bold">{t('{{n}} IQD', { n: fmt(inv.total) })}</td>
                  <td className="table-td"><StatusBadge status={inv.status} /></td>
                  <td className="table-td text-slate-500 capitalize">{t(inv.payment_method || '—')}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      {inv.status === 'unpaid' && (
                        <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none"
                          onChange={e => e.target.value && payMutation.mutate({ id: inv.id, method: e.target.value })}
                          defaultValue="">
                          <option value="" disabled>{t("Mark Paid")}</option>
                          {['cash','card','insurance','bank'].map(m => <option key={m} value={m}>{t(m)}</option>)}
                        </select>
                      )}
                      <button onClick={() => downloadPdf(inv.id, inv.invoice_number)} className="btn-secondary text-xs py-1 px-2">
                        <Download size={12} />
                      </button>
                    </div>
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
