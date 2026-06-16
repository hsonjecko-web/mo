/* ===========================================
   expenses.js - صفحة المصروفات
   ===========================================
   - عرض جميع المصروفات
   - إضافة / تعديل / حذف مصروف
   - تصفية حسب الشهر والسنة والبورد
   =========================================== */

GM.registerView('expenses', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><span class="material-symbols-rounded">payments</span> المصروفات</h2>
          <div class="subtitle">إدارة مصروفات المولدات والصيانة</div>
        </div>
        <div class="page-actions">
          <button v-if="can('expenses_add')" class="btn btn-danger" @click="openAdd">
            <span class="material-symbols-rounded">add</span> اضافة مصروف
          </button>
        </div>
      </div>

      <!-- فلترة -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="form-group" style="min-width:120px">
            <div class="form-label">الشهر</div>
            <div class="select-wrap">
              <select v-model.number="filterMonth" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">السنة</div>
            <div class="select-wrap">
              <select v-model.number="filterYear" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:130px">
            <div class="form-label">الصنف</div>
            <div class="select-wrap">
              <select v-model="filterCategory" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">كل الاصناف</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:120px">
            <div class="form-label">المولد</div>
            <div class="select-wrap">
              <select v-model="filterGenerator" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">كل المولدات</option>
                <option v-for="g in generators" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ملخص المصروفات -->
      <div class="stats-grid" style="margin-bottom:1rem">
        <div class="stat-card gradient-rose">
          <div class="stat-label">اجمالي المصروفات</div>
          <div class="stat-value">{{ formatMoney(totalExpenses) }}</div>
          <div class="stat-sub">لشهر {{ monthName(filterMonth) }} {{ filterYear }}</div>
        </div>
        <div class="stat-card gradient-teal">
          <div class="stat-label">عدد المصروفات</div>
          <div class="stat-value">{{ filteredList.length }}</div>
          <div class="stat-sub">عملية صرف</div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-label">عدد الاصناف</div>
          <div class="stat-value">{{ categories.length }}</div>
          <div class="stat-sub">صنف مصروفات</div>
        </div>
      </div>

      <!-- جدول المصروفات -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="border:none">
          <table v-if="filteredList.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>الصنف</th>
                <th>البيان</th>
                <th>المولد</th>
                <th>المبلغ</th>
                <th v-if="can('expenses_edit') || can('expenses_delete')">الاجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in filteredList" :key="e.id">
                <td>{{ i + 1 }}</td>
                <td style="font-size:.78rem">{{ e.date }}</td>
                <td><span class="badge badge-primary">{{ getCategoryName(e.categoryId) }}</span></td>
                <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.description || '-' }}</td>
                <td>{{ getGeneratorName(e.generatorId) || '-' }}</td>
                <td><strong style="color:var(--rose)">{{ formatMoney(e.amount) }}</strong></td>
                <td v-if="can('expenses_edit') || can('expenses_delete')">
                  <button v-if="can('expenses_edit')" class="btn btn-info btn-xs" @click="openEdit(e)"><span class="material-symbols-rounded">edit</span></button>
                  <button v-if="can('expenses_delete')" class="btn btn-danger btn-xs" @click="deleteExp(e)"><span class="material-symbols-rounded">delete</span></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded">payments</span>
            <p>لا توجد مصروفات لهذا الشهر</p>
            <p v-if="can('expenses_add')" class="sub-text">
              <button class="btn btn-danger btn-sm" @click="openAdd" style="margin-top:.5rem"><span class="material-symbols-rounded">add</span> اضافة مصروف</button>
            </p>
          </div>
        </div>
      </div>

      <!-- مودال اضافة/تعديل مصروف -->
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">{{ modalMode === 'add' ? 'add_circle' : 'edit' }}</span> {{ modalMode === 'add' ? 'اضافة' : 'تعديل' }} مصروف</h3>
            <button class="modal-close" @click="closeModal"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">الصنف <span style="color:var(--danger)">*</span></label>
                <div class="select-wrap">
                  <select v-model="form.categoryId" class="form-input" ref="firstInput">
                    <option value="">اختر الصنف</option>
                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">المبلغ <span style="color:var(--danger)">*</span></label>
                <input type="number" v-model.number="form.amount" class="form-input" placeholder="المبلغ" min="1">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">البيان</label>
              <input v-model="form.description" class="form-input" placeholder="وصف المصروف">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">التاريخ</label>
                <input type="date" v-model="form.date" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">المولد</label>
                <div class="select-wrap">
                  <select v-model="form.generatorId" class="form-input">
                    <option value="">عام</option>
                    <option v-for="g in generators" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">ملاحظات</label>
              <input v-model="form.notes" class="form-input" placeholder="اختياري">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" @click="saveItem"><span class="material-symbols-rounded">save</span> {{ modalMode === 'add' ? 'اضافة' : 'حفظ' }}</button>
            <button class="btn btn-ghost" @click="closeModal">الغاء</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      filterMonth: now.getMonth() + 1,
      filterYear: now.getFullYear(),
      filterCategory: '',
      filterGenerator: '',
      showModal: false,
      modalMode: 'add',
      editingId: null,
      form: { categoryId: '', amount: '', description: '', date: GM.helpers.today(), generatorId: '', notes: '' }
    };
  },
  computed: {
    store() { return GM.store; },
    categories() { return this.store.expenseCategories; },
    generators() { return this.store.generators; },
    yearList() {
      const y = []; const cy = new Date().getFullYear();
      for (let i = cy - 3; i <= cy + 2; i++) y.push(i);
      return y;
    },
    filteredList() {
      let list = this.store.getExpensesByMonth(this.filterMonth, this.filterYear);
      if (this.filterCategory) list = list.filter(e => e.categoryId === this.filterCategory);
      if (this.filterGenerator) list = list.filter(e => e.generatorId === this.filterGenerator);
      list.sort((a, b) => b.date.localeCompare(a.date));
      return list;
    },
    totalExpenses() {
      return this.filteredList.reduce((s, e) => s + e.amount, 0);
    }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getCategoryName(id) {
      if (!id) return '-';
      const c = this.categories.find(x => x.id === id);
      return c ? c.name : 'غير معروف';
    },
    getGeneratorName(id) {
      return this.store.getGeneratorName(id);
    },
    openAdd() {
      this.modalMode = 'add';
      this.editingId = null;
      this.form = { categoryId: '', amount: '', description: '', date: GM.helpers.today(), generatorId: '', notes: '' };
      this.showModal = true;
      this.$nextTick(() => { if (this.$refs.firstInput) this.$refs.firstInput.focus(); });
    },
    openEdit(item) {
      this.modalMode = 'edit';
      this.editingId = item.id;
      this.form = {
        categoryId: item.categoryId || '',
        amount: item.amount || '',
        description: item.description || '',
        date: item.date || GM.helpers.today(),
        generatorId: item.generatorId || '',
        notes: item.notes || ''
      };
      this.showModal = true;
    },
    closeModal() { this.showModal = false; },
    saveItem() {
      if (!this.form.categoryId) { this.showToast('الرجاء اختيار الصنف', 'error'); return; }
      if (!this.form.amount || this.form.amount <= 0) { this.showToast('الرجاء ادخال المبلغ', 'error'); return; }
      if (this.modalMode === 'add') {
        this.store.addExpense(this.form);
        this.showToast('تم اضافة المصروف', 'success');
      } else {
        this.store.updateExpense(this.editingId, this.form);
        this.showToast('تم تعديل المصروف', 'success');
      }
      this.closeModal();
    },
    deleteExp(item) {
      if (confirm(`هل انت متاكد من حذف هذا المصروف بقيمة ${GM.helpers.formatMoney(item.amount)} د.ع؟`)) {
        this.store.deleteExpense(item.id);
        this.showToast('تم حذف المصروف', 'success');
      }
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});
