/* ===========================================
   messages.js - صفحة الرسائل والواتساب
   ===========================================
   معالج إرسال متكامل بـ 4 خطوات:
   1. اختيار المستلمين (مع فلترة)
   2. اختيار قالب الرسالة
   3. معاينة الرسالة
   4. إرسال عبر واتساب
   =========================================== */

GM.registerView('messages', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><span class="material-symbols-rounded">chat</span> الرسائل والإرسال</h2>
          <div class="subtitle">إرسال رسائل تذكير عبر واتساب للمشتركين</div>
        </div>
        <div class="page-actions">
          <button v-if="can('messages_templates')" class="btn btn-ghost-primary" @click="openTemplateModal">
            <span class="material-symbols-rounded">add</span> قالب جديد
          </button>
        </div>
      </div>

      <!-- ====== الخطوات ====== -->
      <div class="steps">
        <div class="step" :class="{active: step === 1, completed: step > 1}" @click="step = Math.max(step, 1)">
          <span class="step-num"><span class="material-symbols-rounded">{{ step > 1 ? 'check' : '' }}</span></span>
          <span class="step-text">اختيار المستلمين</span>
        </div>
        <div class="step" :class="{active: step === 2, completed: step > 2}" @click="step = Math.max(step, selectedCount > 0 ? 2 : 1)">
          <span class="step-num"><span class="material-symbols-rounded">{{ step > 2 ? 'check' : '' }}</span></span>
          <span class="step-text">قالب الرسالة</span>
        </div>
        <div class="step" :class="{active: step === 3, completed: step > 3}" @click="step = Math.max(step, selectedCount > 0 ? 3 : 1)">
          <span class="step-num"><span class="material-symbols-rounded">{{ step > 3 ? 'check' : '' }}</span></span>
          <span class="step-text">المعاينة</span>
        </div>
        <div class="step" :class="{active: step === 4}" @click="step = Math.max(step, selectedCount > 0 ? 4 : 1)">
          <span class="step-num"><span class="material-symbols-rounded">send</span></span>
          <span class="step-text">الإرسال</span>
        </div>
      </div>

      <!-- ====== الخطوة 1: اختيار المستلمين ====== -->
      <div class="step-content" v-if="step === 1">
        <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
          <div class="filter-bar">
            <div class="form-group" style="min-width:130px">
              <div class="form-label">الحالة</div>
              <div class="select-wrap">
                <select v-model="filterStatus" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                  <option value="unpaid">غير مدفوع (متاخر)</option>
                  <option value="paid">مدفوع فقط</option>
                  <option value="">الكل</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="min-width:130px">
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
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <div class="card-header" style="padding:.6rem .85rem;margin:0">
            <div style="display:flex;align-items:center;gap:.5rem">
              <label class="checkbox-all" style="padding:0;border:none;margin:0;gap:.4rem;cursor:pointer" @click="toggleSelectAll">
                <input type="checkbox" :checked="allSelected" @click.stop="toggleSelectAll" style="width:16px;height:16px;accent-color:var(--primary)">
                <span style="font-size:.85rem">اختيار الكل</span>
              </label>
            </div>
            <span style="font-size:.8rem;color:var(--text-light)">تم اختيار <strong style="color:var(--primary)">{{ selectedCount }}</strong> من {{ candidateList.length }}</span>
          </div>
          <div class="checkbox-list" style="max-height:300px">
            <div v-for="item in candidateList" :key="item.subscriberId" class="checkbox-item" @click="toggleSelect(item.subscriberId)">
              <input type="checkbox" :checked="selectedIds.includes(item.subscriberId)" @click.stop="toggleSelect(item.subscriberId)" style="width:18px;height:18px;accent-color:var(--primary)">
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-sub">
                  {{ getBoardName(item.boardId) }} | {{ item.amps }} امبير |
                  المبلغ: {{ formatMoney(item.total) }} |
                  <span :style="{color: item.paid ? 'var(--success)' : 'var(--danger)'}">
                    {{ item.paid ? 'مدفوع' : 'غير مدفوع' }}
                  </span>
                </div>
              </div>
              <span v-if="item.paid" class="badge badge-success">مدفوع</span>
              <span v-else class="badge badge-danger">غير مدفوع</span>
            </div>
          </div>
          <div v-if="candidateList.length === 0" class="empty-state" style="padding:1.5rem">
            <span class="material-symbols-rounded">group</span>
            <p>لا يوجد مشتركين مطابقين للفلترة</p>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-primary" :disabled="selectedCount === 0" @click="step = 2">
            التالي <span class="material-symbols-rounded">arrow_back</span>
          </button>
        </div>
      </div>

      <!-- ====== الخطوة 2: اختيار قالب الرسالة ====== -->
      <div class="step-content" v-if="step === 2">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">mail</span> قوالب الرسائل</h3>
            <span v-if="templates.length === 0" style="font-size:.8rem;color:var(--text-light)">لا توجد قوالب</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            <div v-for="t in templates" :key="t.id" class="template-card" :class="{active: selectedTemplateId === t.id}" @click="selectedTemplateId = t.id">
              <div class="template-title">
                <span class="material-symbols-rounded">message</span> {{ t.title }}
              </div>
              <div class="template-body" style="white-space:pre-wrap">{{ t.body }}</div>
              <div v-if="can('messages_templates')" class="template-actions">
                <button class="btn btn-info btn-xs" @click.stop="editTemplate(t)"><span class="material-symbols-rounded">edit</span></button>
                <button class="btn btn-danger btn-xs" @click.stop="deleteTemplate(t)"><span class="material-symbols-rounded">delete</span></button>
              </div>
            </div>
          </div>
          <button v-if="can('messages_templates') && templates.length > 0" class="btn btn-ghost btn-sm" @click="openTemplateModal" style="margin-top:.75rem;width:100%">
            <span class="material-symbols-rounded">add</span> اضافة قالب جديد
          </button>
        </div>

        <!-- معاينة القالب -->
        <div class="card" v-if="selectedTemplate">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">visibility</span> معاينة القالب</h3>
          </div>
          <div style="background:var(--bg);padding:.85rem;border-radius:var(--radius-sm);white-space:pre-wrap;font-size:.85rem;line-height:1.7" v-html="previewText"></div>
          <div style="margin-top:.5rem;font-size:.75rem;color:var(--text-light)">
            <span class="material-symbols-rounded">info</span> سيتم استبدال {name} باسم المشترك و {month} باسم الشهر و {amount} بالمبلغ
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-ghost" @click="step = 1"><span class="material-symbols-rounded">arrow_forward</span> السابق</button>
          <button class="btn btn-primary" :disabled="!selectedTemplate || selectedCount === 0" @click="step = 3">
            التالي <span class="material-symbols-rounded">arrow_back</span>
          </button>
        </div>
      </div>

      <!-- ====== الخطوة 3: المعاينة النهائية ====== -->
      <div class="step-content" v-if="step === 3">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <h3><span class="material-symbols-rounded">list</span> ملخص الإرسال</h3>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.85rem">
            <div style="padding:.5rem;background:var(--bg);border-radius:var(--radius-xs)">
              <div style="font-size:.7rem;color:var(--text-light)">عدد المستلمين</div>
              <div style="font-weight:700;font-size:1.1rem;color:var(--primary)">{{ selectedCount }}</div>
            </div>
            <div style="padding:.5rem;background:var(--bg);border-radius:var(--radius-xs)">
              <div style="font-size:.7rem;color:var(--text-light)">قالب الرسالة</div>
              <div style="font-weight:700">{{ selectedTemplate ? selectedTemplate.title : '-' }}</div>
            </div>
            <div style="padding:.5rem;background:var(--bg);border-radius:var(--radius-xs)">
              <div style="font-size:.7rem;color:var(--text-light)">الشهر</div>
              <div style="font-weight:700">{{ monthName(filterMonth) }} {{ filterYear }}</div>
            </div>
            <div style="padding:.5rem;background:var(--bg);border-radius:var(--radius-xs)">
              <div style="font-size:.7rem;color:var(--text-light)">المبلغ الاجمالي</div>
              <div style="font-weight:700;color:var(--danger)">{{ formatMoney(selectedTotal) }}</div>
            </div>
          </div>
        </div>

        <!-- قائمة المستلمين النهائية -->
        <div class="card" style="padding:0;overflow:hidden">
          <div class="card-header" style="padding:.6rem .85rem;margin:0">
            <h3 style="font-size:.9rem"><span class="material-symbols-rounded">group</span> المستلمون ({{ selectedCount }})</h3>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr><th>الاسم</th><th>الهاتف</th><th>المبلغ</th><th>معاينة</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedList" :key="item.subscriberId">
                  <td><strong>{{ item.name }}</strong></td>
                  <td dir="ltr">{{ item.phone }}</td>
                  <td>{{ formatMoney(item.total) }}</td>
                  <td>
                    <button class="btn btn-info btn-xs" @click="previewForSub(item)" title="معاينة الرسالة لهذا المشترك">
                      <span class="material-symbols-rounded">visibility</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-ghost" @click="step = 2"><span class="material-symbols-rounded">arrow_forward</span> السابق</button>
          <button class="btn btn-primary" @click="step = 4" :disabled="selectedCount === 0">
            الارسال <span class="material-symbols-rounded">arrow_back</span>
          </button>
        </div>
      </div>

      <!-- ====== الخطوة 4: الإرسال ====== -->
      <div class="step-content" v-if="step === 4">
        <div class="card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:.5rem">
            <span class="material-symbols-rounded" style="color:#25D366">chat</span>
          </div>
          <h3 style="font-size:1.1rem;margin-bottom:.25rem">جاهز للإرسال!</h3>
          <p style="color:var(--text-secondary);font-size:.85rem;margin-bottom:1.5rem">
            سيتم إرسال رسالة واتساب إلى {{ selectedCount }} مشترك
          </p>
          <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-whatsapp btn-lg" @click="sendAll">
              <span class="material-symbols-rounded">chat</span> إرسال الكل عبر واتساب
            </button>
            <button class="btn btn-primary btn-lg" @click="copyAllMessages">
              <span class="material-symbols-rounded">content_copy</span> نسخ جميع الرسائل
            </button>
          </div>
          <div style="margin-top:1rem;font-size:.8rem;color:var(--text-light)">
            <span class="material-symbols-rounded">info</span> سيتم فتح واتساب لكل مشترك في نافذة جديدة
          </div>
        </div>

        <!-- قائمة الإرسال -->
        <div class="card" style="margin-top:1rem;padding:0;overflow:hidden">
          <div class="card-header" style="padding:.6rem .85rem;margin:0">
            <h3 style="font-size:.9rem"><span class="material-symbols-rounded">list</span> قائمة الإرسال</h3>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>المبلغ</th><th>الإرسال</th><th>نسخ</th></tr></thead>
              <tbody>
                <tr v-for="(item, i) in selectedList" :key="item.subscriberId">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ item.name }}</strong></td>
                  <td dir="ltr">{{ item.phone }}</td>
                  <td>{{ formatMoney(item.total) }}</td>
                  <td>
                    <button class="btn btn-whatsapp btn-xs" @click="sendOne(item)" title="ارسال">
                      <span class="material-symbols-rounded">chat</span>
                    </button>
                  </td>
                  <td>
                    <button class="btn btn-info btn-xs" @click="copyOne(item)" title="نسخ">
                      <span class="material-symbols-rounded">content_copy</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-ghost" @click="step = 3"><span class="material-symbols-rounded">arrow_forward</span> السابق</button>
          <button class="btn btn-ghost" @click="resetWizard"><span class="material-symbols-rounded">refresh</span> بدء جديد</button>
        </div>
      </div>

      <!-- ====== مودال القالب ====== -->
      <div class="modal-overlay" v-if="showTemplateModal" @click.self="showTemplateModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">mail</span> {{ templateModalMode === 'add' ? 'قالب جديد' : 'تعديل القالب' }}</h3>
            <button class="modal-close" @click="showTemplateModal = false"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">عنوان القالب</label>
              <input v-model="templateForm.title" class="form-input" placeholder="مثال: تذكير بالدفع" ref="tmplInput">
            </div>
            <div class="form-group">
              <label class="form-label">نص الرسالة</label>
              <textarea v-model="templateForm.body" class="form-input" rows="6" placeholder="اكتب نص الرسالة... يمكنك استخدام {name} لاسم المشترك و {month} لاسم الشهر و {amount} للمبلغ"></textarea>
            </div>
            <div style="font-size:.75rem;color:var(--text-light);background:var(--bg);padding:.5rem .65rem;border-radius:var(--radius-xs)">
              <strong>المتغيرات المتاحة:</strong>
              <code style="background:var(--border);padding:.05rem .3rem;border-radius:3px">{name}</code> اسم المشترك
              <code style="background:var(--border);padding:.05rem .3rem;border-radius:3px">{month}</code> الشهر
              <code style="background:var(--border);padding:.05rem .3rem;border-radius:3px">{amount}</code> المبلغ
              <code style="background:var(--border);padding:.05rem .3rem;border-radius:3px">{amps}</code> عدد الامبيرات
              <code style="background:var(--border);padding:.05rem .3rem;border-radius:3px">{phone}</code> رقم الهاتف
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveTemplate"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="showTemplateModal = false">الغاء</button>
          </div>
        </div>
      </div>

      <!-- مودال معاينة رسالة لمشترك -->
      <div class="modal-overlay" v-if="showPreview" @click.self="showPreview = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">visibility</span> معاينة الرسالة</h3>
            <button class="modal-close" @click="showPreview = false"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom:.5rem">
              <span style="font-weight:600">إلى:</span> {{ previewSub ? previewSub.name : '' }}
              <span dir="ltr" style="margin-right:.5rem;color:var(--text-light)">({{ previewSub ? previewSub.phone : '' }})</span>
            </div>
            <div style="background:var(--bg);padding:.85rem;border-radius:var(--radius-sm);white-space:pre-wrap;font-size:.85rem;line-height:1.7" v-html="previewSubText"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-whatsapp" @click="sendOne(previewSub)" v-if="previewSub"><span class="material-symbols-rounded">chat</span> إرسال</button>
            <button class="btn btn-ghost" @click="showPreview = false">اغلاق</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      step: 1,
      filterStatus: 'unpaid',
      filterMonth: now.getMonth() + 1,
      filterYear: now.getFullYear(),
      filterBoard: '',
      filterArea: '',
      selectedIds: [],
      selectedTemplateId: null,
      showTemplateModal: false,
      templateModalMode: 'add',
      templateEditingId: null,
      templateForm: { title: '', body: '' },
      showPreview: false,
      previewSub: null
    };
  },
  computed: {
    store() { return GM.store; },
    templates() { return this.store.messageTemplates; },
    areas() { return this.store.areas; },
    boards() { return this.store.boards; },
    yearList() {
      const y = []; const cy = new Date().getFullYear();
      for (let i = cy - 3; i <= cy + 2; i++) y.push(i);
      return y;
    },
    // All candidates based on filters
    candidateList() {
      return this.store.getBillingList(this.filterMonth, this.filterYear, '', this.filterBoard)
        .filter(item => {
          if (this.filterStatus === 'paid') return item.paid;
          if (this.filterStatus === 'unpaid') return !item.paid;
          return true;
        })
        .filter(item => {
          if (!this.filterArea) return true;
          const board = this.boards.find(b => b.id === item.boardId);
          return board && board.areaId === this.filterArea;
        })
        .filter(item => item.phone && item.phone.trim());
    },
    allSelected() {
      return this.candidateList.length > 0 && this.selectedIds.length === this.candidateList.length;
    },
    selectedCount() { return this.selectedIds.length; },
    selectedTemplate() {
      return this.templates.find(t => t.id === this.selectedTemplateId);
    },
    // All selected subscriber objects
    selectedList() {
      return this.candidateList.filter(item => this.selectedIds.includes(item.subscriberId));
    },
    selectedTotal() {
      return this.selectedList.reduce((s, i) => s + i.total, 0);
    },
    // Preview text with first selected subscriber
    previewText() {
      if (!this.selectedTemplate || this.selectedList.length === 0) return '';
      const first = this.selectedList[0];
      return this.fillTemplate(this.selectedTemplate.body, first);
    },
    previewSubText() {
      if (!this.selectedTemplate || !this.previewSub) return '';
      return this.fillTemplate(this.selectedTemplate.body, this.previewSub);
    }
  },
  watch: {
    filterStatus() { this.selectedIds = []; },
    filterMonth() { this.selectedIds = []; },
    filterYear() { this.selectedIds = []; },
    filterBoard() { this.selectedIds = []; },
    filterArea() { this.selectedIds = []; }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getBoardName(id) { return this.store.getBoardName(id); },
    fillTemplate(body, sub) {
      if (!sub) return body;
      return body
        .replace(/{name}/g, sub.name)
        .replace(/{month}/g, this.monthName(this.filterMonth))
        .replace(/{amount}/g, this.formatMoney(sub.total))
        .replace(/{amps}/g, sub.amps)
        .replace(/{phone}/g, sub.phone || '');
    },
    toggleSelect(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx > -1) this.selectedIds.splice(idx, 1);
      else this.selectedIds.push(id);
    },
    toggleSelectAll() {
      if (this.allSelected) {
        this.selectedIds = [];
      } else {
        this.selectedIds = this.candidateList.map(item => item.subscriberId);
      }
    },
    // Template CRUD
    openTemplateModal() {
      this.templateModalMode = 'add';
      this.templateEditingId = null;
      this.templateForm = { title: '', body: '' };
      this.showTemplateModal = true;
      this.$nextTick(() => { if (this.$refs.tmplInput) this.$refs.tmplInput.focus(); });
    },
    editTemplate(t) {
      this.templateModalMode = 'edit';
      this.templateEditingId = t.id;
      this.templateForm = { title: t.title, body: t.body };
      this.showTemplateModal = true;
    },
    deleteTemplate(t) {
      if (confirm(`هل انت متاكد من حذف القالب "${t.title}"؟`)) {
        this.store.deleteMessageTemplate(t.id);
        if (this.selectedTemplateId === t.id) this.selectedTemplateId = null;
        this.showToast('تم حذف القالب', 'success');
      }
    },
    saveTemplate() {
      if (!this.templateForm.title.trim()) { this.showToast('الرجاء ادخال عنوان القالب', 'error'); return; }
      if (!this.templateForm.body.trim()) { this.showToast('الرجاء ادخال نص الرسالة', 'error'); return; }
      if (this.templateModalMode === 'add') {
        this.store.addMessageTemplate(this.templateForm.title, this.templateForm.body);
        this.showToast('تم اضافة القالب', 'success');
      } else {
        this.store.updateMessageTemplate(this.templateEditingId, this.templateForm.title, this.templateForm.body);
        this.showToast('تم تعديل القالب', 'success');
      }
      this.showTemplateModal = false;
    },
    // Preview for a specific subscriber
    previewForSub(item) {
      this.previewSub = item;
      this.showPreview = true;
    },
    // Normalize phone to international format
    normalizePhone(phone) {
      let p = phone.replace(/\s/g, '');
      if (p.startsWith('0')) p = '964' + p.slice(1);
      else if (!p.startsWith('964') && !p.startsWith('+')) p = '964' + p;
      return p.replace(/^\+/, '');
    },
    // Send to one subscriber
    sendOne(item) {
      if (!this.selectedTemplate) {
        this.showToast('الرجاء اختيار قالب الرسالة', 'error');
        return;
      }
      const msg = this.fillTemplate(this.selectedTemplate.body, item);
      const phone = this.normalizePhone(item.phone);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    },
    // Send to all
    sendAll() {
      if (this.selectedList.length === 0) return;
      // Send the first one and open others in tabs with delay
      this.sendOne(this.selectedList[0]);
      for (let i = 1; i < this.selectedList.length; i++) {
        setTimeout(() => {
          this.sendOne(this.selectedList[i]);
        }, i * 1000);
      }
      this.showToast(`تم فتح ${this.selectedList.length} نافذة واتساب`, 'success');
    },
    // Copy message for one subscriber
    copyOne(item) {
      if (!this.selectedTemplate) { this.showToast('الرجاء اختيار قالب', 'error'); return; }
      const msg = this.fillTemplate(this.selectedTemplate.body, item);
      navigator.clipboard.writeText(msg).then(() => {
        this.showToast('تم نسخ الرسالة', 'success');
      }).catch(() => {
        this.showToast('فشل النسخ', 'error');
      });
    },
    // Copy all messages
    copyAllMessages() {
      const texts = this.selectedList.map(item => {
        return this.fillTemplate(this.selectedTemplate.body, item);
      }).join('\n\n---\n\n');
      navigator.clipboard.writeText(texts).then(() => {
        this.showToast('تم نسخ جميع الرسائل', 'success');
      }).catch(() => {
        this.showToast('فشل النسخ', 'error');
      });
    },
    resetWizard() {
      this.step = 1;
      this.selectedIds = [];
      this.selectedTemplateId = null;
    },
    showToast(msg, type) {
      this.$emit('toast', msg, type);
    }
  },
  mounted() {
    if (window.__msgTargetSubId) {
      const subId = window.__msgTargetSubId;
      const targetMonth = window.__msgTargetMonth;
      const targetYear = window.__msgTargetYear;
      // Clear globals
      window.__msgTargetSubId = null;
      window.__msgTargetMonth = null;
      window.__msgTargetYear = null;
      // Set filters
      if (targetMonth) this.filterMonth = targetMonth;
      if (targetYear) this.filterYear = targetYear;
      this.filterStatus = '';
      this.$nextTick(() => {
        this.selectedIds = [subId];
        if (this.selectedCount > 0) this.step = 2;
      });
    }
  }
});
