const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { query } = require('../config/database');
const { auth, authorizeProject } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel or CSV file.'));
    }
  }
});

/**
 * @route   POST /api/import/tasks/:projectId
 * @desc    Import tasks from Excel file
 * @access  Private
 */
router.post('/tasks/:projectId', auth, authorizeProject('member'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${data.length} tasks from Excel`);

    // Get project members for user mapping
    const projectMembers = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email 
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [projectId]
    );

    const userMap = createUserMap(projectMembers.rows);

    // Get default column for tasks
    const defaultColumn = await query(
      'SELECT id FROM kanban_columns WHERE project_id = $1 ORDER BY position LIMIT 1',
      [projectId]
    );

    const defaultColumnId = defaultColumn.rows.length > 0 ? defaultColumn.rows[0].id : null;

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
        const task = await createTaskFromRow(
          row, 
          projectId, 
          userId, 
          userMap, 
          defaultColumnId
        );
        
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
          taskName: data[i]['Task Name'] || 'Unknown'
        });
      }
    }

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, details) 
       VALUES ($1, $2, 'imported_tasks', 'project', $3)`,
      [userId, projectId, JSON.stringify({ 
        success: importResults.success, 
        failed: importResults.failed 
      })]
    );

    res.json({
      message: 'Import completed',
      results: importResults
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      message: 'Error importing tasks',
      error: error.message 
    });
  }
});

/**
 * Create user map for quick lookup
 */
function createUserMap(users) {
  const userMap = {};

  users.forEach(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    userMap[fullName] = user.id;
    userMap[user.email.toLowerCase()] = user.id;
  });

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
      // Excel epoch starts at 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString();
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
  if (!priority) return 'medium';

  const normalized = priority.toLowerCase();
  const priorityMap = {
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'urgent': 'urgent'
  };

  return priorityMap[normalized] || 'medium';
}

/**
 * Map status from Zoho to SQUAD PM
 */
function mapStatus(status) {
  if (!status) return 'Backlog';

  const normalized = status.toLowerCase();
  
  // Common status mappings
  if (normalized.includes('progress')) return 'In Progress';
  if (normalized.includes('review')) return 'In Review';
  if (normalized.includes('done') || normalized.includes('complete')) return 'Done';
  if (normalized.includes('blocked')) return 'Blocked';
  if (normalized.includes('todo') || normalized.includes('to do')) return 'To Do';

  // Return original if no mapping found
  return status;
}

/**
 * Create a task from Excel row data
 */
async function createTaskFromRow(row, projectId, createdById, userMap, defaultColumnId) {
  // Parse dates
  const startDate = parseExcelDate(row['Start Date']);
  const dueDate = parseExcelDate(row['Due Date']);
  const completionDate = parseExcelDate(row['Completion Date']);

  // Map priority and status
  const priority = mapPriority(row['Priority']);
  const status = mapStatus(row['Custom Status']);

  // Parse tags
  const tags = row['Tags'] ? row['Tags'].split(',').map(t => t.trim()).filter(t => t) : [];

  // Find assignee
  const assigneeId = findUserId(row['Owner'], userMap);

  // Parse numeric fields
  const durationHours = parseFloat(row['Duration']) || null;
  const workHours = parseFloat(row['Work Hours']) || 0;
  const completionPercentage = parseInt(row['% Completed']) || 0;

  // Get next position
  const positionResult = await query(
    'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE column_id = $1',
    [defaultColumnId]
  );
  const position = positionResult.rows[0].next_position;

  // Create task
  const taskResult = await query(
    `INSERT INTO tasks (
      title, description, status, priority, project_id, column_id, 
      reporter_id, due_date, position, tags, start_date, duration_hours,
      completion_percentage, completed_at, work_hours, billing_type
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
    RETURNING *`,
    [
      row['Task Name'] || 'Untitled Task',
      row['Description'] || '',
      status,
      priority,
      projectId,
      defaultColumnId,
      createdById,
      dueDate,
      position,
      tags,
      startDate,
      durationHours,
      completionPercentage,
      completionDate,
      workHours,
      row['Billing Type'] || 'None'
    ]
  );

  const task = taskResult.rows[0];

  // Assign user if found
  if (assigneeId) {
    await query(
      'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
      [task.id, assigneeId]
    );

    // Create notification for assignee
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, 'task_assigned', 'New task assigned', $2, $3)`,
      [assigneeId, `You have been assigned to "${task.title}"`, 
       JSON.stringify({ task_id: task.id, project_id: projectId })]
    );
  }

  console.log(`Created task: ${task.title}`);
  return task;
}

module.exports = router;
