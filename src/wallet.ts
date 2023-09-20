import R from 'ramda';
import Amqp from '@highoutput/amqp';

type Document = {
  account: string;
  balance: number;
};

let workers: any[];
let balances: Document[] = [];
const debits: Record<string, number> = {};

function findDocument(account: string) {
  const document = R.find((item: Document) => item.account === account)(balances);

  if (!document) {
    throw new Error(`Account with id \`${account}\` does not exist.`);
  }

  return document;
}

export { balances };

export async function start(amqp: Amqp, initial: Document[]) {
  balances = [...balances, ...initial];

  workers = await Promise.all([
    amqp.createWorker('Wallet.Query', async ({ type, data }) => {
      if (type === 'AvailableBalance' || type === 'TotalBalance') {
        return findDocument(data.account).balance;
      }
    }),
    amqp.createWorker('Wallet.Command', async ({ type, data }) => {
      const document = findDocument(data.account);

      if (type === 'Credit') {
        document.balance += data.amount;
        return true;
      }

      if (type === 'Debit') {
        document.balance -= data.amount;
        debits[data.transaction] = data.amount;
        return true;
      }

      if (type === 'RollbackDebit') {
        document.balance += debits[data.transaction];
        delete debits[data.transaction];
        return true;
      }

      if (type === 'AddTurnover') {
        return true;
      }

      throw new Error(`\`${type}\` is not supported.`);
    }),
  ]);
}

export async function stop() {
  await Promise.all(workers.map(worker => worker.stop()));
}
