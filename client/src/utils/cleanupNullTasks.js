import { generateClient } from 'aws-amplify/data';

/**
 * Cleanup script to delete tasks with null titles from the database
 * Run this once to clean up existing bad data
 */
export async function cleanupNullTasks(projectId) {
  const client = generateClient();
  
  try {
    console.log('Starting cleanup of tasks with null titles...');
    
    // Fetch all tasks for the project
    const { data: tasks, errors } = await client.models.Task.list({
      filter: {
        projectId: {
          eq: projectId
        }
      }
    });

    if (errors) {
      console.error('Error fetching tasks:', errors);
      return { success: false, error: errors };
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found');
      return { success: true, deleted: 0 };
    }

    console.log(`Found ${tasks.length} tasks, checking for null titles...`);

    // Find tasks with null or empty titles
    const tasksToDelete = tasks.filter(task => !task.title || task.title.trim() === '');
    
    console.log(`Found ${tasksToDelete.length} tasks with null/empty titles`);

    if (tasksToDelete.length === 0) {
      return { success: true, deleted: 0 };
    }

    // Delete each task
    let deleted = 0;
    let failed = 0;
    
    for (const task of tasksToDelete) {
      try {
        console.log(`Deleting task ${task.id}...`);
        await client.models.Task.delete({ id: task.id });
        deleted++;
      } catch (error) {
        console.error(`Failed to delete task ${task.id}:`, error);
        failed++;
      }
    }

    console.log(`Cleanup complete: ${deleted} deleted, ${failed} failed`);
    
    return {
      success: true,
      deleted,
      failed,
      total: tasksToDelete.length
    };

  } catch (error) {
    console.error('Cleanup error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update tasks with null titles to have a default title
 * Alternative to deletion
 */
export async function fixNullTasks(projectId) {
  const client = generateClient();
  
  try {
    console.log('Starting fix of tasks with null titles...');
    
    // Fetch all tasks for the project
    const { data: tasks, errors } = await client.models.Task.list({
      filter: {
        projectId: {
          eq: projectId
        }
      }
    });

    if (errors) {
      console.error('Error fetching tasks:', errors);
      return { success: false, error: errors };
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found');
      return { success: true, fixed: 0 };
    }

    console.log(`Found ${tasks.length} tasks, checking for null titles...`);

    // Find tasks with null or empty titles
    const tasksToFix = tasks.filter(task => !task.title || task.title.trim() === '');
    
    console.log(`Found ${tasksToFix.length} tasks with null/empty titles`);

    if (tasksToFix.length === 0) {
      return { success: true, fixed: 0 };
    }

    // Update each task
    let fixed = 0;
    let failed = 0;
    
    for (let i = 0; i < tasksToFix.length; i++) {
      const task = tasksToFix[i];
      try {
        console.log(`Fixing task ${task.id}...`);
        await client.models.Task.update({
          id: task.id,
          title: `Untitled Task ${i + 1}`
        });
        fixed++;
      } catch (error) {
        console.error(`Failed to fix task ${task.id}:`, error);
        failed++;
      }
    }

    console.log(`Fix complete: ${fixed} fixed, ${failed} failed`);
    
    return {
      success: true,
      fixed,
      failed,
      total: tasksToFix.length
    };

  } catch (error) {
    console.error('Fix error:', error);
    return { success: false, error: error.message };
  }
}
