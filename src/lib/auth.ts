import { cookies } from 'next/headers';
import { createClient } from './supabase/server';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  isAdmin: boolean;
}

/** The signed-in user for the current request, plus whether they're an
 * admin (checked via the same is_admin() the database's RLS policies use,
 * so this always agrees with what the database will actually let them
 * read). Returns null if nobody's signed in — callers that require auth
 * should redirect to /login instead of rendering when this is null (the
 * middleware already does this for every page except /login itself, so in
 * practice this is a defense-in-depth check, not the primary gate). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

    const { data: isAdmin } = await supabase.rpc('is_admin');
    const meta = user.user_metadata ?? {};

    return {
      id: user.id,
      email: user.email,
      name: meta.full_name || meta.name || user.email.split('@')[0],
      avatarUrl: meta.avatar_url || meta.picture || '',
      isAdmin: Boolean(isAdmin)
    };
  } catch {
    // Supabase unreachable (e.g. project misconfigured/down) — treat as
    // signed-out rather than crashing every page render.
    return null;
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

const ACTING_AS_COOKIE = 'acting_as_user_id';

export interface EffectiveUser {
  /** The REAL, authenticated identity — always trust this (not
   * effectiveUserId) for permission checks like "is this actually an
   * admin". Never derived from the acting_as cookie. */
  realUser: CurrentUser;
  /** Whose data every query should read/write for the rest of this
   * request — the admin's own id normally, or the impersonated user's id
   * while "Acting as" is active. */
  effectiveUserId: string;
  effectiveEmail: string;
  isActingAs: boolean;
}

/** Every data-access function (db.ts, history.ts, nicheFinderStore.ts, ...)
 * uses THIS instead of trusting Supabase RLS to implicitly scope an
 * unfiltered query to "whoever's signed in" — that assumption breaks for
 * an admin's own session, because the RLS admin-bypass policy makes an
 * unfiltered query return EVERY user's rows, not just the admin's own (see
 * supabase/schema.sql's is_admin() bypass). So every query in this app
 * explicitly filters/sets user_id to this function's effectiveUserId,
 * which also happens to be exactly the mechanism "Act as user" needs: an
 * admin viewing another user's dashboard is just effectiveUserId pointing
 * at that user's id instead of their own.
 *
 * The acting_as cookie is only ever honored if the REAL session is
 * independently confirmed admin via is_admin() on every call — it carries
 * no authority by itself, so a tampered cookie value on a non-admin
 * session does nothing. */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const realUser = await getCurrentUser();
  if (!realUser) return null;

  if (realUser.isAdmin) {
    const cookieStore = await cookies();
    const actingAsId = cookieStore.get(ACTING_AS_COOKIE)?.value;
    if (actingAsId && actingAsId !== realUser.id) {
      const supabase = await createClient();
      const { data } = await supabase.rpc('get_user_email', { target_user_id: actingAsId }).single();
      const targetEmail = (data as unknown as string) || actingAsId;
      return { realUser, effectiveUserId: actingAsId, effectiveEmail: targetEmail, isActingAs: true };
    }
  }

  return { realUser, effectiveUserId: realUser.id, effectiveEmail: realUser.email, isActingAs: false };
}

export async function requireEffectiveUser(): Promise<EffectiveUser> {
  const user = await getEffectiveUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export { ACTING_AS_COOKIE };
