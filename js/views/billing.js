/* ===========================================
   billing.js - صفحة الفوترة الشهرية
   =========================================== */

GM.registerView('billing', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><span class="material-symbols-rounded">receipt_long</span> الفوترة الشهرية</h2>
          <div class="subtitle">ادارة فواتير المشتركين لكل شهر</div>
        </div>
        <div class="page-actions">
          <button v-if="can('billing_manage') && unpaidItems.length > 0" class="btn btn-success" @click="markAllPaid">
            <span class="material-symbols-rounded">done_all</span> تسديد الكل
          </button>
        </div>
      </div>

      <!-- تحكمات الفلترة والشهر -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="form-group" style="min-width:110px">
            <div class="form-label">الشهر</div>
            <div class="select-wrap">
              <select v-model.number="month" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:90px">
            <div class="form-label">السنة</div>
            <div class="select-wrap">
              <select v-model.number="year" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">السعر / أمبير</div>
            <div style="display:flex;gap:4px">
              <input type="number" v-model.number="pricePerAmp" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem;flex:1" placeholder="السعر">
              <button v-if="can('billing_set_price')" class="btn btn-primary btn-sm" @click="savePrice" style="padding:.35rem .5rem;font-size:.75rem" :title="priceSaved ? 'تم الحفظ' : 'حفظ'">
                <span class="material-symbols-rounded">{{ priceSaved ? 'check' : 'save' }}</span>
              </button>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">الحالة</div>
            <div class="select-wrap">
              <select v-model="filterPaid" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option value="paid">مدفوع</option>
                <option value="unpaid">غير مدفوع</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">البورد</div>
            <div class="select-wrap">
              <select v-model="filterBoard" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ملخص -->
      <div class="billing-summary">
        <span class="bs-item" style="color:var(--success)"><span class="material-symbols-rounded">check_circle</span> المدفوع: <strong>{{ paidCount }}</strong></span>
        <span class="bs-item" style="color:var(--danger)"><span class="material-symbols-rounded">cancel</span> غير المدفوع: <strong>{{ unpaidItems.length }}</strong></span>
        <span class="bs-item" style="color:var(--primary)"><span class="material-symbols-rounded">calculate</span> الاجمالي: <strong>{{ formatMoney(totalAmount) }}</strong></span>
        <span class="bs-item" style="color:var(--success)"><span class="material-symbols-rounded">volunteer_activism</span> المحصل: <strong>{{ formatMoney(collectedAmount) }}</strong></span>
      </div>

      <!-- قائمة الفواتير -->
      <div v-if="billingList.length > 0" class="sub-list">
        <div v-for="item in billingList" :key="item.subscriberId" class="sub-card" :style="item.paid ? {borderColor:'var(--success)',background:'var(--success-light)',opacity:.85} : {}">
          <div class="sub-bar" :style="{background: item.paid ? 'var(--success)' : 'var(--danger)'}"></div>
          <div class="sub-info">
            <div class="sub-name">
              {{ item.name }}
              <span v-if="item.paid" class="badge badge-success">مدفوع</span>
              <span v-else class="badge badge-danger">غير مدفوع</span>
            </div>
            <div class="sub-meta">
              <span class="amps-badge"><span class="material-symbols-rounded">bolt</span> {{ item.amps }} أمبير</span>
              <span><span class="material-symbols-rounded">layers</span> {{ getBoardName(item.boardId) }}</span>
              <span><span class="material-symbols-rounded">currency_exchange</span> {{ formatMoney(item.total) }}</span>
            </div>
          </div>
          <div class="sub-amps" v-if="can('billing_manage')">
            <button v-if="!item.paid" class="btn btn-success btn-xs" @click="togglePay(item.subscriberId, true)" title="تسديد"><span class="material-symbols-rounded">check</span></button>
            <button v-if="item.paid" class="btn btn-warning btn-xs" @click="togglePay(item.subscriberId, false)" title="الغاء"><span class="material-symbols-rounded">undo</span></button>
          </div>
        </div>
      </div>

      <div v-if="billingList.length === 0" class="card">
        <div class="empty-state">
          <span class="material-symbols-rounded">receipt_long</span>
          <p>لا يوجد مشتركين في النظام</p>
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
