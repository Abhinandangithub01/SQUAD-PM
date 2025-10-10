# 🚀 Complete Import Setup - Step by Step

## ❌ Current Error
**"Backend server is not running. Please start the server on port 5000"**

This means your server is not running. Let's fix everything!

---

## ✅ Complete Setup (Follow in Order)

### Step 1: Install xlsx Package
```powershell
cd C:\Users\mail2\Downloads\ProjectManagement\server
npm install xlsx
```

**Expected Output:**
```
added 1 package, and audited X packages in Xs
```

---

### Step 2: Run Database Migration

**Option A: Using psql command line**
```powershell
# Navigate to project root
cd C:\Users\mail2\Downloads\ProjectManagement

# Run migration
psql -U postgres -d your_database_name -f database/migrations/add_import_fields.sql
```

**Option B: Using pgAdmin or database tool**
1. Open your PostgreSQL tool
2. Connect to your database
3. Open `database/migrations/add_import_fields.sql`
4. Execute the SQL

**The migration adds these fields:**
- `start_date` - Task start date
- `duration_hours` - Estimated duration
- `completion_percentage` - Progress (0-100)
- `completed_at` - Completion timestamp
- `work_hours` - Actual hours spent
- `billing_type` - Billable/Non Billable/None

---

### Step 3: Start the Backend Server

```powershell
cd C:\Users\mail2\Downloads\ProjectManagement\server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Environment: development
```

**Keep this terminal open!** The server must stay running.

---

### Step 4: Verify Server is Running

Open a new terminal and test:
```powershell
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"OK","timestamp":"2025-10-10T..."}
```

---

### Step 5: Test Import Feature

1. **Refresh your browser** (F5)
2. Go to Kanban Board
3. Click "Import Tasks" button
4. Upload your Excel file
5. Click "Import Tasks"

**Should work now!** ✅

---

## 📋 Your Excel Data Mapping

Based on your data, here's how columns map:

| Excel Column | SQUAD PM Field | Example Value |
|-------------|----------------|---------------|
| Task Name | title | "Manage Users/Employee" |
| Owner | assignedToId | "Unassigned User" → null |
| Custom Status | status | "Scope Defined" → "TODO" |
| Tags | tags | "Company Settings" → ["Company Settings"] |
| Start Date | start_date | (empty) → null |
| Due Date | due_date | (empty) → null |
| Duration | duration_hours | "-" → null |
| Priority | priority | "High" → "HIGH" |
| Created By | reporter_id | "Abhinandan R" → matched user |
| % Completed | completion_percentage | "0" → 0 |
| Completion Date | completed_at | "-" → null |
| Work hours | work_hours | "00:00" → 0 |
| Billing Type | billing_type | "None" → "None" |

---

## 🎯 Expected Import Results

With your 52 tasks:
- ✅ All 52 tasks will be created
- ⚠️ "Unassigned User" won't match anyone (tasks created without assignee)
- ✅ "Abhinandan R" will be matched if user exists in project
- ✅ Tags will be parsed correctly
- ✅ Priority mapped: High→HIGH, Medium→MEDIUM, Low→LOW
- ✅ Status: "Scope Defined" → "TODO" (or keep as is)

---

## 🔍 Troubleshooting

### Error: "Cannot find module 'xlsx'"
**Solution:** Run `npm install xlsx` in server directory

### Error: "Backend server is not running"
**Solution:** Start server with `npm run dev` in server directory

### Error: "Failed to load resource: 404"
**Solution:** 
1. Check server is running
2. Verify import.js exists in server/routes/
3. Check server logs for errors

### Error: "Column not found in database"
**Solution:** Run the database migration

### Tasks created but not assigned
**Reason:** "Unassigned User" doesn't match any real user
**Solution:** Either:
- Leave as is (tasks created without assignee)
- Replace "Unassigned User" with real email/name in Excel
- Assign manually after import

---

## 📝 Quick Checklist

Before importing:

- [ ] xlsx package installed (`npm list xlsx` shows version)
- [ ] Database migration run (check if columns exist)
- [ ] Server running (`npm run dev` in server directory)
- [ ] Server responding (test `/api/health` endpoint)
- [ ] Browser refreshed
- [ ] Excel file ready

---

## 🎬 Complete Command Sequence

Copy and paste this entire block:

```powershell
# 1. Install xlsx
cd C:\Users\mail2\Downloads\ProjectManagement\server
npm install xlsx

# 2. Start server (keep this running)
npm run dev
```

In a **new terminal**:
```powershell
# 3. Test server
curl http://localhost:5000/api/health
```

Then in your browser:
1. Refresh page (F5)
2. Click "Import Tasks"
3. Upload Excel
4. Import!

---

## 💡 Pro Tips

### Tip 1: User Matching
For "Abhinandan R" to be matched, there must be a user in the project with:
- First name: "Abhinandan"
- Last name: "R"
OR
- Email containing "abhinandan"

### Tip 2: Batch Import
Your 52 tasks will all import at once. The system processes them sequentially.

### Tip 3: Error Recovery
If some tasks fail, the import continues. You'll see:
- Success count
- Failed count
- Detailed error messages for each failure

### Tip 4: Empty Values
- "-" in Duration/Work Hours → 0
- Empty dates → null
- "Unassigned User" → no assignee

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Server Not Running
**Symptom:** 404 errors, "Backend server is not running"
**Fix:** Run `npm run dev` in server directory

### ❌ Mistake 2: Wrong Directory
**Symptom:** "Cannot find package.json"
**Fix:** Make sure you're in the `server` directory

### ❌ Mistake 3: Migration Not Run
**Symptom:** "Column does not exist" errors
**Fix:** Run the database migration SQL

### ❌ Mistake 4: Old Browser Cache
**Symptom:** Still seeing old errors
**Fix:** Hard refresh (Ctrl+Shift+R)

---

## ✅ Success Indicators

You'll know it's working when:

1. **Server Terminal Shows:**
   ```
   Server running on port 5000
   Processing 52 tasks from Excel
   Created task: Manage Users/Employee
   Created task: Department and Roles
   ...
   ```

2. **Browser Shows:**
   ```
   ✅ Successfully imported 52 tasks!
   ```

3. **Kanban Board:**
   - All 52 tasks appear
   - In correct columns
   - With proper tags and priorities

---

## 📞 Still Having Issues?

If it still doesn't work:

1. **Check server logs** - Look at the terminal where you ran `npm run dev`
2. **Check browser console** - Press F12 and look for errors
3. **Verify database** - Check if new columns exist in tasks table
4. **Test endpoint** - Try `curl http://localhost:5000/api/health`

---

## 🎉 After Successful Import

You should see:
- ✅ 52 tasks created
- ✅ Tags applied ("Company Settings", "Dashboard", etc.)
- ✅ Priorities set (High, Medium, Low)
- ✅ Status set to "TODO" or "Scope Defined"
- ✅ Created by "Abhinandan R" (if user exists)
- ⚠️ No assignees (since "Unassigned User" doesn't match)

You can then:
1. Assign tasks manually
2. Move tasks between columns
3. Update any fields as needed

---

**Ready? Start with Step 1 above!** 🚀
