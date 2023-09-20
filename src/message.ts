import { hash } from 'highoutput-utilities';
import R from 'ramda';
import Amqp from '@highoutput/amqp';

import { generateFakeId } from './util';
import {
  AccountMessage,
  AccountMessagesQueryInput,
  CreateMessageCommandInput,
  MarkAsReadCommandInput,
  Message,
  MessageQueryInput,
  MessagesQueryInput,
  TypeAndDataInput,
} from './types/message';

let workers: any[];
let messages: Message[];
let accountMessages: AccountMessage[];

export async function start(
  amqp: Amqp,
  {
    initialMessages,
    initialAccountMessages,
  }: { initialMessages: Message[]; initialAccountMessages: AccountMessage[] }
): Promise<void> {
  messages = R.clone(initialMessages);
  accountMessages = R.clone(initialAccountMessages);

  workers = await Promise.all([
    amqp.createWorker('Message', async ({ type, data }: TypeAndDataInput) => {
      if (type === 'CreateMessage') {
        const id = generateFakeId('msg');
        messages.push({
          ...(data as CreateMessageCommandInput),
          dateTimeCreated: new Date(),
          id,
        });
        return id;
      }

      if (type === 'MarkAsRead') {
        accountMessages.map(accountMessage => {
          const { admin, account, id } = data as MarkAsReadCommandInput;
          if (
            accountMessage.account !== account &&
            accountMessage.admin !== admin &&
            accountMessage.id !== id
          ) {
            return accountMessage;
          }

          return {
            ...accountMessage,
            isRead: true,
          };
        });

        return true;
      }

      if (type === 'Message') {
        return R.find(R.propEq('id', (data as MessageQueryInput).id))(messages);
      }

      if (type === 'Messages') {
        const filteredMessages = messages.filter(
          message => message.admin === (data as MessagesQueryInput).filter.admin
        );

        const edges = filteredMessages.map(message => {
          const cursor = `${message.dateTimeCreated
            .getTime()
            .toString(36)
            .padStart(8, '0')}${hash(message.id)
            .toString('hex')
            .substr(0, 16)}}`;

          return {
            node: message,
            cursor: Buffer.from(cursor, 'utf8').toString('base64'),
          };
        });

        const endCursor =
          edges.length > 0
            ? R.prop('cursor')(R.last(edges) as { cursor: string })
            : null;

        let hasNextPage = false;

        return {
          totalCount: filteredMessages.length,
          edges,
          pageInfo: {
            endCursor,
            hasNextPage,
          },
        };
      }

      if (type === 'AccountMessages') {
        const filteredAccountMessages = accountMessages.filter(
          ({ account, admin }) => {
            const { filter } = data as AccountMessagesQueryInput;
            return account === filter.account && admin === filter.admin;
          }
        );

        const edges = filteredAccountMessages.map(accountMessage => {
          const cursor = `${accountMessage.dateTimeCreated
            .getTime()
            .toString(36)
            .padStart(8, '0')}${hash(accountMessage.id)
            .toString('hex')
            .substr(0, 16)}}`;

          return {
            node: accountMessage,
            cursor: Buffer.from(cursor, 'utf8').toString('base64'),
          };
        });

        const endCursor =
          edges.length > 0
            ? R.prop('cursor')(R.last(edges) as { cursor: string })
            : null;

        let hasNextPage = false;

        return {
          totalCount: filteredAccountMessages.length,
          edges,
          pageInfo: {
            endCursor,
            hasNextPage,
          },
        };
      }
    }),
  ]);
}

export async function stop(): Promise<void> {
  await Promise.all(workers.map(worker => worker.stop()));
}
