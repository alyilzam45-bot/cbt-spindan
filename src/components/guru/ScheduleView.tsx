import React, { useState } from 'react';
import { ScheduleItem } from '../../types/cbt';
import { SUBJECT_OPTIONS } from '../../data/defaultData';
import { getScheduleStatus, WibTimeInfo, DEFAULT_CBT_EXIT_TOKEN } from '../../utils/cbtLogic';
import { Calendar, PlusCircle, ExternalLink, Trash2, CheckCircle2, Clock, Link as LinkIcon, Save, KeyRound, Copy, Check, RotateCcw, Lock, Eye, EyeOff } from 'lucide-react';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  currentTime: WibTimeInfo;
  onSaveSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  onUpdateExamUrl: (id: string, url: string) => void;
  onDeleteSchedule: (id: string) => void;
  setNoticeMessage: (msg: string) => void;
  exitToken?: string;
  onUpdateExitToken?: (token: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  currentTime,
  onSaveSchedule,
  onUpdateExamUrl,
  onDeleteSchedule,
  setNoticeMessage,
  exitToken = DEFAULT_CBT_EXIT_TOKEN,
  onUpdateExitToken,
}) => {
  // Form states
  const [subject, setSubject] = useState('');
  const [scheduleClass, setScheduleClass] = useState('7');
  const [date, setDate] = useState(currentTime.date);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:30');
  const [session, setSession] = useState('Sesi 1');
  const [examUrl, setExamUrl] = useState('');

  // Exit token edit state with privacy mask
  const [tokenEdit, setTokenEdit] = useState(exitToken);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Editing link row state
  const [editingLinks, setEditingLinks] = useState<Record<string, string>>({});

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !scheduleClass || !date || !startTime || !endTime || !session) {
      setNoticeMessage('Lengkapi semua data jadwal terlebih dahulu.');
      return;
    }

    if (endTime <= startTime) {
      setNoticeMessage('Jam selesai ujian harus setelah jam mulai.');
      return;
    }

    if (examUrl && !/^https:\/\//i.test(examUrl.trim())) {
      setNoticeMessage('Link ujian harus menggunakan protokol HTTPS yang aman (https://...).');
      return;
    }

    onSaveSchedule({
      subject_name: subject,
      schedule_class: scheduleClass,
      schedule_date: date,
      schedule_start: startTime,
      schedule_end: endTime,
      schedule_session: session,
      schedule_open: true,
      schedule_exam_url: examUrl.trim(),
    });

    setSubject('');
    setExamUrl('');
    setNoticeMessage(`Jadwal ujian "${subject}" Kelas ${scheduleClass} berhasil disimpan.`);
  };

  const handleSaveExamUrl = (id: string) => {
    const newUrl = editingLinks[id] !== undefined ? editingLinks[id].trim() : '';
    if (newUrl && !/^https:\/\//i.test(newUrl)) {
      setNoticeMessage('Link ujian harus menggunakan format HTTPS yang valid.');
      return;
    }

    onUpdateExamUrl(id, newUrl);
    setNoticeMessage('Tautan link ujian berhasil diperbarui.');
  };

  const sortedSchedules = [...schedules].sort(
    (a, b) => a.schedule_date.localeCompare(b.schedule_date) || a.schedule_start.localeCompare(b.schedule_start)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003366]">
          JADWAL & SESI UJIAN CBT
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Atur tanggal, sesi waktu, dan tautan soal ujian. Status waktu otomatis mengikuti WIB.
        </p>
      </header>

      {/* Main Grid: Form Left, List Right */}
      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        {/* Form: Buat Jadwal Baru */}
        <section aria-labelledby="form-schedule-heading" className="bg-white rounded-2xl p-6 border border-[#dce6ed] shadow-sm h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-[#003366]" />
            <h2 id="form-schedule-heading" className="text-base font-bold text-[#003366]">
              BUAT JADWAL BARU
            </h2>
          </div>

          <form onSubmit={handleCreateSchedule} className="mt-4 space-y-4">
            <div>
              <label htmlFor="sched-subject" className="block text-xs font-bold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                id="sched-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366] bg-white"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {SUBJECT_OPTIONS.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sched-class" className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Kelas
              </label>
              <select
                id="sched-class"
                value={scheduleClass}
                onChange={(e) => setScheduleClass(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366] bg-white"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>

            <div>
              <label htmlFor="sched-date" className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Ujian
              </label>
              <input
                id="sched-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sched-start" className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Mulai (WIB)
                </label>
                <input
                  id="sched-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366]"
                />
              </div>
              <div>
                <label htmlFor="sched-end" className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Selesai (WIB)
                </label>
                <input
                  id="sched-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sched-session" className="block text-xs font-bold text-slate-700 mb-1">
                Sesi Ujian
              </label>
              <select
                id="sched-session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366] bg-white"
              >
                <option value="Sesi 1">Sesi 1</option>
                <option value="Sesi 2">Sesi 2</option>
                <option value="Sesi 3">Sesi 3</option>
              </select>
            </div>

            <div>
              <label htmlFor="sched-url" className="block text-xs font-bold text-slate-700 mb-1">
                Link Ujian (Google Form / CBT HTTPS)
              </label>
              <input
                id="sched-url"
                type="url"
                value={examUrl}
                onChange={(e) => setExamUrl(e.target.value)}
                placeholder="https://forms.gle/... atau https://cbt.sch.id/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Opsional. Tombol masuk hanya aktif bagi siswa saat waktu ujian berstatus Aktif.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#003366] hover:bg-[#00264d] text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Simpan Jadwal Ujian
            </button>
          </form>

          {/* Token Keluar CBT Management Card */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                TOKEN KELUAR UJIAN CBT
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Kunci keamanan pengawas. Siswa di ruang ujian wajib memasukkan token ini saat selesai mengerjakan untuk keluar dari mode Kiosk terkunci.
            </p>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Token Aktif (Dirahasiakan):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-extrabold text-rose-700 bg-white px-2.5 py-0.5 rounded border border-rose-300 tracking-wider">
                    {showToken ? exitToken : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="p-1 rounded text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    title={showToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={tokenEdit}
                  onChange={(e) => setTokenEdit(e.target.value.toUpperCase())}
                  placeholder="Ketik token baru..."
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono uppercase font-bold border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = tokenEdit.trim().toUpperCase();
                    if (!trimmed) {
                      setNoticeMessage('Token tidak boleh kosong.');
                      return;
                    }
                    if (onUpdateExitToken) {
                      onUpdateExitToken(trimmed);
                    }
                    setNoticeMessage(`Token Keluar CBT berhasil diperbarui: ${trimmed}`);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(exitToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                    setNoticeMessage(`Token ${exitToken} disalin ke clipboard.`);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Token</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const generated = `SPIN${randomSuffix}`;
                    setTokenEdit(generated);
                    if (onUpdateExitToken) {
                      onUpdateExitToken(generated);
                    }
                    setNoticeMessage(`Token Keluar baru diacak: ${generated}`);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Acak Token</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Table: Daftar Jadwal */}
        <section aria-labelledby="table-schedule-heading" className="bg-white rounded-2xl p-6 border border-[#dce6ed] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 id="table-schedule-heading" className="text-base font-bold text-[#003366]">
                DAFTAR JADWAL UJIAN ({schedules.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Status diperbarui otomatis setiap detik sesuai waktu WIB.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-slate-100 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#003366]" />
              <span>{currentTime.label}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#edf2f6] text-[#003366] font-bold">
                <tr>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Mapel</th>
                  <th className="py-3 px-3">Kelas / Sesi</th>
                  <th className="py-3 px-3">Jam WIB</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 min-w-[220px]">Link & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada jadwal ujian dibuat.
                    </td>
                  </tr>
                ) : (
                  sortedSchedules.map((item) => {
                    const status = getScheduleStatus(
                      item.schedule_date,
                      item.schedule_start,
                      item.schedule_end,
                      currentTime
                    );

                    const currentEditValue =
                      editingLinks[item.id] !== undefined
                        ? editingLinks[item.id]
                        : item.schedule_exam_url || '';

                    const isLinkValid = /^https:\/\//i.test(item.schedule_exam_url || '');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-medium whitespace-nowrap text-slate-700">
                          {item.schedule_date}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#003366]">
                          {item.subject_name}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">Kelas {item.schedule_class}</span>
                          <span className="text-slate-400 text-xs ml-1">({item.schedule_session})</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                          {item.schedule_start}–{item.schedule_end}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                              status === 'Aktif'
                                ? 'bg-[#087f78] text-white animate-pulse'
                                : status === 'Selesai'
                                ? 'bg-[#852d35] text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            {isLinkValid ? (
                              <a
                                href={item.schedule_exam_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  status === 'Aktif'
                                    ? 'bg-[#087f78] text-white hover:bg-[#066560]'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                                title="Buka tautan ujian"
                              >
                                <span>Buka</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Link Belum Disetel
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteSchedule(item.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg ml-auto transition-colors cursor-pointer"
                              title="Hapus jadwal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quick Edit HTTPS Link Input */}
                          <div className="flex items-center gap-1">
                            <input
                              type="url"
                              value={currentEditValue}
                              placeholder="https://..."
                              onChange={(e) =>
                                setEditingLinks((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-[#003366]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveExamUrl(item.id)}
                              className="px-2 py-1 bg-slate-200 hover:bg-[#003366] hover:text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0"
                              title="Simpan Link"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
