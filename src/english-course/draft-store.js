// One queue per work: preserve the exact retry token and never write a stale copy silently.
export const draftVersion = work => Number(work.state?.draftVersion || 0);
const canEdit = work => ['started', 'objective_complete', 'needs_revision'].includes(work.status);
const copy = value => JSON.parse(JSON.stringify(value));

export class DraftStore {
 constructor({key, work, defaults, send, fetchRemote, onSaved = () => {}, storage = globalThis.localStorage, delay = 1800}) {
  Object.assign(this, {key, work, defaults, send, fetchRemote, onSaved, storage, delay});
  this.listeners = new Set(); this.version = draftVersion(work); this.pending = null;
  this.dirty = false; this.conflict = false; this.error = ''; this.sync = 'Saqlangan'; this.active = true;
  this.draft = this.fromWork(work);
  try {
   const saved = JSON.parse(storage.getItem(key) || 'null');
   if (saved && !canEdit(work) && (saved.dirty || saved.pending)) storage.setItem(key + ':recovery', JSON.stringify({draft: saved.draft || saved, at: Date.now()}));
   if (saved && canEdit(work)) {
    // Old unsent lesson requests and old assessment drafts are recovered once.
    const unsent = saved.format === 2 ? saved.dirty || saved.pending : saved.pending || !('at' in saved);
    if (unsent) {
     this.draft = {...this.draft, ...this.pick(saved.draft || saved)};
     this.version = saved.format === 2 ? Number(saved.version || 0) : this.version;
     if (saved.pending?.id === work.id && saved.pending.token) this.pending = saved.pending;
     this.dirty = true; this.sync = 'Shu brauzerda saqlandi. Hisobga yuborish kutilmoqda.';
    }
   }
  } catch { /* A malformed or unavailable local copy cannot replace the server copy. */ }
 }
 pick(value) { return Object.fromEntries(Object.keys(this.defaults).filter(k => value[k] !== undefined).map(k => [k, value[k]])); }
 fromWork(work) { return copy({...this.defaults, ...this.pick(work.state || {})}); }
 snapshot() { return {draft: this.draft, sync: this.sync, error: this.error, conflict: this.conflict}; }
 emit() { for (const listener of this.listeners) listener(this.snapshot()); }
 subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
 persist() {
  try {
   this.storage.setItem(this.key, JSON.stringify({format: 2, draft: this.draft, version: this.version, pending: this.pending, dirty: this.dirty, at: Date.now()}));
   this.localFailed = false;
  } catch { this.localFailed = true; }
 }
 schedule() {
  clearTimeout(this.timer);
  if (this.active && this.dirty && !this.conflict && canEdit(this.work)) this.timer = setTimeout(() => this.flush().catch(() => {}), this.delay);
 }
 mount() { this.active = true; this.schedule(); }
 dispose() { this.active = false; clearTimeout(this.timer); }
 update(patch) {
  const next = {...this.draft, ...(typeof patch === 'function' ? patch(this.draft) : patch)};
  if (JSON.stringify(next) === JSON.stringify(this.draft)) return;
  this.draft = next;
  if (canEdit(this.work)) {
   this.dirty = true; this.persist(); this.sync = this.localFailed ? 'Brauzer xotirasiga saqlanmadi. Hisobga saqlash kutilmoqda.' : 'Shu brauzerda saqlandi';
   this.schedule();
  }
  this.emit();
 }
 updateWork(work) {
  this.work = work;
  if (!canEdit(work)) {
   if (this.dirty) { try { this.storage.setItem(this.key + ':recovery', JSON.stringify({draft: this.draft, at: Date.now()})); } catch {} }
   // Submitted work always displays the submitted server text and recording.
   this.draft = this.fromWork(work); this.pending = null; this.dirty = false; this.conflict = false;
   this.version = draftVersion(work); clearTimeout(this.timer); this.persist(); this.emit();
  } else if (!this.dirty && !this.inflight) this.version = draftVersion(work);
 }
 async flush() {
  clearTimeout(this.timer);
  if (this.inflight) { await this.inflight; return this.dirty ? this.flush() : undefined; }
  if (!canEdit(this.work) || !this.dirty) return;
  if (this.conflict) throw Object.assign(Error(this.error), {code: 'P7231'});
  const deliver = async () => {
   while (this.dirty && canEdit(this.work)) {
    const body = this.pending || {id: this.work.id, ...copy(this.draft), expectedDraftVersion: this.version, token: crypto.randomUUID()};
    this.pending = body; this.persist(); this.sync = 'Saqlanmoqda…'; this.emit();
    try {
     const next = await this.send(body);
     this.version = draftVersion(next); this.work = next; this.pending = null;
     this.dirty = JSON.stringify(this.pick(body)) !== JSON.stringify(this.draft);
     this.error = ''; this.persist();
     this.sync = this.dirty ? 'Yangi o‘zgarish saqlanmoqda…' : this.localFailed ? 'Hisobga saqlandi. Brauzer xotirasi ochilmadi.' : 'Hisobga saqlandi';
     this.onSaved(next); this.emit();
    } catch (error) {
     this.conflict = error.code === 'P7231'; this.error = error.message;
     this.sync = this.conflict ? 'Ikki xil qoralama bor. Nusxani o‘zingiz tanlang.' : this.localFailed ? 'Hisobga yuborilmadi. Qoralamani yuklab oling.' : 'Shu brauzerda saqlandi. Hisobga yuborish kutilmoqda.';
     this.persist(); this.emit(); throw error;
    }
   }
  };
  this.inflight = deliver();
  try { await this.inflight } finally { this.inflight = null; }
 }
 async resolveConflict(useLocal) {
  const remote = await this.fetchRemote();
  if (useLocal && !canEdit(remote)) throw Error('Ish topshirilgan. Avval ustoz qayta ishlashga qaytarsin.');
  // Keep a recovery copy when the learner explicitly opens the remote version.
  if (!useLocal) {
   try { this.storage.setItem(this.key + ':recovery', JSON.stringify({draft: this.draft, at: Date.now()})); } catch {}
   this.draft = this.fromWork(remote);
  }
  this.work = remote; this.version = draftVersion(remote); this.pending = null; this.conflict = false; this.error = ''; this.dirty = useLocal;
  this.sync = useLocal ? 'Qoralamangiz hisobga yuborilmoqda…' : 'Hisobdagi nusxa ochildi';
  this.persist(); this.onSaved(remote); this.emit();
  if (useLocal) await this.flush();
 }
}
