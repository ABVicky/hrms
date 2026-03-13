const VERSION = "1.3";

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['employees', 'attendance', 'leave_requests', 'expenses', 'wfh_requests', 'announcements', 'notifications'];
  
  sheets.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    
    // Define expected headers for each sheet
    let expectedHeaders = [];
    if (name === 'employees') {
      expectedHeaders = ['employee_id', 'name', 'email', 'phone', 'department', 'role', 'salary', 'employee_type', 'manager_id', 'joining_date', 'account_status', 'contract_end_date', 'profile_picture', 'password'];
    } else if (name === 'attendance') {
      expectedHeaders = ['attendance_id', 'employee_id', 'employee_name', 'date', 'check_in', 'check_out', 'mode', 'latitude', 'longitude', 'working_hours', 'attendance_status'];
    } else if (name === 'leave_requests') {
      expectedHeaders = ['request_id', 'employee_id', 'employee_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'manager_comment'];
    } else if (name === 'expenses') {
      expectedHeaders = ['expense_id', 'employee_id', 'employee_name', 'amount', 'category', 'description', 'receipt_file', 'status', 'approved_by', 'payment_status'];
    } else if (name === 'wfh_requests') {
      expectedHeaders = ['request_id', 'employee_id', 'employee_name', 'date', 'reason', 'status', 'approved_by'];
    } else if (name === 'announcements') {
      expectedHeaders = ['id', 'title', 'message', 'posted_by', 'timestamp', 'type', 'priority'];
    } else if (name === 'notifications') {
      expectedHeaders = ['id', 'employee_id', 'employee_name', 'title', 'message', 'timestamp', 'read', 'type', 'target_path'];
    }

    if (expectedHeaders.length > 0) {
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        sheet.appendRow(expectedHeaders);
      } else {
        // Sync missing headers
        const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        expectedHeaders.forEach(h => {
          if (currentHeaders.indexOf(h) === -1) {
            sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
          }
        });
      }
    }
  });
  return "Database Setup Complete";
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function doGet(e) {
  return handleRequest(e, 'GET');
}

function handleRequest(e, method) {
  try {
    let params;
    let endpoint;
    
    if (method === 'POST') {
      const postData = JSON.parse(e.postData.contents);
      endpoint = postData.endpoint;
      params = postData.params || {};
    } else {
      endpoint = e.parameter.endpoint;
      params = e.parameter || {};
    }
    
    let result = {};
    
    switch (endpoint) {
      case '/login':
        result = handleLogin(params);
        break;
      case '/checkin':
        result = handleCheckin(params);
        break;
      case '/checkout':
        result = handleCheckout(params);
        break;
      case '/leave-request':
        result = handleLeaveRequest(params);
        break;
      case '/expense-submit':
        result = handleExpenseSubmit(params);
        break;
      case '/attendance':
        result = getAttendance(params);
        break;
      case '/employee':
        result = getEmployee(params);
        break;
      case '/dashboard-stats':
        result = getDashboardStats(params);
        break;
      case '/update-profile':
        result = handleUpdateProfile(params);
        break;
      case '/approve-request':
        result = handleApproveRequest(params);
        break;
      case '/reject-request':
        result = handleRejectRequest(params);
        break;
      case '/post-announcement':
        result = handlePostAnnouncement(params);
        break;
      case '/get-announcements':
        result = getAnnouncements(params);
        break;
      case '/get-leave-requests':
        result = getLeaveRequests(params);
        break;
      case '/get-notifications':
        result = getNotifications(params);
        break;
      case '/get-expenses':
        result = getExpenses(params);
        break;
      case '/latest-status':
        result = getLatestStatus(params);
        break;
      case '/mark-notification-read':
        result = handleMarkNotificationRead(params);
        break;
      case '/status':
        result = { status: "online", version: VERSION, spreadsheet_id: SpreadsheetApp.getActiveSpreadsheet().getId() };
        break;
      default:
        throw new Error('[v' + VERSION + '] Unknown endpoint: ' + endpoint);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map((row, rowIndex) => {
    let obj = {};
    headers.forEach((header, index) => {
      const headerStr = String(header).trim().toLowerCase();
      let value = row[index];
      
      if (value instanceof Date) {
        // Force date columns to YYYY-MM-DD
        if (headerStr === 'date' || headerStr === 'expiry_date' || headerStr.endsWith('_date')) {
          value = Utilities.formatDate(value, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd");
        } else {
          // Check-in/out times: Use ISO-8601 with offset
          value = Utilities.formatDate(value, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
        }
      }
      // Use original header for keys to maintain compatibility with updateRowInSheet
      obj[header] = value;
      // Also add lowercase version for easier internal script access
      obj[headerStr] = value;
    });
    // Add internal row index for debugging if needed
    obj['_row'] = rowIndex + 2; 
    return obj;
  });
}

function appendToSheet(sheetName, dataObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => typeof dataObj[header] !== 'undefined' ? dataObj[header] : '');
  sheet.appendRow(row);
  return dataObj;
}

function updateRowInSheet(sheetName, searchColumnHeader, searchValue, updateData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const searchColIndex = headers.indexOf(searchColumnHeader);
  
  if (searchColIndex === -1) throw new Error("Column not found: " + searchColumnHeader);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][searchColIndex] == searchValue) {
      // Found the row.
      Object.keys(updateData).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updateData[key]);
        }
      });
      return true;
    }
  }
  return false;
}

