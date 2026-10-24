import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { sessionStateExists } from '@/lib/dataProviders/browserUtils';
import { getCurrentUser } from '@/lib/auth';

/** Scraping/data-source internals (which provider, RapidAPI, session
 * cookies, config/credentials.json) are operational details for whoever
 * runs this deployment — not something a paying customer needs to see, so
 * they're only included for admins. Regular users still get
 * translateApiUrl (used by the Niche Finder terms translator they can
 * actually trigger). */
export async function GET() {
  const config = getConfig();
  const user = await getCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);

  return NextResponse.json({
    isAdmin,
    translateApiUrl: config.translateApiUrl,
    ...(isAdmin && {
      dataProvider: config.dataProvider,
      rapidApiConfigured: Boolean(config.rapidApi.key),
      maxVideosToFetch: config.maxVideosToFetch,
      nicheMaxVideos: config.nicheMaxVideos,
      scrapeHeadless: config.scrapeHeadless,
      scrapeDebug: config.scrapeDebug,
      persistSession: config.persistSession,
      sessionSaved: sessionStateExists(),
      cookieConfigured: Boolean(config.tiktokAccount.cookie)
    })
  });
}
