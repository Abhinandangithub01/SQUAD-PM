const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { auth, authorize, authorizeProject } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow(''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6')
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().allow(''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  status: Joi.string().valid('active', 'archived', 'completed')
});

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT p.*, 
              u.first_name || ' ' || u.last_name as owner_name,
              pm.role as user_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND type = 'task') as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND type = 'issue') as issue_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE pm.user_id = $1 OR p.owner_id = $1 OR $2 = 'admin'
       ORDER BY p.updated_at DESC`,
      [req.user.id, req.user.role]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    const projectResult = await query(
      `SELECT p.*, 
              u.first_name || ' ' || u.last_name as owner_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND type = 'task') as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND type = 'issue') as issue_count
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project members
    const membersResult = await query(
      `SELECT pm.*, u.first_name, u.last_name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.first_name`,
      [req.params.id]
    );

    // Get kanban columns
    const columnsResult = await query(
      `SELECT * FROM kanban_columns 
       WHERE project_id = $1 
       ORDER BY position`,
      [req.params.id]
    );

    const project = {
      ...projectResult.rows[0],
      members: membersResult.rows,
      columns: columnsResult.rows
    };

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', auth, authorize(['admin', 'project_manager']), async (req, res) => {
  try {
    const { error } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description, color } = req.body;

    // Create project
    const projectResult = await query(
      `INSERT INTO projects (name, description, color, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description, color, req.user.id]
    );

    const project = projectResult.rows[0];

    // Add owner as project member
    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, 'owner')`,
      [project.id, req.user.id]
    );

    // Create default kanban columns
    const defaultColumns = [
      { name: 'Backlog', position: 1, color: '#6B7280' },
      { name: 'To Do', position: 2, color: '#EF4444' },
      { name: 'In Progress', position: 3, color: '#F59E0B' },
      { name: 'Review', position: 4, color: '#8B5CF6' },
      { name: 'Done', position: 5, color: '#10B981' }
    ];

    for (const column of defaultColumns) {
      await query(
        `INSERT INTO kanban_columns (project_id, name, position, color) 
         VALUES ($1, $2, $3, $4)`,
        [project.id, column.name, column.position, column.color]
      );
    }

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'created', 'project', $3, $4)`,
      [req.user.id, project.id, project.id, JSON.stringify({ name })]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', auth, authorizeProject('admin'), async (req, res) => {
  try {
    const { error } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description, color, status } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(req.params.id);

    const result = await query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'updated', 'project', $3, $4)`,
      [req.user.id, req.params.id, req.params.id, JSON.stringify(req.body)]
    );

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', auth, authorizeProject('owner'), async (req, res) => {
  try {
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING name', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private
router.post('/:id/members', auth, authorizeProject('admin'), async (req, res) => {
  try {
    const memberSchema = Joi.object({
      user_id: Joi.string().uuid().required(),
      role: Joi.string().valid('admin', 'member', 'viewer').default('member')
    });

    const { error } = memberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { user_id, role } = req.body;

    // Check if user exists
    const userResult = await query('SELECT id, first_name, last_name FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    const existingMember = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, user_id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Add member
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.id, user_id, role]
    );

    // Log activity
    const user = userResult.rows[0];
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'added_member', 'project', $3, $4)`,
      [req.user.id, req.params.id, req.params.id, JSON.stringify({ 
        added_user: `${user.first_name} ${user.last_name}`,
        role 
      })]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id/members/:userId
// @desc    Update member role
// @access  Private
router.put('/:id/members/:userId', auth, authorizeProject('admin'), async (req, res) => {
  try {
    const roleSchema = Joi.object({
      role: Joi.string().valid('admin', 'member', 'viewer').required()
    });

    const { error } = roleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { role } = req.body;

    const result = await query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [role, req.params.id, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private
router.delete('/:id/members/:userId', auth, authorizeProject('admin'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 AND role != \'owner\' RETURNING *',
      [req.params.id, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found or cannot remove owner' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/kanban
// @desc    Get kanban board data
// @access  Private
router.get('/:id/kanban', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    // Get columns
    const columnsResult = await query(
      'SELECT * FROM kanban_columns WHERE project_id = $1 ORDER BY position',
      [req.params.id]
    );

    // Get tasks with assignees
    const tasksResult = await query(
      `SELECT t.*, 
              array_agg(DISTINCT u.first_name || ' ' || u.last_name) FILTER (WHERE u.id IS NOT NULL) as assignee_names,
              array_agg(DISTINCT ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL) as assignee_ids,
              (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count,
              (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id) as checklist_total,
              (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id AND is_completed = true) as checklist_completed,
              (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count
       FROM tasks t
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE t.project_id = $1
       GROUP BY t.id
       ORDER BY t.position, t.created_at`,
      [req.params.id]
    );

    const columns = columnsResult.rows.map(column => ({
      ...column,
      tasks: tasksResult.rows.filter(task => task.column_id === column.id)
    }));

    res.json({ columns });
  } catch (error) {
    console.error('Get kanban error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
