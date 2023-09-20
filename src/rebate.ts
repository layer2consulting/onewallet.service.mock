import R from 'ramda';
import Amqp from '@highoutput/amqp';

type Document = {
  account: string;
  available: number;
  lockedBalance: number;
  turnoverRequirement: number;
};

let workers: any[];
let rebates: Document[];

export { rebates };

export async function start(amqp: Amqp, initialRebates: Document[]) {
  rebates = R.clone(initialRebates);

  workers = await Promise.all([
    amqp.createWorker('Rebate.Query', async ({ type, data }) => {
      if (type === 'Rebate') {
        return (
          R.find(R.propEq('account', data.account))(rebates) || {
            available: 0,
            lockedBalance: 0,
            turnoverRequirement: 0,
          }
        );
      }
    }),
    amqp.createWorker('Rebate.Command', async () => {
      return true;
    }),
  ]);
}

export async function stop() {
  await Promise.all(workers.map(worker => worker.stop()));
}
