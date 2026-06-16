/* ===========================================
   users.js - صفحة إدارة المستخدمين والصلاحيات
   ===========================================
   - عرض قائمة المستخدمين
   - إضافة / تعديل / حذف مستخدم
   - تحديد الصلاحيات
   - تغيير كلمة المرور
   =========================================== */

GM.registerView('users', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><span class="material-symbols-rounded">security</span> المستخدمين والصلاحيات</h2>
          <div class="subtitle">إدارة حسابات المستخدمين وصلاحياتهم</div>
        </div>
        <div class="page-actions">
          <button v-if="can('users_add')" class="btn btn-primary" @click="openAdd">
            <span class="material-symbols-rounded">add</span> اضافة مستخدم
          </button>
        </div>
      </div>

      <!-- قائمة المستخدمين -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap" style="border:none">
          <table v-if="users.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الاضافة</th>
                <th v-if="can('users_edit') || can('users_delete')">الاجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in users" :key="u.id">
                <td>{{ i + 1 }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:.4rem">
                    <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:#fff;background:var(--primary)" :style="{background: getRoleColor(u.role)}">
                      {{ u.name.charAt(0) }}
                    </div>
                    <strong>{{ u.name }}</strong>
                  </div>
                </td>
                <td dir="ltr" style="font-size:.8rem">{{ u.username }}</td>
                <td>
                  <span class="badge badge-primary" :style="{background: getRoleColor(u.role) + '22', color: getRoleColor(u.role)}">
                    {{ getRoleName(u.role) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="u.active ? 'badge-success' : 'badge-danger'">
                    {{ u.active ? 'نشط' : 'موقوف' }}
                  </span>
                </td>
                <td style="font-size:.78rem">{{ u.createdAt }}</td>
                <td v-if="can('users_edit') || can('users_delete')">
                  <button v-if="can('users_edit')" class="btn btn-info btn-xs" @click="openEdit(u)"><span class="material-symbols-rounded">edit</span></button>
                  <button v-if="can('users_delete')" class="btn btn-danger btn-xs" @click="deleteUser(u)"><span class="material-symbols-rounded">delete</span></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <span class="material-symbols-rounded">group</span>
            <p>لا يوجد مستخدمين</p>
          </div>
        </div>
      </div>

      <!-- مودال اضافة/تعديل مستخدم -->
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">{{ modalMode === 'add' ? 'person_add' : 'edit' }}</span> {{ modalMode === 'add' ? 'اضافة' : 'تعديل' }} مستخدم</h3>
            <button class="modal-close" @click="closeModal"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">الاسم الكامل <span style="color:var(--danger)">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="الاسم" ref="nameInput">
              </div>
              <div class="form-group">
                <label class="form-label">اسم المستخدم <span style="color:var(--danger)">*</span></label>
                <input v-model="form.username" class="form-input" placeholder="username" dir="ltr">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ modalMode === 'add' ? 'كلمة المرور' : 'كلمة المرور (اترك فارغاً ان لم ترد التغيير)' }} <span v-if="modalMode === 'add'" style="color:var(--danger)">*</span></label>
                <input type="password" v-model="form.password" class="form-input" placeholder="********" dir="ltr">
              </div>
              <div class="form-group">
                <label class="form-label">الدور</label>
                <div class="select-wrap">
                  <select v-model="form.role" class="form-input" @change="onRoleChange">
                    <option v-for="(def, key) in roles" :key="key" :value="key">{{ def.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="toggle-row" style="cursor:pointer;display:flex;align-items:center;gap:.5rem;padding:.5rem 0">
                <input type="checkbox" v-model="form.active" style="width:18px;height:18px;accent-color:var(--primary)">
                <span style="font-weight:600;font-size:.85rem">حساب نشط</span>
              </label>
            </div>

            <!-- الصلاحيات المخصصة -->
            <div v-if="form.role === 'custom'" class="form-section">
              <div class="form-section-title"><span class="material-symbols-rounded">key</span> الصلاحيات المخصصة</div>
              <div class="permissions-grid">
                <div v-for="(pName, pKey) in allPerms" :key="pKey" class="permission-item">
                  <input type="checkbox" :value="pKey" v-model="form.customPermissions" style="width:16px;height:16px;accent-color:var(--primary)">
                  <label style="margin:0;cursor:pointer">{{ pName }}</label>
                </div>
              </div>
            </div>

            <div v-if="form.role !== 'custom'" style="padding:.5rem .65rem;background:var(--bg);border-radius:var(--radius-xs);font-size:.8rem;color:var(--text-secondary)">
              <span class="material-symbols-rounded">info</span>
              صلاحيات دور "{{ getRoleName(form.role) }}": {{ getPermCount(form.role) }} صلاحية
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="saveUser"><span class="material-symbols-rounded">save</span> حفظ</button>
            <button class="btn btn-ghost" @click="closeModal">الغاء</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      showModal: false,
      modalMode: 'add',
      editingId: null,
      form: { name: '', username: '', password: '', role: 'viewer', active: true, customPermissions: [] }
    };
  },
  computed: {
    users() { return GM.auth ? GM.auth.users : []; },
    roles() { return GM.ROLE_DEFINITIONS; },
    allPerms() { return GM.ALL_PERMISSIONS; }
  },
  methods: {
    can(p) { return GM.auth && GM.auth.hasPermission(p); },
    getRoleName(role) {
      const def = this.roles[role];
      return def ? def.name : role;
    },
    getRoleColor(role) {
      const def = this.roles[role];
      return def ? def.color : '#64748b';
    },
    getPermCount(role) {
      const def = this.roles[role];
      return def ? def.permissions.length : 0;
    },
    openAdd() {
      this.modalMode = 'add';
      this.editingId = null;
      this.form = { name: '', username: '', password: '', role: 'viewer', active: true, customPermissions: [] };
      this.showModal = true;
      this.$nextTick(() => { if (this.$refs.nameInput) this.$refs.nameInput.focus(); });
    },
    openEdit(u) {
      this.modalMode = 'edit';
      this.editingId = u.id;
      this.form = {
        name: u.name, username: u.username, password: '',
        role: u.role, active: u.active,
        customPermissions: u.customPermissions || []
      };
      this.showModal = true;
    },
    closeModal() { this.showModal = false; },
    onRoleChange() {
      if (this.form.role !== 'custom') {
        this.form.customPermissions = [];
      }
    },
    saveUser() {
      if (!this.form.name.trim()) { this.showToast('الرجاء ادخال الاسم', 'error'); return; }
      if (!this.form.username.trim()) { this.showToast('الرجاء ادخال اسم المستخدم', 'error'); return; }
      if (this.modalMode === 'add' && !this.form.password) { this.showToast('الرجاء ادخال كلمة المرور', 'error'); return; }

      const data = {
        name: this.form.name.trim(),
        username: this.form.username.trim(),
        password: this.form.password,
        role: this.form.role,
        active: this.form.active,
        customPermissions: this.form.role === 'custom' ? this.form.customPermissions : null
      };

      let result;
      if (this.modalMode === 'add') {
        result = GM.auth.addUser(data);
      } else {
        result = GM.auth.updateUser(this.editingId, data);
      }

      if (result.success) {
        this.showToast(this.modalMode === 'add' ? 'تم اضافة المستخدم' : 'تم تعديل المستخدم', 'success');
        this.closeModal();
      } else {
        this.showToast(result.error || 'حدث خطأ', 'error');
      }
    },
    deleteUser(u) {
      if (confirm(`هل انت متاكد من حذف المستخدم "${u.name}"؟`)) {
        const result = GM.auth.deleteUser(u.id);
        if (result.success) {
          this.showToast('تم حذف المستخدم', 'success');
        } else {
          this.showToast(result.error || 'حدث خطأ', 'error');
        }
      }
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});
