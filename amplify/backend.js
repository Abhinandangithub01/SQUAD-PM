import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './backend/function/postConfirmation/resource';
import { createOrganization } from './backend/function/createOrganization/resource';
import { inviteUser } from './backend/function/inviteUser/resource';
import { acceptInvite } from './backend/function/acceptInvite/resource';
import { removeUser } from './backend/function/removeUser/resource';
import { dueDateReminder } from './backend/function/dueDateReminder/resource';
import { sendNotification } from './backend/function/sendNotification/resource';
import { webhookDispatcher } from './backend/function/webhookDispatcher/resource';
import { slackNotifier } from './backend/function/slackNotifier/resource';

/**
 * Complete AWS Amplify Backend Configuration
 * Includes: Auth, Data (GraphQL), Storage (S3), Lambda Functions
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  postConfirmation,
  createOrganization,
  inviteUser,
  acceptInvite,
  removeUser,
  dueDateReminder,
  sendNotification,
  webhookDispatcher,
  slackNotifier,
});

// Grant Lambda functions access to DynamoDB
const dataTableArn = backend.data.resources.tables['AmplifyDataTable'].tableArn;
const dataTableName = backend.data.resources.tables['AmplifyDataTable'].tableName;

// PostConfirmation Lambda permissions
backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
    resources: [dataTableArn, `${dataTableArn}/index/*`],
  })
);

backend.postConfirmation.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);

// CreateOrganization Lambda permissions
backend.createOrganization.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:UpdateItem'],
    resources: [dataTableArn, `${dataTableArn}/index/*`],
  })
);

backend.createOrganization.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);

// InviteUser Lambda permissions
backend.inviteUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:UpdateItem',
      'ses:SendEmail',
      'ses:SendRawEmail',
    ],
    resources: ['*'], // SES requires wildcard
  })
);

backend.inviteUser.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);
backend.inviteUser.addEnvironment('SES_FROM_EMAIL', 'noreply@projecthub.com');
backend.inviteUser.addEnvironment('APP_URL', 'https://main.d8tv3j2hk2i9r.amplifyapp.com');

// AcceptInvite Lambda permissions
backend.acceptInvite.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:UpdateItem',
    ],
    resources: [dataTableArn, `${dataTableArn}/index/*`],
  })
);

backend.acceptInvite.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);

// RemoveUser Lambda permissions
backend.removeUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:DeleteItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:UpdateItem',
    ],
    resources: [dataTableArn, `${dataTableArn}/index/*`],
  })
);

backend.removeUser.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);

// DueDateReminder Lambda permissions
backend.dueDateReminder.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:Scan',
      'dynamodb:Query',
      'dynamodb:GetItem',
      'ses:SendEmail',
      'ses:SendRawEmail',
    ],
    resources: ['*'], // SES requires wildcard, Scan needs table access
  })
);

backend.dueDateReminder.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);
backend.dueDateReminder.addEnvironment('SES_FROM_EMAIL', 'noreply@projecthub.com');
backend.dueDateReminder.addEnvironment('APP_URL', 'https://main.d8tv3j2hk2i9r.amplifyapp.com');

// SendNotification Lambda permissions
backend.sendNotification.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'ses:SendEmail',
      'ses:SendRawEmail',
    ],
    resources: ['*'], // SES requires wildcard
  })
);

backend.sendNotification.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);
backend.sendNotification.addEnvironment('SES_FROM_EMAIL', 'noreply@projecthub.com');
backend.sendNotification.addEnvironment('APP_URL', 'https://main.d8tv3j2hk2i9r.amplifyapp.com');

// WebhookDispatcher Lambda permissions
backend.webhookDispatcher.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
    ],
    resources: [dataTableArn, `${dataTableArn}/index/*`],
  })
);

backend.webhookDispatcher.addEnvironment('DYNAMODB_TABLE_NAME', dataTableName);

// SlackNotifier Lambda - no special permissions needed (just HTTP calls)
