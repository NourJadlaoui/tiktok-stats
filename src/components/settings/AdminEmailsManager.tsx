'use client';

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export default function AdminEmailsManager({ initial }: { initial: string[] }) {
  const [emails, setEmails] = useState(initial);
  const [newEmail, setNewEmail] = useState('');

  async function add() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setNewEmail('');
    const res = await fetch('/api/settings/admin-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    setEmails(json.emails);
  }

  async function remove(email: string) {
    const res = await fetch(`/api/settings/admin-emails?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    const json = await res.json();
    setEmails(json.emails);
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 text-sm font-semibold">Admin access</h2>
      <p className="mb-4 text-xs text-neutral-400">
        Anyone signed in with one of these Google emails can see every user's data from the Admin page —
        enforced by the database itself, not just hidden UI.
      </p>
      <div className="flex flex-col gap-1.5">
        {emails.map((e) => (
          <div key={e} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:bg-neutral-800/60">
            <span>{e}</span>
            <button onClick={() => remove(e)} className="text-neutral-400 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="someone@gmail.com" className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        <button onClick={add} className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"><Plus size={14} /></button>
      </div>
    </div>
  );
}
