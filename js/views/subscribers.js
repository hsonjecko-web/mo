/* ===========================================
   subscribers.js - صفحة إدارة المشتركين
   ===========================================
   تعرض وتدير:
   - قائمة المشتركين مع البحث والتصفية
   - إضافة / تعديل / حذف مشترك
   - ربط المشترك بالبورد والمولد
   - تحديد عدد الامبيرات
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
            <i class="fas fa-plus"></i> اضافة مشترك
          </button>
        </div>
      </div>

      <!-- فلترة وبحث -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="search-input" style="flex:1;min-width:180px">
            <i class="fas fa-search"></i>
            <input v-model="search" placeholder="بحث عن مشترك (الاسم / الهاتف)...">
          </div>
          <div class="form-group" style="min-width:130px">
            <div class="form-label">البورد</div>
            <div class="select-wrap">
              <select v-model="filterBoard" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">كل البوردات</option>
                <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:130px">
            <div class="form-label">المنطقة</div>
            <div class="select-wrap">
              <select v-model="filterArea" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="">كل المناطق</option>
                <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:100px">
            <div class="form-label">الترتيب</div>
            <div class="select-wrap">
              <select v-model="sortBy" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option value="name">الاسم</option>
                <option value="date">التاريخ</option>
                <option value="amps">الامبير</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- جدول المشتركين -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="border:none">
          <table v-if="filteredList.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>رقم الجوزة</th>
                <th>الهاتف</th>
                <th>البورد</th>
                <th>المولد</th>
                <th>الامبير</th>
                <th>التاريخ</th>
                <th v-if="can('subscribers_edit') || can('subscribers_delete')">الاجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in filteredList" :key="s.id">
                <td>{{ i + 1 }}</td>
                <td>
                  <strong>{{ s.name }}</strong>
                  <div v-if="s.notes" style="font-size:.65rem;color:var(--text-light);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.notes }}</div>
                </td>
                <td><span class="badge badge-primary">{{ s.connectionNumber || '-' }}</span></td>
                <td dir="ltr" style="direction:ltr;text-align:right">
                  <a :href="'tel:' + s.phone" style="color:var(--primary)">{{ s.phone }}</a>
                </td>
                <td>{{ getBoardName(s.boardId) }}</td>
                <td>{{ getGeneratorName(s.generatorId) }}</td>
                <td><span class="amps-display"><i class="fas fa-bolt"></i> {{ s.amps }}</span></td>
                <td style="font-size:.75rem">{{ s.createdAt }}</td>
                <td v-if="can('subscribers_edit') || can('subscribers_delete')">
                  <button v-if="can('subscribers_edit')" class="btn btn-info btn-xs" @click="openEdit(s)" title="تعديل"><i class="fas fa-edit"></i></button>
                  <button v-if="can('subscribers_delete')" class="btn btn-danger btn-xs" @click="confirmDelete(s)" title="حذف"><i class="fas fa-trash"></i></button>
                  <button class="btn btn-success btn-xs" @click="quickPay(s)" title="دفع"><i class="fas fa-check"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="fas fa-users"></i>
            <p>{{ subscribers.length === 0 ? 'لا يوجد مشتركين في النظام' : 'لا توجد نتائج تطابق البحث' }}</p>
            <p class="sub-text" v-if="subscribers.length === 0 && can('subscribers_add')">
              <button class="btn btn-primary btn-sm" @click="openAdd" style="margin-top:.5rem"><i class="fas fa-plus"></i> اضافة مشترك</button>
            </p>
          </div>
        </div>
        <!-- ملخص أسفل الجدول -->
        <div v-if="filteredList.length > 0" style="padding:.6rem .85rem;border-top:1px solid var(--border);font-size:.78rem;color:var(--text-light);display:flex;justify-content:space-between;flex-wrap:wrap;gap:.25rem">
          <span>عدد المشتركين: <strong>{{ filteredList.length }}</strong></span>
          <span>مجموع الامبيرات: <strong>{{ totalAmps }}</strong></span>
          <span>متوسط الامبيرات: <strong>{{ avgAmps }}</strong></span>
        </div>
      </div>

      <!-- مودال اضافة/تعديل مشترك -->
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3><i :class="modalMode === 'add' ? 'fas fa-plus-circle' : 'fas fa-edit'"></i> {{ modalMode === 'add' ? 'اضافة' : 'تعديل' }} مشترك</h3>
            <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">اسم المشترك <span style="color:var(--danger)">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="الاسم الكامل" ref="firstInput">
              </div>
              <div class="form-group">
                <label class="form-label">رقم الهاتف <span style="color:var(--danger)">*</span></label>
                <input v-model="form.phone" class="form-input" placeholder="077xxxxxxxx" dir="ltr">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">العنوان</label>
              <input v-model="form.address" class="form-input" placeholder="عنوان السكن (اختياري)">
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
                <label class="form-label">عدد الامبيرات <span style="color:var(--danger)">*</span></label>
                <input type="number" v-model.number="form.amps" class="form-input" placeholder="مثال: 5" min="1" max="100">
              </div>
              <div class="form-group">
                <label class="form-label">رقم الجوزة (يدوي)</label>
                <input v-model="form.connectionNumber" class="form-input" placeholder="رقم الجوزة حسب البورد">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">ملاحظات</label>
                <input v-model="form.notes" class="form-input" placeholder="اختياري">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveItem"><i class="fas fa-save"></i> {{ modalMode === 'add' ? 'اضافة' : 'حفظ التعديلات' }}</button>
            <button class="btn btn-ghost" @click="closeModal">الغاء</button>
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
            <p>هل انت متاكد من حذف المشترك <strong>{{ deletingItem ? deletingItem.name : '' }}</strong>؟</p>
            <p style="font-size:.8rem;color:var(--text-light);margin-top:.5rem">سيتم حذف جميع سجلات الدفع الخاصة بهذا المشترك</p>
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
      sortBy: 'name',
      showModal: false,
      modalMode: 'add',
      editingId: null,
      form: { name: '', phone: '', address: '', boardId: '', generatorId: '', amps: 5, connectionNumber: '', notes: '' },
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
    filteredList() {
      let list = [...this.subscribers];
      if (this.search) {
        const q = this.search.trim().toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q));
      }
      if (this.filterBoard) list = list.filter(s => s.boardId === this.filterBoard);
      if (this.filterArea) {
        const bIds = this.boards.filter(b => b.areaId === this.filterArea).map(b => b.id);
        list = list.filter(s => bIds.includes(s.boardId));
      }
      if (this.sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      else if (this.sortBy === 'date') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      else if (this.sortBy === 'amps') list.sort((a, b) => b.amps - a.amps);
      return list;
    },
    totalAmps() { return this.filteredList.reduce((s, x) => s + (x.amps || 0), 0); },
    avgAmps() {
      const l = this.filteredList;
      return l.length ? (this.totalAmps / l.length).toFixed(1) : 0;
    }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    getBoardName(id) { return this.store.getBoardName(id); },
    getGeneratorName(id) { return this.store.getGeneratorName(id); },
    getAreaName(id) { return this.store.getAreaName(id); },
    openAdd() {
      this.modalMode = 'add';
      this.editingId = null;
      this.form = { name: '', phone: '', address: '', boardId: '', generatorId: '', amps: 5, connectionNumber: '', notes: '' };
      this.showModal = true;
      this.$nextTick(() => { if (this.$refs.firstInput) this.$refs.firstInput.focus(); });
    },
    openEdit(item) {
      this.modalMode = 'edit';
      this.editingId = item.id;
      this.form = {
        name: item.name, phone: item.phone, address: item.address || '',
        boardId: item.boardId || '', generatorId: item.generatorId || '',
        amps: item.amps || 5, connectionNumber: item.connectionNumber || '', notes: item.notes || ''
      };
      this.showModal = true;
      this.$nextTick(() => { if (this.$refs.firstInput) this.$refs.firstInput.focus(); });
    },
    closeModal() { this.showModal = false; this.form = {}; },
    saveItem() {
      if (!this.form.name.trim()) { this.showToast('الرجاء ادخال اسم المشترك', 'error'); return; }
      if (!this.form.phone.trim()) { this.showToast('الرجاء ادخال رقم الهاتف', 'error'); return; }
      if (!this.form.boardId) { this.showToast('الرجاء اختيار البورد', 'error'); return; }
      if (!this.form.amps || this.form.amps < 1) { this.showToast('الرجاء ادخال عدد الامبيرات', 'error'); return; }
      if (this.form.amps > 100) { this.showToast('الحد الاقصى للامبيرات هو 100', 'error'); return; }

      // اذا لم يتم ادخال رقم جوزة، نضيف واحد تلقائي حسب البورد
      if (!this.form.connectionNumber) {
        const existing = this.store.subscribers.filter(s => s.boardId === this.form.boardId && s.id !== this.editingId);
        this.form.connectionNumber = String(existing.length + 1);
      }
      if (this.modalMode === 'add') {
        this.store.addSubscriber(this.form);
        this.showToast('تم اضافة المشترك بنجاح', 'success');
      } else {
        this.store.updateSubscriber(this.editingId, this.form);
        this.showToast('تم تعديل المشترك بنجاح', 'success');
      }
      this.closeModal();
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
    },
    quickPay(sub) {
      this.$emit('navigate', 'quickpay');
      // Will be handled by quickpay view
      setTimeout(() => {
        window.__quickPayTarget = sub.id;
      }, 100);
    },
    showToast(msg, type) {
      this.$emit('toast', msg, type);
    }
  }
});
