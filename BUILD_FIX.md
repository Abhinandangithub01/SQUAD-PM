# Build Failure Fix - amplify_outputs.json Encoding Issue

## 🔴 Error Analysis

**Error Message:**
```
Module parse failed: Cannot parse JSON: Unexpected token '�', "��{
"auth": {
' is not valid JSON
```

**Root Cause:**
The backend deployment generates `amplify_outputs.json` in the root directory with potential BOM (Byte Order Mark) characters. The frontend build tries to import this file but encounters encoding issues.

---

## ✅ Solution Applied

### Fix 1: Update amplify.yml to Copy and Clean JSON

**File**: `amplify.yml`

Added command to copy `amplify_outputs.json` from root to `client/src/` with proper encoding:

```yaml
backend:
  phases:
    build:
      commands:
        - npm install --legacy-peer-deps
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        # Copy amplify_outputs.json to client/src with proper encoding
        - cat amplify_outputs.json | jq '.' > client/src/amplify_outputs.json
```

This uses `jq` to:
- Parse the JSON
- Remove any BOM or encoding issues
- Output clean UTF-8 JSON

---

## 🚀 Deployment Steps

### Option 1: Commit and Push (Recommended)

```bash
git add amplify.yml
git commit -m "fix: resolve amplify_outputs.json encoding issue in build"
git push origin main
```

AWS Amplify will automatically redeploy with the fix.

---

### Option 2: Alternative Fix (If jq is not available)

If `jq` is not available in the build environment, use this alternative:

**Update `amplify.yml`:**

```yaml
backend:
  phases:
    build:
      commands:
        - npm install --legacy-peer-deps
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        # Copy with encoding fix using node
        - node -e "const fs=require('fs'); const data=fs.readFileSync('amplify_outputs.json','utf8').replace(/^\uFEFF/,''); fs.writeFileSync('client/src/amplify_outputs.json',data,'utf8');"
```

---

### Option 3: Update Frontend Import (Fallback)

If the above doesn't work, update how the frontend imports the config:

**File**: `client/src/index.js`

```javascript
import { Amplify } from 'aws-amplify';

// Dynamically import to avoid build-time parsing
const configureAmplify = async () => {
  try {
    const response = await fetch('/amplify_outputs.json');
    const outputs = await response.json();
    
    const amplifyConfig = {
      Auth: {
        Cognito: {
          userPoolId: outputs.auth?.user_pool_id,
          userPoolClientId: outputs.auth?.user_pool_client_id,
          identityPoolId: outputs.auth?.identity_pool_id,
          loginWith: {
            email: true,
          },
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: { required: true },
            given_name: { required: true },
            family_name: { required: true },
          },
          passwordFormat: {
            minLength: outputs.auth?.password_policy?.min_length || 8,
            requireLowercase: outputs.auth?.password_policy?.require_lowercase || true,
            requireUppercase: outputs.auth?.password_policy?.require_uppercase || true,
            requireNumbers: outputs.auth?.password_policy?.require_numbers || true,
            requireSpecialCharacters: outputs.auth?.password_policy?.require_symbols || true,
          },
        },
      },
      API: {
        GraphQL: {
          endpoint: outputs.data?.url,
          region: outputs.data?.aws_region,
          defaultAuthMode: 'userPool',
          apiKey: outputs.data?.api_key,
          modelIntrospection: outputs.data?.model_introspection,
        },
      },
    };

    Amplify.configure(amplifyConfig, { ssr: false });
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
};

// Configure before rendering
configureAmplify().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

---

## 🧪 Testing the Fix

### 1. Monitor Build Logs

After pushing, watch the Amplify Console build logs:

```
Backend Build → Should complete successfully
Frontend Build → Should now compile without JSON parse errors
```

### 2. Verify File Creation

In build logs, check for:
```
✓ amplify_outputs.json copied to client/src/
✓ Frontend build succeeded
```

### 3. Test Application

Once deployed:
- Navigate to your app URL
- Open browser console
- Verify no "Auth UserPool not configured" errors
- Try logging in

---

## 🔍 Additional Debugging

### Check File Encoding Locally

```bash
# Check for BOM
file client/src/amplify_outputs.json

# View first bytes
hexdump -C client/src/amplify_outputs.json | head

# Should show: 7b 22 61 75 (which is {"au)
# Should NOT show: ef bb bf (which is BOM)
```

### Validate JSON

```bash
# Test JSON validity
cat client/src/amplify_outputs.json | jq '.' > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

---

## 📋 Rollback Plan

If the fix causes issues:

### Revert amplify.yml
```bash
git revert HEAD
git push origin main
```

### Use Static Configuration
Temporarily hardcode the configuration in `index.js` until the issue is resolved:

```javascript
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_woC9GygUF',
      userPoolClientId: '60qcl823scus2kqpelnv3i29op',
      identityPoolId: 'ap-south-1:f6403882-ace6-4694-a758-17dab33abbdf',
      // ... rest of config
    },
  },
  // ... rest of config
};

Amplify.configure(amplifyConfig);
```

---

## 🎯 Success Criteria

- ✅ Backend build completes successfully
- ✅ `amplify_outputs.json` copied to `client/src/`
- ✅ Frontend build completes without JSON parse errors
- ✅ Application loads without errors
- ✅ Authentication works correctly

---

## 📞 Common Issues

### Issue: `jq: command not found`

**Solution**: Use the Node.js alternative in Option 2 above.

### Issue: File not found after copy

**Solution**: Verify the path in amplify.yml:
```yaml
- ls -la amplify_outputs.json  # Check root
- ls -la client/src/amplify_outputs.json  # Check destination
```

### Issue: Still getting encoding errors

**Solution**: 
1. Use Option 3 (dynamic import)
2. Or add to `.gitignore` and generate at build time only

---

## 🔄 Long-term Solution

Consider using environment variables instead of JSON files:

**amplify.yml:**
```yaml
backend:
  phases:
    build:
      commands:
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        # Export as environment variables
        - export REACT_APP_USER_POOL_ID=$(cat amplify_outputs.json | jq -r '.auth.user_pool_id')
        - export REACT_APP_USER_POOL_CLIENT_ID=$(cat amplify_outputs.json | jq -r '.auth.user_pool_client_id')
        # ... etc
```

**index.js:**
```javascript
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      // ...
    },
  },
};
```

---

**Status**: Fix applied to `amplify.yml`  
**Action Required**: Commit and push changes  
**Expected Resolution Time**: 5-10 minutes (next build)