function getTodayStr() {
  return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd");
}

function getNowIso() {
  return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

// -------------------------------------------------------------
// Cache Helpers
// -------------------------------------------------------------
function clearCache(employee_id) {
  const cache = CacheService.getScriptCache();
  cache.remove("dashboard_stats_all");
  if (employee_id) {
    cache.remove("dashboard_stats_" + String(employee_id));
  }
}

// -------------------------------------------------------------
// Handlers
// -------------------------------------------------------------

function handleLogin(params) {
  const { email, password } = params;
  if (!email || !password) throw new Error("Email and password required");
  
  const employees = getSheetData('employees');
  const user = employees.find(e => e.email === email && e.password === password && e.account_status !== 'inactive');
  
  if (!user) throw new Error("Invalid credentials or inactive account");
  
  // Strip password before returning
  delete user.password;
  
  return { user };
}

function handleCheckin(params) {
  const { employee_id, lat, lng, mode } = params;
  if (!employee_id) throw new Error("Employee ID required");
  
  const today = getTodayStr();
  const attendance = getSheetData('attendance');
  
  // Prevent multiple active check-ins (regardless of date, to handle late night/early morning shifts)
  const openSession = attendance.find(a => {
    const isOwner = String(a.employee_id).trim() === String(employee_id).trim();
    const isNotCheckedOut = !a.check_out || String(a.check_out).trim() === "" || String(a.check_out).trim() === "---";
    return isOwner && isNotCheckedOut;
  });
  
  if (openSession) {
    throw new Error("[v" + VERSION + "] Active session from " + openSession.date + " found. Please check out first.");
  }
  
  // Also guard against double check-in for "today" strictly
  const closedRecordToday = attendance.find(a => {
    const isOwner = String(a.employee_id).trim() === String(employee_id).trim();
    const isToday = String(a.date) === today;
    const isCheckedOut = a.check_out && String(a.check_out).trim() !== "" && String(a.check_out).trim() !== "---";
    return isOwner && isToday && isCheckedOut;
  });
  if (closedRecordToday) throw new Error("[v" + VERSION + "] Already completed session for today");
  
  // Store check-in
  const newAttendance = {
    attendance_id: Utilities.getUuid(),
    employee_id: employee_id,
    employee_name: getEmployeeName(employee_id),
    date: today,
    check_in: getNowIso(),
    check_out: '',
    mode: mode || 'office',
    latitude: lat || '',
    longitude: lng || '',
    working_hours: '',
    attendance_status: (mode === 'wfh') ? 'wfh' : 'present'
  };
  
  appendToSheet('attendance', newAttendance);
  clearCache(employee_id);
  return { status: 'Checked in successfully', record: newAttendance };
}

function handleCheckout(params) {
  const { employee_id } = params;
  if (!employee_id) throw new Error("Employee ID required");
  
  const attendance = getSheetData('attendance');
  
  // Find latest open session (very robust check)
  const existingCheckin = attendance
    .filter(a => {
      const isOwner = String(a.employee_id).trim() === String(employee_id).trim();
      const isNotCheckedOut = !a.check_out || String(a.check_out).trim() === "" || String(a.check_out).trim() === "---";
      return isOwner && isNotCheckedOut;
    })
    .sort((a, b) => {
      const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
      const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
      return timeB - timeA;
    })[0];

  if (!existingCheckin) {
    throw new Error("[v" + VERSION + "] No active check-in found in system. Please try checking in again.");
  }
  
  const checkoutTimeStr = getNowIso();
  const checkoutTime = new Date(checkoutTimeStr);
  const checkinTime = new Date(existingCheckin.check_in);
  const diffHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);
  
  updateRowInSheet('attendance', 'attendance_id', existingCheckin.attendance_id, {
    check_out: checkoutTimeStr,
    working_hours: diffHours.toFixed(2)
  });
  
  clearCache(employee_id);
  return { status: 'Checked out successfully', working_hours: diffHours.toFixed(2) };
}

