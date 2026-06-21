/* ===========================================
   footer.js - مكون الفوتر (Footer Component)
   ===========================================
   التصميم: مستوحى من The Sovereign Ledger
   - تصميم radio-input للتنقل السريع
   - أيقونات Material Icons
   =========================================== */

GM.registerComponent('app-footer', {
  template: `
    <footer class="app-footer">
      <div class="radio-input">
        <label class="label" :class="{active: activeView === 'dashboard'}" @click="nav('dashboard')">
          <span class="text">
            <span class="material-icons">home</span>
            <span>الرئيسية</span>
          </span>
        </label>
        <label class="label" :class="{active: activeView === 'subscribers'}" @click="nav('subscribers')">
          <span class="text">
            <span class="material-icons">reorder</span>
            <span>المشتركين</span>
          </span>
        </label>
        <label class="label" :class="{active: activeView === 'quickpay'}" @click="nav('quickpay')">
          <span class="text">
            <span class="material-icons">add</span>
            <span>دفع سريع</span>
          </span>
        </label>
        <label class="label" :class="{active: activeView === 'billing'}" @click="nav('billing')">
          <span class="text">
            <span class="material-icons">payments</span>
            <span>الفوترة</span>
          </span>
        </label>
        <label class="label" :class="{active: activeView === 'settings'}" @click="nav('settings')">
          <span class="text">
            <span class="material-icons">analytics</span>
            <span>الإعدادات</span>
          </span>
        </label>
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
