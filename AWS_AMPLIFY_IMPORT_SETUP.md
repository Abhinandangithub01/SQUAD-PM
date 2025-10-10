# 🚀 AWS Amplify Import Setup

## Overview
You're using AWS Amplify (not local server), so we need to:
1. Deploy the Lambda function
2. Update DynamoDB schema
3. Configure API Gateway endpoint
4. Update frontend to use Amplify API

---

## 📋 Current Architecture

**AWS Amplify Stack:**
- ✅ Frontend: Deployed on Amplify Hosting
- ✅ Backend: AppSync GraphQL API
- ✅ Database: DynamoDB
- ❌ Import Lambda: NOT YET DEPLOYED

---

## ✅ Step-by-Step Setup

### Step 1: Update Amplify Schema

Add the new fields to your GraphQL schema:

**File:** `amplify/backend/api/schema.graphql`

Find the `Task` type and add these fields:

```graphql
type Task @model @auth(rules: [
  { allow: owner },
  { allow: private, operations: [read] }
]) {
  id: ID!
  projectId: ID! @index(name: "byProject", sortKeyFields: ["status", "createdAt"])
  project: Project @belongsTo(fields: ["projectId"])
  title: String!
  description: String
  status: TaskStatus!
  priority: TaskPriority!
  dueDate: AWSDateTime
  createdById: ID! @index(name: "byCreator", sortKeyFields: ["createdAt"])
  createdBy: User @belongsTo(fields: ["createdById"])
  assignedToId: ID @index(name: "byAssignee", sortKeyFields: ["status"])
  assignedTo: User @belongsTo(fields: ["assignedToId"])
  columnId: ID
  position: Int
  tags: [String]
  
  # NEW FIELDS FOR IMPORT
  startDate: AWSDateTime
  durationHours: Float
  completionPercentage: Int
  completedAt: AWSDateTime
  workHours: Float
  billingType: String
  
  comments: [Comment] @hasMany(indexName: "byTask", fields: ["id"])
  attachments: [Attachment] @hasMany(indexName: "byTask", fields: ["id"])
  subtasks: [Subtask] @hasMany(indexName: "byTask", fields: ["id"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

---

### Step 2: Add Import Mutation to Schema

Add this to your schema.graphql:

```graphql
# Add to Mutation type
type Mutation {
  # ... existing mutations ...
  
  importTasksFromExcel(
    projectId: ID!
    fileKey: String!
  ): ImportResult
    @function(name: "importTasks-${env}")
}

# Add new types
type ImportResult {
  success: Int!
  failed: Int!
  errors: [ImportError]
  createdTasks: [Task]
}

