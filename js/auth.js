/* ===========================================
   auth.js - نظام المصادقة والصلاحيات
   ===========================================
   هذا الملف يحتوي على:
   - إدارة المستخدمين (Users)
   - نظام الصلاحيات (Permissions)
   - الأدوار (Roles)
   - تسجيل الدخول والخروج
   =========================================== */

const AUTH_KEY = 'gm_v2_auth';

// --- Permission Definitions ---
const ALL_PERMISSIONS = {
  // Dashboard
  'dashboard': 'لوحة التحكم',

  // Subscribers
  'subscribers_view': 'عرض المشتركين',
  'subscribers_add': 'إضافة مشترك',
  'subscribers_edit': 'تعديل مشترك',
  'subscribers_delete': 'حذف مشترك',

  // Billing
  'billing_view': 'عرض الفواتير',
  'billing_manage': 'إدارة الفواتير (تسديد/إلغاء)',
  'billing_set_price': 'تحديد سعر الامبير',

  // Messages
  'messages_view': 'عرض الرسائل',
  'messages_send': 'إرسال رسائل واتساب',
  'messages_templates': 'إدارة قوالب الرسائل',

  // Expenses
  'expenses_view': 'عرض المصروفات',
  'expenses_add': 'إضافة مصروف',
  'expenses_edit': 'تعديل مصروف',
  'expenses_delete': 'حذف مصروف',

  // Archive
  'archive_view': 'عرض الأرشيف',

  // Settings
  'settings_view': 'عرض الإعدادات',
  'settings_areas': 'إدارة المناطق',
  'settings_boards': 'إدارة البوردات',
  'settings_generators': 'إدارة المولدات',
  'settings_categories': 'إدارة أصناف المصروفات',
  'settings_general': 'الإعدادات العامة',

  // Users
  'users_view': 'عرض المستخدمين',
  'users_add': 'إضافة مستخدم',
  'users_edit': 'تعديل مستخدم',
  'users_delete': 'حذف مستخدم',

  // System
  'export_data': 'تصدير البيانات',
  'import_data': 'استيراد البيانات',
  'clear_data': 'مسح البيانات',
};

// --- Role Definitions ---
const ROLE_ADMIN = 'admin';
const ROLE_ACCOUNTANT = 'accountant';
const ROLE_OPERATOR = 'operator';
const ROLE_VIEWER = 'viewer';

const ROLE_DEFINITIONS = {
  [ROLE_ADMIN]: {
    name: 'مدير النظام',
    color: '#ef4444',
    permissions: Object.keys(ALL_PERMISSIONS)
  },
  [ROLE_ACCOUNTANT]: {
    name: 'محاسب',
    color: '#f59e0b',
    permissions: [
      'dashboard',
      'subscribers_view',
      'billing_view', 'billing_manage', 'billing_set_price',
      'messages_view', 'messages_send',
      'expenses_view', 'expenses_add', 'expenses_edit',
      'archive_view',
      'settings_view',
      'export_data'
    ]
  },
  [ROLE_OPERATOR]: {
    name: 'مشغل',
    color: '#06b6d4',
    permissions: [
      'dashboard',
      'subscribers_view', 'subscribers_add', 'subscribers_edit',
      'billing_view', 'billing_manage',
      'messages_view', 'messages_send',
      'expenses_view', 'expenses_add',
      'archive_view',
      'settings_view'
    ]
  },
  [ROLE_VIEWER]: {
    name: 'مشاهد',
    color: '#64748b',
    permissions: [
      'dashboard',
      'subscribers_view',
      'billing_view',
      'messages_view',
      'expenses_view',
      'archive_view',
      'settings_view'
    ]
  }
};

// --- Default Admin User ---
const DEFAULT_USERS = [
  {
    id: 'admin_001',
    username: 'admin',
    password: 'admin123',
    name: 'مدير النظام',
    role: ROLE_ADMIN,
    customPermissions: null,
    active: true,
    createdAt: '2024-01-01'
  }
];

// ===========================================
// Auth System
// ===========================================

