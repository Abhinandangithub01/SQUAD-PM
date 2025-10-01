# 🚀 Simplified AWS Setup - No AWS CLI Required

## Alternative Method: Use Amplify Studio (Browser-Based)

This method is easier and doesn't require AWS CLI installation!

---

## **Step 1: Access Your Amplify App in Browser**

1. **Go to AWS Amplify Console:**
   https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1sl3pki9s1332

2. **Sign in with your AWS account**

---

## **Step 2: Set Up Backend Using Amplify Studio**

### Option A: Use Amplify Studio (Easiest)

1. **In Amplify Console, click "Backend environments"**
2. **Click "Get started" under "Set up Amplify Studio"**
3. **Click "Launch Studio"**

4. **In Studio, you can:**
   - Create data models (Users, Projects, Tasks) visually
   - Set up authentication
   - Configure storage
   - No coding required!

### Option B: Manual Backend Setup (Using Console)

If you prefer manual setup, follow these steps in AWS Console:

---

## **Method 1: Set Up AWS Cognito (Authentication)**

1. **Go to AWS Cognito Console:**
   https://console.aws.amazon.com/cognito/home?region=us-east-1

2. **Click "Create user pool"**

3. **Configure sign-in:**
   - Sign-in options: ✅ Email
   - Click "Next"

4. **Security requirements:**
   - Password policy: Cognito defaults
   - MFA: Optional (enable later)
   - Click "Next"

5. **Sign-up experience:**
   - Self-service sign-up: ✅ Enable
   - Attributes: ✅ email, ✅ given_name, ✅ family_name
   - Click "Next"

6. **Message delivery:**
   - Email provider: Send email with Cognito
   - Click "Next"

7. **Integrate your app:**
   - User pool name: `projectmanagement-users`
   - App client name: `projectmanagement-web`
   - Click "Next"

8. **Review and create**
   - Click "Create user pool"

9. **Save these values:**
   ```
   User Pool ID: us-east-1_XXXXXXXXX
   App Client ID: XXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

## **Method 2: Set Up DynamoDB Tables**

1. **Go to DynamoDB Console:**
   https://console.aws.amazon.com/dynamodb/home?region=us-east-1

2. **Create Tables (one by one):**

### **Table 1: Users**
- Table name: `Users-prod`
- Partition key: `id` (String)
- Click "Create table"

### **Table 2: Projects**
- Table name: `Projects-prod`
- Partition key: `id` (String)
- Click "Create table"

### **Table 3: Tasks**
- Table name: `Tasks-prod`
- Partition key: `id` (String)
- Add index: `projectId-index`
- Click "Create table"

### **Table 4: Comments**
- Table name: `Comments-prod`
- Partition key: `id` (String)
- Add index: `taskId-index`
- Click "Create table"

---

## **Method 3: Set Up S3 Bucket (File Storage)**

1. **Go to S3 Console:**
   https://s3.console.aws.amazon.com/s3/home?region=us-east-1

2. **Click "Create bucket"**

3. **Configure:**
   - Bucket name: `projectmanagement-files-prod`
   - Region: US East (N. Virginia) us-east-1
   - Block all public access: ✅ (keep checked)
   - Bucket Versioning: Enable
   - Click "Create bucket"

4. **Set up CORS:**
   - Go to bucket → Permissions → CORS
   - Add this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://main.d1sl3pki9s1332.amplifyapp.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

---

## **Method 4: Set Up API Gateway (REST API)**

1. **Go to API Gateway Console:**
   https://console.aws.amazon.com/apigateway/home?region=us-east-1

2. **Click "Create API"**

3. **Choose "REST API" → Build**

4. **Configure:**
   - API name: `projectmanagement-api`
   - Endpoint type: Regional
   - Click "Create API"

5. **Create Resources:**
   - Create `/projects`
   - Create `/tasks`
   - Create `/users`
   - etc.

---

## **Easier Alternative: Use Amplify CLI Without AWS CLI**

Since AWS CLI installation is tricky on Windows, let's use Amplify directly:

### **Step 1: Configure Amplify (One-time setup)**

```bash
# In PowerShell
amplify configure
```

This will:
1. Open browser to AWS Console
2. Create an IAM user automatically
3. Return to terminal with credentials

**Follow the prompts:**
- Region: `us-east-1`
- User name: `amplify-admin`

### **Step 2: Initialize Amplify in Your Project**

```bash
cd C:\Users\mail2\Downloads\ProjectManagement\client

amplify init
```

**Answer the prompts:**
```
? Enter a name for the project: projectmanagementsys
? Initialize the project with the above configuration? Yes
? Select the authentication method: AWS profile
? Please choose the profile you want to use: amplify-admin
```

### **Step 3: Add Backend Services**

```bash
# Add Authentication
amplify add auth
# Choose: Default configuration
# Sign in: Email
# Advanced: No

# Add API
amplify add api
# Choose: GraphQL
# Name: projectmanagementapi
# Auth: Amazon Cognito User Pool
# Schema: Single object with fields

# Add Storage
amplify add storage
# Choose: Content
# Name: projectfiles
# Access: Auth users only
# Permissions: create, read, update, delete
```

### **Step 4: Deploy Everything**

```bash
amplify push
```

This will:
- ✅ Create Cognito User Pool
- ✅ Create AppSync GraphQL API
- ✅ Create DynamoDB tables
- ✅ Create S3 bucket
- ✅ Generate `aws-exports.js`

---

## **Step 5: Update Frontend**

### **1. Install Amplify packages:**

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### **2. Update `src/index.js`:**

```javascript
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);
```

### **3. Update `src/App.js`:**

Replace `AuthProvider` with `CognitoAuthProvider`:

```javascript
import { CognitoAuthProvider } from './contexts/CognitoAuthContext';

function App() {
  return (
    <CognitoAuthProvider>
      {/* Your existing app */}
    </CognitoAuthProvider>
  );
}
```

---

## **Quick Test**

Once setup is complete, test with:

```bash
npm start
```

Then:
1. ✅ Register a new user
2. ✅ Check email for verification code
3. ✅ Verify and login
4. ✅ Create a project
5. ✅ Everything should work with AWS backend!

---

## **Configuration Values Needed**

After setup, you'll have these values in `aws-exports.js`:

```javascript
{
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_XXXXXXXXX",
  "aws_user_pools_web_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
  "aws_appsync_graphqlEndpoint": "https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
  "aws_user_files_s3_bucket": "projectmanagement-xxxxx"
}
```

---

## **Next Command to Run:**

```bash
amplify configure
```

This will guide you through the entire setup in your browser! 🚀
