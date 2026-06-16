/* ===========================================
   sidebar.js - مكون القائمة الجانبية (Sidebar)
   ===========================================
   المسؤولية: عرض القائمة الجانبية مع:
   - روابط التصفح حسب الصلاحيات
   - عرض عدد المتاخرين
   - دعم الوضع الليلي
   =========================================== */

GM.registerComponent('app-sidebar', {
  template: `
    <aside class="sidebar" :class="{open: open}" :style="(isDesktop && open) ? 'transform:translateX(0)' : ''">
      <!-- رأس السايدبار -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-badge"><span class="material-symbols-rounded">bolt</span></div>
          <span>إدارة المولدات</span>
        </div>
        <button class="sidebar-close sidebar-close-btn" @click="$emit('close')">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>

      <!-- روابط التصفح -->
      <nav class="sidebar-nav">
        <div class="sidebar-section">الرئيسية</div>
        <a v-if="can('dashboard')" class="nav-item" :class="{active: activeView === 'dashboard'}" href="#" @click.prevent="nav('dashboard')" style="animation:fadeIn .3s ease both;animation-delay:0s">
          <span class="material-symbols-rounded">monitoring</span>
          <span class="nav-text">لوحة التحكم</span>
        </a>

        <div class="sidebar-section">المشتركين</div>
        <a v-if="can('subscribers_view')" class="nav-item" :class="{active: activeView === 'subscribers'}" href="#" @click.prevent="nav('subscribers')" style="animation:fadeIn .3s ease both;animation-delay:.03s">
          <span class="material-symbols-rounded">group</span>
          <span class="nav-text">المشتركين</span>
        </a>
        <a v-if="can('billing_view')" class="nav-item" :class="{active: activeView === 'billing'}" href="#" @click.prevent="nav('billing')" style="animation:fadeIn .3s ease both;animation-delay:.06s">
          <span class="material-symbols-rounded">receipt_long</span>
          <span class="nav-text">الفوترة</span>
        </a>

        <div class="sidebar-section">الرسائل</div>
        <a v-if="can('messages_view')" class="nav-item" :class="{active: activeView === 'messages'}" href="#" @click.prevent="nav('messages')" style="animation:fadeIn .3s ease both;animation-delay:.09s">
          <span class="material-symbols-rounded">chat</span>
          <span class="nav-text">الرسائل والإرسال</span>
          <span class="nav-badge" v-if="lateCount > 0">{{ lateCount }}</span>
        </a>

        <div class="sidebar-section">المالية</div>
        <a v-if="can('expenses_view')" class="nav-item" :class="{active: activeView === 'expenses'}" href="#" @click.prevent="nav('expenses')" style="animation:fadeIn .3s ease both;animation-delay:.12s">
          <span class="material-symbols-rounded">payments</span>
          <span class="nav-text">المصروفات</span>
        </a>
        <a v-if="can('archive_view')" class="nav-item" :class="{active: activeView === 'archive'}" href="#" @click.prevent="nav('archive')" style="animation:fadeIn .3s ease both;animation-delay:.15s">
          <span class="material-symbols-rounded">archive</span>
          <span class="nav-text">الأرشيف الشهري</span>
        </a>

        <div class="sidebar-section">النظام</div>
        <a v-if="can('settings_view')" class="nav-item" :class="{active: activeView === 'settings'}" href="#" @click.prevent="nav('settings')" style="animation:fadeIn .3s ease both;animation-delay:.18s">
          <span class="material-symbols-rounded">settings</span>
          <span class="nav-text">الإعدادات</span>
        </a>
        <a v-if="can('users_view')" class="nav-item" :class="{active: activeView === 'users'}" href="#" @click.prevent="nav('users')" style="animation:fadeIn .3s ease both;animation-delay:.21s">
          <span class="material-symbols-rounded">security</span>
          <span class="nav-text">المستخدمين والصلاحيات</span>
        </a>
      </nav>

      <!-- فوتر السايدبار -->
      <div class="sidebar-footer">
        <span class="material-symbols-rounded">bolt</span> v2.0 | جميع الحقوق محفوظة
      </div>
    </aside>
  `,
  props: {
    open: { type: Boolean, default: false },
    activeView: { type: String, default: 'dashboard' },
    lateCount: { type: Number, default: 0 }
  },
  emits: ['navigate', 'close'],
  data() {
    return { isDesktop: window.innerWidth >= 992 };
  },
  mounted() {
    window.addEventListener('resize', this.checkWidth);
  },
  unmounted() {
    window.removeEventListener('resize', this.checkWidth);
  },
  methods: {
    nav(v) {
      this.$emit('navigate', v);
      if (!this.isDesktop) this.$emit('close');
    },
    can(perm) {
      return GM.auth && GM.auth.hasPermission(perm);
    },
    checkWidth() {
      this.isDesktop = window.innerWidth >= 992;
    }
  }
});
