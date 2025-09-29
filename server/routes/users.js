const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    if (role) {
      whereClause += ` AND role = $${paramCount++}`;
      queryParams.push(role);
    }
    if (status) {
      const isActive = status === 'active';
      whereClause += ` AND is_active = $${paramCount++}`;
      queryParams.push(isActive);
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, is_active, created_at, last_login,
              (SELECT COUNT(*) FROM project_members WHERE user_id = users.id) as project_count,
              (SELECT COUNT(*) FROM tasks WHERE reporter_id = users.id) as created_tasks,
              (SELECT COUNT(*) FROM task_assignees ta JOIN tasks t ON ta.task_id = t.id WHERE ta.user_id = users.id) as assigned_tasks
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC`,
      queryParams
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users for project assignment
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, project_id } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    let excludeClause = '';
    const queryParams = [`%${q}%`];
    
    if (project_id) {
      excludeClause = `AND id NOT IN (
        SELECT user_id FROM project_members WHERE project_id = $2
      )`;
      queryParams.push(project_id);
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, avatar_url, role
       FROM users 
       WHERE is_active = true 
       AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
       ${excludeClause}
       ORDER BY first_name, last_name
       LIMIT 10`,
      queryParams
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, is_active, created_at, last_login
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's projects
    const projectsResult = await query(
      `SELECT p.id, p.name, p.color, pm.role
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.name`,
      [req.params.id]
    );

    // Get user's task statistics
    const statsResult = await query(
      `SELECT 
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as total_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as total_issues,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues
       FROM task_assignees ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.user_id = $1`,
      [req.params.id]
    );

    const user = {
      ...result.rows[0],
      projects: projectsResult.rows,
      stats: statsResult.rows[0]
    };

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private
router.put('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const updateSchema = Joi.object({
      first_name: Joi.string().min(1).max(100),
      last_name: Joi.string().min(1).max(100),
      role: Joi.string().valid('admin', 'project_manager', 'member', 'viewer'),
      is_active: Joi.boolean()
    });

    const { error } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { first_name, last_name, role, is_active } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(req.params.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, email, first_name, last_name, role, is_active`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    // Prevent deleting self
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userResult = await query('SELECT email FROM users WHERE id = $1', [req.params.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Instead of hard delete, deactivate the user
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/me/dashboard
// @desc    Get dashboard data for current user
// @access  Private
router.get('/me/dashboard', auth, async (req, res) => {
  try {
    // Get assigned tasks
    const tasksResult = await query(
      `SELECT t.*, p.name as project_name, p.color as project_color
       FROM tasks t
       JOIN task_assignees ta ON t.id = ta.task_id
       JOIN projects p ON t.project_id = p.id
       WHERE ta.user_id = $1 AND t.status != 'Done'
       ORDER BY 
         CASE WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE THEN 1 ELSE 2 END,
         t.due_date ASC NULLS LAST,
         t.priority DESC,
         t.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    // Get recent activity
    const activityResult = await query(
      `SELECT al.*, p.name as project_name, u.first_name, u.last_name
       FROM activity_log al
       LEFT JOIN projects p ON al.project_id = p.id
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.project_id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       ) OR $2 = 'admin'
       ORDER BY al.created_at DESC
       LIMIT 20`,
      [req.user.id, req.user.role]
    );

    // Get project statistics
    const projectStatsResult = await query(
      `SELECT 
         p.id, p.name, p.color,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as task_count,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as issue_count,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       ) OR $2 = 'admin'
       GROUP BY p.id, p.name, p.color
       ORDER BY p.name`,
      [req.user.id, req.user.role]
    );

    // Get unread notifications count
    const notificationResult = await query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      tasks: tasksResult.rows,
      activity: activityResult.rows,
      projects: projectStatsResult.rows,
      unread_notifications: parseInt(notificationResult.rows[0].unread_count)
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
