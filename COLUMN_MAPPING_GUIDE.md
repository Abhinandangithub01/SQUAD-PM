# Excel Column Mapping Guide

## Complete Column Mapping Reference

This guide shows exactly how your Zoho Projects Excel columns map to SQUAD PM fields.

## 📊 Column Mapping Table

| # | Zoho Excel Column | SQUAD PM Field | Data Type | Required | Default | Notes |
|---|------------------|----------------|-----------|----------|---------|-------|
| 1 | **Task Name** | `title` | String(255) | ✅ Yes | - | Main task identifier |
| 2 | **Owner** | `assignedToId` | UUID | No | null | Matched by name or email |
| 3 | **Custom Status** | `status` | String(100) | No | "Backlog" | Auto-converted to SQUAD PM status |
| 4 | **Tags** | `tags` | Array | No | [] | Comma-separated values |
| 5 | **Start Date** | `start_date` | Timestamp | No | null | NEW FIELD - When task starts |
| 6 | **Due Date** | `due_date` | Timestamp | No | null | Task deadline |
| 7 | **Duration** | `duration_hours` | Decimal | No | null | NEW FIELD - Estimated hours |
| 8 | **Priority** | `priority` | Enum | No | "medium" | low/medium/high/urgent |
| 9 | **Created By** | `reporter_id` | UUID | No | Current User | Who created the task |
| 10 | **% Completed** | `completion_percentage` | Integer | No | 0 | NEW FIELD - 0 to 100 |
| 11 | **Completion Date** | `completed_at` | Timestamp | No | null | NEW FIELD - When completed |
| 12 | **Work Hours** | `work_hours` | Decimal | No | 0 | NEW FIELD - Actual hours spent |
| 13 | **Billing Type** | `billing_type` | String | No | "None" | NEW FIELD - Billable/Non Billable/None |
| 14 | **Description** | `description` | Text | No | "" | Detailed task description |

## 🔄 Status Conversion Rules

Your Zoho status values are automatically converted:

| Zoho Status | SQUAD PM Status | Color |
|------------|----------------|-------|
| To Do, TODO | `TODO` | 🔴 Red |
| In Progress, InProgress | `IN_PROGRESS` | 🟡 Yellow |
| In Review, Review | `IN_REVIEW` | 🔵 Blue |
| Done, Completed | `DONE` | 🟢 Green |
| Blocked | `BLOCKED` | ⚫ Gray |
| *Any other* | Original value | Default |

**Note**: Status matching is case-insensitive and handles variations.

## 🎯 Priority Conversion Rules

| Zoho Priority | SQUAD PM Priority | Badge Color |
|--------------|------------------|-------------|
| Low | `LOW` | 🟢 Green |
| Medium | `MEDIUM` | 🟡 Yellow |
| High | `HIGH` | 🟠 Orange |
| Urgent | `URGENT` | 🔴 Red |
| *Empty/Other* | `MEDIUM` | 🟡 Yellow |

## 👤 User Matching Logic

The system tries to match the "Owner" field in this order:

1. **By Full Name** (case-insensitive)
   - "John Doe" matches user with firstName="John", lastName="Doe"
   
2. **By Email** (case-insensitive)
   - "john.doe@example.com" matches user with that email

3. **No Match**
   - Task is created without an assignee
   - Can be assigned later manually

**Examples**:
```
✅ "John Doe" → Matches John Doe
✅ "john doe" → Matches John Doe (case-insensitive)
✅ "john@example.com" → Matches by email
❌ "J. Doe" → No match (needs full name)
❌ "Johnny" → No match (needs exact first name)
```

## 📅 Date Format Support

The import supports multiple date formats:

