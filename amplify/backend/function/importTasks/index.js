const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables - Amplify auto-generates these
const API_SQUADPM_TASKTABLE_NAME = process.env.API_SQUADPM_TASKTABLE_NAME;
const API_SQUADPM_USERTABLE_NAME = process.env.API_SQUADPM_USERTABLE_NAME;
const API_SQUADPM_PROJECTMEMBERTABLE_NAME = process.env.API_SQUADPM_PROJECTMEMBERTABLE_NAME;
const STORAGE_BUCKET = process.env.STORAGE_SQUADPM_BUCKETNAME;

/**
 * Lambda handler for importing tasks from Excel
 */
exports.handler = async (event) => {
  console.log('Import Tasks Event:', JSON.stringify(event, null, 2));

  try {
    // Handle both AppSync and API Gateway events
    const args = event.arguments || JSON.parse(event.body || '{}');
    const { fileKey, projectId } = args;
    const userId = event.identity?.sub || args.userId;

    if (!fileKey || !projectId) {
      return {
        success: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: 'Missing required parameters: fileKey or projectId',
          taskName: null
        }],
        createdTasks: []
      };
    }

    // Download Excel file from S3
    const s3Params = {
      Bucket: STORAGE_BUCKET,
      Key: fileKey
    };

    console.log('Downloading file from S3:', s3Params);
    const s3Object = await s3.getObject(s3Params).promise();
    const workbook = XLSX.read(s3Object.Body, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${data.length} tasks from Excel`);

    // Get project members to map owners
    const projectMembers = await getProjectMembers(projectId);
    const userMap = await getUserMap(projectMembers);

    const importResults = {
      success: 0,
      failed: 0,
      errors: [],
      createdTasks: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const task = await createTaskFromRow(row, projectId, userId, userMap);
        
        if (task) {
          importResults.success++;
          importResults.createdTasks.push(task);
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        importResults.failed++;
        importResults.errors.push({
          row: i + 1,
          error: error.message,
          data: data[i]
        });
      }
    }

    // Clean up the uploaded file
    try {
      await s3.deleteObject(s3Params).promise();
      console.log('Cleaned up uploaded file from S3');
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
      // Don't fail the import if cleanup fails
    }

    // Return results for AppSync
    return importResults;

  } catch (error) {
    console.error('Import error:', error);
    return {
      success: 0,
      failed: 0,
      errors: [{
        row: 0,
        error: error.message,
        taskName: null
      }],
      createdTasks: []
    };
  }
};

/**
 * Create a task from Excel row data
 */
async function createTaskFromRow(row, projectId, createdById, userMap) {
  // Map Excel columns to task fields
  const taskId = uuidv4();
  const now = new Date().toISOString();

  // Parse dates
  const startDate = parseExcelDate(row['Start Date']);
  const dueDate = parseExcelDate(row['Due Date']);
  const completionDate = parseExcelDate(row['Completion Date']);

  // Map priority
  const priority = mapPriority(row['Priority']);

  // Map status
  const status = mapStatus(row['Custom Status']);

  // Parse tags
  const tags = row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [];

  // Find assignee
  const assignedToId = findUserId(row['Owner'], userMap);

  // Parse numeric fields
  const durationHours = parseFloat(row['Duration']) || null;
  const workHours = parseFloat(row['Work Hours']) || 0;
  const completionPercentage = parseInt(row['% Completed']) || 0;

  const task = {
    id: taskId,
    projectId: projectId,
    title: row['Task Name'] || 'Untitled Task',
    description: row['Description'] || '',
    status: status,
    priority: priority,
    createdById: createdById,
    assignedToId: assignedToId,
    tags: tags,
    startDate: startDate,
    dueDate: dueDate,
    durationHours: durationHours,
    completionPercentage: completionPercentage,
    completedAt: completionDate,
    workHours: workHours,
    billingType: row['Billing Type'] || 'None',
    position: 0,
    createdAt: now,
    updatedAt: now,
    __typename: 'Task'
  };

  // Save to DynamoDB
  await dynamodb.put({
    TableName: API_SQUADPM_TASKTABLE_NAME,
    Item: task
  }).promise();

  console.log(`Created task: ${task.title}`);
  return task;
}

/**
 * Get project members
 */
async function getProjectMembers(projectId) {
  const params = {
    TableName: API_SQUADPM_PROJECTMEMBERTABLE_NAME,
    IndexName: 'byProject',
    KeyConditionExpression: 'projectId = :projectId',
    ExpressionAttributeValues: {
      ':projectId': projectId
    }
  };

  const result = await dynamodb.query(params).promise();
  return result.Items || [];
}

/**
 * Create user map for quick lookup
 */
async function getUserMap(projectMembers) {
  const userMap = {};

  for (const member of projectMembers) {
    const userParams = {
      TableName: API_SQUADPM_USERTABLE_NAME,
      Key: { id: member.userId }
    };

    const userResult = await dynamodb.get(userParams).promise();
    if (userResult.Item) {
      const user = userResult.Item;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      userMap[fullName] = user.id;
      userMap[user.email.toLowerCase()] = user.id;
    }
  }

  return userMap;
}

/**
 * Find user ID by name or email
 */
function findUserId(ownerName, userMap) {
  if (!ownerName) return null;
  
  const normalized = ownerName.toLowerCase().trim();
  return userMap[normalized] || null;
}

/**
 * Parse Excel date to ISO string
 */
function parseExcelDate(dateValue) {
  if (!dateValue) return null;

  try {
    // Excel dates are serial numbers
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return new Date(date.y, date.m - 1, date.d).toISOString();
    }

    // Try parsing as string
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', dateValue, error);
    return null;
  }
}

/**
 * Map priority from Zoho to SQUAD PM
 */
function mapPriority(priority) {
  if (!priority) return 'MEDIUM';

  const normalized = priority.toLowerCase();
  const priorityMap = {
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
    'urgent': 'URGENT'
  };

  return priorityMap[normalized] || 'MEDIUM';
}

/**
 * Map status from Zoho to SQUAD PM
 */
function mapStatus(status) {
  if (!status) return 'TODO';

  const normalized = status.toLowerCase();
  const statusMap = {
    'to do': 'TODO',
    'todo': 'TODO',
    'in progress': 'IN_PROGRESS',
    'inprogress': 'IN_PROGRESS',
    'in review': 'IN_REVIEW',
    'review': 'IN_REVIEW',
    'done': 'DONE',
    'completed': 'DONE',
    'blocked': 'BLOCKED'
  };

  return statusMap[normalized] || 'TODO';
}
