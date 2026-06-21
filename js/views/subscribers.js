/* ===========================================
   subscribers.js - صفحة إدارة المشتركين
   =========================================== */

GM.registerView('subscribers', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><i class="fas fa-users"></i> المشتركين</h2>
          <div class="subtitle">إدارة جميع المشتركين في النظام</div>
        </div>
        <div class="page-actions">
          <button v-if="can('subscribers_add')" class="btn btn-primary" @click="openAdd">
            <i class="fas fa-plus"></i> اضافة
          </button>
        </div>
      </div>

      <!-- فلترة وبحث -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="search-input" style="flex:1;min-width:160px">
            <i class="fas fa-search"></i>
            <input v-model="search" placeholder="بحث عن مشترك...">
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">البورد</div>
            <div class="select-wrap">
              <select v-model="filterBoard" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">المنطقة</div>
            <div class="select-wrap">
              <select v-model="filterArea" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">الحالة</div>
            <div class="select-wrap">
              <select v-model="filterStatus" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">الكل</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- قائمة المشتركين -->
      <div class="sub-list">
        <div
          v-for="s in filteredList"
          :key="s.id"
          class="sub-card"
          :style="subCardStyle(s)"
          @click="openDetail(s)"
        >
          <div class="sub-bar" :style="{background: subColor(s)}"></div>
          <div class="sub-info">
            <div class="sub-name">
              {{ s.name }}
              <span v-if="s.status === 'inactive'" class="badge badge-danger">ملغي</span>
            </div>
            <div class="sub-meta">
              <span class="amps-badge"><i class="fas fa-bolt"></i> {{ s.amps }} أمبير</span>
              <span><i class="fas fa-layer-group"></i> {{ getBoardName(s.boardId) }}</span>
            </div>
          </div>
          <div class="sub-amps">
            <div class="sub-pct" :style="{color: subColor(s)}" v-if="s.status !== 'inactive'">{{ subPayPercent(s) }}%</div>
            <i class="fas fa-chevron-left" style="color:var(--text-light);font-size:.7rem"></i>
          </div>
        </div>
        <div v-if="filteredList.length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <p>{{ subscribers.length === 0 ? 'لا يوجد مشتركين' : 'لا توجد نتائج' }}</p>
        </div>
      </div>

      <!-- ملخص -->
      <div v-if="filteredList.length > 0" class="sub-summary">
        <span>عدد المشتركين: <strong>{{ filteredList.length }}</strong></span>
        <span>مجموع الامبيرات: <strong>{{ totalAmps }}</strong></span>
      </div>

      <!-- ===== مودال تفاصيل المشترك ===== -->
      <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3><i class="fas fa-user"></i> {{ detailSub.name }}</h3>
            <button class="modal-close" @click="showDetail = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <!-- معلومات سريعة -->
            <div class="detail-grid">
              <div class="dg-item">
                <i class="fas fa-bolt" style="color:var(--warning)"></i>
                <span class="dg-label">الامبير</span>
                <span class="dg-value">{{ detailSub.amps }}</span>
              </div>
              <div class="dg-item" :class="{success: detailPaid, danger: !detailPaid && detailSub.status !== 'inactive'}">
                <i class="fas fa-check-circle"></i>
                <span class="dg-label">{{ currentMonthName }}</span>
                <span class="dg-value">{{ detailPaid ? 'مدفوع' : 'غير مدفوع' }}</span>
              </div>
              <div class="dg-item">
                <i class="fas fa-layer-group" style="color:var(--primary)"></i>
                <span class="dg-label">البورد</span>
                <span class="dg-value">{{ getBoardName(detailSub.boardId) }}</span>
              </div>
              <div class="dg-item">
                <i class="fas fa-map-marker-alt" style="color:var(--teal)"></i>
                <span class="dg-label">المنطقة</span>
                <span class="dg-value">{{ getAreaName(detailSub.areaId) }}</span>
              </div>
            </div>

            <!-- أزرار التحكم -->
            <div class="detail-actions">
              <button class="btn btn-lg btn-block" :class="detailPaid ? 'btn-ghost-danger' : 'btn-success'" @click="togglePay" :disabled="detailSub.status === 'inactive'">
                <i class="fas" :class="detailPaid ? 'fa-times' : 'fa-check'"></i>
                {{ detailPaid ? 'الغاء الدفع' : 'تسجيل الدفعة' }}
              </button>
              <button v-if="can('subscribers_edit')" class="btn btn-ghost-primary btn-lg btn-block" @click="editFromDetail">
                <i class="fas fa-edit"></i> تعديل بيانات المشترك
              </button>
            </div>

            <!-- إرسال رسالة واتساب -->
            <div class="detail-section">
              <div class="detail-section-title"><i class="fab fa-whatsapp"></i> إرسال رسالة</div>
              <button class="btn btn-whatsapp btn-lg btn-block" @click="goToMessages">
                <i class="fab fa-whatsapp"></i> ارسال عبر واتساب
              </button>
            </div>

            <!-- الأرشيف الشهري -->
            <div class="detail-section">
              <div class="detail-section-title"><i class="fas fa-archive"></i> الأرشيف الشهري</div>
              <div class="pay-history">
                <div v-for="year in payYears" :key="year" class="pay-year">
                  <div class="pay-year-title">{{ year }}</div>
                  <div class="pay-months">
                    <div
                      v-for="m in 12"
                      :key="year + '-' + m"
                      class="pay-month"
                      :class="{paid: isMonthPaid(m, year), current: isCurrentMonth(m, year)}"
                      @click="toggleMonthPay(m, year)"
                    >
                      <div class="pm-status"><i class="fas" :class="isMonthPaid(m, year) ? 'fa-check-circle' : 'fa-circle'"></i></div>
                      <div class="pm-name">{{ getMonthOrdinal(m, year) }}</div>
                      <div class="pm-amount">{{ getMonthAmount(m, year) }}</div>
                      <div class="pm-date" v-if="getMonthPaidAt(m, year)">{{ getMonthPaidAt(m, year) }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="payYears.length === 0" style="font-size:.8rem;color:var(--text-light);padding:.5rem 0">لا توجد دفعات سابقة</div>
              </div>
            </div>

            <!-- حذف -->
            <div v-if="can('subscribers_delete')" style="margin-top:.75rem;text-align:center">
              <button class="btn btn-ghost-danger btn-sm" @click="confirmDelete(detailSub)">
                <i class="fas fa-trash"></i> حذف المشترك
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- مودال اضافة/تعديل مشترك -->
      <div class="modal-overlay" v-if="showForm" @click.self="closeForm">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3><i :class="formMode === 'add' ? 'fas fa-plus-circle' : 'fas fa-edit'"></i> {{ formMode === 'add' ? 'اضافة' : 'تعديل' }} مشترك</h3>
            <button class="modal-close" @click="closeForm"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">الاسم <span style="color:var(--danger)">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="الاسم الكامل" ref="firstInput">
              </div>
              <div class="form-group">
                <label class="form-label">الهاتف <span style="color:var(--danger)">*</span></label>
                <input v-model="form.phone" class="form-input" placeholder="077xxxxxxxx" dir="ltr">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">البورد <span style="color:var(--danger)">*</span></label>
                <div class="select-wrap">
                  <select v-model="form.boardId" class="form-input">
                    <option value="">اختر البورد</option>
                    <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }} ({{ getAreaName(b.areaId) }})</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">المولد</label>
                <div class="select-wrap">
                  <select v-model="form.generatorId" class="form-input">
                    <option value="">اختر المولد</option>
                    <option v-for="g in generators" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">الامبيرات <span style="color:var(--danger)">*</span></label>
                <input type="number" v-model.number="form.amps" class="form-input" placeholder="مثال: 5" min="1" max="100">
              </div>
              <div class="form-group">
                <label class="form-label">رقم الجوزة</label>
                <input v-model="form.connectionNumber" class="form-input" placeholder="رقم الجوزة">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">العنوان</label>
              <input v-model="form.address" class="form-input" placeholder="العنوان (اختياري)">
            </div>
            <div class="form-group" v-if="formMode === 'edit'">
              <label class="form-label">الحالة</label>
              <div class="select-wrap">
                <select v-model="form.status" class="form-input">
                  <option value="active">نشط</option>
                  <option value="inactive">ملغي</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveItem"><i class="fas fa-save"></i> {{ formMode === 'add' ? 'اضافة' : 'حفظ' }}</button>
            <button class="btn btn-ghost" @click="closeForm">الغاء</button>
          </div>
        </div>
      </div>

      <!-- مودال تاكيد الحذف -->
      <div class="modal-overlay" v-if="showConfirm" @click.self="showConfirm = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> تاكيد الحذف</h3>
          </div>
          <div class="modal-body">
            <p>هل انت متاكد من حذف <strong>{{ deletingItem ? deletingItem.name : '' }}</strong>؟</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" @click="doDelete"><i class="fas fa-trash"></i> حذف</button>
            <button class="btn btn-ghost" @click="showConfirm = false">الغاء</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      search: '',
      filterBoard: '',
      filterArea: '',
      filterStatus: '',
      // Detail modal
      showDetail: false,
      detailSub: null,
      // Form modal
      showForm: false,
      formMode: 'add',
      editId: null,
      form: { name: '', phone: '', address: '', boardId: '', generatorId: '', amps: 5, connectionNumber: '', status: 'active' },
      // Confirm delete
      showConfirm: false,
      deletingItem: null
    };
  },
  computed: {
    store() { return GM.store; },
    subscribers() { return this.store.subscribers; },
    areas() { return this.store.areas; },
    boards() { return this.store.boards; },
    generators() { return this.store.generators; },
    templates() { return this.store.messageTemplates; },
    now() { return new Date(); },
    currentMonth() { return this.now.getMonth() + 1; },
    currentYear() { return this.now.getFullYear(); },
    currentMonthName() { return GM.helpers.monthName(this.currentMonth); },
    monthOrdinals() { return ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر']; },
    filteredList() {
      let list = [...this.subscribers];
      if (this.search) {
        const q = this.search.trim().toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q)));
      }
      if (this.filterBoard) list = list.filter(s => s.boardId === this.filterBoard);
      if (this.filterArea) {
        const bIds = this.boards.filter(b => b.areaId === this.filterArea).map(b => b.id);
        list = list.filter(s => bIds.includes(s.boardId));
      }
      if (this.filterStatus === 'active') list = list.filter(s => s.status !== 'inactive');
      else if (this.filterStatus === 'inactive') list = list.filter(s => s.status === 'inactive');
      list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      return list;
    },
    totalAmps() { return this.filteredList.reduce((s, x) => s + (x.amps || 0), 0); },
    detailPaid() {
      if (!this.detailSub) return false;
      const p = this.store.getPayment(this.detailSub.id, this.currentMonth, this.currentYear);
      return p ? p.paid : false;
    },
    payYears() {
      if (!this.detailSub) return [];
      const yrs = new Set();
      for (const p of this.store.payments) {
        if (p.subscriberId === this.detailSub.id) yrs.add(p.year);
      }
      const cur = this.currentYear;
      // Always show current and previous year
      for (let y = cur; y >= cur - 1; y--) yrs.add(y);
      return [...yrs].sort((a, b) => b - a);
    }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    getBoardName(id) { return this.store.getBoardName(id); },
    getGeneratorName(id) { return this.store.getGeneratorName(id); },
    getAreaName(id) { return this.store.getAreaName(id); },
    getPrice(month, year) { return this.store.getPricePerAmp(month, year); },
    isMonthPaid(month, year) {
      if (!this.detailSub) return false;
      const p = this.store.getPayment(this.detailSub.id, month, year);
      return p ? p.paid : false;
    },
    isCurrentMonth(m, y) { return m === this.currentMonth && y === this.currentYear; },
    getMonthAmount(m, y) {
      if (!this.detailSub) return '';
      const price = this.getPrice(m, y);
      return GM.helpers.formatMoney(this.detailSub.amps * price);
    },
    // Sub payment percentage across all months
    subPayPercent(s) {
      if (s.status === 'inactive') return 0;
      const allPays = this.store.payments.filter(p => p.subscriberId === s.id);
      if (allPays.length === 0) return 0;
      const paid = allPays.filter(p => p.paid).length;
      return Math.round((paid / allPays.length) * 100);
    },
    isDark() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    },
    subColor(s) {
      if (s.status === 'inactive') return 'var(--text-muted)';
      const pct = this.subPayPercent(s);
      const hue = Math.min(120, (pct / 100) * 120);
      const l = this.isDark() ? 65 : 45;
      return `hsl(${hue}, 75%, ${l}%)`;
    },
    subCardStyle(s) {
      if (s.status === 'inactive') return { opacity: .55 };
      const pct = this.subPayPercent(s);
      const hue = Math.min(120, (pct / 100) * 120);
      if (this.isDark()) {
        return {
          borderColor: `hsl(${hue}, 50%, 30%)`,
          background: `hsl(${hue}, 40%, 15%)`
        };
      }
      return {
        borderColor: `hsl(${hue}, 70%, 80%)`,
        background: `hsl(${hue}, 60%, 95%)`
      };
    },
    // Detail
    openDetail(s) {
      // Get areaId from board
      const board = this.store.boards.find(b => b.id === s.boardId);
      this.detailSub = { ...s, areaId: board ? board.areaId : '' };
      this.showDetail = true;
    },
    togglePay() {
      if (!this.detailSub || this.detailSub.status === 'inactive') return;
      const paid = !this.detailPaid;
      this.store.togglePayment(this.detailSub.id, this.currentMonth, this.currentYear, paid);
      // Force reactivity
      this.detailSub = { ...this.detailSub };
      this.showToast(paid ? 'تم تسجيل الدفعة' : 'تم الغاء الدفعة', paid ? 'success' : 'warning');
    },
    toggleMonthPay(m, y) {
      if (!this.detailSub || this.detailSub.status === 'inactive') return;
      const paid = !this.isMonthPaid(m, y);
      this.store.togglePayment(this.detailSub.id, m, y, paid);
      this.detailSub = { ...this.detailSub };
    },
    getMonthOrdinal(m, y) {
      if (!this.detailSub) return m;
      const parts = (this.detailSub.createdAt || '').split('-');
      if (parts.length < 2) return this.monthOrdinals[m - 1] || m;
      const sy = parseInt(parts[0]), sm = parseInt(parts[1]);
      const diff = (y - sy) * 12 + (m - sm) + 1;
      if (diff >= 1 && diff <= 12) return `الشهر ${this.monthOrdinals[diff - 1]}`;
      return GM.helpers.monthName(m);
    },
    getMonthPaidAt(m, y) {
      if (!this.detailSub) return '';
      const p = this.store.getPayment(this.detailSub.id, m, y);
      return (p && p.paid && p.paidAt) ? p.paidAt : '';
    },
    goToMessages() {
      if (!this.detailSub) return;
      this.showDetail = false;
      window.__msgTargetSubId = this.detailSub.id;
      window.__msgTargetMonth = this.currentMonth;
      window.__msgTargetYear = this.currentYear;
      this.$emit('navigate', 'messages');
    },
    editFromDetail() {
      if (!this.detailSub) return;
      const s = this.store.subscribers.find(x => x.id === this.detailSub.id);
      if (s) this.openEdit(s);
      this.showDetail = false;
    },
    // Form
    openAdd() {
      this.formMode = 'add'; this.editId = null;
      this.form = { name: '', phone: '', address: '', boardId: '', generatorId: '', amps: 5, connectionNumber: '', status: 'active' };
      this.showForm = true;
      this.$nextTick(() => { if (this.$refs.firstInput) this.$refs.firstInput.focus(); });
    },
    openEdit(item) {
      this.formMode = 'edit'; this.editId = item.id;
      this.form = {
        name: item.name, phone: item.phone, address: item.address || '',
        boardId: item.boardId || '', generatorId: item.generatorId || '',
        amps: item.amps || 5, connectionNumber: item.connectionNumber || '',
        status: item.status || 'active'
      };
      this.showForm = true;
      this.$nextTick(() => { if (this.$refs.firstInput) this.$refs.firstInput.focus(); });
    },
    closeForm() { this.showForm = false; },
    saveItem() {
      if (!this.form.name.trim()) { this.showToast('الرجاء ادخال الاسم', 'error'); return; }
      if (!this.form.phone.trim()) { this.showToast('الرجاء ادخال الهاتف', 'error'); return; }
      if (!this.form.boardId) { this.showToast('الرجاء اختيار البورد', 'error'); return; }
      if (!this.form.amps || this.form.amps < 1) { this.showToast('الرجاء ادخال الامبيرات', 'error'); return; }
      if (!this.form.connectionNumber) {
        const existing = this.store.subscribers.filter(s => s.boardId === this.form.boardId && s.id !== this.editId);
        this.form.connectionNumber = String(existing.length + 1);
      }
      if (this.formMode === 'add') {
        this.store.addSubscriber(this.form);
        this.showToast('تم اضافة المشترك', 'success');
      } else {
        this.store.updateSubscriber(this.editId, this.form);
        this.showToast('تم تعديل المشترك', 'success');
      }
      this.closeForm();
    },
    confirmDelete(item) {
      this.deletingItem = item;
      this.showConfirm = true;
    },
    doDelete() {
      if (this.deletingItem) {
        this.store.deleteSubscriber(this.deletingItem.id);
        this.showToast('تم حذف المشترك', 'success');
      }
      this.showConfirm = false;
      this.deletingItem = null;
      this.showDetail = false;
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});
