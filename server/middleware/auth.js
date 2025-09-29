const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Project-based authorization middleware
const authorizeProject = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.project_id;
      
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      // Check if user is a member of the project
      const result = await query(
        `SELECT pm.role, p.owner_id 
         FROM project_members pm 
         JOIN projects p ON pm.project_id = p.id 
         WHERE pm.project_id = $1 AND pm.user_id = $2`,
        [projectId, req.user.id]
      );

      if (result.rows.length === 0) {
        // Check if user is admin (can access all projects)
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Access denied to this project' });
        }
      } else {
        const userProjectRole = result.rows[0].role;
        const roleHierarchy = {
          'viewer': 1,
          'member': 2,
          'admin': 3,
          'owner': 4
        };

        if (roleHierarchy[userProjectRole] < roleHierarchy[requiredRole]) {
          return res.status(403).json({ message: 'Insufficient project permissions' });
        }
      }

      next();
    } catch (error) {
      console.error('Project authorization error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

module.exports = {
  auth,
  authorize,
  authorizeProject
};
