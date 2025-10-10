# 🚀 Excel Import Feature - START HERE

## Quick Links

📖 **Documentation**
- [Quick Start Guide](IMPORT_QUICK_START.md) - Get started in 5 minutes
- [Complete Documentation](EXCEL_IMPORT_FEATURE.md) - Full technical details
- [Column Mapping Guide](COLUMN_MAPPING_GUIDE.md) - Excel column reference
- [Implementation Summary](IMPORT_FEATURE_SUMMARY.md) - What was built

---

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Run Setup Script
```powershell
.\setup-import-feature.ps1
```

### 2️⃣ Run Database Migration
```bash
psql -U your_username -d your_database -f database/migrations/add_import_fields.sql
```

### 3️⃣ Restart Server
```bash
cd server
npm run dev
```

**Done!** The import feature is now available in your Kanban board! 🎉

---

## 🎯 How to Import Tasks

1. Open any project's **Kanban Board**
2. Click the green **"Import Tasks"** button (top-right)
3. Upload your Excel file from Zoho Projects
4. Click **"Import Tasks"**
5. Review results!

---

## 📋 Excel Format

Your file should have these columns:

| Column | Required | Example |
|--------|----------|---------|
| Task Name | ✅ Yes | "Build login feature" |
| Owner | No | "john@example.com" |
| Custom Status | No | "In Progress" |
| Tags | No | "Frontend, React" |
| Start Date | No | "2024-01-01" |
| Due Date | No | "2024-01-15" |
| Duration | No | "40" |
| Priority | No | "High" |
| % Completed | No | "50" |
| Work Hours | No | "20" |
| Billing Type | No | "Billable" |

**Tip:** Click "Download Template" in the import modal to get a sample file!

---

## ✨ What's New

### 6 New Fields Added:
- ✅ **Start Date** - When task begins
- ✅ **Duration Hours** - Estimated time
- ✅ **Completion %** - Progress tracking
- ✅ **Completed At** - Finish timestamp
- ✅ **Work Hours** - Actual time spent
- ✅ **Billing Type** - Billable/Non-billable

### Smart Features:
- ✅ Automatic user matching (by name or email)
- ✅ Status conversion (Zoho → SQUAD PM)
- ✅ Priority mapping
- ✅ Date parsing (multiple formats)
- ✅ Tag processing
- ✅ Error recovery (continues on failures)
- ✅ Detailed error reporting

---

## 🎨 UI Features

- **Drag & Drop** - Easy file upload
- **Template Download** - Sample CSV file
- **Progress Tracking** - Real-time feedback
- **Error Details** - Row-by-row error messages
- **Success Stats** - Import summary
- **Task Preview** - See created tasks

---

## 🔧 Troubleshooting

### Import button not visible?
- Refresh the page
- Make sure you're on the Kanban board
- Check browser console for errors

### Import fails?
- Verify file format (.xlsx, .xls, or .csv)
- Check file size (must be < 10MB)
- Review server logs
- Verify database migration was run

### Users not assigned?
- Check Owner name matches project member
- Try using email instead of name
- Verify user is a project member

---

## 📊 What Gets Imported

✅ **Imported:**
- Task name and description
- Status and priority
- Assignee (if matched)
- Tags
- All dates (start, due, completion)
- Work hours and duration
- Billing type
- Completion percentage

❌ **Not Imported:**
- Subtasks
- Comments
- Attachments
- Time logs

---

## 🎯 Example

**Excel Row:**
```
Task Name: "Build dashboard"
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

**Result:** ✅ Task created with all fields, assigned to Jane, in "In Progress" status

---

## 📞 Need Help?

1. Check [Quick Start Guide](IMPORT_QUICK_START.md)
2. Review [Column Mapping Guide](COLUMN_MAPPING_GUIDE.md)
3. Read [Complete Documentation](EXCEL_IMPORT_FEATURE.md)
4. Check server logs: `cd server && npm run dev`
5. Check browser console (F12)

---

## 🎊 Ready to Import?

1. ✅ Run setup script
2. ✅ Run database migration
3. ✅ Restart server
4. 🚀 Start importing!

**Head to your Kanban board and click the green "Import Tasks" button!**

---

Made with ❤️ for easy project migration
