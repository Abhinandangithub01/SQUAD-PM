# Excel Import Feature - Complete Implementation Guide

## Overview
This feature allows you to import project tasks from Zoho Projects (or any compatible Excel format) into SQUAD PM. It includes a complete end-to-end solution with UI, backend API, and database support.

## Features Implemented

### 1. **Excel Column Mapping**
The following columns from your Zoho Projects export are mapped to SQUAD PM fields:

| Excel Column | SQUAD PM Field | Type | Notes |
|-------------|----------------|------|-------|
| Task Name | title | String | Required |
| Owner | assignedToId | User Reference | Mapped by name/email |
| Custom Status | status | String | Auto-mapped to SQUAD PM statuses |
| Tags | tags | Array | Comma-separated values |
| Start Date | start_date | Timestamp | NEW FIELD |
| Due Date | due_date | Timestamp | Existing field |
| Duration | duration_hours | Decimal | NEW FIELD (in hours) |
| Priority | priority | Enum | Mapped to LOW/MEDIUM/HIGH/URGENT |
| Created By | reporter_id | User Reference | Defaults to importer |
| % Completed | completion_percentage | Integer | NEW FIELD (0-100) |
| Completion Date | completed_at | Timestamp | NEW FIELD |
| Work Hours | work_hours | Decimal | NEW FIELD |
| Billing Type | billing_type | String | NEW FIELD (Billable/Non Billable/None) |
| Description | description | Text | Optional |

### 2. **New Database Fields Added**
The following fields were added to the `tasks` table:

```sql
- start_date (TIMESTAMP)
- duration_hours (DECIMAL)
- completion_percentage (INTEGER 0-100)
- completed_at (TIMESTAMP)
- work_hours (DECIMAL)
- billing_type (VARCHAR - Billable/Non Billable/None)
```

### 3. **Smart Mapping Features**

#### Status Mapping
Automatically converts Zoho statuses to SQUAD PM statuses:
- "To Do" / "TODO" → TODO
- "In Progress" / "InProgress" → IN_PROGRESS
- "In Review" / "Review" → IN_REVIEW
- "Done" / "Completed" → DONE
- "Blocked" → BLOCKED

#### Priority Mapping
- "High" → HIGH
- "Medium" → MEDIUM
- "Low" → LOW
- "Urgent" → URGENT

#### User Mapping
- Matches users by full name (case-insensitive)
- Matches users by email (case-insensitive)
- If no match found, task is created without assignee

## Installation & Setup

### Step 1: Database Migration
Run the database migration to add new fields:

```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database

# Run the migration
\i database/migrations/add_import_fields.sql
```

### Step 2: Install Server Dependencies
```bash
cd server
npm install xlsx
```

The `xlsx` package is already added to `package.json`.

### Step 3: Restart Server
```bash
cd server
npm run dev
```

### Step 4: Client is Ready
The client-side code is already integrated. No additional installation needed.

## Usage Guide

### For End Users

1. **Navigate to Kanban Board**
   - Go to any project's Kanban board
   - Look for the green "Import Tasks" button in the top-right corner

2. **Download Template (Optional)**
   - Click "Download Template" to get a sample CSV file
   - Use this as a reference for formatting your data

3. **Prepare Your Excel File**
   - Export tasks from Zoho Projects as Excel/CSV
   - Ensure column headers match the required format
   - Required columns: Task Name, Owner, Custom Status, Priority, Due Date, Tags

4. **Upload and Import**
   - Click "Import Tasks" button
   - Drag and drop your Excel file or click to browse
   - Click "Import Tasks" to start the process
   - Wait for the import to complete

5. **Review Results**
   - See how many tasks were successfully imported
   - Review any errors for failed imports
   - Failed imports show row number and error message

### For Developers

#### API Endpoint
```
POST /api/import/tasks/:projectId
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: Excel/CSV file
```

#### Response Format
```json
{
  "message": "Import completed",
  "results": {
    "success": 45,
    "failed": 2,
    "errors": [
      {
        "row": 23,
        "error": "Invalid date format",
        "taskName": "Sample Task"
      }
    ],
    "createdTasks": [
      {
        "id": "uuid",
        "title": "Task Name",
        "status": "TODO",
        ...
      }
    ]
  }
}
```

## File Structure

### Frontend Components
```
client/src/components/
└── ImportTasksModal.js          # Main import modal component
```

### Backend Routes
```
server/routes/
└── import.js                    # Import API endpoint
```

### Database
```
database/migrations/
└── add_import_fields.sql        # Database migration
```

