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
          <h2><span class="material-symbols-rounded">settings</span> الإعدادات</h2>
          <div class="subtitle">إدارة جميع بيانات النظام والتهيئة</div>
        </div>
      </div>

      <!-- علامات التبويب العمودية -->
      <div class="v-tabs">
        <div v-if="can('settings_areas')" class="v-tab" :class="{active: tab === 'areas'}" @click="tab = 'areas'">
          <span class="material-symbols-rounded">location_on</span> المناطق
        </div>
        <div v-if="can('settings_boards')" class="v-tab" :class="{active: tab === 'boards'}" @click="tab = 'boards'">
          <span class="material-symbols-rounded">layers</span> البوردات
        </div>
        <div v-if="can('settings_generators')" class="v-tab" :class="{active: tab === 'generators'}" @click="tab = 'generators'">
          <span class="material-symbols-rounded">factory</span> المولدات
        </div>
        <div v-if="can('settings_categories')" class="v-tab" :class="{active: tab === 'categories'}" @click="tab = 'categories'">
          <span class="material-symbols-rounded">sell</span> أصناف المصروفات
        </div>
        <div class="v-tab" :class="{active: tab === 'templates'}" @click="tab = 'templates'">
          <span class="material-symbols-rounded">mail</span> قوالب الرسائل
        </div>
        <div class="v-tab" :class="{active: tab === 'general'}" @click="tab = 'general'">
          <span class="material-symbols-rounded">tune</span> عام
        </div>
      </div>

      <!-- ===================== المناطق ===================== -->
      <div v-if="tab === 'areas'">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">location_on</span> المناطق <span class="badge badge-primary">{{ areas.length }}</span></h3>
            <button class="btn btn-primary btn-sm" @click="openAreaModal">
              <span class="material-symbols-rounded">add</span> اضافة
            </button>
          </div>
          <div v-if="areas.length > 0" class="setting-list">
            <div v-for="a in areas" :key="a.id" class="setting-card">
              <div class="sc-icon"><span class="material-symbols-rounded">location_on</span></div>
              <div class="sc-info">
                <div class="sc-name">{{ a.name }}</div>
                <div class="sc-meta">
                  <span><span class="material-symbols-rounded">layers</span> {{ getBoardsCount(a.id) }} بورد</span>
                  <span><span class="material-symbols-rounded">group</span> {{ getSubsCountByArea(a.id) }} مشترك</span>
                </div>
              </div>
              <div class="sc-actions">
                <button class="btn btn-info btn-xs" @click="editBoard(b)" title="تعديل"><span class="material-symbols-rounded">edit</span></button>
                <button class="btn btn-danger btn-xs" @click="deleteBoard(b)" title="حذف"><span class="material-symbols-rounded">delete</span></button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded">location_on</span>
            <p>لا توجد مناطق</p>
          </div>
        </div>
      </div>

      <!-- ===================== البوردات ===================== -->
      <div v-if="tab === 'boards'">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">layers</span> البوردات</h3>
            <button class="btn btn-primary btn-sm" @click="openBoardModal">
              <span class="material-symbols-rounded">add</span> اضافة بورد
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
                    <button class="btn btn-info btn-xs" @click="editBoard(b)"><span class="material-symbols-rounded">edit</span></button>
                    <button class="btn btn-danger btn-xs" @click="deleteBoard(b)"><span class="material-symbols-rounded">delete</span></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <span class="material-symbols-rounded">layers</span>
              <p>لا توجد بوردات</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== المولدات ===================== -->
      <div v-if="tab === 'generators'">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">factory</span> المولدات <span class="badge badge-primary">{{ generators.length }}</span></h3>
            <button class="btn btn-primary btn-sm" @click="openGeneratorModal">
              <span class="material-symbols-rounded">add</span> اضافة
            </button>
          </div>
          <div v-if="generators.length > 0" class="setting-list">
            <div v-for="g in generators" :key="g.id" class="setting-card">
              <div class="sc-icon"><span class="material-symbols-rounded">factory</span></div>
              <div class="sc-info">
                <div class="sc-name">{{ g.name }}</div>
                <div class="sc-meta">
                  <span><span class="material-symbols-rounded">location_on</span> {{ getAreaName(g.areaId) }}</span>
                  <span><span class="material-symbols-rounded">group</span> {{ getSubsCountByGenerator(g.id) }} مشترك</span>
                  <span v-if="g.owner"><span class="material-symbols-rounded">person</span> {{ g.owner }}</span>
                  <span v-if="g.ownerPhone" dir="ltr"><span class="material-symbols-rounded">phone</span> {{ g.ownerPhone }}</span>
                </div>
              </div>
              <div class="sc-actions">
                <button class="btn btn-info btn-xs" @click="editGenerator(g)" title="تعديل"><span class="material-symbols-rounded">edit</span></button>
                <button class="btn btn-danger btn-xs" @click="deleteGenerator(g)" title="حذف"><span class="material-symbols-rounded">delete</span></button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded">factory</span>
            <p>لا توجد مولدات</p>
          </div>
        </div>
      </div>

      <!-- ===================== أصناف المصروفات ===================== -->
      <div v-if="tab === 'categories'">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">sell</span> أصناف المصروفات <span class="badge badge-primary">{{ categories.length }}</span></h3>
            <button class="btn btn-primary btn-sm" @click="openCategoryModal">
              <span class="material-symbols-rounded">add</span> اضافة
            </button>
          </div>
          <div v-if="categories.length > 0" class="setting-list">
            <div v-for="c in categories" :key="c.id" class="setting-card">
              <div class="sc-icon"><span class="material-symbols-rounded">label</span></div>
              <div class="sc-info">
                <div class="sc-name">{{ c.name }}</div>
                <div class="sc-meta">
                  <span><span class="material-symbols-rounded">calendar_month</span> {{ c.createdAt }}</span>
                </div>
              </div>
              <div class="sc-actions">
                <button class="btn btn-danger btn-xs" @click="deleteCategory(c)" title="حذف"><span class="material-symbols-rounded">delete</span></button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded">sell</span>
            <p>لا توجد أصناف مصروفات</p>
            <p class="sub-text">أضف أصناف مثل: زيت, وقود, صيانة, قطع غيار, رواتب...</p>
          </div>
        </div>
      </div>

      <!-- ===================== قوالب الرسائل ===================== -->
      <div v-if="tab === 'templates'">
        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">mail</span> قوالب الرسائل</h3>
            <button v-if="can('messages_templates')" class="btn btn-primary btn-sm" @click="openTemplateModal">
              <span class="material-symbols-rounded">add</span> قالب جديد
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            <div v-for="t in templates" :key="t.id" class="template-card" @click="editTemplate(t)">
              <div class="template-title">
                <span class="material-symbols-rounded" style="color:var(--primary)">message</span> {{ t.title }}
              </div>
              <div class="template-body" style="white-space:pre-wrap">{{ t.body }}</div>
              <div class="template-actions" v-if="can('messages_templates')">
                <button class="btn btn-info btn-xs" @click.stop="editTemplate(t)"><span class="material-symbols-rounded">edit</span> تعديل</button>
                <button class="btn btn-danger btn-xs" @click.stop="deleteTemplate(t)"><span class="material-symbols-rounded">delete</span></button>
              </div>
            </div>
            <div v-if="templates.length === 0" class="empty-state" style="padding:1.5rem">
              <span class="material-symbols-rounded">mail</span>
              <p>لا توجد قوالب رسائل</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== الإعدادات العامة ===================== -->
      <div v-if="tab === 'general'">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">palette</span> المظهر</h3>
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
            <h3><span class="material-symbols-rounded">attach_money</span> الإعدادات المالية</h3>
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
            <h3><span class="material-symbols-rounded">database</span> إدارة البيانات</h3>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button v-if="can('export_data')" class="btn btn-info" @click="exportData">
              <span class="material-symbols-rounded">download</span> تصدير البيانات
            </button>
            <button v-if="can('import_data')" class="btn btn-warning" @click="$refs.importInput.click()">
              <span class="material-symbols-rounded">upload</span> استيراد البيانات
            </button>
            <button v-if="can('clear_data')" class="btn btn-danger" @click="clearData">
              <span class="material-symbols-rounded">delete</span> مسح كل البيانات
            </button>
            <button class="btn btn-ghost-primary" @click="loadSampleData">
              <span class="material-symbols-rounded">science</span> بيانات تجربة
            </button>
          </div>
          <input type="file" ref="importInput" accept=".json" style="display:none" @change="importData">
        </div>

        <div class="card">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">info</span> معلومات النظام</h3>
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
            <h3><span class="material-symbols-rounded">location_on</span> {{ areaModalMode === 'add' ? 'اضافة' : 'تعديل' }} منطقة</h3>
            <button class="modal-close" @click="showAreaModal = false"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">اسم المنطقة</label>
              <input v-model="areaForm.name" class="form-input" placeholder="ادخل اسم المنطقة" ref="areaInput">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveArea"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="showAreaModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال البورد ====== -->
      <div class="modal-overlay" v-if="showBoardModal" @click.self="showBoardModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">layers</span> {{ boardModalMode === 'add' ? 'اضافة' : 'تعديل' }} بورد</h3>
            <button class="modal-close" @click="showBoardModal = false"><span class="material-symbols-rounded">close</span></button>
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
            <button class="btn btn-primary" @click="saveBoard"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="showBoardModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال المولد ====== -->
      <div class="modal-overlay" v-if="showGenModal" @click.self="showGenModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">factory</span> {{ genModalMode === 'add' ? 'اضافة' : 'تعديل' }} مولد</h3>
            <button class="modal-close" @click="showGenModal = false"><span class="material-symbols-rounded">close</span></button>
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
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">قدرة المولد (أمبير)</label>
                <input type="number" v-model.number="genForm.amps" class="form-input" placeholder="مثال: 200" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">رقم هاتف المولد</label>
                <input v-model="genForm.ownerPhone" class="form-input" placeholder="077xxxxxxxx" dir="ltr">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveGenerator"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="showGenModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال صنف المصروفات ====== -->
      <div class="modal-overlay" v-if="showCatModal" @click.self="showCatModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">label</span> اضافة صنف مصروفات</h3>
            <button class="modal-close" @click="showCatModal = false"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">اسم الصنف</label>
              <input v-model="catForm.name" class="form-input" placeholder="مثال: وقود, زيت, صيانة..." ref="catInput">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveCategory"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="showCatModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- ====== مودال القالب ====== -->
      <div class="modal-overlay" v-if="showTplModal" @click.self="showTplModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">mail</span> {{ tplMode === 'add' ? 'قالب جديد' : 'تعديل القالب' }}</h3>
            <button class="modal-close" @click="showTplModal = false"><span class="material-symbols-rounded">close</span></button>
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
            <button class="btn btn-primary" @click="saveTemplate"><span class="material-symbols-rounded">save</span> حفظ</button>
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
    showToast(msg, type) { this.$emit('toast', msg, type); },
    loadSampleData() {
      if (!confirm('سيتم اضافة بيانات تجربة (مناطق، بوردات، مولدات، مشتركين)\nمع العلم لن يتم حذف البيانات الحالية')) return;
      const sample = (function() {
        const now = new Date();
        const cy = now.getFullYear();
        const cm = now.getMonth() + 1;
        const d = (o) => { const dt = new Date(); dt.setDate(dt.getDate() - o); return dt.toISOString().slice(0,10); };
        const id = (n) => n;
        const areas = [
          { id: id('area_1'), name: 'حي القادسية', createdAt: d(90) },
          { id: id('area_2'), name: 'حي الاندلس', createdAt: d(85) },
          { id: id('area_3'), name: 'حي المنصور', createdAt: d(80) },
        ];
        const boards = [
          { id: id('board_1'), name: 'بورد 1', areaId: id('area_1'), createdAt: d(80) },
          { id: id('board_2'), name: 'بورد 2', areaId: id('area_1'), createdAt: d(75) },
          { id: id('board_3'), name: 'بورد السلام', areaId: id('area_2'), createdAt: d(70) },
          { id: id('board_4'), name: 'بورد النور', areaId: id('area_3'), createdAt: d(65) },
        ];
        const generators = [
          { id: id('gen_1'), name: 'مولد القادسية 1', areaId: id('area_1'), owner: 'ابو علي', ownerPhone: '07701234567', generatorNumber: 'G-001', createdAt: d(80) },
          { id: id('gen_2'), name: 'مولد الاندلس', areaId: id('area_2'), owner: 'الحاج كريم', ownerPhone: '07707654321', generatorNumber: 'G-002', createdAt: d(70) },
        ];
        const subs = [
          { id: id('sub_1'), name: 'علي محمد', phone: '07711223344', address: 'شارع ١', boardId: id('board_1'), generatorId: id('gen_1'), amps: 5, connectionNumber: '1', notes: '', createdAt: d(60), status: 'active' },
          { id: id('sub_2'), name: 'حسين احمد', phone: '07722334455', address: 'شارع ٢', boardId: id('board_1'), generatorId: id('gen_1'), amps: 10, connectionNumber: '2', notes: '', createdAt: d(55), status: 'active' },
          { id: id('sub_3'), name: 'عباس كريم', phone: '07733445566', address: 'شارع ٣', boardId: id('board_2'), generatorId: id('gen_1'), amps: 7, connectionNumber: '1', notes: 'صاحب المحل', createdAt: d(50), status: 'active' },
          { id: id('sub_4'), name: 'محمد رضا', phone: '07744556677', address: 'حي الاندلس', boardId: id('board_3'), generatorId: id('gen_2'), amps: 3, connectionNumber: '1', notes: '', createdAt: d(45), status: 'active' },
          { id: id('sub_5'), name: 'زهراء حسن', phone: '07755667788', address: 'شارع المنصور', boardId: id('board_4'), generatorId: id('gen_2'), amps: 5, connectionNumber: '1', notes: '', createdAt: d(40), status: 'active' },
          { id: id('sub_6'), name: 'مصطفى جليل', phone: '07766778899', address: 'شارع ٥', boardId: id('board_2'), generatorId: id('gen_1'), amps: 15, connectionNumber: '2', notes: 'مول تجاري', createdAt: d(35), status: 'active' },
          { id: id('sub_7'), name: 'حسن علي', phone: '07777889900', address: 'بغداد', boardId: id('board_3'), generatorId: id('gen_2'), amps: 10, connectionNumber: '2', notes: '', createdAt: d(30), status: 'inactive' },
          { id: id('sub_8'), name: 'نور الهدى', phone: '07788990011', address: 'حي القادسية', boardId: id('board_1'), generatorId: id('gen_1'), amps: 5, connectionNumber: '3', notes: '', createdAt: d(25), status: 'active' },
        ];
        const ms = [];
        for (let i = 0; i < 3; i++) {
          let m = cm - i; let y = cy;
          if (m <= 0) { m += 12; y -= 1; }
          ms.push({ id: id('ms_' + i), month: m, year: y, pricePerAmp: 1500 });
        }
        const pays = [];
        const paid = [id('sub_1'), id('sub_3'), id('sub_5'), id('sub_8')];
        for (let i = 0; i < 3; i++) {
          let m = cm - i; let y = cy;
          if (m <= 0) { m += 12; y -= 1; }
          for (const sid of paid) pays.push({ id: id('pay_' + sid + '_' + i), subscriberId: sid, month: m, year: y, paid: true, paidAt: d(i * 30 + 5) });
          pays.push({ id: id('pay_un_' + i), subscriberId: id('sub_2'), month: m, year: y, paid: false, paidAt: null });
          pays.push({ id: id('pay_un2_' + i), subscriberId: id('sub_6'), month: m, year: y, paid: false, paidAt: null });
        }
        return { areas, boards, generators, subscribers: subs, monthlySettings: ms, payments: pays };
      })();
      const s = this.store;
      // Merge without duplicates
      const exists = (arr, id) => arr.some(x => x.id === id);
      for (const a of sample.areas) { if (!exists(s.areas, a.id)) s.areas.push(a); }
      for (const b of sample.boards) { if (!exists(s.boards, b.id)) s.boards.push(b); }
      for (const g of sample.generators) { if (!exists(s.generators, g.id)) s.generators.push(g); }
      for (const sub of sample.subscribers) { if (!exists(s.subscribers, sub.id)) s.subscribers.push(sub); }
      for (const m of sample.monthlySettings) { if (!exists(s.monthlySettings, m.id)) s.monthlySettings.push(m); }
      for (const p of sample.payments) { if (!exists(s.payments, p.id)) s.payments.push(p); }
      s._save();
      this.showToast('تم اضافة بيانات التجربة', 'success');
    }
  }
});

