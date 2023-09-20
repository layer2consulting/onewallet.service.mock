import R from 'ramda';
import { v4 as uuid } from 'uuid';
import Amqp from '@highoutput/amqp';

import { generateFakeId } from './util';
import ResourceNotFoundError from './errors/resource-not-found-error';
import InvalidRequestError from './errors/invalid-request-error';
import ResourceExistsError from './errors/resource-exists';

type Request = {
  username:
    | 'RoleSuperAdmin'
    | 'RoleMember'
    | 'RoleOperatorWithRoleSuperAdmin'
    | 'RoleOperatorWithRoleAdmin'
    | 'RoleOperatorWithRoleOperator'
    | 'AccountNotFound';
} & {
  admin: 'PermissionGroupWithPerMissionGroup' | 'PermissionGrouptNotFound';
} & {
  account:
    | 'AdminNotPermissionGroupAdmin'
    | 'AdminNotPermissionGroupOwner'
    | 'AdminPermissionGroupExist'
    | 'MemberLevelNotFound'
    | 'MemberLevelExist'
    | 'AccountMemberLevelNotFound'
    | 'AccountNotFound'
    | 'PermissionGrouptNotFound'
    | 'AccountInvalidCredentials';
} & {
  id: 'AdminNotMemberLevelOwner';
};

let dataReturned = {
  data: [
    'id',
    'username',
    'firstname',
    'lastname',
    'nickname',
    'email',
    'currency',
    'languange',
    'parent',
    'admin',
    'mobilePhone',
    'wechat',
    'qqnumber',
    'gender',
    'displayName',
    'adminCode',
    'role',
    'site',
    'indexes',
    'hooks',
  ].reduce((acc, curr) => Object.assign(acc, { [curr]: uuid() }), {}),
};

