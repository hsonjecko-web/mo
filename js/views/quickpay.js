/* ===========================================
   quickpay.js - صفحة الدفع السريع
   =========================================== */

GM.registerView('quickpay', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><span class="material-symbols-rounded">volunteer_activism</span> دفع سريع</h2>
          <div class="subtitle">ابحث عن المشترك وسجل الدفع بسرعة</div>
        </div>
      </div>

      <!-- شريط البحث والتحكم -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="search-input" style="flex:1;min-width:200px">
            <span class="material-symbols-rounded">search</span>
            <input v-model="searchQuery" placeholder="ابحث باسم المشترك او رقم الهاتف..." ref="searchInput">
          </div>
          <div class="form-group" style="min-width:110px">
            <div class="form-label">الشهر</div>
            <div class="select-wrap">
              <select v-model.number="payMonth" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="min-width:90px">
            <div class="form-label">السنة</div>
            <div class="select-wrap">
              <select v-model.number="payYear" class="form-input" style="padding-top:.35rem;padding-bottom:.35rem">
                <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- قائمة المشتركين الغير دافعين -->
      <div v-if="displayList.length > 0" class="sub-list">
        <div v-for="sub in displayList" :key="sub.id" class="sub-card" @click="openPay(sub)" style="cursor:pointer">
          <div class="sub-bar" style="background:var(--danger)"></div>
          <div class="sub-info">
            <div class="sub-name">{{ sub.name }}</div>
            <div class="sub-meta">
              <span class="amps-badge"><span class="material-symbols-rounded">bolt</span> {{ sub.amps }} أمبير</span>
              <span><span class="material-symbols-rounded">layers</span> {{ getBoardName(sub.boardId) }}</span>
              <span dir="ltr"><span class="material-symbols-rounded">phone</span> {{ sub.phone }}</span>
            </div>
          </div>
          <div class="sub-amps" style="flex-direction:column;align-items:flex-end;gap:2px">
            <div style="font-size:.7rem;font-weight:700;color:var(--danger)">{{ formatMoney(sub.amps * pricePerAmp) }}</div>
            <button class="btn btn-info btn-xs" @click.stop="whatsApp(sub)" title="رسالة"><span class="material-symbols-rounded">chat</span></button>
          </div>
        </div>
      </div>

      <!-- رسالة لا يوجد متأخرين -->
      <div v-if="displayList.length === 0" class="card">
        <div class="empty-state" style="padding:2rem">
          <span class="material-symbols-rounded" style="font-size:3rem">check_circle</span>
          <p>جميع المشتركين مسددين لهذا الشهر</p>
        </div>
      </div>

      <!-- مودال تأكيد الدفع -->
      <div class="modal-overlay" v-if="payTarget" @click.self="payTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">check_circle</span> تأكيد الدفع</h3>
            <button class="modal-close" @click="payTarget = null"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:.5rem;font-size:.9rem">
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">الاسم:</span>
                <span style="font-weight:700">{{ payTarget.name }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">عدد الامبيرات:</span>
                <span style="font-weight:700">{{ payTarget.amps }} أمبير</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">سعر الامبير:</span>
                <span style="font-weight:700">{{ formatMoney(pricePerAmp) }} د.ع</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:.5rem;border-top:1px solid var(--border);margin-top:.25rem">
                <span style="font-weight:700;font-size:1rem">المبلغ المستحق:</span>
                <span style="font-weight:800;font-size:1.3rem;color:var(--primary)">{{ formatMoney(payTarget.amps * pricePerAmp) }} د.ع</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" @click="confirmPay"><span class="material-symbols-rounded">check</span> تأكيد الدفع</button>
            <button class="btn btn-ghost" @click="payTarget = null">إلغاء</button>
          </div>
        </div>
      </div>

      <!-- مودال سند القبض -->
      <div class="modal-overlay" v-if="showReceipt" @click.self="showReceipt = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">receipt</span> سند قبض</h3>
            <button class="modal-close" @click="showReceipt = false"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body" id="receiptContent">
            <div style="text-align:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px dashed var(--border)">
              <div style="font-size:1.3rem;font-weight:800;color:var(--primary)"><span class="material-symbols-rounded">bolt</span> نظام إدارة المولدات</div>
              <div style="font-size:.75rem;color:var(--text-light)">سند قبض نقدي</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.4rem;font-size:.85rem">
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-light)">رقم السند:</span><span style="font-weight:600;direction:ltr">{{ receiptData.number }}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-light)">التاريخ:</span><span style="font-weight:600">{{ receiptData.date }}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-light)">الاسم:</span><span style="font-weight:600">{{ receiptData.name }}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-light)">الهاتف:</span><span style="font-weight:600" dir="ltr">{{ receiptData.phone }}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:var(--text-light)">الشهر:</span><span style="font-weight:600">{{ receiptData.month }}</span></div>
              <div style="display:flex;justify-content:space-between;padding-top:.4rem;border-top:1px solid var(--border);margin-top:.4rem">
                <span style="font-weight:700;font-size:.9rem">المبلغ:</span>
                <span style="font-weight:800;font-size:1.1rem;color:var(--primary)">{{ receiptData.amount }} د.ع</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-light)">
                <span>عدد الامبيرات: {{ receiptData.amps }}</span>
                <span>سعر الامبير: {{ receiptData.pricePerAmp }} د.ع</span>
              </div>
            </div>
            <div style="margin-top:.75rem;padding-top:.5rem;border-top:1px solid var(--border);font-size:.75rem;color:var(--text-light);text-align:center">
              <span class="material-symbols-rounded" style="color:var(--success)">check_circle</span> تم الدفع بنجاح
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="printReceipt"><span class="material-symbols-rounded">print</span> طباعة</button>
            <button class="btn btn-ghost" @click="showReceipt = false">اغلاق</button>
          </div>
        </div>
      </div>

      <!-- مودال اختيار قالب الرسالة -->
      <div class="modal-overlay" v-if="showTemplatePicker && templatePickSub" @click.self="closeTemplatePicker">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><span class="material-symbols-rounded">chat</span> اختر قالب الرسالة</h3>
            <button class="modal-close" @click="closeTemplatePicker"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body">
            <div v-if="templates.length === 0" class="empty-state" style="padding:1rem">
              <p>لا توجد قوالب رسائل متاحة</p>
            </div>
            <div v-for="t in templates" :key="t.id" class="template-card" @click="sendWhatsAppWithTemplate(t)" style="cursor:pointer;margin-bottom:.4rem">
              <div class="template-title">
                <span class="material-symbols-rounded" style="color:var(--primary);font-size:1rem">mail</span>
                <span>{{ t.title }}</span>
              </div>
              <div class="template-body" style="white-space:pre-wrap;font-size:.78rem">{{ t.body }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      searchQuery: '',
      payMonth: now.getMonth() + 1,
      payYear: now.getFullYear(),
      payTarget: null,
      showReceipt: false,
      receiptData: { number: '', date: '', name: '', phone: '', month: '', amount: '', amps: '', pricePerAmp: '' },
      showTemplatePicker: false,
      templatePickSub: null,
      selectedTemplate: null
    };
  },
  computed: {
    store() { return GM.store; },
    subscribers() { return this.store.subscribers; },
    yearList() {
      const y = []; const cy = new Date().getFullYear();
      for (let i = cy - 3; i <= cy + 2; i++) y.push(i);
      return y;
    },
    pricePerAmp() { return this.store.getPricePerAmp(this.payMonth, this.payYear); },
    templates() { return this.store.messageTemplates; },
    displayList() {
      const q = this.searchQuery.trim().toLowerCase();
      let list = this.store.subscribers;
      if (q) {
        list = list.filter(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
        );
      }
      return list.filter(s => !this.getPayStatus(s.id)).slice(0, 50);
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
      if (window.__quickPayTarget) {
        const sub = this.store.subscribers.find(s => s.id === window.__quickPayTarget);
        if (sub) this.searchQuery = sub.name;
        window.__quickPayTarget = null;
      }
    });
  },
  methods: {
    monthName(m) { return GM.helpers.monthName(m); },
    formatMoney(n) { return GM.helpers.formatMoney(n); },
    getBoardName(id) { return this.store.getBoardName(id); },
    getPayStatus(subId) {
      const p = this.store.getPayment(subId, this.payMonth, this.payYear);
      return p ? p.paid : false;
    },
    openPay(sub) {
      this.payTarget = sub;
    },
    confirmPay() {
      if (!this.payTarget) return;
      const sub = this.payTarget;
      this.payTarget = null;
      this.doPay(sub);
    },
    doPay(sub) {
      this.store.togglePayment(sub.id, this.payMonth, this.payYear, true);
      const price = this.pricePerAmp;
      const total = sub.amps * price;
      this.receiptData = {
        number: 'RCP-' + Date.now().toString(36).toUpperCase(),
        date: GM.helpers.today(),
        name: sub.name,
        phone: sub.phone,
        month: this.monthName(this.payMonth) + ' ' + this.payYear,
        amount: GM.helpers.formatMoney(total),
        amps: sub.amps,
        pricePerAmp: GM.helpers.formatMoney(price)
      };
      this.showReceipt = true;
      this.showToast(`تم تسديد فاتورة ${sub.name}`, 'success');
    },
    undoPay(sub) {
      this.store.togglePayment(sub.id, this.payMonth, this.payYear, false);
      this.showToast(`تم الغاء تسديد ${sub.name}`, 'warning');
    },
    printReceipt() {
      const win = window.open('', '_blank');
      if (!win) { this.showToast('الرجاء السماح بالنوافذ المنبثقة', 'error'); return; }
      const content = document.getElementById('receiptContent');
      if (!content) return;
      win.document.write(`
        <!DOCTYPE html><html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><title>سند قبض</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Cairo',sans-serif;padding:1.5rem;color:#0f172a;font-size:14px;direction:rtl}
          .receipt{max-width:320px;margin:0 auto}
          .header{text-align:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px dashed #e2e8f0}
          .header h1{font-size:1.3rem;color:#6366f1}
          .header p{font-size:.75rem;color:#94a3b8}
          .row{display:flex;justify-content:space-between;padding:.25rem 0;font-size:.85rem}
          .row .label{color:#64748b}
          .row .value{font-weight:600}
          .total{border-top:1px solid #e2e8f0;margin-top:.4rem;padding-top:.4rem;font-size:1.1rem;color:#6366f1;font-weight:800}
          .footer{text-align:center;margin-top:.75rem;padding-top:.5rem;border-top:1px solid #e2e8f0;font-size:.75rem;color:#94a3b8}
          @media print{body{padding:1rem}.no-print{display:none}}
        </style>
        </head><body>
        <div class="receipt">
          <div class="header"><h1><span class="material-symbols-rounded">bolt</span> نظام إدارة المولدات</h1><p>سند قبض نقدي</p></div>
          <div class="row"><span class="label">رقم السند:</span><span class="value" dir="ltr">${this.receiptData.number}</span></div>
          <div class="row"><span class="label">التاريخ:</span><span class="value">${this.receiptData.date}</span></div>
          <div class="row"><span class="label">الاسم:</span><span class="value">${this.receiptData.name}</span></div>
          <div class="row"><span class="label">الهاتف:</span><span class="value" dir="ltr">${this.receiptData.phone}</span></div>
          <div class="row"><span class="label">الشهر:</span><span class="value">${this.receiptData.month}</span></div>
          <div class="row total"><span class="label">المبلغ:</span><span>${this.receiptData.amount} د.ع</span></div>
          <div class="row" style="font-size:.75rem;color:#94a3b8"><span>الامبيرات: ${this.receiptData.amps}</span><span>سعر الامبير: ${this.receiptData.pricePerAmp} د.ع</span></div>
          <div class="footer"><span class="material-symbols-rounded" style="color:#10b981">check_circle</span> تم الدفع بنجاح</div>
        </div>
        <div class="no-print" style="text-align:center;margin-top:1rem">
          <button onclick="window.print()" style="padding:.5rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-family:Cairo;font-size:.9rem;cursor:pointer"><span class="material-symbols-rounded">print</span> طباعة</button>
        </div>
        </body></html>
      `);
      win.document.close();
    },
    whatsApp(sub) {
      this.templatePickSub = sub;
      this.showTemplatePicker = true;
    },
    closeTemplatePicker() {
      this.showTemplatePicker = false;
      this.templatePickSub = null;
      this.selectedTemplate = null;
    },
    sendWhatsAppWithTemplate(t) {
      const sub = this.templatePickSub;
      if (!sub) return;
      const body = this.fillTemplate(t.body, sub);
      const phone = this.normalizePhone(sub.phone);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank');
      this.closeTemplatePicker();
    },
    fillTemplate(body, sub) {
      if (!sub) return body;
      return body
        .replace(/{name}/g, sub.name)
        .replace(/{month}/g, this.monthName(this.payMonth))
        .replace(/{amount}/g, this.formatMoney(sub.amps * this.pricePerAmp))
        .replace(/{amps}/g, sub.amps)
        .replace(/{phone}/g, sub.phone || '');
    },
    normalizePhone(phone) {
      let p = phone.replace(/\s/g, '');
      if (p.startsWith('0')) p = '964' + p.slice(1);
      else if (!p.startsWith('964') && !p.startsWith('+')) p = '964' + p;
      return p.replace(/^\+/, '');
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});