type ImportError {
  row: Int!
  error: String!
  taskName: String
}
```

---

### Step 3: Create Lambda Function

**File:** `amplify/backend/function/importTasks/importTasks-cloudformation-template.json`

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Lambda function for importing tasks from Excel",
  "Parameters": {
    "CloudWatchRule": {
      "Type": "String",
      "Default": "-",
      "Description": " Schedule Expression"
    },
    "deploymentBucketName": {
      "Type": "String"
    },
    "env": {
      "Type": "String"
    },
    "s3Key": {
      "Type": "String"
    }
  },
  "Conditions": {
    "ShouldNotCreateEnvResources": {
      "Fn::Equals": [
        {
          "Ref": "env"
        },
        "NONE"
      ]
    }
  },
  "Resources": {
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Metadata": {
        "aws:asset:path": "./src",
        "aws:asset:property": "Code"
      },
      "Properties": {
        "Code": {
          "S3Bucket": {
            "Ref": "deploymentBucketName"
          },
          "S3Key": {
            "Ref": "s3Key"
          }
        },
        "Handler": "index.handler",
        "FunctionName": {
          "Fn::If": [
            "ShouldNotCreateEnvResources",
            "importTasks",
            {
              "Fn::Join": [
                "",
                [
                  "importTasks",
                  "-",
                  {
                    "Ref": "env"
                  }
                ]
              ]
            }
          ]
        },
        "Environment": {
          "Variables": {
            "ENV": {
              "Ref": "env"
            },
            "REGION": {
              "Ref": "AWS::Region"
            }
          }
        },
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Runtime": "nodejs18.x",
        "Layers": [],
        "Timeout": 300,
        "MemorySize": 512
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::If": [
            "ShouldNotCreateEnvResources",
            "squadpmLambdaRole",
            {
              "Fn::Join": [
                "",
                [
                  "squadpmLambdaRole",
                  "-",
                  {
                    "Ref": "env"
                  }
                ]
              ]
            }
          ]
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "lambda.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        }
      }
    },
    "lambdaexecutionpolicy": {
      "DependsOn": [
        "LambdaExecutionRole"
      ],
      "Type": "AWS::IAM::Policy",
      "Properties": {
        "PolicyName": "lambda-execution-policy",
        "Roles": [
          {
            "Ref": "LambdaExecutionRole"
          }
        ],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": {
                "Fn::Sub": [
                  "arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*",
                  {
                    "region": {
                      "Ref": "AWS::Region"
                    },
                    "account": {
                      "Ref": "AWS::AccountId"
                    },
                    "lambda": {
                      "Ref": "LambdaFunction"
                    }
                  }
                ]
              }
            },
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:DeleteObject"
              ],
              "Resource": "arn:aws:s3:::*/*"
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "Name": {
      "Value": {
        "Ref": "LambdaFunction"
      }
    },
    "Arn": {
      "Value": {
        "Fn::GetAtt": [
          "LambdaFunction",
          "Arn"
        ]
      }
    },
    "Region": {
      "Value": {
        "Ref": "AWS::Region"
      }
    },
    "LambdaExecutionRole": {
      "Value": {
        "Ref": "LambdaExecutionRole"
      }
    }
  }
}
```

---

### Step 4: Update Lambda Function Code

The Lambda function code is already created at:
`amplify/backend/function/importTasks/index.js`

Make sure it has the correct environment variables.

---

### Step 5: Update Frontend to Use Amplify Storage

**File:** `client/src/components/ImportTasksModal.js`

Update the import handler to use Amplify Storage:

```javascript
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const handleImport = async () => {
  if (!file) {
    toast.error('Please select a file to import');
    return;
  }

  try {
    setUploading(true);

    // Upload file to S3 using Amplify Storage
    const fileKey = `imports/${projectId}/${Date.now()}_${file.name}`;
    
    const result = await uploadData({
      key: fileKey,
      data: file,
      options: {
        contentType: file.type,
      }
    }).result;

    console.log('File uploaded:', result);

    setUploading(false);
    setImporting(true);

    // Call the import mutation
    const importResult = await client.graphql({
      query: `
        mutation ImportTasks($projectId: ID!, $fileKey: String!) {
          importTasksFromExcel(projectId: $projectId, fileKey: $fileKey) {
            success
            failed
            errors {
              row
              error
              taskName
            }
            createdTasks {
              id
              title
              status
              priority
            }
          }
        }
      `,
      variables: {
        projectId: projectId,
        fileKey: result.key
      }
    });

    setImporting(false);
    const data = importResult.data.importTasksFromExcel;
    setImportResults(data);
    setShowResults(true);

    if (data.success > 0) {
      toast.success(`Successfully imported ${data.success} tasks!`);
      if (onImportComplete) {
        onImportComplete(data);
      }
    }

    if (data.failed > 0) {
      toast.error(`Failed to import ${data.failed} tasks`);
    }

  } catch (error) {
    console.error('Import error:', error);
    setUploading(false);
    setImporting(false);
    toast.error(error.message || 'Failed to import tasks');
  }
};
```

---

### Step 6: Deploy to Amplify

```bash
# 1. Push schema changes
amplify push

# 2. This will:
#    - Update DynamoDB tables with new fields
#    - Deploy Lambda function
#    - Update AppSync API
#    - Update frontend build

# 3. Confirm when prompted:
#    ? Do you want to update code for your updated GraphQL API? Yes
#    ? Do you want to generate GraphQL statements? Yes
```