### Supported Formats:
1. **ISO Format**: `2024-01-15`
2. **Excel Serial**: `45321` (Excel's internal date number)
3. **US Format**: `01/15/2024`
4. **European Format**: `15/01/2024`
5. **Full DateTime**: `2024-01-15T10:30:00Z`

### Best Practice:
Use **ISO format** (YYYY-MM-DD) for maximum compatibility.

**Examples**:
```
✅ "2024-01-15" → January 15, 2024
✅ "45321" → Converted from Excel serial
✅ "01/15/2024" → January 15, 2024
❌ "Jan 15" → Not supported (missing year)
❌ "15-Jan-2024" → Not supported (use ISO)
```

## 🏷️ Tags Format

Tags should be comma-separated in a single cell:

**Format**: `Tag1, Tag2, Tag3`

**Examples**:
```
✅ "Frontend, React, UI" → ["Frontend", "React", "UI"]
✅ "Backend" → ["Backend"]
✅ "Bug, Critical, Security" → ["Bug", "Critical", "Security"]
❌ "Frontend; React" → ["Frontend; React"] (semicolon not supported)
```

## 💰 Billing Type Values

| Excel Value | Stored Value | Description |
|------------|--------------|-------------|
| Billable | `Billable` | Client-billable work |
| Non Billable | `Non Billable` | Internal work |
| None | `None` | Not tracked |
| *Empty* | `None` | Default value |

## 📈 Numeric Fields

### Duration (hours)
- **Format**: Decimal number
- **Examples**: `40`, `8.5`, `160`
- **Unit**: Hours

### Work Hours
- **Format**: Decimal number
- **Examples**: `20`, `4.5`, `80`
- **Unit**: Hours

### % Completed
- **Format**: Integer 0-100
- **Examples**: `0`, `50`, `100`
- **Validation**: Must be between 0 and 100

## 🔍 Example Excel Rows

### Example 1: Complete Task
```
Task Name: "Implement user authentication"
Owner: "john.doe@example.com"
Custom Status: "In Progress"
Tags: "Backend, Security, API"
Start Date: "2024-01-01"
Due Date: "2024-01-15"
Duration: "40"
Priority: "High"
% Completed: "25"
Work Hours: "10"
Billing Type: "Billable"
Description: "Implement JWT-based authentication with refresh tokens"
```

**Result**: ✅ Complete task with all fields populated

### Example 2: Minimal Task
```
Task Name: "Fix login bug"
Owner: ""
Custom Status: ""
Tags: ""
Start Date: ""
Due Date: ""
Duration: ""
Priority: ""
% Completed: ""
Work Hours: ""
Billing Type: ""
Description: ""
```

**Result**: ✅ Task created with defaults (status=Backlog, priority=medium, etc.)

### Example 3: Task with Errors
```
Task Name: ""  ← ERROR: Required field
Owner: "Unknown User"  ← WARNING: User not found
Custom Status: "In Progress"
Tags: "Frontend"
Start Date: "invalid-date"  ← ERROR: Invalid date
Due Date: "2024-01-15"
Duration: "abc"  ← ERROR: Not a number
Priority: "High"
```

**Result**: ❌ Import fails with detailed error message

## 🎨 Field Validation Rules

| Field | Validation | Error Message |
|-------|-----------|---------------|
| Task Name | Not empty | "Task name is required" |
| Owner | Must match project member | "User not found: {name}" |
| Start Date | Valid date format | "Invalid start date format" |
| Due Date | Valid date format | "Invalid due date format" |
| Duration | Positive number | "Duration must be a positive number" |
| Priority | One of: low/medium/high/urgent | "Invalid priority value" |
| % Completed | 0-100 | "Completion must be between 0 and 100" |
| Work Hours | Positive number | "Work hours must be a positive number" |

## 📝 Template Download

The import modal provides a template with all columns pre-configured. Click **"Download Template"** to get:

- All column headers in correct format
- Sample data row
- CSV format (compatible with Excel)

## 🔧 Troubleshooting Column Issues

### Column not recognized?
- Check spelling exactly matches the table above
- Column names are case-sensitive
- Remove extra spaces before/after column names

### Data not importing correctly?
- Verify data type matches expected format
- Check for special characters
- Ensure dates are in supported format
- Verify numeric fields contain only numbers

### User not being assigned?
- Check Owner name matches project member exactly
- Try using email instead of name
- Verify user is a member of the project
- Check for typos in name/email

## 📊 Import Statistics

After import, you'll see:
- ✅ **Success Count**: Tasks imported successfully
- ❌ **Failed Count**: Tasks that failed to import
- 📋 **Error Details**: Row number, error message, and task name for each failure
- 📝 **Created Tasks**: List of successfully created tasks (first 10 shown)

---

**Pro Tip**: Start with a small test file (5-10 tasks) to verify your column mapping before importing hundreds of tasks!
