export interface WorkerOptions {
  concurrency?: number;
}

export type Event<T = any> = Readonly<{
  id: string;
  type: string;
  body: T;
  aggregateId: string;
  aggregateType: number;
  aggregateVersion: number;
  timestamp: number;
}>;

export type Pagination<T> = {
  first?: number;
  after?: string;
  filter: T;
};

export type Language = 'en' | 'zh' | 'zh-Hant' | 'zh-Hans';