---

### Step 7: Configure S3 Storage

Make sure S3 storage is configured:

```bash
amplify add storage

# Choose:
# ? Select from one of the below mentioned services: Content
# ? Provide a friendly name for your resource: importFiles
# ? Provide bucket name: squadpm-imports
# ? Who should have access: Auth users only
# ? What kind of access do you want: create, read, delete

amplify push
```

---

## 🔧 Quick Commands

```bash
# Full deployment
cd C:\Users\mail2\Downloads\ProjectManagement
amplify push

# Just update function
amplify function update importTasks
amplify push function importTasks

# Check status
amplify status

# View logs
amplify console
```

---

## 📝 Environment Variables

The Lambda function needs these environment variables (auto-configured by Amplify):

- `API_SQUADPM_GRAPHQLAPIIDOUTPUT` - AppSync API ID
- `API_SQUADPM_GRAPHQLAPIENDPOINTOUTPUT` - AppSync endpoint
- `API_SQUADPM_TASKTABLE_NAME` - DynamoDB Task table
- `API_SQUADPM_USERTABLE_NAME` - DynamoDB User table
- `STORAGE_IMPORTFILES_BUCKETNAME` - S3 bucket name

---

## ✅ Testing on Amplify

After deployment:

1. **Go to your Amplify URL**: `https://main.d1f6qp1tc8...amplifyapp.com`
2. **Navigate to Kanban Board**
3. **Click "Import Tasks"**
4. **Upload your Excel file**
5. **Click "Import Tasks"**

**Should work now!** ✅

---

## 🔍 Debugging on Amplify

### Check CloudWatch Logs
```bash
# View Lambda logs
amplify console

# Navigate to:
# Backend environments > [your-env] > Functions > importTasks > View logs
```

### Check AppSync Logs
```bash
# In AWS Console:
# AppSync > APIs > squadpm > Logging
```

### Check S3 Bucket
```bash
# Verify file was uploaded:
# S3 > squadpm-imports > imports/[projectId]/
```

---

## 🎯 Expected Flow

1. **User uploads Excel** → File goes to S3
2. **Frontend calls mutation** → AppSync receives request
3. **AppSync triggers Lambda** → Lambda downloads from S3
4. **Lambda parses Excel** → Extracts task data
5. **Lambda creates tasks** → Writes to DynamoDB
6. **Lambda returns results** → Frontend shows success/errors
7. **Lambda cleans up** → Deletes file from S3

---

## 📊 Your Data Will Map Like This

```
Task Name → title
Owner → assignedToId (matched by name/email)
Custom Status → status
Tags → tags (array)
Start Date → startDate
Due Date → dueDate
Duration → durationHours
Priority → priority (HIGH/MEDIUM/LOW)
Created By → createdById (matched)
% Completed → completionPercentage
Completion Date → completedAt
Work hours → workHours
Billing Type → billingType
```

---

## 🚨 Common Amplify Issues

### Issue 1: "Amplify has not been configured"
**Fix:** Make sure `aws-exports.js` is imported in your app

### Issue 2: "Access Denied" on S3
**Fix:** Check storage permissions in `amplify/backend/storage/`

### Issue 3: Lambda timeout
**Fix:** Increase timeout in CloudFormation template (already set to 300s)

### Issue 4: DynamoDB capacity
**Fix:** Check if you need to increase provisioned capacity

---

## 📞 Quick Help

**If import fails on Amplify:**

1. Check CloudWatch logs for Lambda errors
2. Verify S3 bucket exists and has correct permissions
3. Confirm DynamoDB tables have new fields
4. Test GraphQL mutation in AppSync console
5. Check browser console for frontend errors

---

## 🎉 After Successful Deployment

Your import feature will:
- ✅ Work on production Amplify URL
- ✅ Upload files to S3
- ✅ Process via Lambda
- ✅ Store in DynamoDB
- ✅ Handle 50+ tasks easily
- ✅ Show detailed error reports

---

**Ready to deploy?** Run `amplify push` and wait for deployment to complete! 🚀
