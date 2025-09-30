# ⌨️ Keyboard Shortcuts Guide

## 🎯 Quick Actions on Task Cards

When hovering over any task card, you can use these shortcuts:

### **M** - Assign Member
- **Action**: Opens member assignment menu
- **Usage**: Hover over card → Press `M`
- **Menu**: Search and select team member
- **Result**: Assigns selected member to task

### **D** - Set Due Date
- **Action**: Opens due date picker
- **Usage**: Hover over card → Press `D`
- **Menu**: Calendar picker with quick options
- **Quick Options**:
  - Today
  - Tomorrow
  - Next Week
  - Clear
- **Result**: Sets task due date

### **T** - Edit Tags
- **Action**: Opens tags menu
- **Usage**: Hover over card → Press `T`
- **Menu**: Multi-select tag list
- **Features**:
  - Search tags
  - Toggle multiple tags
  - Visual checkmarks
- **Result**: Updates task tags

---

## 📋 How It Works

### 1. **Hover Activation**
```
Hover over any task card
↓
Card highlights with blue border
↓
Keyboard hint badge appears (M · D · T)
↓
Shortcuts are now active
```

### 2. **Menu Positioning**
- Menu appears **below** the card
- If no space below, appears **beside** the card
- Automatically adjusts position
- Closes on click outside

### 3. **Visual Feedback**
- **Hover**: Blue border + shadow
- **Active**: Pulsing hint badge
- **Menu Open**: Blue border on menu
- **Selected**: Checkmarks and highlights

---

## 🎨 Menu Features

### **Assign Member Menu (M)**
```
┌─────────────────────────┐
│ Assign Member      [×]  │
├─────────────────────────┤
│ [Search members...]     │
├─────────────────────────┤
│ 👤 John Doe             │
│    john@example.com     │
├─────────────────────────┤
│ 👤 Jane Smith           │
│    jane@example.com     │
└─────────────────────────┘
```

**Features:**
- Search by name or email
- Avatar display
- Click to assign
- Auto-closes on selection

### **Due Date Menu (D)**
```
┌─────────────────────────┐
│ Set Due Date       [×]  │
├─────────────────────────┤
│ [Date Picker]           │
├─────────────────────────┤
│ [Today] [Tomorrow]      │
│ [Next Week] [Clear]     │
├─────────────────────────┤
│      [Save]             │
└─────────────────────────┘
```

**Features:**
- Calendar date picker
- Quick action buttons
- Clear option
- Save button

### **Tags Menu (T)**
```
┌─────────────────────────┐
│ Edit Tags          [×]  │
├─────────────────────────┤
│ [Search tags...]        │
├─────────────────────────┤
│ 🔵 Frontend        [✓]  │
│ 🟢 Backend         [ ]  │
│ 🟡 Design          [✓]  │
├─────────────────────────┤
│      [Save]             │
└─────────────────────────┘
```

**Features:**
- Search tags
- Multi-select
- Color indicators
- Checkmarks for selected
- Save button

---

## 💡 Tips & Tricks

### **Quick Workflow**
1. Hover over card
2. Press `M` to assign
3. Press `D` to set deadline
4. Press `T` to add tags
5. All done in seconds!

### **Search Shortcuts**
- Type immediately after opening menu
- Search is auto-focused
- Use arrow keys to navigate
- Press Enter to select

### **Keyboard Navigation**
- `Esc` - Close menu
- `Tab` - Navigate fields
- `Enter` - Confirm selection
- `Backspace` - Clear search

---

## 🚀 Usage Examples

### **Example 1: Assign Task**
```
1. Hover over "Design Homepage" card
2. Press M
3. Type "john"
4. Click John Doe
5. ✓ Task assigned!
```

### **Example 2: Set Deadline**
```
1. Hover over task card
2. Press D
3. Click "Tomorrow"
4. Click Save
5. ✓ Due date set!
```

### **Example 3: Add Tags**
```
1. Hover over task card
2. Press T
3. Click "Frontend"
4. Click "Urgent"
5. Click Save
6. ✓ Tags added!
```

---

## 🎯 Benefits

### **Speed**
- ⚡ 5x faster than clicking through menus
- ⚡ No need to open full task modal
- ⚡ Bulk updates in seconds

### **Efficiency**
- 🎯 Stay in flow state
- 🎯 Less mouse movement
- 🎯 Fewer clicks

### **Productivity**
- 📈 Update multiple tasks quickly
- 📈 Less context switching
- 📈 Faster task management

---

## 🔧 Technical Details

### **Keyboard Detection**
- Listens only when card is hovered
- Ignores shortcuts in input fields
- Prevents conflicts with browser shortcuts
- Clean event cleanup

### **Menu Positioning**
- Calculates card position
- Adjusts for viewport boundaries
- Prevents overflow
- Smooth animations

### **State Management**
- React hooks for state
- Optimistic UI updates
- API calls on save
- Toast notifications

---

## 📱 Responsive Behavior

### **Desktop**
- Full keyboard shortcuts
- Hover detection
- Menu positioning

### **Tablet**
- Touch to activate
- Long press for menu
- Swipe gestures

### **Mobile**
- Tap to open menu
- Full-screen menu
- Touch-optimized

---

## 🎨 Customization

### **Available Options**
- Custom keyboard shortcuts
- Menu position (below/beside/above)
- Theme colors
- Animation speed
- Auto-close delay

### **Future Enhancements**
- More shortcuts (P for priority, S for status)
- Custom shortcut mapping
- Shortcut cheat sheet overlay
- Global keyboard shortcuts

---

## 🐛 Troubleshooting

### **Shortcuts Not Working?**
1. Make sure card is hovered
2. Check if focus is in input field
3. Verify keyboard is enabled
4. Try refreshing page

### **Menu Not Appearing?**
1. Check card position on screen
2. Verify menu component is loaded
3. Check browser console for errors
4. Try different card

### **Search Not Working?**
1. Click in search field
2. Clear any existing text
3. Type slowly
4. Check data is loaded

---

## 📚 Related Features

- **Drag & Drop**: Reorder tasks
- **Bulk Actions**: Select multiple tasks
- **Quick Filters**: Filter by assignee/tags
- **Command Palette**: Global shortcuts (coming soon)

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