let workers: any[];
export async function start(amqp: Amqp, accounts: any[]) {
  workers = await Promise.all([
    amqp.createWorker('Account.Query', async ({ type, data }) => {
      if (type === 'Account') {
        return R.find(account => R.equals(data, R.pick(R.keys<string>(data), account)))(accounts) || null;
      }

      if (type === 'AccountMemberLevels') {
        return [
          {
            ...[
              'id',
              'admin',
              'name',
              'description',
              'handlingFeeType',
              'handlingFee',
              'tableName',
              'indexes',
            ].reduce((acc, curr) => Object.assign(acc, { [curr]: uuid() }), {}),
            minimumSingleWithdrawalLimit: 110.2,
            maximumSingleWithdrawalLimit: 120.2,
            maximumDailyWithdrawalLimit: 200.1,
            timestamps: false,
          },
        ];
      }

      if (type === 'Authenticate') {
        if (data.account === 'AccountNotFound') {
          throw new ResourceNotFoundError({ username: uuid() });
        }
        if (data.account === 'AccountInvalidCredentials') {
          throw new InvalidRequestError('Invalid credentials', {
            invalidCredentials: true,
          });
        }
        return [
          {
            ...dataReturned.data,
            enabled: true,
            frozen: true,
            ...['lastLogin', 'timestamp'].reduce(
              (acc, curr) => Object.assign(acc, { [curr]: Date.now() }),
              {}
            ),
          },
        ];
      }

      if (type === 'Informations') {
        return [
          {
            ...dataReturned.data,
            enabled: true,
            frozen: true,
            ...['lastLogin', 'timestamp'].reduce(
              (acc, curr) => Object.assign(acc, { [curr]: Date.now() }),
              {}
            ),
          },
        ];
      }

      if (type === 'MemberLevels') {
        return [
          {
            ...['id', 'admin', 'name', 'description', 'indexes'].reduce(
              (acc, curr) => Object.assign(acc, { [curr]: uuid() }),
              {}
            ),
            handlingFeeType: 'PERCENTAGE',
            handlingFee: 123.2,
            minimumSingleWithdrawalLimit: 123.2,
            maximumSingleWithdrawalLimit: 123.2,
            maximumDailyWithdrawalLimit: 200.1,
            tableName: 'MemberLevel',
            timestamps: false,
          },
        ];
      }

      if (type === 'Members') {
        return [
          {
            ...dataReturned.data,
            enabled: true,
            frozen: true,
            lastLogin: Date.now(),
            timestamp: Date.now(),
          },
        ];
      }
    }),
    amqp.createWorker('Account.Command', async function handleCommand({
      type,
      data,
    }: {
      type: string;
      data: Request;
    }) {
      if (type === 'CreateAccount') {
        if (data.username === 'RoleSuperAdmin') {
          throw new InvalidRequestError(
            'Cannot create account with role `super_admin`.',
            { invalidRole: true }
          );
        }
        if (data.username === 'RoleMember') {
          throw new InvalidRequestError(
            'Accounts with `member` role cannot create account',
            { invalidRole: true }
          );
        }
        if (data.username === 'RoleOperatorWithRoleAdmin') {
          throw new InvalidRequestError(
            'Operator cannot create account with role `admin`.',
            { invalidRole: true }
          );
        }
        if (data.username === 'RoleOperatorWithRoleSuperAdmin') {
          throw new InvalidRequestError(
            'Operator cannot create account with role `super_admin`.',
            { invalidRole: true }
          );
        }
        if (data.username === 'RoleOperatorWithRoleOperator') {
          throw new InvalidRequestError(
            'Operator cannot create account with role `operator`.',
            { invalidRole: true }
          );
        }

        return generateFakeId('acc');
      }
      if (type === 'UpdateAccount') {
        if (data.username === 'AccountNotFound') {
          throw new ResourceNotFoundError({ type: 'user', id: uuid() });
        }
        return true;
      }
      if (type === 'AssignPermissionGroup') {
        if (data.account === 'AccountNotFound') {
          throw new ResourceNotFoundError({ type: 'account', id: uuid() });
        }
        if (data.account === 'PermissionGrouptNotFound') {
          throw new ResourceNotFoundError({
            type: 'permission_group',
            id: uuid(),
          });
        }
        if (data.account === 'AdminNotPermissionGroupOwner') {
          throw new ResourceNotFoundError({
            account: uuid(),
            permissionGroup: uuid(),
            admin: uuid(),
            adminMismatch: true,
          });
        }
        if (data.account === 'AdminPermissionGroupExist') {
          throw new ResourceExistsError({
            account: uuid(),
            permissionGroup: uuid(),
          });
        }
        return true;
      }
      if (type === 'DeassignPermissionGroup') {
        if (data.account === 'AccountNotFound') {
          throw new ResourceNotFoundError({ type: 'account', id: uuid() });
        }
        if (data.account === 'PermissionGrouptNotFound') {
          throw new ResourceNotFoundError({
            type: 'permission_group',
            id: uuid(),
          });
        }
        if (data.account === 'AdminNotPermissionGroupOwner') {
          throw new ResourceNotFoundError({
            account: uuid(),
            permissionGroup: uuid(),
            admin: uuid(),
          });
        }
        return true;
      }
      if (type === 'UpdatePermissionGroup') {
        if (data.admin === 'PermissionGrouptNotFound') {
          throw new ResourceNotFoundError({ id: uuid() });
        }
        if (data.admin === 'PermissionGroupWithPerMissionGroup') {
          throw new ResourceNotFoundError({ id: uuid() });
        }
        return true;
      }
      if (type === 'DeletePermissionGroup') {
        if (data.admin === 'PermissionGrouptNotFound') {
          throw new ResourceNotFoundError({ id: uuid() });
        }
        if (data.admin === 'PermissionGroupWithPerMissionGroup') {
          throw new ResourceNotFoundError({ id: uuid() });
        }
        return true;
      }
      if (type === 'AssignAccountMemberLevel') {
        if (data.account === 'MemberLevelNotFound') {
          throw new ResourceNotFoundError({
            type: 'member_level',
            id: uuid(),
          });
        }
        if (data.account === 'MemberLevelExist') {
          throw new ResourceExistsError({
            type: 'account_member_level',
            id: uuid(),
            account: uuid(),
            memberLevel: uuid(),
          });
        }
        return uuid();
      }
      if (type === 'DeassignAccountMemberLevel') {
        if (data.account === 'AccountMemberLevelNotFound') {
          throw new ResourceNotFoundError({
            type: 'account_member_level',
            id: uuid(),
            account: uuid(),
            memberLevel: uuid(),
          });
        }
        return true;
      }
      if (type === 'UpdateMemberLevel') {
        if (data.id === 'AdminNotMemberLevelOwner') {
          throw new ResourceNotFoundError({
            type: 'member_level',
            id: uuid(),
          });
        }
        return true;
      }
      if (type === 'DeleteMemberLevel') {
        if (data.id === 'AdminNotMemberLevelOwner') {
          throw new ResourceNotFoundError({
            type: 'member_level',
            id: uuid(),
          });
        }
        return true;
      }
    }),
  ]);
}
export async function stop() {
  await Promise.all(workers.map(worker => worker.stop()));
}
