'use client';

import { useChannelData } from '@/components/dashboard/ChannelDataContext';
import VideosTable from '@/components/VideosTable';

export default function VideosPage() {
  const { data, eurRate } = useChannelData();
  return (
    <VideosTable
      username={data.profile.username}
      initialVideos={data.videos}
      channelRpm={data.settings.rpm}
      eurRate={eurRate}
    />
  );
}
