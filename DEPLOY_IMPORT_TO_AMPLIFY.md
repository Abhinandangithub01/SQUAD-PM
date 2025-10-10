# 🚀 Deploy Import Feature to AWS Amplify

## Quick Deployment Steps

### Step 1: Update Schema
Add new fields to `amplify/backend/api/schema.graphql`:

```graphql
type Task @model @auth(rules: [
  { allow: owner },
  { allow: private, operations: [read] }
]) {
  # ... existing fields ...
  
  # ADD THESE NEW FIELDS:
  startDate: AWSDateTime
  durationHours: Float
  completionPercentage: Int
  completedAt: AWSDateTime
  workHours: Float
  billingType: String
  
  # ... rest of fields ...
}

# ADD THIS MUTATION:
type Mutation {
  importTasksFromExcel(
    projectId: ID!
    fileKey: String!
  ): ImportResult
    @function(name: "importTasks-${env}")
}

# ADD THESE TYPES:
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

### Step 2: Deploy Changes
```bash
amplify push
```

Answer prompts:
- ✅ Do you want to update code for your updated GraphQL API? **Yes**
- ✅ Do you want to generate GraphQL statements? **Yes**

### Step 3: Test
1. Go to your Amplify URL
2. Navigate to Kanban Board
3. Click "Import Tasks"
4. Upload Excel file
5. Import!

---

## ✅ What Was Updated

1. ✅ **ImportTasksModal.js** - Now uses Amplify Storage and GraphQL
2. ✅ **Lambda function** - Already created in `amplify/backend/function/importTasks/`
3. ✅ **Schema** - Needs manual update (see Step 1)

---

## 🎯 After Deployment

Your import will:
- Upload Excel to S3
- Trigger Lambda function
- Parse Excel and create tasks in DynamoDB
- Return success/error results
- Display in UI

---

## 📞 If You Get Errors

**"importTasksFromExcel is not defined"**
- You need to add the mutation to schema.graphql
- Run `amplify push`

**"Access Denied" on S3**
- Configure storage: `amplify add storage`
- Choose "Content" and allow auth users

**Lambda timeout**
- Already configured for 300 seconds
- Should handle 100+ tasks easily

---

**Ready to deploy?** Just run `amplify push`! 🚀
