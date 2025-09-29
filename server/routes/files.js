const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { auth, authorizeProject } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// @route   GET /api/files/project/:projectId
// @desc    Get all files for a project
// @access  Private
router.get('/project/:projectId', auth, authorizeProject('viewer'), async (req, res) => {
  try {
    const { search, type } = req.query;
    
    let whereClause = 'WHERE f.project_id = $1';
    const queryParams = [req.params.projectId];
    let paramCount = 2;

    if (search) {
      whereClause += ` AND (f.original_name ILIKE $${paramCount} OR f.name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (type) {
      whereClause += ` AND f.mime_type LIKE $${paramCount}`;
      queryParams.push(`${type}%`);
      paramCount++;
    }

    const result = await query(
      `SELECT f.*, 
              u.first_name || ' ' || u.last_name as uploaded_by_name,
              (SELECT COUNT(*) FROM task_attachments WHERE file_id = f.id) as linked_tasks
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       ${whereClause}
       ORDER BY f.created_at DESC`,
      queryParams
    );

    res.json({ files: result.rows });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/files/upload/:projectId
// @desc    Upload file to project
// @access  Private
router.post('/upload/:projectId', auth, authorizeProject('member'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Save file info to database
    const fileResult = await query(
      `INSERT INTO files (name, original_name, mime_type, size, path, project_id, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [filename, originalname, mimetype, size, filePath, req.params.projectId, req.user.id]
    );

    const file = fileResult.rows[0];

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'uploaded', 'file', $3, $4)`,
      [req.user.id, req.params.projectId, file.id, JSON.stringify({ filename: originalname, size })]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    console.error('Upload file error:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   GET /api/files/:id
// @desc    Get file details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const fileResult = await query(
      `SELECT f.*, 
              u.first_name || ' ' || u.last_name as uploaded_by_name,
              p.name as project_name
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       LEFT JOIN projects p ON f.project_id = p.id
       WHERE f.id = $1`,
      [req.params.id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [file.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get linked tasks
    const linkedTasks = await query(
      `SELECT t.id, t.title, ta.attached_at
       FROM task_attachments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.file_id = $1
       ORDER BY ta.attached_at DESC`,
      [req.params.id]
    );

    const fileWithDetails = {
      ...file,
      linked_tasks: linkedTasks.rows
    };

    res.json({ file: fileWithDetails });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/files/:id/download
// @desc    Download file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const fileResult = await query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [file.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.size);

    // Stream file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error during file download' });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const fileResult = await query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check project access (need admin or member role)
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND pm.role IN ('admin', 'owner')
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'
       UNION
       SELECT 'uploader' as role WHERE $4 = $5`,
      [file.project_id, req.user.id, req.user.role, file.uploaded_by, req.user.id]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from database
    await query('DELETE FROM files WHERE id = $1', [req.params.id]);

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file from disk:', err);
      });
    }

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, details) 
       VALUES ($1, $2, 'deleted', 'file', $3, $4)`,
      [req.user.id, file.project_id, req.params.id, JSON.stringify({ filename: file.original_name })]
    );

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/files/:id/link-task
// @desc    Link file to task
// @access  Private
router.post('/:id/link-task', auth, async (req, res) => {
  try {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    // Get file and check access
    const fileResult = await query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Get task and check access
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [task_id]);
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
      [file.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already linked
    const existingLink = await query(
      'SELECT id FROM task_attachments WHERE task_id = $1 AND file_id = $2',
      [task_id, req.params.id]
    );

    if (existingLink.rows.length > 0) {
      return res.status(400).json({ message: 'File is already linked to this task' });
    }

    // Create link
    await query(
      'INSERT INTO task_attachments (task_id, file_id) VALUES ($1, $2)',
      [task_id, req.params.id]
    );

    res.json({ message: 'File linked to task successfully' });
  } catch (error) {
    console.error('Link file to task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/files/:id/unlink-task/:taskId
// @desc    Unlink file from task
// @access  Private
router.delete('/:id/unlink-task/:taskId', auth, async (req, res) => {
  try {
    // Get file and check access
    const fileResult = await query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = fileResult.rows[0];

    // Check project access
    const projectAccess = await query(
      `SELECT pm.role FROM project_members pm 
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT 'admin' as role WHERE $3 = 'admin'`,
      [file.project_id, req.user.id, req.user.role]
    );

    if (projectAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove link
    const result = await query(
      'DELETE FROM task_attachments WHERE task_id = $1 AND file_id = $2 RETURNING *',
      [req.params.taskId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File link not found' });
    }

    res.json({ message: 'File unlinked from task successfully' });
  } catch (error) {
    console.error('Unlink file from task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
