/* ===========================================
   archive.js - صفحة الأرشيف الشهري
   ===========================================
   - عرض سجل الأشهر السابقة
   - لكل شهر: المبلغ المستحق / المحصل / الديون / المصروفات
   - إمكانية فتح تقرير مفصل لكل شهر
   =========================================== */

GM.registerView('archive', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><i class="fas fa-archive"></i> الأرشيف الشهري</h2>
          <div class="subtitle">سجل جميع الأشهر السابقة مع المبالغ المالية</div>
        </div>
      </div>

      <!-- بطاقات الأرشيف -->
      <div v-if="archiveMonths.length > 0" class="archive-grid">
        <div v-for="(arc, i) in archiveMonths" :key="arc.key" class="archive-card animate-fade" :style="{animationDelay: (i * 0.03) + 's'}" @click="selectedArchive = selectedArchive === arc.key ? null : arc.key">
          <div class="archive-month">{{ monthName(arc.month) }}</div>
          <div class="archive-year">{{ arc.year }}</div>
          <div class="archive-total">{{ formatMoney(arc.total) }}</div>
          <div class="archive-counts">
            <span style="color:var(--success)"><i class="fas fa-check-circle"></i> {{ arc.paidCount }}</span>
            <span style="color:var(--danger)"><i class="fas fa-times-circle"></i> {{ arc.unpaidCount }}</span>
            <span style="color:var(--rose)"><i class="fas fa-shopping-cart"></i> {{ formatMoney(arc.expenses) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="card">
        <div class="empty-state">
          <i class="fas fa-archive"></i>
          <p>لا توجد بيانات شهرية بعد</p>
          <p class="sub-text">قم بتحديد سعر الامبير لأي شهر لبدء تسجيل البيانات</p>
        </div>
      </div>

      <!-- التقرير المفصل -->
      <div v-if="selectedArchive" class="card" style="margin-top:1rem">
        <div class="card-header">
          <h3><i class="fas fa-chart-bar"></i> تقرير شهر {{ monthName(selectedMonth) }} {{ selectedYear }}</h3>
          <button class="btn btn-ghost btn-sm" @click="selectedArchive = null"><i class="fas fa-times"></i> اغلاق</button>
        </div>

        <div class="stats-grid" style="margin-bottom:1rem">
          <div class="stat-card gradient-blue">
            <i class="fas fa-file-invoice-dollar stat-icon"></i>
            <div class="stat-label">المبلغ المستحق</div>
            <div class="stat-value">{{ formatMoney(selectedTotal) }}</div>
            <div class="stat-sub">سعر الامبير {{ formatMoney(selectedPrice) }}</div>
          </div>
          <div class="stat-card gradient-green">
            <i class="fas fa-hand-holding-usd stat-icon"></i>
            <div class="stat-label">المحصل</div>
            <div class="stat-value">{{ formatMoney(selectedCollected) }}</div>
            <div class="stat-sub">{{ selectedPaidCount }} مشترك</div>
          </div>
          <div class="stat-card gradient-red">
            <i class="fas fa-exclamation-circle stat-icon"></i>
            <div class="stat-label">الديون</div>
            <div class="stat-value">{{ formatMoney(selectedDebt) }}</div>
            <div class="stat-sub">{{ selectedUnpaidCount }} مشترك</div>
          </div>
          <div class="stat-card gradient-rose">
            <i class="fas fa-shopping-cart stat-icon"></i>
            <div class="stat-label">المصروفات</div>
            <div class="stat-value">{{ formatMoney(selectedExpenses) }}</div>
            <div class="stat-sub">{{ selectedExpensesCount }} عملية</div>
          </div>
        </div>

        <!-- قائمة المشتركين -->
        <div class="table-wrap" style="margin-top:.5rem">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>الامبيرات</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in selectedBillingList" :key="item.subscriberId">
                <td>{{ i + 1 }}</td>
                <td>{{ item.name }}</td>
                <td><span class="amps-display"><i class="fas fa-bolt"></i> {{ item.amps }}</span></td>
                <td>{{ formatMoney(item.total) }}</td>
                <td>
                  <span class="badge" :class="item.paid ? 'badge-success' : 'badge-danger'">
                    {{ item.paid ? 'مدفوع' : 'غير مدفوع' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ملخص مالي -->
        <div style="margin-top:1rem;padding:.75rem;background:var(--bg);border-radius:var(--radius-sm);display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem">
          <div>
            <div style="font-size:.7rem;color:var(--text-light)">صافي الربح</div>
            <div style="font-size:1.1rem;font-weight:800" :style="{color: netSelected >= 0 ? 'var(--success)' : 'var(--danger)'}">
              {{ formatMoney(netSelected) }}
            </div>
          </div>
          <div>
            <div style="font-size:.7rem;color:var(--text-light)">نسبة التحصيل</div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--primary)">{{ selectedRate }}%</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:var(--text-light)">عدد المشتركين</div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--text)">{{ selectedBillingList.length }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      selectedArchive: null
    };
  },
  computed: {
    store() { return GM.store; },
    // All unique month-year combinations from monthlySettings
    archiveMonths() {
      const keys = new Set();
      // From monthlySettings
      this.store.monthlySettings.forEach(s => keys.add(`${s.year}-${s.month}`));
      // Also from payments
      this.store.payments.forEach(p => keys.add(`${p.year}-${p.month}`));
      // Sort descending
      const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
      return sorted.map(key => {
        const [year, month] = key.split('-').map(Number);
        const total = this.store.getExpectedTotal(month, year);
        const collected = this.store.getCollectedTotal(month, year);
        const expenses = this.store.getExpensesTotal(month, year);
        return {
          key,
          month,
          year,
          total,
          collected,
          debt: total - collected,
          paidCount: this.store.getPaidCount(month, year),
          unpaidCount: this.store.getUnpaidCount(month, year),
          expenses
        };
      });
    },
    selectedMonth() {
      if (!this.selectedArchive) return 1;
      return Number(this.selectedArchive.split('-')[1]);
    },
    selectedYear() {
      if (!this.selectedArchive) return new Date().getFullYear();
      return Number(this.selectedArchive.split('-')[0]);
    },
    selectedPrice() {
      return this.store.getPricePerAmp(this.selectedMonth, this.selectedYear);
    },
    selectedTotal() {
      return this.store.getExpectedTotal(this.selectedMonth, this.selectedYear);
    },
    selectedCollected() {
      return this.store.getCollectedTotal(this.selectedMonth, this.selectedYear);
    },
    selectedDebt() {
      return this.selectedTotal - this.selectedCollected;
    },
    selectedPaidCount() {
      return this.store.getPaidCount(this.selectedMonth, this.selectedYear);
    },
    selectedUnpaidCount() {
      return this.store.getUnpaidCount(this.selectedMonth, this.selectedYear);
    },
    selectedExpenses() {
      return this.store.getExpensesTotal(this.selectedMonth, this.selectedYear);
    },
    selectedExpensesCount() {
      return this.store.getExpensesByMonth(this.selectedMonth, this.selectedYear).length;
    },
    selectedBillingList() {
      return this.store.getBillingList(this.selectedMonth, this.selectedYear, '', '');
    },
    netSelected() {
      return this.selectedCollected - this.selectedExpenses;
    },
    selectedRate() {
      if (this.selectedTotal === 0) return 0;
      return Math.round((this.selectedCollected / this.selectedTotal) * 100);
    }
  },
  methods: {
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); }
  }
});
