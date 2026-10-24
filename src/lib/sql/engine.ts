import { createClient } from '../supabase/server';

// Backed by Supabase/Postgres now instead of an embedded SQLite file — but
// keeps the exact same "one JSON blob per row, keyed by one column" shape
// the rest of the app (db.ts) already expects, via the same kvGetAll/
// kvSetAll function names/signatures. That's what let db.ts, settings.ts,
// and channel.ts move to a real multi-user backend with almost no changes
// to their own logic — only the storage engine underneath changed.
//
// `userId` is always passed explicitly and filtered/set on every query —
// this does NOT rely on Row Level Security to implicitly scope an
// unfiltered query to "whoever's signed in", because that assumption is
// wrong for an admin session: the RLS admin-bypass policy makes an
// unfiltered query return EVERY user's rows, not just the admin's own
// (see supabase/schema.sql). Explicit user_id filtering here is what
// makes both an admin's own normal usage AND "Act as user" impersonation
// correct — see src/lib/auth.ts's getEffectiveUser().

export async function kvGetAll<T>(table: string, keyColumn: string, userId: string): Promise<Record<string, T>> {
  const supabase = await createClient();
  // `.select()` can't type-check a dynamic column-list template literal
  // against Supabase's generated types (it only understands string
  // literals known at compile time), so this reads untyped and each row
  // is treated as a plain record instead.
  const { data, error } = (await supabase.from(table).select(`${keyColumn}, data`).eq('user_id', userId)) as {
    data: Record<string, unknown>[] | null;
    error: { message: string } | null;
  };
  if (error) throw error;

  const result: Record<string, T> = {};
  for (const row of data ?? []) {
    result[row[keyColumn] as string] = row.data as T;
  }
  return result;
}

/** Upserts every row currently in `records`. No call site in this app ever
 * actually shrinks one of these top-level maps (channels/profileCache/
 * videoOverrides/nicheSearchCache never drop a whole row — only nested
 * properties inside a row change), so this is pure add-or-update, never a
 * delete. That's deliberate: a previous version deleted every row for this
 * user up front and reinserted the whole snapshot, which only worked
 * single-threaded. Under two near-simultaneous requests for the same user
 * (e.g. the dashboard layout and the active tab's page both saving around
 * the same time, or simply loading a profile twice in a row) it raced
 * badly — one request's blanket DELETE could wipe out a row another
 * request had just inserted (silently losing it — the exact "channel not
 * found, but reloading fixes it" symptom users saw), or two inserts for
 * the same key could collide and throw a duplicate-key error. An upsert
 * keyed on the table's real (user_id, keyColumn) primary key is atomic per
 * row — last write wins for that one row, never a crash, and it can never
 * clobber a sibling row it doesn't even know about. If a future feature
 * needs to actually remove a row, add an explicit kvDelete(table,
 * keyColumn, key, userId) rather than inferring deletions from "missing
 * from this snapshot", which is exactly what raced before. */
export async function kvSetAll<T>(table: string, keyColumn: string, records: Record<string, T>, userId: string): Promise<void> {
  const supabase = await createClient();
  const keys = Object.keys(records);
  if (keys.length === 0) return;

  const rows = keys.map((key) => ({ [keyColumn]: key, data: records[key], user_id: userId }));
  const { error } = await supabase.from(table).upsert(rows, { onConflict: `user_id,${keyColumn}` });
  if (error) throw error;
}