function handleLeaveRequest(params) {
  const employees = getSheetData('employees');
  const user = employees.find(e => e.employee_id == params.employee_id);
  const initialStatus = (user && user.manager_id) ? 'pending_manager' : 'pending_hr';

  const request = {
    request_id: Utilities.getUuid(),
    employee_id: params.employee_id,
    employee_name: getEmployeeName(params.employee_id),
    leave_type: params.leave_type,
    start_date: params.start_date,
    end_date: params.end_date,
    reason: params.reason,
    status: initialStatus,
    approved_by: '',
    manager_comment: ''
  };
  
  appendToSheet('leave_requests', request);
  // Send email notification to Manager here if needed
  clearCache(params.employee_id);
  
  return { status: 'Leave requested successfully', request };
}

function handleExpenseSubmit(params) {
  // If a file is uploaded as base64
  let fileUrl = '';
  if (params.receipt_base64 && params.receipt_filename) {
    const splitBase = params.receipt_base64.split(',');
    const decoded = Utilities.base64Decode(splitBase[1] || splitBase[0]);
    const blob = Utilities.newBlob(decoded, params.receipt_mime, params.receipt_filename);
    const folderIterator = DriveApp.getFoldersByName("HRMS_Expenses");
    let folder;
    if (folderIterator.hasNext()) {
      folder = folderIterator.next();
    } else {
      folder = DriveApp.createFolder("HRMS_Expenses");
    }
    const file = folder.createFile(blob);
    // Open access to anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileUrl = file.getUrl();
  }
  
  const employees = getSheetData('employees');
  const user = employees.find(e => e.employee_id == params.employee_id);
  const initialStatus = (user && user.manager_id) ? 'pending_manager' : 'pending_finance';

  const expense = {
    expense_id: Utilities.getUuid(),
    employee_id: params.employee_id,
    employee_name: getEmployeeName(params.employee_id),
    amount: params.amount,
    category: params.category,
    description: params.description,
    receipt_file: fileUrl,
    status: initialStatus,
    approved_by: '',
    payment_status: 'pending'
  };
  
  appendToSheet('expenses', expense);
  clearCache(params.employee_id);
  return { status: 'Expense submitted successfully', expense };
}

function handleUpdateProfile(params) {
  const { employee_id, avatar_base64, avatar_mime, avatar_filename } = params;
  if (!employee_id || !avatar_base64) throw new Error("Missing required parameters for profile update");
  
  const splitBase = avatar_base64.split(',');
  const decoded = Utilities.base64Decode(splitBase[1] || splitBase[0]);
  const blob = Utilities.newBlob(decoded, avatar_mime, avatar_filename);
  const folderIterator = DriveApp.getFoldersByName("HRMS_Profiles");
  let folder;
  if (folderIterator.hasNext()) {
    folder = folderIterator.next();
  } else {
    folder = DriveApp.createFolder("HRMS_Profiles");
  }
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const fileUrl = "https://drive.google.com/uc?id=" + file.getId();
  
  // Try to update. (Note: if the 'profile_picture' column is missing from the existing sheet headers, it may be ignored by updateRowInSheet unless added)
  updateRowInSheet('employees', 'employee_id', employee_id, {
    profile_picture: fileUrl
  });
  
  return { status: 'Profile picture updated successfully', profile_picture: fileUrl };
}

