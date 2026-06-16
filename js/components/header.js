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
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-title">
          <div class="logo-icon"><i class="fas fa-bolt"></i></div>
          <span>نظام إدارة المولدات</span>
        </div>
        <div class="header-center">
          <button class="btn btn-ghost btn-sm" @click="goTo('dashboard')">
            <i class="fas fa-chart-pie"></i>
            <span class="hide-mobile">الرئيسية</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="goTo('billing')">
            <i class="fas fa-file-invoice-dollar"></i>
            <span class="hide-mobile">الفوترة</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="goTo('messages')">
            <i class="fab fa-whatsapp"></i>
            <span class="hide-mobile">الرسائل</span>
          </button>
        </div>
      </div>
      <div class="header-end">
        <button class="theme-btn" @click="$emit('toggleTheme')" :title="theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'">
          <i :class="theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'"></i>
        </button>
        <div class="header-user" @click="menuOpen = !menuOpen" style="position:relative">
          <div class="avatar">{{ initials }}</div>
          <div class="hide-mobile">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
          <i class="fas fa-chevron-down" style="font-size:.55rem;color:var(--text-light);margin-right:.2rem"></i>
          <!-- User Dropdown Menu -->
          <div v-if="menuOpen" style="position:absolute;top:100%;left:0;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);min-width:170px;z-index:50;padding:.35rem;margin-top:.4rem;animation:scaleIn .15s ease">
            <div style="padding:.4rem .6rem;border-bottom:1px solid var(--border);margin-bottom:.25rem">
              <div style="font-weight:600;font-size:.8rem;color:var(--text)">{{ userName }}</div>
              <div style="font-size:.7rem;color:var(--text-light)">{{ userRole }}</div>
            </div>
            <button class="btn btn-ghost btn-block btn-sm" style="justify-content:flex-start;border-radius:var(--radius-xs)" @click="goTo('settings')">
              <i class="fas fa-cog"></i> الإعدادات
            </button>
            <button class="btn btn-ghost-danger btn-block btn-sm" style="justify-content:flex-start;border-radius:var(--radius-xs)" @click="doLogout">
              <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
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
