const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createChannelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid('public', 'private').default('public'),
  project_id: Joi.string().uuid().allow(null)
});

const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).required(),
  type: Joi.string().valid('text', 'file', 'system').default('text'),
  reply_to: Joi.string().uuid().allow(null)
});

// @route   GET /api/chat/channels
// @desc    Get user's channels
// @access  Private
router.get('/channels', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT c.*, 
              p.name as project_name,
              u.first_name || ' ' || u.last_name as created_by_name,
              cm.role as user_role,
              (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
              (SELECT COUNT(*) FROM chat_messages WHERE channel_id = c.id) as message_count,
              (SELECT content FROM chat_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM chat_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM chat_channels c
       LEFT JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON c.created_by = u.id
       JOIN channel_members cm ON c.id = cm.channel_id
       WHERE cm.user_id = $1
       ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.id]
    );

    res.json({ channels: result.rows });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/channels/:id
// @desc    Get channel details
// @access  Private
router.get('/channels/:id', auth, async (req, res) => {
  try {
    // Check if user is a member of the channel
    const memberCheck = await query(
      'SELECT role FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    // Get channel details
    const channelResult = await query(
      `SELECT c.*, 
              p.name as project_name,
              u.first_name || ' ' || u.last_name as created_by_name
       FROM chat_channels c
       LEFT JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get channel members
    const membersResult = await query(
      `SELECT cm.*, u.first_name, u.last_name, u.email, u.avatar_url
       FROM channel_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.channel_id = $1
       ORDER BY cm.role DESC, u.first_name`,
      [req.params.id]
    );

    const channel = {
      ...channelResult.rows[0],
      members: membersResult.rows,
      user_role: memberCheck.rows[0].role
    };

    res.json({ channel });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/channels
// @desc    Create new channel
// @access  Private
router.post('/channels', auth, async (req, res) => {
  try {
    const { error } = createChannelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description, type, project_id } = req.body;

    // If project_id is provided, check if user has access
    if (project_id) {
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
    }

    // Create channel
    const channelResult = await query(
      `INSERT INTO chat_channels (name, description, type, project_id, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, description, type, project_id, req.user.id]
    );

    const channel = channelResult.rows[0];

    // Add creator as admin member
    await query(
      `INSERT INTO channel_members (channel_id, user_id, role) 
       VALUES ($1, $2, 'admin')`,
      [channel.id, req.user.id]
    );

    // If it's a project channel, add all project members
    if (project_id) {
      await query(
        `INSERT INTO channel_members (channel_id, user_id, role)
         SELECT $1, pm.user_id, 'member'
         FROM project_members pm
         WHERE pm.project_id = $2 AND pm.user_id != $3`,
        [channel.id, project_id, req.user.id]
      );
    }

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/channels/:id/messages
// @desc    Get channel messages
// @access  Private
router.get('/channels/:id/messages', auth, async (req, res) => {
  try {
    // Check if user is a member of the channel
    const memberCheck = await query(
      'SELECT role FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT m.*, 
              u.first_name, u.last_name, u.avatar_url,
              rm.content as reply_content,
              ru.first_name as reply_user_first_name,
              ru.last_name as reply_user_last_name,
              (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count
       FROM chat_messages m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN chat_messages rm ON m.reply_to = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
       WHERE m.channel_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    // Get reactions for each message
    const messageIds = result.rows.map(msg => msg.id);
    let reactions = [];
    
    if (messageIds.length > 0) {
      const reactionsResult = await query(
        `SELECT mr.*, u.first_name, u.last_name
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = ANY($1)
         ORDER BY mr.created_at`,
        [messageIds]
      );
      reactions = reactionsResult.rows;
    }

    // Group reactions by message
    const messagesWithReactions = result.rows.map(message => ({
      ...message,
      reactions: reactions.filter(r => r.message_id === message.id)
    }));

    res.json({ 
      messages: messagesWithReactions.reverse(), // Reverse to show oldest first
      hasMore: result.rows.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/channels/:id/messages
// @desc    Send message to channel
// @access  Private
router.post('/channels/:id/messages', auth, async (req, res) => {
  try {
    // Check if user is a member of the channel
    const memberCheck = await query(
      'SELECT role FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    const { error } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { content, type, reply_to } = req.body;

    // Create message
    const messageResult = await query(
      `INSERT INTO chat_messages (channel_id, user_id, content, type, reply_to) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.params.id, req.user.id, content, type, reply_to]
    );

    // Get message with user info
    const messageWithUser = await query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [messageResult.rows[0].id]
    );

    const message = messageWithUser.rows[0];

    // Emit real-time message to channel members
    const io = req.app.get('io');
    io.to(`channel_${req.params.id}`).emit('new_message', message);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/channels/:channelId/messages/:messageId/reactions
// @desc    Add reaction to message
// @access  Private
router.post('/channels/:channelId/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    // Check if user is a member of the channel
    const memberCheck = await query(
      'SELECT role FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [req.params.channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    const reactionSchema = Joi.object({
      emoji: Joi.string().min(1).max(10).required()
    });

    const { error } = reactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { emoji } = req.body;

    // Check if reaction already exists
    const existingReaction = await query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [req.params.messageId, req.user.id, emoji]
    );

    if (existingReaction.rows.length > 0) {
      // Remove reaction
      await query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [req.params.messageId, req.user.id, emoji]
      );
      
      const io = req.app.get('io');
      io.to(`channel_${req.params.channelId}`).emit('reaction_removed', {
        message_id: req.params.messageId,
        user_id: req.user.id,
        emoji
      });

      return res.json({ message: 'Reaction removed' });
    }

    // Add reaction
    await query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [req.params.messageId, req.user.id, emoji]
    );

    const io = req.app.get('io');
    io.to(`channel_${req.params.channelId}`).emit('reaction_added', {
      message_id: req.params.messageId,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      emoji
    });

    res.json({ message: 'Reaction added' });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/direct
// @desc    Create or get direct message channel
// @access  Private
router.post('/direct', auth, async (req, res) => {
  try {
    const directSchema = Joi.object({
      user_id: Joi.string().uuid().required()
    });

    const { error } = directSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { user_id } = req.body;

    if (user_id === req.user.id) {
      return res.status(400).json({ message: 'Cannot create DM with yourself' });
    }

    // Check if DM channel already exists
    const existingChannel = await query(
      `SELECT c.* FROM chat_channels c
       WHERE c.type = 'direct' 
       AND EXISTS (SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $1)
       AND EXISTS (SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $2)
       AND (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) = 2`,
      [req.user.id, user_id]
    );

    if (existingChannel.rows.length > 0) {
      return res.json({ channel: existingChannel.rows[0] });
    }

    // Get other user info
    const otherUser = await query(
      'SELECT first_name, last_name FROM users WHERE id = $1 AND is_active = true',
      [user_id]
    );

    if (otherUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create DM channel
    const channelResult = await query(
      `INSERT INTO chat_channels (name, type, created_by) 
       VALUES ($1, 'direct', $2) 
       RETURNING *`,
      [`${req.user.first_name} ${req.user.last_name}, ${otherUser.rows[0].first_name} ${otherUser.rows[0].last_name}`, req.user.id]
    );

    const channel = channelResult.rows[0];

    // Add both users as members
    await query(
      `INSERT INTO channel_members (channel_id, user_id, role) VALUES 
       ($1, $2, 'member'), ($1, $3, 'member')`,
      [channel.id, req.user.id, user_id]
    );

    res.status(201).json({
      message: 'Direct message channel created',
      channel
    });
  } catch (error) {
    console.error('Create DM error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
