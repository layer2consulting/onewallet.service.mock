import { v4 as uuidV4, v1 as uuidV1 } from 'uuid';
import crypto from 'crypto';
import { mergeDeepLeft } from 'ramda';

export function generateFakeId(prefix: string = 'bal', uuid?: string): string {
  const id = uuid ? uuid : uuidV4();
  return `${prefix}_${id.split('-').join('')}`;
}

export function generateFakeEventId() {
  const [, low, mid, high] = uuidV1().match(
    /^([0-9a-f]{8})-([0-9a-f]{4})-1([0-9a-f]{3})/
  ) as string[];

  return `evt_${high}${mid}${low}${crypto.randomBytes(4).toString('hex')}`;
}

export function generateFakeEvent(params: {
  type: string;
  id?: string;
  timestamp?: number;
  aggregateId?: string;
  aggregateType?: number;
  aggregateVersion?: number;
  body?: any;
}) {
  return mergeDeepLeft(params, {
    id: generateFakeEventId(),
    timestamp: Date.now(),
    aggregateId: generateFakeId('agg'),
    aggregateType: 1000,
    aggregateVersion: 0,
    body: {},
  });
}