function getAttendance(params) {
  const data = getSheetData('attendance');
  if (params.employee_id) {
    return data.filter(r => r.employee_id == params.employee_id);
  }
  return data;
}

function getLatestStatus(params) {
  const { employee_id } = params;
  if (!employee_id) throw new Error("Employee ID required");
  
  const data = getSheetData('attendance');
  const userRecords = data.filter(r => String(r.employee_id).trim() === String(employee_id).trim());
  
  if (userRecords.length === 0) return { status: 'none' };
  
  const latest = userRecords.sort((a, b) => {
    const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
    const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
    return timeB - timeA;
  })[0];

  const isCheckedIn = latest && latest.check_in && (!latest.check_out || String(latest.check_out).trim() === "" || String(latest.check_out).trim() === "---");
  
  return {
    status: isCheckedIn ? 'checked-in' : 'checked-out',
    latest_record: latest
  };
}

function getEmployee(params) {
  const employees = getSheetData('employees');
  if (params.employee_id) {
    const emp = employees.find(e => e.employee_id == params.employee_id);
    if(emp) delete emp.password;
    return emp;
  }
  
  // Return all but omitted passwords
  return employees.map(e => {
    delete e.password;
    return e;
  });
}

function handleApproveRequest(params) {
  const { request_id, type, role, approver_id } = params;
  const sheetName = type === 'leave' ? 'leave_requests' : 'expenses';
  const idField = type === 'leave' ? 'request_id' : 'expense_id';
  
  let newStatus = 'approved';
  // Stage 1 approver routing
  if (role === 'Manager') {
    newStatus = type === 'leave' ? 'pending_hr' : 'pending_finance';
  }
  
  const data = getSheetData(sheetName);
  const request = data.find(r => r[idField] == request_id);
  
  updateRowInSheet(sheetName, idField, request_id, {
    status: newStatus,
    approved_by: approver_id
  });

  if (request && newStatus === 'approved') {
    createNotification(
      request.employee_id,
      `${type === 'leave' ? 'Leave' : 'Expense'} Approved`,
      `Your ${type} request has been fully approved.`,
      'success',
      '/dashboard'
    );
  } else if (request && role === 'Manager') {
    createNotification(
      request.employee_id,
      `${type === 'leave' ? 'Leave' : 'Expense'} Manager Approval`,
      `Your manager has approved your ${type} request. It is now pending final review.`,
      'info',
      '/dashboard'
    );
  }
  
  clearCache(request.employee_id);
  return { status: 'Request approved successfully', new_status: newStatus };
}

function handleRejectRequest(params) {
  const { request_id, type, approver_id } = params;
  const sheetName = type === 'leave' ? 'leave_requests' : 'expenses';
  const idField = type === 'leave' ? 'request_id' : 'expense_id';
  
  const data = getSheetData(sheetName);
  const request = data.find(r => r[idField] == request_id);

  updateRowInSheet(sheetName, idField, request_id, {
    status: 'rejected',
    approved_by: approver_id
  });

  if (request) {
    createNotification(
      request.employee_id,
      `${type === 'leave' ? 'Leave' : 'Expense'} Rejected`,
      `Your ${type} request was not approved. Check dashboard for details.`,
      'error',
      '/dashboard'
    );
  }
  
  clearCache(request.employee_id);
  return { status: 'Request rejected successfully' };
}

