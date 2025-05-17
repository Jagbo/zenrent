#!/usr/bin/env node

/**
 * TaskMaster AI - Development Workflow Script
 * 
 * This script provides a CLI interface for managing task-driven development workflows.
 * It's designed to work with the tasks.json file and task files in the tasks/ directory.
 */

const { program } = require('commander');
const taskMaster = require('task-master-ai');

// Initialize the program
program
  .version('1.0.0')
  .description('TaskMaster AI - Development Workflow Script');

// List tasks command
program
  .command('list')
  .description('List all tasks with their status')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .option('--status <status>', 'Filter tasks by status (pending, done, deferred)')
  .option('--priority <priority>', 'Filter tasks by priority (high, medium, low)')
  .action((options) => {
    taskMaster.listTasks(options);
  });

// Show task command
program
  .command('show')
  .description('Show details of a specific task')
  .argument('<id>', 'Task ID to show')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .action((id, options) => {
    taskMaster.showTask(id, options);
  });

// Set task status command
program
  .command('set-status')
  .description('Set the status of a task')
  .option('--id <id>', 'Task ID to update', '')
  .option('--status <status>', 'New status (pending, done, deferred)', '')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .action((options) => {
    taskMaster.setTaskStatus(options);
  });

// Parse PRD command
program
  .command('parse-prd')
  .description('Parse a PRD document and generate initial tasks')
  .option('--input <file>', 'Path to PRD text file', 'sample-prd.txt')
  .option('--output <file>', 'Path to output tasks.json file', 'tasks/tasks.json')
  .action((options) => {
    taskMaster.parsePRD(options);
  });

// Expand task command
program
  .command('expand')
  .description('Expand a task into subtasks')
  .option('--id <id>', 'Task ID to expand', '')
  .option('--subtasks <number>', 'Number of subtasks to generate', '5')
  .option('--research', 'Use AI research to improve task expansion', false)
  .option('--prompt <text>', 'Additional context for task expansion', '')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .option('--all', 'Expand all pending tasks', false)
  .action((options) => {
    taskMaster.expandTask(options);
  });

// Clear subtasks command
program
  .command('clear-subtasks')
  .description('Clear subtasks of a task')
  .option('--id <id>', 'Task ID to clear subtasks for', '')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .action((options) => {
    taskMaster.clearSubtasks(options);
  });

// Analyze complexity command
program
  .command('analyze-complexity')
  .description('Analyze task complexity')
  .option('--research', 'Use AI research to improve analysis', false)
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .option('--output <file>', 'Path to output complexity report file', 'scripts/task-complexity-report.json')
  .action((options) => {
    taskMaster.analyzeComplexity(options);
  });

// Complexity report command
program
  .command('complexity-report')
  .description('Show formatted complexity report')
  .option('--file <path>', 'Path to complexity report file', 'scripts/task-complexity-report.json')
  .action((options) => {
    taskMaster.showComplexityReport(options);
  });

// Update tasks command
program
  .command('update')
  .description('Update tasks based on implementation changes')
  .option('--from <id>', 'Task ID from which to start updating', '')
  .option('--prompt <text>', 'Explanation of changes or new context', '')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .action((options) => {
    taskMaster.updateTasks(options);
  });

// Generate task files command
program
  .command('generate')
  .description('Generate individual task files from tasks.json')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .option('--output <dir>', 'Output directory for task files', 'tasks')
  .action((options) => {
    taskMaster.generateTaskFiles(options);
  });

// Fix dependencies command
program
  .command('fix-dependencies')
  .description('Fix invalid dependencies in tasks.json')
  .option('--file <path>', 'Path to tasks.json file', 'tasks/tasks.json')
  .action((options) => {
    taskMaster.fixDependencies(options);
  });

// Initialize command
program
  .command('init')
  .description('Initialize a new TaskMaster AI project')
  .option('--dir <directory>', 'Project directory', process.cwd())
  .action((options) => {
    taskMaster.initProject(options);
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.help();
}
