/* ===========================================
   settings.js - صفحة الإعدادات الكاملة
   ===========================================
   علامات التبويب (Tabs):
   - المناطق
   - البوردات
   - المولدات
   - أصناف المصروفات
   - قوالب الرسائل
   - الإعدادات العامة
   =========================================== */

GM.registerView('settings', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><i class="fas fa-cog"></i> الإعدادات</h2>
          <div class="subtitle">إدارة جميع بيانات النظام والتهيئة</div>
        </div>
      </div>

      <!-- علامات التبويب -->
      <div class="tabs">
        <div v-if="can('settings_areas')" class="tab" :class="{active: tab === 'areas'}" @click="tab = 'areas'">
          <i class="fas fa-map-marker-alt"></i> المناطق
        </div>
        <div v-if="can('settings_boards')" class="tab" :class="{active: tab === 'boards'}" @click="tab = 'boards'">
          <i class="fas fa-layer-group"></i> البوردات
        </div>
        <div v-if="can('settings_generators')" class="tab" :class="{active: tab === 'generators'}" @click="tab = 'generators'">
          <i class="fas fa-industry"></i> المولدات
        </div>
        <div v-if="can('settings_categories')" class="tab" :class="{active: tab === 'categories'}" @click="tab = 'categories'">
          <i class="fas fa-tags"></i> أصناف المصروفات
        </div>
        <div class="tab" :class="{active: tab === 'templates'}" @click="tab = 'templates'">
          <i class="fas fa-envelope"></i> قوالب الرسائل
        </div>
        <div class="tab" :class="{active: tab === 'general'}" @click="tab = 'general'">
          <i class="fas fa-sliders-h"></i> عام
        </div>
      </div>

      <!-- ===================== المناطق ===================== -->
      <div v-if="tab === 'areas'">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-map-marker-alt"></i> المناطق</h3>
            <button class="btn btn-primary btn-sm" @click="openAreaModal">
              <i class="fas fa-plus"></i> اضافة منطقة
            </button>
          </div>
          <div class="table-wrap">
            <table v-if="areas.length > 0">
              <thead><tr><th>#</th><th>اسم المنطقة</th><th>البوردات</th><th>المشتركين</th><th>تاريخ الاضافة</th><th>الاجراءات</th></tr></thead>
              <tbody>
                <tr v-for="(a, i) in areas" :key="a.id">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ a.name }}</strong></td>
                  <td>{{ getBoardsCount(a.id) }}</td>
                  <td>{{ getSubsCountByArea(a.id) }}</td>
                  <td style="font-size:.78rem">{{ a.createdAt }}</td>
                  <td>
                    <button class="btn btn-info btn-xs" @click="editArea(a)"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-xs" @click="deleteArea(a)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="fas fa-map-marker-alt"></i>
              <p>لا توجد مناطق</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== البوردات ===================== -->
      <div v-if="tab === 'boards'">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-layer-group"></i> البوردات</h3>
            <button class="btn btn-primary btn-sm" @click="openBoardModal">
              <i class="fas fa-plus"></i> اضافة بورد
            </button>
          </div>
          <div class="table-wrap">
            <table v-if="boards.length > 0">
              <thead><tr><th>#</th><th>اسم البورد</th><th>المنطقة</th><th>المشتركين</th><th>تاريخ الاضافة</th><th>الاجراءات</th></tr></thead>
              <tbody>
                <tr v-for="(b, i) in boards" :key="b.id">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ b.name }}</strong></td>
                  <td>{{ getAreaName(b.areaId) }}</td>
                  <td>{{ getSubsCountByBoard(b.id) }}</td>
                  <td style="font-size:.78rem">{{ b.createdAt }}</td>
                  <td>
                    <button class="btn btn-info btn-xs" @click="editBoard(b)"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-xs" @click="deleteBoard(b)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="fas fa-layer-group"></i>
              <p>لا توجد بوردات</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== المولدات ===================== -->
      <div v-if="tab === 'generators'">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-industry"></i> المولدات</h3>
            <button class="btn btn-primary btn-sm" @click="openGeneratorModal">
              <i class="fas fa-plus"></i> اضافة مولد
            </button>
          </div>
          <div class="table-wrap">
            <table v-if="generators.length > 0">
              <thead><tr><th>#</th><th>اسم المولد</th><th>المنطقة</th><th>صاحب المولد</th><th>رقم المولد</th><th>هاتف المولد</th><th>المشتركين</th><th>الاجراءات</th></tr></thead>
              <tbody>
                <tr v-for="(g, i) in generators" :key="g.id">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ g.name }}</strong></td>
                  <td>{{ getAreaName(g.areaId) }}</td>
                  <td>{{ g.owner || '-' }}</td>
                  <td>{{ g.generatorNumber || '-' }}</td>
                  <td dir="ltr">{{ g.ownerPhone || '-' }}</td>
                  <td>{{ getSubsCountByGenerator(g.id) }}</td>
                  <td>
                    <button class="btn btn-info btn-xs" @click="editGenerator(g)"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-xs" @click="deleteGenerator(g)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="fas fa-industry"></i>
              <p>لا توجد مولدات</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== أصناف المصروفات ===================== -->
      <div v-if="tab === 'categories'">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-tags"></i> أصناف المصروفات</h3>
            <button class="btn btn-primary btn-sm" @click="openCategoryModal">
              <i class="fas fa-plus"></i> اضافة صنف
            </button>
          </div>
          <div class="table-wrap">
            <table v-if="categories.length > 0">
              <thead><tr><th>#</th><th>اسم الصنف</th><th>تاريخ الاضافة</th><th>الاجراءات</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in categories" :key="c.id">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td style="font-size:.78rem">{{ c.createdAt }}</td>
                  <td>
                    <button class="btn btn-danger btn-xs" @click="deleteCategory(c)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="fas fa-tags"></i>
              <p>لا توجد أصناف مصروفات</p>
              <p class="sub-text">أضف أصناف مثل: زيت, وقود, صيانة, قطع غيار, رواتب...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== قوالب الرسائل ===================== -->
      <div v-if="tab === 'templates'">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-envelope"></i> قوالب الرسائل</h3>
            <button v-if="can('messages_templates')" class="btn btn-primary btn-sm" @click="openTemplateModal">
              <i class="fas fa-plus"></i> قالب جديد
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            <div v-for="t in templates" :key="t.id" class="template-card" @click="editTemplate(t)">
              <div class="template-title">
                <i class="fas fa-message" style="color:var(--primary)"></i> {{ t.title }}
              </div>
              <div class="template-body" style="white-space:pre-wrap">{{ t.body }}</div>
              <div class="template-actions" v-if="can('messages_templates')">
                <button class="btn btn-info btn-xs" @click.stop="editTemplate(t)"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-danger btn-xs" @click.stop="deleteTemplate(t)"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div v-if="templates.length === 0" class="empty-state" style="padding:1.5rem">
              <i class="fas fa-envelope"></i>
              <p>لا توجد قوالب رسائل</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== الإعدادات العامة ===================== -->
      <div v-if="tab === 'general'">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><i class="fas fa-palette"></i> المظهر</h3>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <span class="title">الوضع الليلي</span>
              <span class="desc">تبديل بين الوضع النهاري والليلي</span>
            </div>
            <div class="toggle" :class="{active: theme === 'dark'}" @click="toggleTheme"></div>
          </div>
        </div>

        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><i class="fas fa-dollar-sign"></i> الإعدادات المالية</h3>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">سعر الامبير الافتراضي (د.ع)</label>
              <input type="number" v-model.number="defaultPrice" class="form-input" @change="saveDefaultPrice" placeholder="مثال: 1500">
              <div class="form-hint">هذا السعر يستخدم كقيمة افتراضية عند بداية كل شهر جديد</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><i class="fas fa-database"></i> إدارة البيانات</h3>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button v-if="can('export_data')" class="btn btn-info" @click="exportData">
              <i class="fas fa-download"></i> تصدير البيانات
            </button>
            <button v-if="can('import_data')" class="btn btn-warning" @click="$refs.importInput.click()">
              <i class="fas fa-upload"></i> استيراد البيانات
            </button>
            <button v-if="can('clear_data')" class="btn btn-danger" @click="clearData">
              <i class="fas fa-trash"></i> مسح كل البيانات
            </button>
          </div>
          <input type="file" ref="importInput" accept=".json" style="display:none" @change="importData">
        </div>

        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-info-circle"></i> معلومات النظام</h3>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.82rem">
            <div><strong>عدد المشتركين:</strong> {{ store.subscribers.length }}</div>
            <div><strong>عدد المناطق:</strong> {{ store.areas.length }}</div>
            <div><strong>عدد البوردات:</strong> {{ store.boards.length }}</div>
            <div><strong>عدد المولدات:</strong> {{ store.generators.length }}</div>
            <div><strong>عدد المستخدمين:</strong> {{ usersCount }}</div>
            <div><strong>إجمالي المدفوعات:</strong> {{ formatMoney(totalPayments) }}</div>
          </div>
        </div>
      </div>

      <!-- ====== مودال المنطقة ====== -->
      <div class="modal-overlay" v-if="showAreaModal" @click.self="showAreaModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><i class="fas fa-map-marker-alt"></i> {{ areaModalMode === 'add' ? 'اضافة' : 'تعديل' }} منطقة</h3>
            <button class="modal-close" @click="showAreaModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">اسم المنطقة</label>
              <input v-model="areaForm.name" class="form-input" placeholder="ادخل اسم المنطقة" ref="areaInput">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveArea"><i class="fas fa-save"></i> حفظ</button>
            <button class="btn btn-ghost" @click="showAreaModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال البورد ====== -->
      <div class="modal-overlay" v-if="showBoardModal" @click.self="showBoardModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-layer-group"></i> {{ boardModalMode === 'add' ? 'اضافة' : 'تعديل' }} بورد</h3>
            <button class="modal-close" @click="showBoardModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">اسم البورد</label>
              <input v-model="boardForm.name" class="form-input" placeholder="ادخل اسم البورد" ref="boardInput">
            </div>
            <div class="form-group">
              <label class="form-label">المنطقة التابع لها</label>
              <div class="select-wrap">
                <select v-model="boardForm.areaId" class="form-input">
                  <option value="">اختر المنطقة</option>
                  <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveBoard"><i class="fas fa-save"></i> حفظ</button>
            <button class="btn btn-ghost" @click="showBoardModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال المولد ====== -->
      <div class="modal-overlay" v-if="showGenModal" @click.self="showGenModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-industry"></i> {{ genModalMode === 'add' ? 'اضافة' : 'تعديل' }} مولد</h3>
            <button class="modal-close" @click="showGenModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">اسم المولد <span style="color:var(--danger)">*</span></label>
                <input v-model="genForm.name" class="form-input" placeholder="اسم المولد" ref="genInput">
              </div>
              <div class="form-group">
                <label class="form-label">المنطقة <span style="color:var(--danger)">*</span></label>
                <div class="select-wrap">
                  <select v-model="genForm.areaId" class="form-input">
                    <option value="">اختر المنطقة</option>
                    <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">صاحب المولد</label>
                <input v-model="genForm.owner" class="form-input" placeholder="اسم صاحب المولد">
              </div>
              <div class="form-group">
                <label class="form-label">رقم المولد</label>
                <input v-model="genForm.generatorNumber" class="form-input" placeholder="رقم المولد / اللوحة">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">رقم هاتف المولد</label>
              <input v-model="genForm.ownerPhone" class="form-input" placeholder="077xxxxxxxx" dir="ltr">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveGenerator"><i class="fas fa-save"></i> حفظ</button>
            <button class="btn btn-ghost" @click="showGenModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال صنف المصروفات ====== -->
      <div class="modal-overlay" v-if="showCatModal" @click.self="showCatModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><i class="fas fa-tag"></i> اضافة صنف مصروفات</h3>
            <button class="modal-close" @click="showCatModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">اسم الصنف</label>
              <input v-model="catForm.name" class="form-input" placeholder="مثال: وقود, زيت, صيانة..." ref="catInput">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveCategory"><i class="fas fa-save"></i> حفظ</button>
            <button class="btn btn-ghost" @click="showCatModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال القالب ====== -->
      <div class="modal-overlay" v-if="showTplModal" @click.self="showTplModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-envelope"></i> {{ tplMode === 'add' ? 'قالب جديد' : 'تعديل القالب' }}</h3>
            <button class="modal-close" @click="showTplModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">عنوان القالب</label>
              <input v-model="tplForm.title" class="form-input" placeholder="مثال: تذكير بالدفع" ref="tplInput">
            </div>
            <div class="form-group">
              <label class="form-label">نص الرسالة</label>
              <textarea v-model="tplForm.body" class="form-input" rows="5" placeholder="نص الرسالة..."></textarea>
            </div>
            <div style="font-size:.72rem;color:var(--text-light);background:var(--bg);padding:.5rem;border-radius:var(--radius-xs)">
              <strong>المتغيرات:</strong> {name} {month} {amount} {amps} {phone}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveTemplate"><i class="fas fa-save"></i> حفظ</button>
            <button class="btn btn-ghost" @click="showTplModal = false">الغاء</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      tab: 'areas',
      // Area modal
      showAreaModal: false, areaModalMode: 'add', areaEditId: null, areaForm: { name: '' },
      // Board modal
      showBoardModal: false, boardModalMode: 'add', boardEditId: null, boardForm: { name: '', areaId: '' },
      // Generator modal
      showGenModal: false, genModalMode: 'add', genEditId: null, genForm: { name: '', areaId: '', owner: '', generatorNumber: '', ownerPhone: '' },
      // Category modal
      showCatModal: false, catForm: { name: '' },
      // Template modal
      showTplModal: false, tplMode: 'add', tplEditId: null, tplForm: { title: '', body: '' },
    };
  },
  computed: {
    store() { return GM.store; },
    theme() { return document.documentElement.className === 'dark' ? 'dark' : 'light'; },
    areas() { return this.store.areas; },
    boards() { return this.store.boards; },
    generators() { return this.store.generators; },
    categories() { return this.store.expenseCategories; },
    templates() { return this.store.messageTemplates; },
    defaultPrice: {
      get() { return this.store.defaultPricePerAmp; },
      set(v) { this.store.defaultPricePerAmp = v; this.store._save(); }
    },
    usersCount() {
      return GM.auth ? GM.auth.users.length : 0;
    },
    totalPayments() {
      return this.store.payments.filter(p => p.paid).length;
    }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getAreaName(id) { return this.store.getAreaName(id); },
    getBoardsCount(areaId) { return this.store.boards.filter(b => b.areaId === areaId).length; },
    getSubsCountByBoard(boardId) { return this.store.subscribers.filter(s => s.boardId === boardId).length; },
    getSubsCountByArea(areaId) {
      const bIds = this.store.boards.filter(b => b.areaId === areaId).map(b => b.id);
      return this.store.subscribers.filter(s => bIds.includes(s.boardId)).length;
    },
    getSubsCountByGenerator(genId) { return this.store.subscribers.filter(s => s.generatorId === genId).length; },
    toggleTheme() {
      const isDark = document.documentElement.className === 'dark';
      document.documentElement.className = isDark ? '' : 'dark';
      localStorage.setItem('gm_theme', isDark ? 'light' : 'dark');
    },
    saveDefaultPrice() {
      this.showToast('تم حفظ سعر الامبير الافتراضي', 'success');
    },
    // --- Areas ---
    openAreaModal() {
      this.areaModalMode = 'add'; this.areaEditId = null; this.areaForm = { name: '' };
      this.showAreaModal = true;
      this.$nextTick(() => { if (this.$refs.areaInput) this.$refs.areaInput.focus(); });
    },
    editArea(a) {
      this.areaModalMode = 'edit'; this.areaEditId = a.id; this.areaForm = { name: a.name };
      this.showAreaModal = true;
    },
    saveArea() {
      if (!this.areaForm.name.trim()) { this.showToast('الرجاء ادخال اسم المنطقة', 'error'); return; }
      if (this.areaModalMode === 'add') this.store.addArea(this.areaForm.name);
      else this.store.updateArea(this.areaEditId, this.areaForm.name);
      this.showToast(this.areaModalMode === 'add' ? 'تم اضافة المنطقة' : 'تم تعديل المنطقة', 'success');
      this.showAreaModal = false;
    },
    deleteArea(a) {
      if (confirm(`هل انت متاكد من حذف المنطقة "${a.name}"؟\nسيتم حذف جميع البوردات والمشتركين التابعين لها`)) {
        this.store.deleteArea(a.id);
        this.showToast('تم حذف المنطقة', 'success');
      }
    },
    // --- Boards ---
    openBoardModal() {
      this.boardModalMode = 'add'; this.boardEditId = null; this.boardForm = { name: '', areaId: '' };
      this.showBoardModal = true;
      this.$nextTick(() => { if (this.$refs.boardInput) this.$refs.boardInput.focus(); });
    },
    editBoard(b) {
      this.boardModalMode = 'edit'; this.boardEditId = b.id;
      this.boardForm = { name: b.name, areaId: b.areaId || '' };
      this.showBoardModal = true;
    },
    saveBoard() {
      if (!this.boardForm.name.trim()) { this.showToast('الرجاء ادخال اسم البورد', 'error'); return; }
      if (!this.boardForm.areaId) { this.showToast('الرجاء اختيار المنطقة', 'error'); return; }
      if (this.boardModalMode === 'add') this.store.addBoard(this.boardForm.name, this.boardForm.areaId);
      else this.store.updateBoard(this.boardEditId, this.boardForm.name, this.boardForm.areaId);
      this.showToast(this.boardModalMode === 'add' ? 'تم اضافة البورد' : 'تم تعديل البورد', 'success');
      this.showBoardModal = false;
    },
    deleteBoard(b) {
      if (confirm(`هل انت متاكد من حذف البورد "${b.name}"؟\nسيتم حذف جميع المشتركين التابعين له`)) {
        this.store.deleteBoard(b.id);
        this.showToast('تم حذف البورد', 'success');
      }
    },
    // --- Generators ---
    openGeneratorModal() {
      this.genModalMode = 'add'; this.genEditId = null;
      this.genForm = { name: '', areaId: '', owner: '', generatorNumber: '', ownerPhone: '' };
      this.showGenModal = true;
      this.$nextTick(() => { if (this.$refs.genInput) this.$refs.genInput.focus(); });
    },
    editGenerator(g) {
      this.genModalMode = 'edit'; this.genEditId = g.id;
      this.genForm = { name: g.name, areaId: g.areaId || '', owner: g.owner || '', generatorNumber: g.generatorNumber || '', ownerPhone: g.ownerPhone || '' };
      this.showGenModal = true;
    },
    saveGenerator() {
      if (!this.genForm.name.trim()) { this.showToast('الرجاء ادخال اسم المولد', 'error'); return; }
      if (!this.genForm.areaId) { this.showToast('الرجاء اختيار المنطقة', 'error'); return; }
      if (this.genModalMode === 'add') {
        this.store.addGenerator(this.genForm.name, this.genForm.areaId, {
          owner: this.genForm.owner,
          ownerPhone: this.genForm.ownerPhone,
          generatorNumber: this.genForm.generatorNumber
        });
      } else {
        this.store.updateGenerator(this.genEditId, this.genForm.name, this.genForm.areaId, {
          owner: this.genForm.owner,
          ownerPhone: this.genForm.ownerPhone,
          generatorNumber: this.genForm.generatorNumber
        });
      }
      this.showToast(this.genModalMode === 'add' ? 'تم اضافة المولد' : 'تم تعديل المولد', 'success');
      this.showGenModal = false;
    },
    deleteGenerator(g) {
      if (confirm(`هل انت متاكد من حذف المولد "${g.name}"؟`)) {
        this.store.deleteGenerator(g.id);
        this.showToast('تم حذف المولد', 'success');
      }
    },
    // --- Categories ---
    openCategoryModal() {
      this.catForm = { name: '' };
      this.showCatModal = true;
      this.$nextTick(() => { if (this.$refs.catInput) this.$refs.catInput.focus(); });
    },
    saveCategory() {
      if (!this.catForm.name.trim()) { this.showToast('الرجاء ادخال اسم الصنف', 'error'); return; }
      this.store.addExpenseCategory(this.catForm.name);
      this.showToast('تم اضافة الصنف', 'success');
      this.showCatModal = false;
    },
    deleteCategory(c) {
      if (confirm(`هل انت متاكد من حذف صنف "${c.name}"؟`)) {
        this.store.deleteExpenseCategory(c.id);
        this.showToast('تم حذف الصنف', 'success');
      }
    },
    // --- Templates ---
    openTemplateModal() {
      this.tplMode = 'add'; this.tplEditId = null; this.tplForm = { title: '', body: '' };
      this.showTplModal = true;
      this.$nextTick(() => { if (this.$refs.tplInput) this.$refs.tplInput.focus(); });
    },
    editTemplate(t) {
      this.tplMode = 'edit'; this.tplEditId = t.id; this.tplForm = { title: t.title, body: t.body };
      this.showTplModal = true;
    },
    deleteTemplate(t) {
      if (confirm(`حذف القالب "${t.title}"؟`)) {
        this.store.deleteMessageTemplate(t.id);
        this.showToast('تم حذف القالب', 'success');
      }
    },
    saveTemplate() {
      if (!this.tplForm.title.trim()) { this.showToast('الرجاء ادخال عنوان القالب', 'error'); return; }
      if (!this.tplForm.body.trim()) { this.showToast('الرجاء ادخال نص الرسالة', 'error'); return; }
      if (this.tplMode === 'add') this.store.addMessageTemplate(this.tplForm.title, this.tplForm.body);
      else this.store.updateMessageTemplate(this.tplEditId, this.tplForm.title, this.tplForm.body);
      this.showToast(this.tplMode === 'add' ? 'تم اضافة القالب' : 'تم تعديل القالب', 'success');
      this.showTplModal = false;
    },
    // --- Data Management ---
    exportData() {
      const data = {
        areas: this.store.areas, boards: this.store.boards, generators: this.store.generators,
        subscribers: this.store.subscribers, monthlySettings: this.store.monthlySettings,
        payments: this.store.payments, expenses: this.store.expenses,
        expenseCategories: this.store.expenseCategories, messageTemplates: this.store.messageTemplates,
        defaultPricePerAmp: this.store.defaultPricePerAmp,
        exportedAt: GM.helpers.today()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `generator-backup-${GM.helpers.today()}.json`;
      a.click(); URL.revokeObjectURL(url);
      this.showToast('تم تصدير البيانات', 'success');
    },
    importData(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          this.store.areas = data.areas || [];
          this.store.boards = data.boards || [];
          this.store.generators = data.generators || [];
          this.store.subscribers = data.subscribers || [];
          this.store.monthlySettings = data.monthlySettings || [];
          this.store.payments = data.payments || [];
          this.store.expenses = data.expenses || [];
          this.store.expenseCategories = data.expenseCategories || [];
          if (data.messageTemplates) this.store.messageTemplates = data.messageTemplates;
          if (data.defaultPricePerAmp) this.store.defaultPricePerAmp = data.defaultPricePerAmp;
          this.store._save();
          this.showToast('تم استيراد البيانات بنجاح', 'success');
        } catch (err) {
          this.showToast('خطأ في استيراد البيانات', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    clearData() {
      if (confirm('هل انت متاكد من مسح كل البيانات؟\nهذا الاجراء لا يمكن التراجع عنه!')) {
        if (confirm('تأكيد مرة اخرى: سيتم مسح جميع المشتركين والفواتير والمصروفات')) {
          this.store.areas = []; this.store.boards = []; this.store.generators = [];
          this.store.subscribers = []; this.store.monthlySettings = [];
          this.store.payments = []; this.store.expenses = []; this.store._save();
          this.showToast('تم مسح كل البيانات', 'warning');
        }
      }
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});