function getDashboardStats(params) {
  const { employee_id, role } = params || {};
  const cache = CacheService.getScriptCache();
  const cacheKey = "dashboard_stats_" + (employee_id || "all");
  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const employees = getSheetData('employees');
  const attendance = getSheetData('attendance');
  const leaves = getSheetData('leave_requests');
  const expenses = getSheetData('expenses');
  cleanupOldAnnouncements();
  const announcements = getSheetData('announcements').slice(-5).reverse();
  const notifications = getSheetData('notifications').filter(n => n.employee_id == employee_id).slice(-10).reverse();
  
  const today = new Date().toISOString().split('T')[0];
  
  const todayAttendance = attendance.filter(a => a.date == today);
  const wfhCount = todayAttendance.filter(a => a.mode === 'wfh').length;
  
  let pending_leaves_list = [];
  let pending_expenses_list = [];

  if (role === 'Manager') {
    const teamIds = employees.filter(e => e.manager_id == employee_id).map(e => String(e.employee_id));
    pending_leaves_list = leaves.filter(l => l.status === 'pending_manager' && teamIds.includes(String(l.employee_id)));
    pending_expenses_list = expenses.filter(e => e.status === 'pending_manager' && teamIds.includes(String(e.employee_id)));
  } 
  if (role === 'HR Admin' || role === 'Super Admin') {
    pending_leaves_list = pending_leaves_list.concat(leaves.filter(l => l.status === 'pending_hr' || l.status === 'pending'));
  }
  if (role === 'Finance' || role === 'Super Admin') {
    pending_expenses_list = pending_expenses_list.concat(expenses.filter(e => e.status === 'pending_finance' || e.status === 'pending'));
  }

  // Basic stats
  const stats = {
    total_employees: employees.filter(e => e.account_status !== 'inactive').length,
    today_present: todayAttendance.length,
    wfh_count: wfhCount,
    pending_leaves: pending_leaves_list.length,
    pending_expenses: pending_expenses_list.length,
    pending_leaves_list,
    pending_expenses_list,
    latest_announcements: announcements,
    recent_notifications: notifications
  };
  
  // Cache for only 5 seconds to ensure near real-time sync while still protecting the sheet from extreme spam
  cache.put(cacheKey, JSON.stringify(stats), 5);
  return stats;
}

function handlePostAnnouncement(params) {
  const { title, message, posted_by, type, priority } = params;
  const announcement = {
    id: Utilities.getUuid(),
    title,
    message,
    posted_by,
    timestamp: new Date().toISOString(),
    type: type || 'HR',
    priority: priority || 'normal'
  };
  appendToSheet('announcements', announcement);
  cleanupOldAnnouncements();
  clearCache();
  return { success: true, announcement };
}

function cleanupOldAnnouncements() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('announcements');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0];
  const timestampIndex = headers.indexOf('timestamp');
  if (timestampIndex === -1) return;

  const now = new Date().getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  // We iterate backwards to safely delete rows
  for (let i = data.length - 1; i >= 1; i--) {
    const timestampStr = data[i][timestampIndex];
    if (!timestampStr) continue;

    const postDate = new Date(timestampStr).getTime();
    if (now - postDate > twoDaysMs) {
      sheet.deleteRow(i + 1);
    }
  }
}

function getAnnouncements() {
  cleanupOldAnnouncements();
  return getSheetData('announcements').reverse();
}

function getLeaveRequests(params) {
  const { employee_id } = params;
  const data = getSheetData('leave_requests');
  if (employee_id) {
    return data.filter(r => r.employee_id == employee_id).reverse();
  }
  return data.reverse();
}

function getNotifications(params) {
  const { employee_id } = params;
  return getSheetData('notifications').filter(n => n.employee_id == employee_id).reverse();
}

function getExpenses(params) {
  const { employee_id } = params;
  const data = getSheetData('expenses');
  if (employee_id) {
    return data.filter(r => r.employee_id == employee_id).reverse();
  }
  return data.reverse();
}

function handleMarkNotificationRead(params) {
  const { id } = params;
  updateRowInSheet('notifications', 'id', id, { read: true });
  return { success: true };
}

function createNotification(employee_id, title, message, type, target_path) {
  const notification = {
    id: Utilities.getUuid(),
    employee_id,
    employee_name: getEmployeeName(employee_id),
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    type,
    target_path
  };
  appendToSheet('notifications', notification);
}

function getEmployeeName(employee_id) {
  const employees = getSheetData('employees');
  const emp = employees.find(e => e.employee_id == employee_id);
  return emp ? emp.name : 'Unknown';
}