### Lambda Functions (Optional - for AWS Amplify)
```
amplify/backend/function/importTasks/
├── index.js                     # Lambda function
└── package.json                 # Lambda dependencies
```

## Features & Capabilities

### ✅ Implemented
- [x] Excel/CSV file upload with drag-and-drop
- [x] Column mapping from Zoho Projects format
- [x] User matching by name and email
- [x] Status and priority mapping
- [x] Date parsing (Excel serial dates and strings)
- [x] Tag parsing (comma-separated)
- [x] Bulk task creation
- [x] Error handling and reporting
- [x] Import progress tracking
- [x] Success/failure statistics
- [x] Template download
- [x] Real-time feedback
- [x] Database field additions
- [x] Activity logging

### 🎯 Smart Features
- **Automatic User Matching**: Finds team members by name or email
- **Flexible Date Parsing**: Handles Excel serial dates and string dates
- **Status Normalization**: Converts various status formats to SQUAD PM standards
- **Error Recovery**: Continues importing even if some rows fail
- **Detailed Error Reports**: Shows exactly which rows failed and why

## Error Handling

### Common Errors and Solutions

1. **"No file uploaded"**
   - Solution: Ensure you've selected a file before clicking Import

2. **"Invalid file type"**
   - Solution: Use .xlsx, .xls, or .csv files only

3. **"User not found"**
   - Solution: Ensure the Owner name/email matches a project member exactly

4. **"Invalid date format"**
   - Solution: Use standard date formats (YYYY-MM-DD or Excel dates)

5. **"Access denied"**
   - Solution: Ensure you're a member of the project

## Performance Considerations

- **File Size Limit**: 10MB maximum
- **Batch Processing**: Processes all rows in a single transaction
- **Memory Usage**: Loads entire file into memory (suitable for <1000 tasks)
- **Database Connections**: Uses connection pooling for efficiency

## Security

- ✅ Authentication required (JWT token)
- ✅ Project membership verification
- ✅ File type validation
- ✅ File size limits
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)

## Testing

### Manual Testing Checklist
- [ ] Upload valid Excel file
- [ ] Upload CSV file
- [ ] Upload invalid file type
- [ ] Upload file with missing columns
- [ ] Upload file with invalid dates
- [ ] Upload file with unknown users
- [ ] Upload empty file
- [ ] Upload very large file (>10MB)
- [ ] Test with special characters in task names
- [ ] Test with various date formats
- [ ] Test with different priority values
- [ ] Test with different status values

### Sample Test Data
A sample CSV template is provided via the "Download Template" button in the UI.

## Troubleshooting

### Import Button Not Showing
- Check if you're on the Kanban board page
- Verify the component is imported correctly
- Check browser console for errors

### Import Fails Silently
- Check server logs: `cd server && npm run dev`
- Verify database connection
- Check if migration was run successfully

### Users Not Being Assigned
- Verify user names in Excel match project members exactly
- Check case sensitivity (should be case-insensitive)
- Ensure users are members of the project

### Dates Not Parsing Correctly
- Use ISO format: YYYY-MM-DD
- Or use Excel date format (serial numbers)
- Check for timezone issues

## Future Enhancements

### Potential Improvements
- [ ] Support for subtasks import
- [ ] Import attachments/files
- [ ] Import comments
- [ ] Import time logs
- [ ] Custom field mapping UI
- [ ] Import preview before committing
- [ ] Duplicate detection
- [ ] Update existing tasks (instead of create only)
- [ ] Import from other project management tools
- [ ] Scheduled imports
- [ ] Import history/audit log

## API Reference

### Import Tasks Endpoint

**Endpoint**: `POST /api/import/tasks/:projectId`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Parameters**:
- `projectId` (path): UUID of the project

**Body**:
- `file`: Excel or CSV file (multipart/form-data)

**Response**: 200 OK
```json
{
  "message": "Import completed",
  "results": {
    "success": 45,
    "failed": 2,
    "errors": [...],
    "createdTasks": [...]
  }
}
```

**Error Responses**:
- `400`: Bad request (no file, invalid file type)
- `403`: Forbidden (not a project member)
- `500`: Server error

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Check browser console
4. Verify database migration was successful
5. Ensure all dependencies are installed

## Changelog

### Version 1.0.0 (2024-01-10)
- Initial implementation
- Excel/CSV import support
- Column mapping for Zoho Projects
- User matching
- Status and priority mapping
- Error handling and reporting
- UI components
- Database migrations
- API endpoints

---

**Note**: This feature is production-ready but should be tested thoroughly with your specific data before using in production.
