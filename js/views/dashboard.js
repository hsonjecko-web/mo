/* ===========================================
   dashboard.js - صفحة لوحة التحكم
   ===========================================
   تعرض:
   - كروت ملونة متدرجة: المبلغ المستحق | المحصل الوارد | الديون | المتاخرين
   - إحصائيات سريعة
   - اخر المشتركين
   =========================================== */

GM.registerView('dashboard', {
  template: `
    <div>
      <!-- عنوان الصفحة -->
      <div class="page-header">
        <div>
          <h2><i class="fas fa-chart-pie"></i> لوحة التحكم</h2>
          <div class="subtitle">نظرة عامة على النظام</div>
        </div>
        <div class="page-actions">
          <button v-if="can('billing_view')" class="btn btn-primary" @click="nav('billing')">
            <i class="fas fa-file-invoice-dollar"></i> الفوترة
          </button>
          <button v-if="can('messages_view')" class="btn btn-whatsapp" @click="nav('messages')">
            <i class="fab fa-whatsapp"></i> إرسال رسائل
          </button>
        </div>
      </div>

      <!-- الكروت الملونة - الإحصائيات المالية -->
      <div class="stats-grid">
        <!-- كرت المبلغ المستحق -->
        <div class="stat-card gradient-blue animate-fade" style="animation-delay:0s">
          <i class="fas fa-file-invoice-dollar stat-icon"></i>
          <div class="stat-label">المبلغ المستحق ({{ monthName(m) }})</div>
          <div class="stat-value">{{ formatMoney(expectedTotal) }}</div>
          <div class="stat-sub">اجمالي الفواتير لهذا الشهر</div>
          <div class="stat-trend"><i class="fas fa-calculator"></i> سعر الامبير {{ formatMoney(pricePerAmp) }}</div>
        </div>

        <!-- كرت المحصل الوارد -->
        <div class="stat-card gradient-green animate-fade" style="animation-delay:.05s">
          <i class="fas fa-hand-holding-usd stat-icon"></i>
          <div class="stat-label">المحصل الوارد ({{ monthName(m) }})</div>
          <div class="stat-value">{{ formatMoney(collectedTotal) }}</div>
          <div class="stat-sub">من اصل {{ formatMoney(expectedTotal) }} د.ع</div>
          <div class="stat-trend"><i class="fas fa-percentage"></i> {{ collectionRate }}%</div>
        </div>

        <!-- كرت الديون المتراكمة -->
        <div class="stat-card gradient-red animate-fade" style="animation-delay:.1s">
          <i class="fas fa-exclamation-triangle stat-icon"></i>
          <div class="stat-label">إجمالي الديون</div>
          <div class="stat-value">{{ formatMoney(debtTotal) }}</div>
          <div class="stat-sub">عبر جميع الأشهر</div>
          <div class="stat-trend"><i class="fas fa-clock"></i> {{ unpaidCount }} مشترك متاخر</div>
        </div>

        <!-- كرت المتاخرين -->
        <div class="stat-card gradient-amber animate-fade" style="animation-delay:.15s">
          <i class="fas fa-user-clock stat-icon"></i>
          <div class="stat-label">المتاخرين بالدفع</div>
          <div class="stat-value">{{ unpaidCount }}</div>
          <div class="stat-sub">من اصل {{ subscribersCount }} مشترك</div>
          <div class="stat-trend"><i class="fas fa-arrow-down"></i> {{ paidCount }} مسدد</div>
        </div>

        <!-- كرت اجمالي المشتركين -->
        <div class="stat-card gradient-purple animate-fade" style="animation-delay:.2s">
          <i class="fas fa-users stat-icon"></i>
          <div class="stat-label">إجمالي المشتركين</div>
          <div class="stat-value">{{ subscribersCount }}</div>
          <div class="stat-sub">{{ areasCount }} منطقة | {{ boardsCount }} بورد | {{ generatorsCount }} مولد</div>
        </div>

        <!-- كرت مصروفات الشهر -->
        <div class="stat-card gradient-rose animate-fade" style="animation-delay:.25s">
          <i class="fas fa-shopping-cart stat-icon"></i>
          <div class="stat-label">مصروفات ({{ monthName(m) }})</div>
          <div class="stat-value">{{ formatMoney(monthlyExpenses) }}</div>
          <div class="stat-sub">{{ expensesCount }} عملية صرف</div>
          <div class="stat-trend"><i class="fas fa-balance-scale"></i> صافي {{ formatMoney(netProfit) }}</div>
        </div>
      </div>

      <!-- الإحصائيات -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.5rem">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-chart-bar"></i> الملخص الشهري</h3>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;padding:.25rem 0">
            <div style="flex:1;min-width:100px;text-align:center;padding:.5rem;background:var(--bg);border-radius:var(--radius-sm)">
              <div style="font-size:.7rem;color:var(--text-light)">عدد المسددين</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--success)">{{ paidCount }}</div>
            </div>
            <div style="flex:1;min-width:100px;text-align:center;padding:.5rem;background:var(--bg);border-radius:var(--radius-sm)">
              <div style="font-size:.7rem;color:var(--text-light)">عدد المتاخرين</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--danger)">{{ unpaidCount }}</div>
            </div>
            <div style="flex:1;min-width:100px;text-align:center;padding:.5rem;background:var(--bg);border-radius:var(--radius-sm)">
              <div style="font-size:.7rem;color:var(--text-light)">نسبة التحصيل</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--primary)">{{ collectionRate }}%</div>
            </div>
            <div style="flex:1;min-width:100px;text-align:center;padding:.5rem;background:var(--bg);border-radius:var(--radius-sm)">
              <div style="font-size:.7rem;color:var(--text-light)">متوسط الامبيرات</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--info)">{{ avgAmps }}</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-clock"></i> اخر المشتركين</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:.35rem">
            <div v-if="recentSubs.length === 0" class="empty-state" style="padding:1rem">
              <p>لا يوجد مشتركين بعد</p>
            </div>
            <div v-for="s in recentSubs" :key="s.id" style="display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;border-radius:var(--radius-xs);transition:background var(--transition)" @mouseenter="$event.target.style.background='var(--border)'" @mouseleave="$event.target.style.background='transparent'">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0">{{ s.name.charAt(0) }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:.82rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ s.name }}</div>
                <div style="font-size:.7rem;color:var(--text-light)">{{ getBoardName(s.boardId) }} - {{ s.amps }} امبير</div>
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
    areasCount() { return this.store.areas.length; },
    boardsCount() { return this.store.boards.length; },
    generatorsCount() { return this.store.generators.length; },
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
    avgAmps() {
      const subs = this.store.subscribers;
      if (subs.length === 0) return 0;
      const total = subs.reduce((s, x) => s + (x.amps || 0), 0);
      return (total / subs.length).toFixed(1);
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
