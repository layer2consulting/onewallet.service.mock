import R from 'ramda';
import Amqp from '@highoutput/amqp';

import generateVendorId from './library/generate-vendor-id';

type Game = {
  id: string;
  code: string;
  type: string;
  vendor: string;
  vendorCode: string;
  details?: any[];
};

let workers: any[];
export async function start(amqp: Amqp, games: Game[]) {
  workers = await Promise.all([
    amqp.createWorker('Vendor.Query', async ({ type, data }: { type: string; data: Game }) => {
      if (type === 'Game') {
        return (
          R.find<Game>(
            game => game.vendor === (/^vnd_.+$/.test(data.vendor)
              ? data.vendor
              : generateVendorId(data.vendor))
                  && game.code === data.code,
          )(games) || null
        );
      }

      return null;
    }),
  ]);
}

export async function stop() {
  await Promise.all(workers.map(worker => worker.stop()));
}
