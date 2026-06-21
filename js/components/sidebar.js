/* ===========================================
   sidebar.js - مكون القائمة الجانبية (Sidebar)
   ===========================================
   التصميم: مستوحى من The Sovereign Ledger
   - شريط جانبي أنيق مع أيقونات Material
   - روابط تصفح حسب الصلاحيات
   - عرض عدد المتاخرين
   =========================================== */

GM.registerComponent('app-sidebar', {
  template: `
    <aside class="sidebar" :class="{active: open}">
      <!-- رأس السايدبار -->
      <div class="sidebar-header">
        <h2>القائمة</h2>
        <button class="sidebar-close" @click="$emit('close')">✕</button>
      </div>

      <!-- روابط التصفح -->
      <nav class="sidebar-nav">
        <a v-if="can('dashboard')" class="sidebar-item" :class="{active: activeView === 'dashboard'}" @click.prevent="nav('dashboard')">
          <span class="material-icons">dashboard</span>لوحة التحكم
        </a>
        <a v-if="can('subscribers_view')" class="sidebar-item" :class="{active: activeView === 'subscribers'}" @click.prevent="nav('subscribers')">
          <span class="material-icons">group</span>المشتركين
        </a>
        <a v-if="can('billing_view')" class="sidebar-item" :class="{active: activeView === 'billing'}" @click.prevent="nav('billing')">
          <span class="material-icons">payments</span>الفوترة
        </a>
        <a v-if="can('messages_view')" class="sidebar-item" :class="{active: activeView === 'messages'}" @click.prevent="nav('messages')">
          <span class="material-icons">send</span>الرسائل والإرسال
          <span v-if="lateCount > 0" style="background:var(--danger);color:#fff;font-size:11px;padding:1px 7px;border-radius:var(--radius-full);margin-right:auto">{{ lateCount }}</span>
        </a>
        <a v-if="can('expenses_view')" class="sidebar-item" :class="{active: activeView === 'expenses'}" @click.prevent="nav('expenses')">
          <span class="material-icons">receipt_long</span>المصروفات
        </a>
        <a v-if="can('archive_view')" class="sidebar-item" :class="{active: activeView === 'archive'}" @click.prevent="nav('archive')">
          <span class="material-icons">archive</span>الأرشيف الشهري
        </a>

        <div class="sidebar-divider"></div>

        <a v-if="can('settings_view')" class="sidebar-item" :class="{active: activeView === 'settings'}" @click.prevent="nav('settings')">
          <span class="material-icons">settings</span>الإعدادات
        </a>
        <a v-if="can('users_view')" class="sidebar-item" :class="{active: activeView === 'users'}" @click.prevent="nav('users')">
          <span class="material-icons">security</span>المستخدمين والصلاحيات
        </a>
        <a class="sidebar-item logout" @click.prevent="$emit('logout')">
          <span class="material-icons">logout</span>تسجيل الخروج
        </a>
      </nav>
    </aside>
  `,
  props: {
    open: { type: Boolean, default: false },
    activeView: { type: String, default: 'dashboard' },
    lateCount: { type: Number, default: 0 }
  },
  emits: ['navigate', 'close', 'logout'],
  methods: {
    nav(v) {
      this.$emit('navigate', v);
      this.$emit('close');
    },
    can(perm) {
      return GM.auth && GM.auth.hasPermission(perm);
    }
  }
});
