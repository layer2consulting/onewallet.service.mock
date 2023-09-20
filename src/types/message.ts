import { Language, Pagination } from '../types';

export type Type =
  | 'Message'
  | 'Messages'
  | 'AccountMessages'
  | 'CreateMessage'
  | 'MarkAsRead';

export type MessageQueryInput = {
  readonly admin: string;
  readonly id: string;
};

export type MessagesQueryInput = Pagination<{ readonly admin: string }>;

export type AccountMessagesQueryInput = Pagination<{
  readonly account: string;
  readonly admin: string;
}>;

export type CreateMessageCommandInput = {
  readonly admin: string;
  readonly creator?: string;
  readonly body: {
    [language in Language]?: { title: string; content: string }
  };
  readonly targetAccounts: string[];
  readonly targetMemberLevels?: string[];
};

export type MarkAsReadCommandInput = {
  readonly admin: string;
  readonly account: string;
  readonly id: string;
};

export type DataInput =
  | MessageQueryInput
  | MessagesQueryInput
  | AccountMessagesQueryInput
  | CreateMessageCommandInput
  | MarkAsReadCommandInput;

export type TypeAndDataInput = { type: Type; data: DataInput };

export type Message = {
  id: string;
  admin: string;
  creator?: string;
  body: any;
  targetAccounts: string[];
  targetMemberLevels?: string[];
  dateTimeCreated: Date;
};

export type AccountMessage = {
  id: string;
  admin: string;
  account: string;
  message: string;
  dateTimeCreated: Date;
  isRead: boolean;
  cursor?: string;
};
