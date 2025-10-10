# Excel Import Feature - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```powershell
# Run the setup script
.\setup-import-feature.ps1

# OR manually:
cd server
npm install xlsx
cd ..
```

### Step 2: Run Database Migration
```bash
# Connect to PostgreSQL and run:
psql -U your_username -d your_database -f database/migrations/add_import_fields.sql

# OR if already connected to psql:
\i database/migrations/add_import_fields.sql
```

### Step 3: Restart Server
```bash
cd server
npm run dev
```

### Step 4: Start Using!
1. Open your browser and navigate to any project's Kanban board
2. Click the green **"Import Tasks"** button in the top-right
3. Upload your Excel file from Zoho Projects
4. Click **"Import Tasks"** and wait for completion
5. Review the results!

## 📋 Excel File Format

Your Excel/CSV file should have these columns:

| Column Name | Required | Example |
|------------|----------|---------|
| Task Name | ✅ Yes | "Implement login feature" |
| Owner | No | "John Doe" or "john@example.com" |
| Custom Status | No | "In Progress" |
| Tags | No | "Frontend, React" |
| Start Date | No | "2024-01-01" |
| Due Date | No | "2024-01-15" |
| Duration | No | "40" (hours) |
| Priority | No | "High" |
| % Completed | No | "50" |
| Work Hours | No | "20" |
| Billing Type | No | "Billable" |
| Description | No | "Detailed description..." |

## 💡 Tips

1. **Download Template**: Click "Download Template" in the import modal to get a sample file
2. **User Matching**: Owner names must match project members (case-insensitive)
3. **Date Format**: Use YYYY-MM-DD or Excel date format
4. **Tags**: Separate multiple tags with commas
5. **Status Mapping**: Common statuses are automatically converted

## ⚠️ Common Issues

### Import button not visible?
- Make sure you're on the Kanban board page
- Refresh the page
- Check browser console for errors

### Tasks not being assigned?
- Verify the Owner name matches a project member exactly
- Use email address instead of name
- Leave Owner blank to create unassigned tasks

### Import fails?
- Check file format (must be .xlsx, .xls, or .csv)
- Verify file size is under 10MB
- Check server logs for detailed errors

## 📊 What Gets Imported?

✅ **Imported**:
- Task name and description
- Status and priority
- Assignee (if matched)
- Tags
- Dates (start, due, completion)
- Work hours and duration
- Billing type
- Completion percentage

❌ **Not Imported** (yet):
- Subtasks
- Comments
- Attachments
- Time logs
- Custom fields

## 🎯 Example Import

**Sample Excel Row**:
```
Task Name: "Build user dashboard"
Owner: "jane@example.com"
Custom Status: "In Progress"
Tags: "Frontend, Dashboard"
Start Date: "2024-01-01"
Due Date: "2024-01-15"
Duration: "40"
Priority: "High"
% Completed: "25"
Work Hours: "10"
Billing Type: "Billable"
```

**Result**: Creates a task with all fields populated, assigned to Jane, in "In Progress" status.

## 📞 Need Help?

1. Check the full documentation: `EXCEL_IMPORT_FEATURE.md`
2. Review server logs: `cd server && npm run dev`
3. Check browser console (F12)
4. Verify database migration was successful

---

**Ready to import?** Head to your Kanban board and click the green "Import Tasks" button! 🎉
