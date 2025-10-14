# Phase 1 Deployment Guide - Multi-Tenancy Implementation

## 🚀 Quick Start Deployment

### Prerequisites
- AWS Account with Amplify CLI configured
- Node.js 18+ installed
- Git repository connected to AWS Amplify

---

## Step 1: Update Backend Configuration

### 1.1 Update Cognito Auth Trigger

Edit `amplify/auth/resource.js`:

```javascript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
    // Add custom attributes for multi-tenancy
    'custom:organizationId': {
      dataType: 'String',
      mutable: true,
    },
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
  },
  // Add Lambda triggers
  triggers: {
    postConfirmation: './backend/function/postConfirmation',
  },
});
```

### 1.2 Update Backend Definition

Edit `amplify/backend.js`:

```javascript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { postConfirmation } from './backend/function/postConfirmation/resource';
import { createOrganization } from './backend/function/createOrganization/resource';
import { inviteUser } from './backend/function/inviteUser/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  postConfirmation,
  createOrganization,
  inviteUser,
});

// Grant Lambda permissions to DynamoDB
backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
    resources: [backend.data.resources.tables['AmplifyDataTable'].tableArn],
  })
);

backend.createOrganization.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
    resources: [backend.data.resources.tables['AmplifyDataTable'].tableArn],
  })
);

backend.inviteUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
      'ses:SendEmail',
      'ses:SendRawEmail',
    ],
    resources: ['*'],
  })
);
```

---

## Step 2: Deploy Backend Changes

### 2.1 Deploy to Sandbox (Development)

```bash
cd client
npx ampx sandbox
```

This will:
- ✅ Create new DynamoDB tables with updated schema
- ✅ Deploy Lambda functions
- ✅ Update Cognito User Pool
- ✅ Generate new `amplify_outputs.json`

### 2.2 Deploy to Production

```bash
# Commit changes
git add .
git commit -m "feat: implement multi-tenancy with Organization models and Lambda functions"
git push origin main

# Amplify will automatically deploy
```

---

## Step 3: Configure Amazon SES

### 3.1 Verify Email Address

```bash
aws ses verify-email-identity --email-address noreply@projecthub.com
```

Check your email and click the verification link.

### 3.2 Request Production Access

If sending to non-verified emails:
1. Go to AWS SES Console
2. Click "Request production access"
3. Fill out the form
4. Wait for approval (usually 24 hours)

### 3.3 Set Up Email Templates (Optional)

Create custom email templates in SES console for better branding.

---

## Step 4: Update Frontend

### 4.1 Create Organization Context

Create `client/src/contexts/OrganizationContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext({});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const client = generateClient();

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      // Get user's organization membership
      const { data: memberships } = await client.models.OrganizationMember.list({
        filter: { userId: { eq: user.id } }
      });

      if (memberships && memberships.length > 0) {
        const membership = memberships[0];
        setMembership(membership);

        // Get organization details
        const { data: org } = await client.models.Organization.get({
          id: membership.organizationId
        });
        setOrganization(org);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    organization,
    membership,
    loading,
    refreshOrganization: fetchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
```

### 4.2 Update App.js

```javascript
import { OrganizationProvider } from './contexts/OrganizationContext';

function App() {
  return (
    <CognitoAuthProvider>
      <OrganizationProvider>
        {/* Rest of your app */}
      </OrganizationProvider>
    </CognitoAuthProvider>
  );
}
```

### 4.3 Update API Calls

Example: Creating a project with organizationId

```javascript
import { useOrganization } from '../contexts/OrganizationContext';

const CreateProject = () => {
  const { organization } = useOrganization();
  const client = generateClient();

  const createProject = async (projectData) => {
    const { data } = await client.models.Project.create({
      ...projectData,
      organizationId: organization.id, // Add organization ID
    });
    return data;
  };
};
```

---

## Step 5: Testing

### 5.1 Test User Signup Flow

1. **Create new account**
   ```
   Email: test@example.com
   Password: Test123!@#
   ```

2. **Verify PostConfirmation Lambda**
   - Check CloudWatch Logs
   - Verify User record created in DynamoDB
   - Check `amplify_outputs.json` for table name

3. **Check DynamoDB**
   ```bash
   aws dynamodb scan --table-name AmplifyDataTable-<env> --limit 10
   ```

### 5.2 Test Organization Creation

```javascript
// In browser console or Postman
const response = await fetch('https://your-api-gateway-url/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    name: 'Acme Corp',
    slug: 'acme-corp',
    description: 'Test organization',
    industry: 'Technology',
    size: 'SMALL',
    plan: 'FREE',
  }),
});
```

### 5.3 Test User Invitation

```javascript
const response = await fetch('https://your-api-gateway-url/organizations/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    organizationId: 'org-id-here',
    email: 'newuser@example.com',
    role: 'MEMBER',
  }),
});
```

---

## Step 6: Monitoring & Troubleshooting

### 6.1 CloudWatch Logs

Monitor Lambda execution:
```bash
aws logs tail /aws/lambda/postConfirmation --follow
aws logs tail /aws/lambda/createOrganization --follow
aws logs tail /aws/lambda/inviteUser --follow
```

### 6.2 Common Issues

#### Issue: PostConfirmation Lambda not triggering
**Solution**: 
- Check Cognito trigger configuration
- Verify Lambda has correct permissions
- Check CloudWatch Logs for errors

#### Issue: Email not sending
**Solution**:
- Verify SES email address
- Check SES sandbox mode
- Verify Lambda has SES permissions
- Check CloudWatch Logs

#### Issue: DynamoDB access denied
**Solution**:
- Verify Lambda IAM role has DynamoDB permissions
- Check table name in environment variables
- Verify table exists

#### Issue: Authorization errors in GraphQL
**Solution**:
- Clear browser cache and reload
- Re-authenticate user
- Check `amplify_outputs.json` is up to date
- Verify authorization rules in schema

---

## Step 7: Rollback Plan

If issues occur:

### 7.1 Rollback Backend
```bash
git revert HEAD
git push origin main
```

### 7.2 Restore DynamoDB Backup
```bash
aws dynamodb restore-table-from-backup \
  --target-table-name AmplifyDataTable-prod \
  --backup-arn arn:aws:dynamodb:region:account:table/AmplifyDataTable/backup/backup-id
```

### 7.3 Revert Cognito Changes
- Remove Lambda triggers manually in AWS Console
- Remove custom attributes (if possible)

---

## 📊 Deployment Checklist

- [ ] Backend schema updated with Organization models
- [ ] Lambda functions created and configured
- [ ] Cognito custom attributes added
- [ ] PostConfirmation trigger configured
- [ ] SES email verified
- [ ] Environment variables set
- [ ] IAM permissions configured
- [ ] Frontend OrganizationContext created
- [ ] API calls updated with organizationId
- [ ] Testing completed
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🎯 Success Criteria

- ✅ New users automatically get User profile
- ✅ Organizations can be created via API
- ✅ Users can be invited to organizations
- ✅ Invitation emails are sent
- ✅ Data is properly isolated by organization
- ✅ Authorization rules work correctly
- ✅ No errors in CloudWatch Logs

---

## 📞 Support

If you encounter issues:
1. Check CloudWatch Logs
2. Review DynamoDB tables
3. Verify IAM permissions
4. Check SES configuration
5. Review this guide

---

**Deployment Time Estimate**: 30-60 minutes  
**Testing Time Estimate**: 30 minutes  
**Total Time**: 1-2 hours
