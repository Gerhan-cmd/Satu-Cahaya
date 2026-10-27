import { DEMO_MESSAGES } from './demoMessages';
import { newId } from './id';
import { pickMessage } from './pick';
import { REPORT_REASONS } from './report';
import { RepositoryError, type MessageRepository } from './repositoryTypes';
import { isCategory, validateBody } from './validation';

const PENDING_KEY = 'satucahaya:demo:pending';
const REPORTS_KEY = 'satucahaya:demo:reports';

function appendLocal(key: string, item: unknown): void {
  // Melempar bila storage diblokir, agar kegagalan tidak dilaporkan sebagai sukses.
  const current: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
  const list = Array.isArray(current) ? current : [];
  list.push(item);
  localStorage.setItem(key, JSON.stringify(list));
}

/**
 * Mode demo: pesan contoh berlabel; kiriman dan laporan hanya disimpan di localStorage
 * perangkat ini. Tidak ada yang dikirim ke server.
 */
export const demoRepository: MessageRepository = {
  mode: 'demo',
  async listApproved() {
    return DEMO_MESSAGES;
  },
  async submit({ body, category }) {
    const result = validateBody(body);
    if (!result.ok || !isCategory(category)) throw new RepositoryError('invalid');
    const id = newId();
    appendLocal(PENDING_KEY, { id, body: result.body, category, createdAt: new Date().toISOString() });
    return { status: 'pending', id };
  },
  async receive(excludeIds) {
    return pickMessage(DEMO_MESSAGES, excludeIds);
  },
  async report(messageId, reason) {
    if (!REPORT_REASONS.includes(reason)) throw new RepositoryError('invalid');
    appendLocal(REPORTS_KEY, { messageId, reason, createdAt: new Date().toISOString() });
  },
};
