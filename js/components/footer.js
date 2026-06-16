/* ===========================================
   footer.js - مكون الفوتر (Footer Component)
   ===========================================
   المسؤولية: عرض الفوتر السفلي مع:
   - أزرار تصفح سريعة
   - معلومات حقوق النشر
   - أيقونات ملونة
   =========================================== */

GM.registerComponent('app-footer', {
  template: `
    <footer class="app-footer">
      <div class="footer-inner">
        <!-- أزرار التصفح السريع -->
        <div class="footer-nav">
          <button v-if="can('dashboard')" class="footer-btn" :class="{active: activeView === 'dashboard'}" @click="nav('dashboard')">
            <span class="material-symbols-rounded">monitoring</span>
            <span>الرئيسية</span>
          </button>
          <button v-if="can('subscribers_view')" class="footer-btn" :class="{active: activeView === 'subscribers'}" @click="nav('subscribers')">
            <span class="material-symbols-rounded">group</span>
            <span>المشتركين</span>
          </button>
          <button class="footer-btn" :class="{active: activeView === 'quickpay'}" @click="nav('quickpay')">
            <span class="material-symbols-rounded">volunteer_activism</span>
            <span>دفع سريع</span>
          </button>
          <button v-if="can('expenses_view')" class="footer-btn" :class="{active: activeView === 'expenses'}" @click="nav('expenses')">
            <span class="material-symbols-rounded">payments</span>
            <span>المصروفات</span>
          </button>
          <button v-if="can('settings_view')" class="footer-btn" :class="{active: activeView === 'settings'}" @click="nav('settings')">
            <span class="material-symbols-rounded">settings</span>
            <span>الإعدادات</span>
          </button>
        </div>
      </div>
    </footer>
  `,
  props: {
    activeView: { type: String, default: 'dashboard' }
  },
  emits: ['navigate'],
  methods: {
    nav(v) { this.$emit('navigate', v); },
    can(perm) { return GM.auth && GM.auth.hasPermission(perm); }
  }
});
