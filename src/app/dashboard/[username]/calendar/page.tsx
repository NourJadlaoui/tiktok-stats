'use client';

import { useChannelData } from '@/components/dashboard/ChannelDataContext';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
  const { data, eurRate } = useChannelData();
  return <CalendarView videos={data.videos} channelRpm={data.settings.rpm} eurRate={eurRate} />;
}
