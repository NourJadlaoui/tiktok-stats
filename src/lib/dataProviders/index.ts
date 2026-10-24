import { getConfig } from '@/lib/config';
import { DataProvider } from './types';
import { mockProvider } from './mock';
import { rapidApiProvider } from './rapidapi';
import { tiktokWebProvider } from './tiktokWeb';

export function getDataProvider(): DataProvider {
  const { dataProvider } = getConfig();
  if (dataProvider === 'rapidapi') return rapidApiProvider;
  if (dataProvider === 'mock') return mockProvider;
  return tiktokWebProvider;
}

export * from './types';
