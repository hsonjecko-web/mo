/* ===========================================
   billing.js - صفحة الفوترة الشهرية
   ===========================================
   - تحديد سعر الامبير لكل شهر
   - عرض فواتير جميع المشتركين
   - تسديد / الغاء تسديد
   - تصفية حسب الحالة والبورد
   =========================================== */

GM.registerView('billing', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><i class="fas fa-file-invoice-dollar"></i> الفوترة الشهرية</h2>
          <div class="subtitle">ادارة فواتير المشتركين لكل شهر</div>
        </div>
        <div class="page-actions">
          <button v-if="can('billing_manage') && unpaidItems.length > 0" class="btn btn-success" @click="markAllPaid">
            <i class="fas fa-check-double"></i> تحديد الكل مدفوع
          </button>
        </div>
      </div>

      <!-- تحكمات الفلترة والشهر -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="form-group" style="min-width:120px">
            <div class="form-label">الشهر</div>
            <div class="select-wrap">
              <select v-model.number="month" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">السنة</div>
            <div class="select-wrap">
              <select v-model.number="year" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:140px">
            <div class="form-label">سعر الامبير (د.ع)</div>
            <div style="display:flex;gap:4px">
              <input type="number" v-model.number="pricePerAmp" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem;flex:1" placeholder="سعر الامبير">
              <button v-if="can('billing_set_price')" class="btn btn-primary btn-sm" @click="savePrice" style="padding:.35rem .5rem;font-size:.75rem" :title="priceSaved ? 'تم الحفظ' : 'حفظ'">
                <i :class="priceSaved ? 'fas fa-check' : 'fas fa-save'"></i>
              </button>
            </div>
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">الحالة</div>
            <div class="select-wrap">
              <select v-model="filterPaid" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option value="paid">مدفوع</option>
                <option value="unpaid">غير مدفوع</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">البورد</div>
            <div class="select-wrap">
              <select v-model="filterBoard" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">كل البوردات</option>
                <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- جدول الفواتير -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="card-header" style="padding:.85rem 1rem;margin:0">
          <h3><i class="fas fa-calculator"></i> فاتورة شهر {{ monthName(month) }} {{ year }}</h3>
          <div style="display:flex;align-items:center;gap:.75rem;font-size:.78rem;flex-wrap:wrap">
            <span style="color:var(--success)"><i class="fas fa-check-circle"></i> المدفوع: {{ paidCount }}</span>
            <span style="color:var(--danger)"><i class="fas fa-times-circle"></i> غير المدفوع: {{ unpaidItems.length }}</span>
            <span style="color:var(--primary)"><i class="fas fa-money-bill"></i> الاجمالي: {{ formatMoney(totalAmount) }}</span>
            <span style="color:var(--success)"><i class="fas fa-hand-holding-usd"></i> المحصل: {{ formatMoney(collectedAmount) }}</span>
          </div>
        </div>
        <div class="table-wrap" style="border:none">
          <table v-if="billingList.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>البورد</th>
                <th>الامبيرات</th>
                <th>سعر الامبير</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th v-if="can('billing_manage')">الاجراء</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in billingList" :key="item.subscriberId" :style="item.paid ? 'opacity:.7' : ''">
                <td>{{ i + 1 }}</td>
                <td><strong :style="item.paid ? 'text-decoration:line-through;text-decoration-color:var(--success)' : ''">{{ item.name }}</strong></td>
                <td>{{ getBoardName(item.boardId) }}</td>
                <td><span class="amps-display"><i class="fas fa-bolt"></i> {{ item.amps }}</span></td>
                <td>{{ formatMoney(item.pricePerAmp) }}</td>
                <td><strong>{{ formatMoney(item.total) }}</strong></td>
                <td>
                  <span class="badge" :class="item.paid ? 'badge-success' : 'badge-danger'">
                    <i :class="item.paid ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    {{ item.paid ? 'مدفوع' : 'غير مدفوع' }}
                  </span>
                </td>
                <td v-if="can('billing_manage')">
                  <button v-if="!item.paid" class="btn btn-success btn-xs" @click="togglePay(item.subscriberId, true)" title="تسديد">
                    <i class="fas fa-check"></i> تسديد
                  </button>
                  <button v-else class="btn btn-warning btn-xs" @click="togglePay(item.subscriberId, false)" title="الغاء">
                    <i class="fas fa-undo"></i> الغاء
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="fas fa-file-invoice-dollar"></i>
            <p>لا يوجد مشتركين في النظام</p>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      pricePerAmp: null,
      filterPaid: '',
      filterBoard: '',
      priceSaved: false
    };
  },
  computed: {
    store() { return GM.store; },
    boards() { return this.store.boards; },
    yearList() {
      const y = [];
      const cy = new Date().getFullYear();
      for (let i = cy - 3; i <= cy + 2; i++) y.push(i);
      return y;
    },
    billingList() {
      return this.store.getBillingList(this.month, this.year, this.filterPaid, this.filterBoard);
    },
    paidCount() { return this.billingList.filter(i => i.paid).length; },
    unpaidItems() { return this.billingList.filter(i => !i.paid); },
    totalAmount() { return this.billingList.reduce((s, i) => s + i.total, 0); },
    collectedAmount() {
      return this.billingList.filter(i => i.paid).reduce((s, i) => s + i.total, 0);
    }
  },
  watch: {
    month() { this.loadPrice(); },
    year() { this.loadPrice(); }
  },
  mounted() {
    this.loadPrice();
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getBoardName(id) { return this.store.getBoardName(id); },
    loadPrice() {
      this.pricePerAmp = this.store.getPricePerAmp(this.month, this.year);
      this.priceSaved = true;
    },
    savePrice() {
      if (!this.pricePerAmp || this.pricePerAmp <= 0) {
        this.showToast('الرجاء ادخال سعر امبير صحيح', 'error');
        return;
      }
      this.store.setPricePerAmp(this.month, this.year, this.pricePerAmp);
      this.priceSaved = true;
      this.showToast('تم حفظ سعر الامبير', 'success');
    },
    togglePay(subscriberId, paid) {
      this.store.togglePayment(subscriberId, this.month, this.year, paid);
      const sub = this.store.subscribers.find(s => s.id === subscriberId);
      this.showToast(
        `تم ${paid ? 'تسديد' : 'الغاء تسديد'} فاتورة ${sub ? sub.name : ''}`,
        paid ? 'success' : 'warning'
      );
    },
    markAllPaid() {
      const count = this.unpaidItems.length;
      if (count === 0) return;
      for (const item of this.unpaidItems) {
        this.store.togglePayment(item.subscriberId, this.month, this.year, true);
      }
      this.showToast('تم تسديد ' + count + ' مشترك', 'success');
    },
    showToast(msg, type) {
      this.$emit('toast', msg, type);
    }
  }
});
