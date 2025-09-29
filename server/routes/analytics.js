const express = require('express');
const { query } = require('../config/database');
const { auth, authorize, authorizeProject } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get user's project IDs
    const userProjects = await query(
      `SELECT project_id FROM project_members WHERE user_id = $1
       UNION
       SELECT id as project_id FROM projects WHERE $2 = 'admin'`,
      [req.user.id, req.user.role]
    );

    const projectIds = userProjects.rows.map(p => p.project_id);

    if (projectIds.length === 0) {
      return res.json({
        overview: { total_projects: 0, total_tasks: 0, total_issues: 0, completion_rate: 0 },
        task_completion: [],
        project_progress: [],
        recent_activity: []
      });
    }

    // Overview statistics
    const overviewResult = await query(
      `SELECT 
         COUNT(DISTINCT p.id) as total_projects,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as total_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as total_issues,
         ROUND(
           COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN t.type = 'task' THEN 1 END), 0), 2
         ) as completion_rate
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.id = ANY($1)`,
      [projectIds]
    );

    // Task completion over time (last 30 days)
    const taskCompletionResult = await query(
      `SELECT 
         DATE(t.updated_at) as date,
         COUNT(*) as completed_tasks
       FROM tasks t
       WHERE t.project_id = ANY($1)
       AND t.status = 'Done'
       AND t.updated_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(t.updated_at)
       ORDER BY date`,
      [projectIds]
    );

    // Project progress
    const projectProgressResult = await query(
      `SELECT 
         p.id, p.name, p.color,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as total_tasks,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as total_issues,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues,
         ROUND(
           COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN t.type = 'task' THEN 1 END), 0), 2
         ) as completion_percentage
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.id = ANY($1)
       GROUP BY p.id, p.name, p.color
       ORDER BY p.name`,
      [projectIds]
    );

    // Recent activity
    const recentActivityResult = await query(
      `SELECT al.*, p.name as project_name, u.first_name, u.last_name
       FROM activity_log al
       LEFT JOIN projects p ON al.project_id = p.id
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.project_id = ANY($1)
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [projectIds]
    );

    res.json({
      overview: overviewResult.rows[0],
      task_completion: taskCompletionResult.rows,
      project_progress: projectProgressResult.rows,
      recent_activity: recentActivityResult.rows
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/project/:projectId
// @desc    Get project analytics
// @access  Private
router.get('/project/:projectId', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Project overview
    const overviewResult = await query(
      `SELECT 
         p.name, p.description, p.created_at,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as total_tasks,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as total_issues,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues,
         COUNT(DISTINCT pm.user_id) as team_members,
         ROUND(
           COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN t.type = 'task' THEN 1 END), 0), 2
         ) as completion_rate
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1
       GROUP BY p.id, p.name, p.description, p.created_at`,
      [projectId]
    );

    // Task status distribution
    const statusDistributionResult = await query(
      `SELECT 
         t.status,
         COUNT(*) as count,
         t.type
       FROM tasks t
       WHERE t.project_id = $1
       GROUP BY t.status, t.type
       ORDER BY t.type, count DESC`,
      [projectId]
    );

    // Priority distribution
    const priorityDistributionResult = await query(
      `SELECT 
         t.priority,
         COUNT(*) as count,
         t.type
       FROM tasks t
       WHERE t.project_id = $1
       GROUP BY t.priority, t.type
       ORDER BY 
         CASE t.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END`,
      [projectId]
    );

    // Team performance
    const teamPerformanceResult = await query(
      `SELECT 
         u.id, u.first_name, u.last_name,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as assigned_tasks,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as assigned_issues,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues,
         ROUND(
           COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN t.type = 'task' THEN 1 END), 0), 2
         ) as completion_rate
       FROM users u
       JOIN project_members pm ON u.id = pm.user_id
       LEFT JOIN task_assignees ta ON u.id = ta.user_id
       LEFT JOIN tasks t ON ta.task_id = t.id AND t.project_id = $1
       WHERE pm.project_id = $1
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY completion_rate DESC NULLS LAST`,
      [projectId]
    );

    // Kanban column throughput
    const columnThroughputResult = await query(
      `SELECT 
         kc.name as column_name,
         kc.color,
         COUNT(t.id) as task_count,
         AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/86400) as avg_days_in_column
       FROM kanban_columns kc
       LEFT JOIN tasks t ON kc.id = t.column_id
       WHERE kc.project_id = $1
       GROUP BY kc.id, kc.name, kc.color, kc.position
       ORDER BY kc.position`,
      [projectId]
    );

    // Overdue tasks
    const overdueTasksResult = await query(
      `SELECT 
         t.id, t.title, t.due_date, t.priority, t.type,
         array_agg(u.first_name || ' ' || u.last_name) FILTER (WHERE u.id IS NOT NULL) as assignees
       FROM tasks t
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE t.project_id = $1 
       AND t.due_date < CURRENT_DATE 
       AND t.status != 'Done'
       GROUP BY t.id, t.title, t.due_date, t.priority, t.type
       ORDER BY t.due_date`,
      [projectId]
    );

    // Task creation trend (last 30 days)
    const taskTrendResult = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(CASE WHEN type = 'task' THEN 1 END) as tasks_created,
         COUNT(CASE WHEN type = 'issue' THEN 1 END) as issues_created
       FROM tasks
       WHERE project_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [projectId]
    );

    res.json({
      overview: overviewResult.rows[0],
      status_distribution: statusDistributionResult.rows,
      priority_distribution: priorityDistributionResult.rows,
      team_performance: teamPerformanceResult.rows,
      column_throughput: columnThroughputResult.rows,
      overdue_tasks: overdueTasksResult.rows,
      task_trend: taskTrendResult.rows
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/user/:userId
// @desc    Get user analytics (admin only or own data)
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Check if user can access this data
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.userId;

    // User overview
    const overviewResult = await query(
      `SELECT 
         u.first_name, u.last_name, u.email, u.role, u.created_at,
         COUNT(DISTINCT pm.project_id) as projects_count,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as assigned_tasks,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as assigned_issues,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues,
         COUNT(CASE WHEN t.reporter_id = u.id THEN 1 END) as created_tasks,
         ROUND(
           COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN t.type = 'task' THEN 1 END), 0), 2
         ) as completion_rate
       FROM users u
       LEFT JOIN project_members pm ON u.id = pm.user_id
       LEFT JOIN task_assignees ta ON u.id = ta.user_id
       LEFT JOIN tasks t ON ta.task_id = t.id
       WHERE u.id = $1
       GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at`,
      [userId]
    );

    // Task completion over time
    const completionTrendResult = await query(
      `SELECT 
         DATE(t.updated_at) as date,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as resolved_issues
       FROM tasks t
       JOIN task_assignees ta ON t.id = ta.task_id
       WHERE ta.user_id = $1
       AND t.status = 'Done'
       AND t.updated_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(t.updated_at)
       ORDER BY date`,
      [userId]
    );

    // Project contributions
    const projectContributionsResult = await query(
      `SELECT 
         p.id, p.name, p.color,
         COUNT(CASE WHEN t.type = 'task' THEN 1 END) as assigned_tasks,
         COUNT(CASE WHEN t.type = 'task' AND t.status = 'Done' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN t.type = 'issue' THEN 1 END) as assigned_issues,
         COUNT(CASE WHEN t.type = 'issue' AND t.status = 'Done' THEN 1 END) as resolved_issues
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN task_assignees ta ON pm.user_id = ta.user_id
       LEFT JOIN tasks t ON ta.task_id = t.id AND t.project_id = p.id
       WHERE pm.user_id = $1
       GROUP BY p.id, p.name, p.color
       ORDER BY p.name`,
      [userId]
    );

    // Current workload
    const workloadResult = await query(
      `SELECT 
         t.id, t.title, t.priority, t.due_date, t.status, t.type,
         p.name as project_name, p.color as project_color
       FROM tasks t
       JOIN task_assignees ta ON t.id = ta.task_id
       JOIN projects p ON t.project_id = p.id
       WHERE ta.user_id = $1 AND t.status != 'Done'
       ORDER BY 
         CASE WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE THEN 1 ELSE 2 END,
         t.due_date ASC NULLS LAST,
         CASE t.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END`,
      [userId]
    );

    res.json({
      overview: overviewResult.rows[0],
      completion_trend: completionTrendResult.rows,
      project_contributions: projectContributionsResult.rows,
      current_workload: workloadResult.rows
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/export/:projectId
// @desc    Export project data to CSV
// @access  Private
router.get('/export/:projectId', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    const { type = 'tasks' } = req.query;
    
    let csvData = '';
    let filename = '';

    if (type === 'tasks') {
      const result = await query(
        `SELECT 
           t.title, t.description, t.status, t.priority, t.type, t.due_date, t.created_at, t.updated_at,
           u.first_name || ' ' || u.last_name as reporter,
           array_agg(DISTINCT au.first_name || ' ' || au.last_name) FILTER (WHERE au.id IS NOT NULL) as assignees,
           p.name as project_name
         FROM tasks t
         LEFT JOIN users u ON t.reporter_id = u.id
         LEFT JOIN task_assignees ta ON t.id = ta.task_id
         LEFT JOIN users au ON ta.user_id = au.id
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.project_id = $1
         GROUP BY t.id, t.title, t.description, t.status, t.priority, t.type, t.due_date, t.created_at, t.updated_at, u.first_name, u.last_name, p.name
         ORDER BY t.created_at DESC`,
        [req.params.projectId]
      );

      // Create CSV header
      csvData = 'Title,Description,Status,Priority,Type,Due Date,Created At,Updated At,Reporter,Assignees,Project\n';
      
      // Add data rows
      result.rows.forEach(row => {
        const assignees = row.assignees ? row.assignees.join('; ') : '';
        csvData += `"${row.title}","${row.description || ''}","${row.status}","${row.priority}","${row.type}","${row.due_date || ''}","${row.created_at}","${row.updated_at}","${row.reporter || ''}","${assignees}","${row.project_name}"\n`;
      });

      filename = `tasks_${req.params.projectId}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

module.exports = router;
