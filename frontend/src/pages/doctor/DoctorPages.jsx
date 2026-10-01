import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi, appointmentApi, recordApi, prescriptionApi } from '../../services/api';
import { StatCard, Modal, StatusBadge, Spinner, Toast, Field, EmptyState } from '../../components/shared';
import { Calendar, Users, FileText, Clock, Plus, Search, Pill } from 'lucide-react';
import dayjs from 'dayjs';
import { useT } from '../../i18n';

// ── Doctor Dashboard ────────────────────────────────────────
export function DoctorDashboard() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-dashboard'],
    queryFn: () => doctorApi.dashboard().then(r => r.data),
    refetchInterval: 60000,
  });

  const [showRecord, setShowRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({ chief_complaint:'', diagnosis:'', treatment_plan:'', vital_signs:{ blood_pressure:'', temperature:'', pulse:'', weight:'' } });
  const [prescForm, setPrescForm] = useState({ valid_until:'', medications:[{ name:'', dosage:'', frequency:'', duration:'' }], instructions:'' });
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState('record'); // 'record' | 'prescription'
  const [savedRecord, setSavedRecord] = useState(null);
  const qc = useQueryClient();

  const recordMutation = useMutation({
    mutationFn: recordApi.create,
    onSuccess: (res) => { setSavedRecord(res.data.record); setStep('prescription'); setToast({ message:'Record saved!', type:'success' }); qc.invalidateQueries(['doctor-dashboard']); },
  });

  const prescMutation = useMutation({
    mutationFn: prescriptionApi.create,
    onSuccess: () => { setShowRecord(null); setStep('record'); setSavedRecord(null); setToast({ message:'Prescription created!', type:'success' }); },
  });

  const saveRecord = () => {
    recordMutation.mutate({
      patient_id: showRecord.patient_id,
      appointment_id: showRecord.id,
      visit_date: dayjs().format('YYYY-MM-DD'),
      ...recordForm,
    });
  };

  const savePrescription = () => {
    prescMutation.mutate({
      medical_record_id: savedRecord.id,
      patient_id: savedRecord.patient_id,
      ...prescForm,
    });
  };

  const addMed = () => setPrescForm(f => ({ ...f, medications: [...f.medications, { name:'', dosage:'', frequency:'', duration:'' }] }));
  const updateMed = (i, k, v) => setPrescForm(f => {
    const meds = [...f.medications]; meds[i][k] = v; return { ...f, medications: meds };
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const schedule = data?.today_schedule || [];
  const stats = data?.stats || {};

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Patients"    value={stats.today_appointments || 0}  icon={Calendar} color="brand" />
        <StatCard label="Completed Today"     value={stats.completed_today || 0}      icon={Users}    color="emerald" />
        <StatCard label="Pending Today"       value={stats.pending_today || 0}        icon={Clock}    color="amber" />
        <StatCard label="Total Patients"      value={stats.total_patients || 0}       icon={Users}    color="violet" />
      </div>

      {/* Today's schedule */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{t("Today's Schedule — {{date}}", { date: dayjs().format('dddd, MMMM D') })}</h3>
        </div>
        {schedule.length === 0 ? (
          <EmptyState message="No appointments scheduled for today" icon={Calendar} />
        ) : (
          <div className="divide-y divide-slate-100">
            {schedule.map(appt => (
              <div key={appt.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-4">
                <div className="w-14 text-center">
                  <div className="text-lg font-bold text-brand-600">{appt.appointment_time?.slice(0,5)}</div>
                  <div className="text-xs text-slate-400">{t('{{n}} min', { n: appt.duration_minutes })}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                  {appt.patient?.user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-[8rem]">
                  <div className="font-semibold text-slate-800">{appt.patient?.user?.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t(appt.reason || 'General consultation')}</div>
                </div>
                <StatusBadge status={appt.status} />
                {['confirmed','scheduled','in_progress'].includes(appt.status) && (
                  <button onClick={() => { setShowRecord(appt); setStep('record'); }}
                    className="btn-primary text-xs py-1.5 px-3">
                    <FileText size={13} /> {t("Add Record")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Record Modal */}
      <Modal open={!!showRecord} onClose={() => { setShowRecord(null); setStep('record'); setSavedRecord(null); }}
        title={step === 'record' ? t('Medical Record — {{name}}', { name: showRecord?.patient?.user?.name }) : 'Write Prescription'}
        footer={step === 'record' ? (
          <><button className="btn-secondary" onClick={() => setShowRecord(null)}>{t("Cancel")}</button>
            <button className="btn-primary" disabled={recordMutation.isPending} onClick={saveRecord}>
              {recordMutation.isPending ? t('Saving...') : t('Save & Add Prescription →')}
            </button></>
        ) : (
          <><button className="btn-secondary" onClick={() => setShowRecord(null)}>{t("Skip")}</button>
            <button className="btn-primary" disabled={prescMutation.isPending} onClick={savePrescription}>
              {prescMutation.isPending ? t('Saving...') : t('Save Prescription')}
            </button></>
        )}>

        {step === 'record' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['blood_pressure','BP (e.g. 120/80)'],['temperature','Temp (°C)'],['pulse','Pulse (bpm)'],['weight','Weight (kg)']].map(([k,ph]) => (
                <Field key={k} label={ph.split(' ')[0]}>
                  <input className="input text-xs" placeholder={t(ph)} value={recordForm.vital_signs[k]}
                    onChange={e => setRecordForm(f => ({ ...f, vital_signs: { ...f.vital_signs, [k]: e.target.value } }))} />
                </Field>
              ))}
            </div>
            <Field label="Chief Complaint" required>
              <textarea className="input resize-none h-16" value={recordForm.chief_complaint} onChange={e => setRecordForm(f=>({...f,chief_complaint:e.target.value}))} />
            </Field>
            <Field label="Diagnosis" required>
              <textarea className="input resize-none h-16" value={recordForm.diagnosis} onChange={e => setRecordForm(f=>({...f,diagnosis:e.target.value}))} />
            </Field>
            <Field label="Treatment Plan">
              <textarea className="input resize-none h-16" value={recordForm.treatment_plan} onChange={e => setRecordForm(f=>({...f,treatment_plan:e.target.value}))} />
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Valid Until" required>
              <input type="date" className="input" min={dayjs().add(1,'day').format('YYYY-MM-DD')} value={prescForm.valid_until}
                onChange={e => setPrescForm(f=>({...f,valid_until:e.target.value}))} />
            </Field>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t("Medications")}</label>
                <button onClick={addMed} className="btn-secondary text-xs py-1 px-2"><Plus size={12} /> {t("Add")}</button>
              </div>
              {prescForm.medications.map((med, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 p-3 bg-slate-50 rounded-xl">
                  {[['name','Drug Name'],['dosage','Dosage'],['frequency','Frequency'],['duration','Duration']].map(([k,ph]) => (
                    <input key={k} className="input text-xs" placeholder={t(ph)} value={med[k]} onChange={e => updateMed(i,k,e.target.value)} />
                  ))}
                </div>
              ))}
            </div>
            <Field label="Instructions">
              <textarea className="input resize-none h-16" placeholder={t("Take with food, avoid alcohol...")} value={prescForm.instructions}
                onChange={e => setPrescForm(f=>({...f,instructions:e.target.value}))} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Doctor Schedule (all appointments) ──────────────────────
export function DoctorSchedule() {
  const t = useT();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments', date],
    queryFn: () => appointmentApi.list({ date }).then(r => r.data),
  });

  const appts = data?.data || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} />
        <div className="text-sm text-slate-400">{t('{{n}} appointments on {{date}}', { n: appts.length, date: dayjs(date).format('MMM D') })}</div>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : appts.length === 0 ? (
          <EmptyState message="No appointments for this date" icon={Calendar} />
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Time','Patient','Reason','Status','Payment'].map(h=><th key={h} className="table-th">{t(h)}</th>)}</tr></thead>
            <tbody>
              {appts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono font-bold text-brand-600">{a.appointment_time?.slice(0,5)}</td>
                  <td className="table-td font-semibold">{a.patient?.user?.name}</td>
                  <td className="table-td text-slate-500 text-xs max-w-xs truncate">{t(a.reason || '—')}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  <td className="table-td"><StatusBadge status={a.payment_status} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

// ── Doctor Medical Records (records this doctor has written) ─
export function DoctorRecords() {
  const t = useT();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-records'],
    queryFn: () => recordApi.list().then(r => r.data),
  });
  const records = (data?.data || []).filter(r => {
    const q = search.trim().toLowerCase();
    return !q || [r.patient?.user?.name, r.diagnosis, r.chief_complaint].some(v => v?.toLowerCase().includes(q));
  });
  const initials = name => name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input ps-9" placeholder={t("Search by patient, diagnosis or complaint...")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="text-sm text-slate-400 whitespace-nowrap">{t('{{n}} records', { n: records.length })}</div>
      </div>

      {isLoading ? <div className="py-16 flex justify-center"><Spinner /></div> : records.length === 0 ? (
        <div className="card"><EmptyState message="No medical records found" icon={FileText} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {records.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} className="card p-5 text-start hover:border-brand-300 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">{initials(r.patient?.user?.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{r.patient?.user?.name}</div>
                  <div className="text-xs text-slate-400">{dayjs(r.visit_date).format('MMM D, YYYY')}</div>
                </div>
                {r.prescriptions?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-full"><Pill size={12} /> {r.prescriptions.flatMap(p => p.medications || []).length}</span>
                )}
              </div>
              <div className="mt-3 text-sm font-medium text-slate-700">{t(r.diagnosis)}</div>
              <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t(r.chief_complaint)}</div>
              {r.vital_signs && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {[['BP', r.vital_signs.blood_pressure], ['Pulse', r.vital_signs.pulse && t('{{n}} bpm', { n: r.vital_signs.pulse })], ['Temp', r.vital_signs.temperature && `${r.vital_signs.temperature}°C`], ['Weight', r.vital_signs.weight && t('{{n}} kg', { n: r.vital_signs.weight })]]
                    .filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg"><span className="text-slate-400">{t(k)}</span> {t(v)}</span>
                    ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Medical Record">
        {selected && (
          <div className="space-y-3 text-sm">
            {[['Patient', selected.patient?.user?.name], ['Visit date', dayjs(selected.visit_date).format('MMM D, YYYY')], ['Chief complaint', selected.chief_complaint], ['Diagnosis', selected.diagnosis], ['Treatment plan', selected.treatment_plan]].map(([k, v]) => (
              <div key={k}><div className="text-xs text-slate-400 uppercase tracking-wide">{t(k)}</div><div className="font-medium text-slate-800">{v || '—'}</div></div>
            ))}
            {selected.prescriptions?.length > 0 && (
              <div><div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("Medications")}</div>
                {selected.prescriptions.flatMap(p => p.medications || []).map((m, i) => (
                  <div key={i} className="text-slate-700">{m.name} {m.dosage} — {t(m.frequency)}, {t(m.duration)}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