GM.auth = {
  // --- State ---
  currentUser: null,
  users: [],

  // --- Initialize ---
  init() {
    // Load users
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        this.users = JSON.parse(raw);
      } else {
        this.users = DEFAULT_USERS.map(u => ({ ...u }));
        this._saveUsers();
      }
    } catch (e) {
      this.users = DEFAULT_USERS.map(u => ({ ...u }));
      this._saveUsers();
    }

    // Check for stored session
    const session = sessionStorage.getItem('gm_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        this.currentUser = data;
      } catch (e) {
        this.currentUser = null;
      }
    }
  },

  _saveUsers() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.users));
  },

  // --- Login ---
  login(username, password) {
    const user = this.users.find(u =>
      u.username === username && u.password === password && u.active
    );
    if (!user) return null;

    this.currentUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      customPermissions: user.customPermissions
    };

    sessionStorage.setItem('gm_session', JSON.stringify(this.currentUser));
    return this.currentUser;
  },

  // --- Logout ---
  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('gm_session');
  },

  // --- Check if logged in ---
  isLoggedIn() {
    return this.currentUser !== null;
  },

  // --- Get current user ---
  getCurrentUser() {
    return this.currentUser;
  },

  // --- Permission Check ---
  hasPermission(permission) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role;
    const roleDef = ROLE_DEFINITIONS[role];
    if (!roleDef) return false;

    // Admin has all permissions
    if (role === ROLE_ADMIN) return true;

    // Check custom permissions
    if (this.currentUser.customPermissions) {
      return this.currentUser.customPermissions.includes(permission);
    }

    // Check role permissions
    return roleDef.permissions.includes(permission);
  },

  // --- Check multiple permissions (OR) ---
  hasAnyPermission(permissions) {
    return permissions.some(p => this.hasPermission(p));
  },

  // --- Check multiple permissions (AND) ---
  hasAllPermissions(permissions) {
    return permissions.every(p => this.hasPermission(p));
  },

  // --- User Management ---
  addUser(data) {
    if (this.users.find(u => u.username === data.username)) {
      return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
    }
    this.users.push({
      id: GM.helpers.genId(),
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role,
      customPermissions: data.customPermissions || null,
      active: true,
      createdAt: GM.helpers.today()
    });
    this._saveUsers();
    return { success: true };
  },

  updateUser(id, data) {
    const user = this.users.find(u => u.id === id);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    if (data.username && data.username !== user.username) {
      if (this.users.find(u => u.username === data.username && u.id !== id)) {
        return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
      }
    }

    if (data.username) user.username = data.username;
    if (data.password) user.password = data.password;
    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role;
    if (data.customPermissions !== undefined) user.customPermissions = data.customPermissions;
    if (data.active !== undefined) user.active = data.active;

    this._saveUsers();
    return { success: true };
  },

  deleteUser(id) {
    const adminCount = this.users.filter(u => u.role === ROLE_ADMIN).length;
    const user = this.users.find(u => u.id === id);
    if (user && user.role === ROLE_ADMIN && adminCount <= 1) {
      return { success: false, error: 'لا يمكن حذف آخر مدير في النظام' };
    }
    this.users = this.users.filter(u => u.id !== id);
    this._saveUsers();
    return { success: true };
  },

  getUsers() {
    return this.users;
  },

  getUser(id) {
    return this.users.find(u => u.id === id);
  },

  // --- Change Password ---
  changePassword(userId, oldPassword, newPassword) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };
    if (user.password !== oldPassword) return { success: false, error: 'كلمة المرور القديمة غير صحيحة' };
    user.password = newPassword;
    this._saveUsers();
    return { success: true };
  }
};

// --- Expose role definitions globally ---
GM.ROLE_DEFINITIONS = ROLE_DEFINITIONS;
GM.ALL_PERMISSIONS = ALL_PERMISSIONS;
GM.ROLES = { ROLE_ADMIN, ROLE_ACCOUNTANT, ROLE_OPERATOR, ROLE_VIEWER };
