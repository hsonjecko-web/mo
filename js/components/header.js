/* ===========================================
   header.js - مكون الهدر (Header Component)
   ===========================================
   المسؤولية: عرض شريط العنوان العلوي مع:
   - زر القائمة الجانبية (للموبايل)
   - شعار التطبيق
   - روابط سريعة (سطح المكتب)
   - معلومات المستخدم
   - زر تبديل الوضع (ليلي/نهاري)
   =========================================== */

GM.registerComponent('app-header', {
  template: `
    <header class="header" :class="{dark: theme === 'dark'}">
      <div class="header-start">
        <button class="header-btn header-menu-btn" @click="$emit('toggleSidebar')" title="القائمة">
          <span class="material-symbols-rounded">menu</span>
        </button>
        <div class="header-title">
          <div class="logo-icon"><span class="material-symbols-rounded">bolt</span></div>
          <span class="header-title-text">نظام إدارة المولدات</span>
        </div>
        <div class="header-center">
          <button class="btn btn-ghost btn-sm" @click="goTo('dashboard')">
            <span class="material-symbols-rounded">monitoring</span>
            <span class="hide-mobile">الرئيسية</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="goTo('billing')">
            <span class="material-symbols-rounded">receipt_long</span>
            <span class="hide-mobile">الفوترة</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="goTo('messages')">
            <span class="material-symbols-rounded">chat</span>
            <span class="hide-mobile">الرسائل</span>
          </button>
        </div>
      </div>
      <div class="header-end">
        <button class="theme-btn" @click="$emit('toggleTheme')" :title="theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'">
          <span class="material-symbols-rounded">{{ theme === 'light' ? 'dark_mode' : 'light_mode' }}</span>
          <span class="theme-label hide-mobile">{{ theme === 'light' ? 'ليلي' : 'نهاري' }}</span>
        </button>
        <div class="header-user" @click="menuOpen = !menuOpen" style="position:relative">
          <div class="avatar">{{ initials }}</div>
          <div class="hide-mobile">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
          <span class="material-symbols-rounded" style="font-size:.55rem;color:var(--text-light);margin-right:.2rem">expand_more</span>
          <!-- User Dropdown Menu -->
          <div v-if="menuOpen" style="position:absolute;top:100%;left:0;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);min-width:170px;z-index:50;padding:.35rem;margin-top:.4rem;animation:scaleIn .15s ease">
            <div style="padding:.4rem .6rem;border-bottom:1px solid var(--border);margin-bottom:.25rem">
              <div style="font-weight:600;font-size:.8rem;color:var(--text)">{{ userName }}</div>
              <div style="font-size:.7rem;color:var(--text-light)">{{ userRole }}</div>
            </div>
            <button class="btn btn-ghost btn-block btn-sm" style="justify-content:flex-start;border-radius:var(--radius-xs)" @click="goTo('settings')">
              <span class="material-symbols-rounded">settings</span> الإعدادات
            </button>
            <button class="btn btn-ghost-danger btn-block btn-sm" style="justify-content:flex-start;border-radius:var(--radius-xs)" @click="doLogout">
              <span class="material-symbols-rounded">logout</span> تسجيل الخروج
            </button>
          </div>
        </div>
        <!-- Overlay to close dropdown on outside click -->
        <div v-if="menuOpen" @click="menuOpen = false" style="position:fixed;inset:0;z-index:-1"></div>
      </div>
    </header>
  `,
  props: {
    theme: { type: String, default: 'light' },
    user: { type: Object, default: null }
  },
  emits: ['toggleSidebar', 'toggleTheme', 'logout', 'navigate'],
  data() {
    return { menuOpen: false };
  },
  computed: {
    userName() {
      return this.user ? this.user.name : 'زائر';
    },
    userRole() {
      if (!this.user) return '';
      const def = GM.ROLE_DEFINITIONS[this.user.role];
      return def ? def.name : this.user.role;
    },
    initials() {
      if (!this.user || !this.user.name) return '?';
      return this.user.name.charAt(0);
    }
  },
  methods: {
    goTo(v) { this.menuOpen = false; this.$emit('navigate', v); },
    doLogout() { this.menuOpen = false; this.$emit('logout'); }
  }
});
