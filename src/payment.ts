import Amqp from '@highoutput/amqp';

let workers: any[];

export async function start(amqp: Amqp) {
  workers = await Promise.all([
    amqp.createWorker('Payment.Query', async () => {
      return [];
    }),
    amqp.createWorker('Payment.Command', async () => {
      return true;
    }),
  ]);
}

export async function stop() {
  await Promise.all(workers.map(worker => worker.stop()));
}
