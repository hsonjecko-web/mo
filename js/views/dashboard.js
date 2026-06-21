/* ===========================================
   dashboard.js - صفحة لوحة التحكم
   ===========================================
   تعرض:
   - كروت بتصميم The Sovereign Ledger
   - إحصائيات سريعة
   - اخر المشتركين
   =========================================== */

GM.registerView('dashboard', {
  template: `
    <div>
      <!-- عنوان الصفحة -->
      <div class="page-header">
        <div>
          <h2><span class="material-icons">chart_pie</span> لوحة التحكم</h2>
          <div class="subtitle">نظرة عامة على النظام</div>
        </div>
        <div class="page-actions">
          <button v-if="can('billing_view')" class="btn btn-primary" @click="nav('billing')">
            <span class="material-icons">payments</span> الفوترة
          </button>
          <button v-if="can('messages_view')" class="btn btn-ghost" @click="nav('messages')">
            <span class="material-icons">send</span> إرسال رسائل
          </button>
        </div>
      </div>

      <!-- الكروت الإحصائية -->
      <div class="stats-grid">
        <!-- كرت المبلغ المستحق -->
        <div class="stat-card card-1">
          <span class="material-icons icon">account_balance_wallet</span>
          <div>
            <div class="value">{{ formatMoney(expectedTotal) }} <span>د.ع</span></div>
            <div class="label">المبلغ المستحق ({{ monthName(m) }})</div>
          </div>
        </div>

        <!-- كرت المحصل الوارد -->
        <div class="stat-card card-2">
          <span class="material-icons icon">check_circle</span>
          <div>
            <div class="value">{{ formatMoney(collectedTotal) }} <span>د.ع</span></div>
            <div class="label">المحصل الوارد ({{ monthName(m) }})</div>
          </div>
        </div>

        <!-- كرت الديون المتراكمة -->
        <div class="stat-card card-3">
          <span class="material-icons icon">sync_alt</span>
          <div>
            <div class="value">{{ formatMoney(debtTotal) }} <span>د.ع</span></div>
            <div class="label">إجمالي الديون</div>
          </div>
        </div>

        <!-- كرت المتاخرين -->
        <div class="stat-card card-4">
          <span class="material-icons icon">group</span>
          <div>
            <div class="value">{{ unpaidCount }}</div>
            <div class="label">المتاخرين بالدفع</div>
          </div>
        </div>

        <!-- كرت اجمالي المشتركين -->
        <div class="stat-card card-5">
          <span class="material-icons icon">people</span>
          <div>
            <div class="value">{{ subscribersCount }}</div>
            <div class="label">إجمالي المشتركين</div>
          </div>
        </div>

        <!-- كرت مصروفات الشهر -->
        <div class="stat-card card-6 critical">
          <span class="material-icons icon">shopping_cart</span>
          <div>
            <div class="value">{{ formatMoney(monthlyExpenses) }} <span>د.ع</span></div>
            <div class="label">مصروفات ({{ monthName(m) }})</div>
          </div>
        </div>
      </div>

      <!-- الإحصائيات -->
      <div class="section-title">ملخص شهري</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.5rem">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-icons">bar_chart</span> نسب التحصيل</h3>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;padding:.25rem 0">
            <div style="flex:1;min-width:80px;text-align:center;padding:.5rem;background:var(--bg-page);border-radius:var(--radius-md)">
              <div style="font-size:.7rem;color:var(--text-muted)">المسددين</div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--success)">{{ paidCount }}</div>
            </div>
            <div style="flex:1;min-width:80px;text-align:center;padding:.5rem;background:var(--bg-page);border-radius:var(--radius-md)">
              <div style="font-size:.7rem;color:var(--text-muted)">المتاخرين</div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--danger)">{{ unpaidCount }}</div>
            </div>
            <div style="flex:1;min-width:80px;text-align:center;padding:.5rem;background:var(--bg-page);border-radius:var(--radius-md)">
              <div style="font-size:.7rem;color:var(--text-muted)">التحصيل</div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--accent-primary)">{{ collectionRate }}%</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3><span class="material-icons">schedule</span> اخر المشتركين</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:.35rem">
            <div v-if="recentSubs.length === 0" class="empty-state" style="padding:1rem">
              <p>لا يوجد مشتركين بعد</p>
            </div>
            <div v-for="s in recentSubs" :key="s.id" style="display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;border-radius:var(--radius-sm);transition:background var(--transition)" @mouseenter="$event.target.style.background='var(--bg-input)'" @mouseleave="$event.target.style.background='transparent'">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-light);color:var(--accent-primary);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0">{{ s.name.charAt(0) }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:.82rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ s.name }}</div>
                <div style="font-size:.7rem;color:var(--text-muted)">{{ getBoardName(s.boardId) }} - {{ s.amps }} امبير</div>
              </div>
              <span class="badge badge-info" style="font-size:.65rem">{{ s.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      m: now.getMonth() + 1,
      y: now.getFullYear()
    };
  },
  computed: {
    store() { return GM.store; },
    pricePerAmp() { return this.store.getPricePerAmp(this.m, this.y); },
    subscribersCount() { return this.store.subscribers.length; },
    expectedTotal() { return this.store.getExpectedTotal(this.m, this.y); },
    collectedTotal() { return this.store.getCollectedTotal(this.m, this.y); },
    debtTotal() { return this.store.getDebtTotal(); },
    unpaidCount() { return this.store.getUnpaidCount(this.m, this.y); },
    paidCount() { return this.store.getPaidCount(this.m, this.y); },
    collectionRate() {
      const total = this.expectedTotal;
      if (total === 0) return 0;
      return Math.round((this.collectedTotal / total) * 100);
    },
    recentSubs() {
      return [...this.store.subscribers].reverse().slice(0, 5);
    },
    monthlyExpenses() {
      return this.store.getExpensesTotal(this.m, this.y);
    },
    expensesCount() {
      return this.store.getExpensesByMonth(this.m, this.y).length;
    },
    netProfit() {
      return this.collectedTotal - this.monthlyExpenses;
    }
  },
  methods: {
    nav(v) { this.$emit('navigate', v); },
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getBoardName(id) { return this.store.getBoardName(id); }
  }
});
