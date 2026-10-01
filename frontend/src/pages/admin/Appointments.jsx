import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, doctorApi, patientApi } from '../../services/api';
import { Modal, StatusBadge, Spinner, EmptyState, Toast, Field } from '../../components/shared';
import { Calendar, Plus, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { useT } from '../../i18n';

const STATUSES = ['scheduled','confirmed','in_progress','completed','cancelled','no_show'];

export default function Appointments() {
  const t = useT();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [showBook, setShowBook] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', department_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [slots, setSlots] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentApi.list(filters).then(r => r.data),
  });

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: () => doctorApi.list().then(r => r.data) });
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => patientApi.list().then(r => r.data) });

  const bookMutation = useMutation({
    mutationFn: appointmentApi.create,
    onSuccess: () => {
      qc.invalidateQueries(['appointments']);
      setShowBook(false);
      setForm({ patient_id:'', doctor_id:'', department_id:'', appointment_date:'', appointment_time:'', reason:'' });
      setToast({ message: 'Appointment booked successfully!', type: 'success' });
    },
    onError: (err) => setToast({ message: err.response?.data?.message || 'Booking failed', type: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentApi.updateStatus(id, data),
    onSuccess: () => { qc.invalidateQueries(['appointments']); setToast({ message: 'Status updated', type: 'success' }); },
  });

  const loadSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    const res = await appointmentApi.slots(doctorId, date);
    setSlots(res.data.slots || []);
  };

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors?.find(d => d.id == doctorId);
    setForm(f => ({ ...f, doctor_id: doctorId, department_id: doctor?.department_id || '', appointment_time: '' }));
    if (form.appointment_date) loadSlots(doctorId, form.appointment_date);
  };

  const handleDateChange = (date) => {
    setForm(f => ({ ...f, appointment_date: date, appointment_time: '' }));
    if (form.doctor_id) loadSlots(form.doctor_id, date);
  };

  const appts = data?.data || [];

  return (
    <div className="p-4 sm:p-6 animate-slide-up">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Filters & action */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input ps-9" placeholder={t("Search...")} />
        </div>
        <input type="date" className="input w-44" value={filters.date}
          onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
        <select className="select w-44" value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">{t("All Status")}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t(s.replace('_',' '))}</option>)}
        </select>
        <button onClick={() => setShowBook(true)} className="btn-primary ms-auto">
          <Plus size={16} /> {t("Book Appointment")}
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : appts.length === 0 ? (
          <EmptyState message="No appointments found" icon={Calendar} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{['Patient','Doctor','Dept','Date','Time','Status','Payment','Actions'].map(h => <th key={h} className="table-th">{t(h)}</th>)}</tr>
              </thead>
              <tbody>
                {appts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setShowDetail(a)}>
                    <td className="table-td">
                      <div className="font-semibold text-slate-800">{a.patient?.user?.name}</div>
                    </td>
                    <td className="table-td text-slate-600">{a.doctor?.user?.name}</td>
                    <td className="table-td text-slate-500 text-xs">{t(a.department?.name)}</td>
                    <td className="table-td font-medium">{dayjs(a.appointment_date).format('MMM D, YYYY')}</td>
                    <td className="table-td font-mono text-xs">{a.appointment_time?.slice(0,5)}</td>
                    <td className="table-td"><StatusBadge status={a.status} /></td>
                    <td className="table-td"><StatusBadge status={a.payment_status} /></td>
                    <td className="table-td" onClick={e => e.stopPropagation()}>
                      <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none"
                        value={a.status}
                        onChange={e => statusMutation.mutate({ id: a.id, data: { status: e.target.value } })}>
                        {STATUSES.map(s => <option key={s} value={s}>{t(s.replace('_',' '))}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book modal */}
      <Modal open={showBook} onClose={() => setShowBook(false)} title="Book Appointment"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowBook(false)}>{t("Cancel")}</button>
          <button className="btn-primary" disabled={bookMutation.isPending}
            onClick={() => bookMutation.mutate(form)}>
            {bookMutation.isPending ? t('Booking...') : t('Book Appointment')}
          </button>
        </>}>
        <div className="space-y-4">
          <Field label="Patient" required>
            <select className="select" value={form.patient_id}
              onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
              <option value="">{t("Select patient")}</option>
              {patients?.data?.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
            </select>
          </Field>
          <Field label="Doctor" required>
            <select className="select" value={form.doctor_id} onChange={e => handleDoctorChange(e.target.value)}>
              <option value="">{t("Select doctor")}</option>
              {doctors?.map(d => <option key={d.id} value={d.id}>{d.user?.name} — {t(d.specialty)}</option>)}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" className="input" value={form.appointment_date}
              min={dayjs().format('YYYY-MM-DD')}
              onChange={e => handleDateChange(e.target.value)} />
          </Field>
          <Field label="Available Time Slots" required>
            {slots.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                {form.doctor_id && form.appointment_date ? t('No slots available for this date') : t('Select doctor and date first')}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button key={slot} type="button"
                    onClick={() => setForm(f => ({ ...f, appointment_time: slot }))}
                    className={`py-2 text-xs rounded-xl border font-semibold transition-all ${form.appointment_time === slot ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Reason">
            <textarea className="input resize-none h-20" placeholder={t("Reason for visit...")}
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      {/* Detail modal */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={t('Appointment #{{id}}', { id: showDetail.id })}
          footer={<button className="btn-secondary" onClick={() => setShowDetail(null)}>{t("Close")}</button>}>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Patient',    showDetail.patient?.user?.name],
              ['Doctor',     showDetail.doctor?.user?.name],
              ['Department', showDetail.department?.name],
              ['Date',       dayjs(showDetail.appointment_date).format('MMMM D, YYYY')],
              ['Time',       showDetail.appointment_time?.slice(0,5)],
              ['Duration',   t('{{n}} min', { n: showDetail.duration_minutes })],
              ['Fee',        t('{{n}} IQD', { n: new Intl.NumberFormat('en').format(showDetail.fee) })],
              ['Status',     showDetail.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t(k)}</div>
                <div className="text-sm font-semibold text-slate-800 mt-1 capitalize">{t(v)}</div>
              </div>
            ))}
          </div>
          {showDetail.reason && (
            <div className="mt-4 bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{t("Reason")}</div>
              <div className="text-sm text-slate-700">{t(showDetail.reason)}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
