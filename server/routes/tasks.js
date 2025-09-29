const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { auth, authorizeProject } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow(''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  project_id: Joi.string().uuid().required(),
  column_id: Joi.string().uuid(),
  assignee_ids: Joi.array().items(Joi.string().uuid()).default([]),
  due_date: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string()).default([])
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().allow(''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  status: Joi.string(),
  column_id: Joi.string().uuid().allow(null),
  assignee_ids: Joi.array().items(Joi.string().uuid()),
  due_date: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string()),
  position: Joi.number().integer().min(0)
});

const convertToIssueSchema = Joi.object({
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  environment: Joi.string().allow(''),
  steps_to_reproduce: Joi.string().allow('')
});

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    const { type, status, assignee, priority, search } = req.query;
    
    let whereClause = 'WHERE t.project_id = $1';
    const queryParams = [req.params.projectId];
    let paramCount = 2;

    // Add filters
    if (type) {
      whereClause += ` AND t.type = $${paramCount++}`;
      queryParams.push(type);
    }
    if (status) {
      whereClause += ` AND t.status = $${paramCount++}`;
      queryParams.push(status);
    }
    if (assignee) {
      whereClause += ` AND EXISTS (SELECT 1 FROM task_assignees WHERE task_id = t.id AND user_id = $${paramCount++})`;
      queryParams.push(assignee);
    }
    if (priority) {
      whereClause += ` AND t.priority = $${paramCount++}`;
      queryParams.push(priority);
    }
    if (search) {
      whereClause += ` AND (t.title ILIKE $${paramCount++} OR t.description ILIKE $${paramCount++})`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const result = await query(
      `SELECT t.*, 
              u.first_name || ' ' || u.last_name as reporter_name,
              array_agg(DISTINCT au.first_name || ' ' || au.last_name) FILTER (WHERE au.id IS NOT NULL) as assignee_names,
              array_agg(DISTINCT ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL) as assignee_ids,
              (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count,
              (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id) as checklist_total,
              (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id AND is_completed = true) as checklist_completed,
              (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count
       FROM tasks t
       LEFT JOIN users u ON t.reporter_id = u.id
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users au ON ta.user_id = au.id
       ${whereClause}
       GROUP BY t.id, u.first_name, u.last_name
       ORDER BY t.position, t.created_at DESC`,
      queryParams
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const taskResult = await query(
      `SELECT t.*, 
              u.first_name || ' ' || u.last_name as reporter_name,
              p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.reporter_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [task.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get assignees
    const assigneesResult = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url
       FROM task_assignees ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = $1`,
      [req.params.id]
    );

    // Get comments
    const commentsResult = await query(
      `SELECT tc.*, u.first_name, u.last_name, u.avatar_url
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at`,
      [req.params.id]
    );

    // Get checklists
    const checklistsResult = await query(
      `SELECT * FROM task_checklists 
       WHERE task_id = $1 
       ORDER BY position, created_at`,
      [req.params.id]
    );

    // Get attachments
    const attachmentsResult = await query(
      `SELECT f.*, ta.attached_at
       FROM task_attachments ta
       JOIN files f ON ta.file_id = f.id
       WHERE ta.task_id = $1
       ORDER BY ta.attached_at`,
      [req.params.id]
    );

    const taskWithDetails = {
      ...task,
      assignees: assigneesResult.rows,
      comments: commentsResult.rows,
      checklists: checklistsResult.rows,
      attachments: attachmentsResult.rows
    };

    res.json({ task: taskWithDetails });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { error } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { title, description, priority, project_id, column_id, assignee_ids, due_date, tags } = req.body;

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Get default column if not provided
    let finalColumnId = column_id;
    if (!finalColumnId) {
      const defaultColumn = await query(
        'SELECT id FROM kanban_columns WHERE project_id = $1 ORDER BY position LIMIT 1',
        [project_id]
      );
      if (defaultColumn.rows.length > 0) {
        finalColumnId = defaultColumn.rows[0].id;
      }
    }

    // Get column status
    let status = 'Backlog';
    if (finalColumnId) {
      const columnResult = await query('SELECT name FROM kanban_columns WHERE id = $1', [finalColumnId]);
      if (columnResult.rows.length > 0) {
        status = columnResult.rows[0].name;
      }
    }

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE column_id = $1',
      [finalColumnId]
    );
    const position = positionResult.rows[0].next_position;

    // Create task
    const taskResult = await query(
      `INSERT INTO tasks (title, description, status, priority, project_id, column_id, reporter_id, due_date, position, tags) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [title, description, status, priority, project_id, finalColumnId, req.user.id, due_date, position, tags]
    );

    const task = taskResult.rows[0];

    // Assign users
    for (const assigneeId of assignee_ids) {
      await query(
        'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
        [task.id, assigneeId]
      );

      // Create notification for assignee
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, 'task_assigned', 'New task assigned', $2, $3)`,
        [assigneeId, `You have been assigned to "${title}"`, JSON.stringify({ task_id: task.id, project_id })]
      );
    }

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'created', 'task', $3, $4)`,
      [req.user.id, project_id, task.id, JSON.stringify({ title, assignee_ids })]
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project_${project_id}`).emit('task_created', task);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { error } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Get current task
    const currentTask = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (currentTask.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = currentTask.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [task.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, priority, status, column_id, assignee_ids, due_date, tags, position } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (column_id !== undefined) {
      updates.push(`column_id = $${paramCount++}`);
      values.push(column_id);
      
      // Update status based on column
      if (column_id) {
        const columnResult = await query('SELECT name FROM kanban_columns WHERE id = $1', [column_id]);
        if (columnResult.rows.length > 0) {
          updates.push(`status = $${paramCount++}`);
          values.push(columnResult.rows[0].name);
        }
      }
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }
    if (position !== undefined) {
      updates.push(`position = $${paramCount++}`);
      values.push(position);
    }

    if (updates.length === 0 && assignee_ids === undefined) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Update task if there are field updates
    if (updates.length > 0) {
      values.push(req.params.id);
      await query(
        `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount}`,
        values
      );
    }

    // Update assignees if provided
    if (assignee_ids !== undefined) {
      // Remove existing assignees
      await query('DELETE FROM task_assignees WHERE task_id = $1', [req.params.id]);
      
      // Add new assignees
      for (const assigneeId of assignee_ids) {
        await query(
          'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
          [req.params.id, assigneeId]
        );
      }
    }

    // Get updated task
    const updatedTask = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'updated', 'task', $3, $4)`,
      [req.user.id, task.project_id, req.params.id, JSON.stringify(req.body)]
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project_${task.project_id}`).emit('task_updated', updatedTask.rows[0]);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/:id/convert-to-issue
// @desc    Convert task to issue
// @access  Private
router.post('/:id/convert-to-issue', auth, async (req, res) => {
  try {
    const { error } = convertToIssueSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Get current task
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1 AND type = \'task\'', [req.params.id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or already converted' });
    }

    const task = taskResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [task.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { severity, environment, steps_to_reproduce } = req.body;

    // Update task to issue
    const updatedTask = await query(
      `UPDATE tasks 
       SET type = 'issue', severity = $1, environment = $2, steps_to_reproduce = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [severity, environment, steps_to_reproduce, req.params.id]
    );

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'converted_to_issue', 'task', $3, $4)`,
      [req.user.id, task.project_id, req.params.id, JSON.stringify({ severity, environment })]
    );

    // Notify assignees about conversion
    const assignees = await query(
      'SELECT user_id FROM task_assignees WHERE task_id = $1',
      [req.params.id]
    );

    for (const assignee of assignees.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, 'task_converted', 'Task converted to issue', $2, $3)`,
        [assignee.user_id, `"${task.title}" has been converted to an issue`, 
         JSON.stringify({ task_id: req.params.id, project_id: task.project_id })]
      );
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project_${task.project_id}`).emit('task_converted_to_issue', updatedTask.rows[0]);

    res.json({
      message: 'Task converted to issue successfully',
      issue: updatedTask.rows[0]
    });
  } catch (error) {
    console.error('Convert to issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Get task to check project access
    const taskResult = await query('SELECT project_id, title FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [task.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete task (cascading deletes will handle related records)
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'deleted', 'task', $3, $4)`,
      [req.user.id, task.project_id, req.params.id, JSON.stringify({ title: task.title })]
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project_${task.project_id}`).emit('task_deleted', { id: req.params.id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const commentSchema = Joi.object({
      content: Joi.string().min(1).required()
    });

    const { error } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { content } = req.body;

    // Check if task exists and get project access
    const taskResult = await query('SELECT project_id, title FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [task.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add comment
    const commentResult = await query(
      `INSERT INTO task_comments (task_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [req.params.id, req.user.id, content]
    );

    // Get comment with user info
    const commentWithUser = await query(
      `SELECT tc.*, u.first_name, u.last_name, u.avatar_url
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.id = $1`,
      [commentResult.rows[0].id]
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project_${task.project_id}`).emit('task_comment_added', {
      task_id: req.params.id,
      comment: commentWithUser.rows[0]
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: commentWithUser.rows[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
