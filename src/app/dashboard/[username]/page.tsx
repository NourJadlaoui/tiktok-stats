import { redirect } from 'next/navigation';

export default async function DashboardIndex({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/dashboard/${username}/overview`);
}
