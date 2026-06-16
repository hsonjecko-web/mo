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
            <i class="fas fa-chart-pie"></i>
            <span>الرئيسية</span>
          </button>
          <button v-if="can('subscribers_view')" class="footer-btn" :class="{active: activeView === 'subscribers'}" @click="nav('subscribers')">
            <i class="fas fa-users"></i>
            <span>المشتركين</span>
          </button>

          <button class="footer-btn" :class="{active: activeView === 'quickpay'}" @click="nav('quickpay')">
            <i class="fas fa-hand-holding-usd"></i>
            <span>دفع سريع</span>
          </button>
          <button v-if="can('expenses_view')" class="footer-btn" :class="{active: activeView === 'expenses'}" @click="nav('expenses')">
            <i class="fas fa-money-bill-wave"></i>
            <span>المصروفات</span>
          </button>
          <button v-if="can('settings_view')" class="footer-btn" :class="{active: activeView === 'settings'}" @click="nav('settings')">
            <i class="fas fa-cog"></i>
            <span>الإعدادات</span>
          </button>
        </div>
        <!-- حقوق النشر -->
        <div class="footer-copy">
          <i class="fas fa-bolt" style="color:var(--warning)"></i>
          نظام إدارة مشتركي المولدات v2.0
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
