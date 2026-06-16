/* ===========================================
   quickpay.js - صفحة الدفع السريع
   ===========================================
   - بحث عن مشترك بالاسم او رقم الهاتف
   - عرض معلومات المشترك
   - دفع او تأجيل الدفع
   - اختيار الشهر والسنة
   =========================================== */

GM.registerView('quickpay', {
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2><i class="fas fa-hand-holding-usd"></i> دفع سريع</h2>
          <div class="subtitle">ابحث عن المشترك وسجل الدفع بسرعة</div>
        </div>
      </div>

      <!-- شريط البحث -->
      <div class="card" style="margin-bottom:1rem;padding:.85rem 1rem">
        <div class="filter-bar">
          <div class="search-input" style="flex:1;min-width:200px">
            <i class="fas fa-search"></i>
            <input v-model="searchQuery" placeholder="ابحث باسم المشترك او رقم الهاتف..." @input="searchQuery = $event.target.value" ref="searchInput">
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

      <!-- نتائج البحث -->
      <div v-if="searchQuery.trim()">
        <div v-if="searchResults.length === 0" class="card">
          <div class="empty-state" style="padding:1.5rem">
            <i class="fas fa-search"></i>
            <p>لا توجد نتائج للبحث</p>
          </div>
        </div>
        <div v-for="sub in searchResults" :key="sub.id" class="card" style="margin-bottom:.75rem;padding:0;overflow:hidden">
          <div style="padding:1rem 1rem .75rem;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
              <div>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem">
                    {{ sub.name.charAt(0) }}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:.95rem">{{ sub.name }}</div>
                    <div style="font-size:.75rem;color:var(--text-light);display:flex;gap:.5rem;flex-wrap:wrap">
                      <span dir="ltr">{{ sub.phone }}</span>
                      <span>{{ getBoardName(sub.boardId) }}</span>
                      <span>رقم الجوزة: {{ sub.connectionNumber || '-' }}</span>
                      <span class="amps-display"><i class="fas fa-bolt"></i> {{ sub.amps }} امبير</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
            <div>
              <div style="font-size:.7rem;color:var(--text-light)">المبلغ المستحق</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--primary)">
                {{ formatMoney(sub.amps * pricePerAmp) }} د.ع
              </div>
              <div style="font-size:.7rem;color:var(--text-light)">سعر الامبير: {{ formatMoney(pricePerAmp) }} د.ع</div>
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button v-if="!getPayStatus(sub.id)" class="btn btn-success" @click="doPay(sub)">
                <i class="fas fa-check"></i> دفع
              </button>
              <button v-if="getPayStatus(sub.id)" class="btn btn-warning" @click="undoPay(sub)">
                <i class="fas fa-undo"></i> الغاء الدفع
              </button>
              <button class="btn btn-info" @click="whatsApp(sub)">
                <i class="fab fa-whatsapp"></i>
              </button>
            </div>
          </div>
          <div v-if="getPayStatus(sub.id)" style="padding:.4rem 1rem;background:var(--success-light);font-size:.75rem;color:var(--success);font-weight:600">
            <i class="fas fa-check-circle"></i> تم الدفع لشهر {{ monthName(payMonth) }} {{ payYear }}
          </div>
          <div v-else style="padding:.4rem 1rem;background:var(--danger-light);font-size:.75rem;color:var(--danger);font-weight:600">
            <i class="fas fa-times-circle"></i> غير مدفوع لشهر {{ monthName(payMonth) }} {{ payYear }}
          </div>
        </div>
      </div>

      <!-- رسالة عند عدم وجود بحث -->
          <div v-if="!searchQuery.trim()" class="card">
        <div class="empty-state" style="padding:2rem">
          <i class="fas fa-search" style="font-size:3.5rem"></i>
          <p>ابحث عن المشترك باستخدام الاسم او رقم الهاتف</p>
          <p class="sub-text">ثم قم بتسديد الفاتورة بضغطة زر</p>
        </div>
      </div>

      <!-- ====== مودال سند القبض ====== -->
      <div class="modal-overlay" v-if="showReceipt" @click.self="showReceipt = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3><i class="fas fa-receipt"></i> سند قبض</h3>
            <button class="modal-close" @click="showReceipt = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" id="receiptContent">
            <div style="text-align:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px dashed var(--border)">
              <div style="font-size:1.5rem;font-weight:800;color:var(--primary)"><i class="fas fa-bolt"></i> نظام إدارة المولدات</div>
              <div style="font-size:.75rem;color:var(--text-light)">سند قبض نقدي</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.4rem;font-size:.85rem">
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">رقم السند:</span>
                <span style="font-weight:600;direction:ltr">{{ receiptData.number }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">التاريخ:</span>
                <span style="font-weight:600">{{ receiptData.date }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">اسم المشترك:</span>
                <span style="font-weight:600">{{ receiptData.name }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">رقم الهاتف:</span>
                <span style="font-weight:600" dir="ltr">{{ receiptData.phone }}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-light)">الشهر:</span>
                <span style="font-weight:600">{{ receiptData.month }}</span>
              </div>
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
              <i class="fas fa-check-circle" style="color:var(--success)"></i>
              تم الدفع بنجاح
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="printReceipt">
              <i class="fas fa-print"></i> طباعة
            </button>
            <button class="btn btn-ghost" @click="showReceipt = false">اغلاق</button>
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
      showReceipt: false,
      receiptData: { number: '', date: '', name: '', phone: '', month: '', amount: '', amps: '', pricePerAmp: '' }
    };
  },
  computed: {
    store() { return GM.store; },
    yearList() {
      const y = []; const cy = new Date().getFullYear();
      for (let i = cy - 3; i <= cy + 2; i++) y.push(i);
      return y;
    },
    pricePerAmp() { return this.store.getPricePerAmp(this.payMonth, this.payYear); },
    searchResults() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return [];
      return this.store.subscribers.filter(s =>
        s.name.toLowerCase().includes(q) || s.phone.includes(q)
      ).slice(0, 10);
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
      // Check if a subscriber was sent from subscribers page
      if (window.__quickPayTarget) {
        const sub = this.store.subscribers.find(s => s.id === window.__quickPayTarget);
        if (sub) {
          this.searchQuery = sub.name;
        }
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
      this.showToast(`تم تسديد فاتورة ${sub.name} لشهر ${this.monthName(this.payMonth)}`, 'success');
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
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Tajawal',sans-serif;padding:1.5rem;color:#0f172a;font-size:14px;direction:rtl}
          .receipt{max-width:320px;margin:0 auto}
          .header{text-align:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px dashed #e2e8f0}
          .header h1{font-size:1.3rem;color:#6366f1}
          .header p{font-size:.75rem;color:#94a3b8}
          .row{display:flex;justify-content:space-between;padding:.25rem 0;font-size:.85rem}
          .row .label{color:#64748b}
          .row .value{font-weight:600}
          .total{border-top:1px solid #e2e8f0;margin-top:.4rem;padding-top:.4rem}
          .total .value{font-size:1.1rem;color:#6366f1;font-weight:800}
          .footer{text-align:center;margin-top:.75rem;padding-top:.5rem;border-top:1px solid #e2e8f0;font-size:.75rem;color:#94a3b8}
          @media print{body{padding:1rem}.no-print{display:none}}
        </style>
        </head><body>
        <div class="receipt">
          <div class="header">
            <h1><i class="fas fa-bolt"></i> نظام إدارة المولدات</h1>
            <p>سند قبض نقدي</p>
          </div>
          <div class="row"><span class="label">رقم السند:</span><span class="value" dir="ltr">${this.receiptData.number}</span></div>
          <div class="row"><span class="label">التاريخ:</span><span class="value">${this.receiptData.date}</span></div>
          <div class="row"><span class="label">اسم المشترك:</span><span class="value">${this.receiptData.name}</span></div>
          <div class="row"><span class="label">رقم الهاتف:</span><span class="value" dir="ltr">${this.receiptData.phone}</span></div>
          <div class="row"><span class="label">الشهر:</span><span class="value">${this.receiptData.month}</span></div>
          <div class="row total"><span class="label">المبلغ:</span><span class="value">${this.receiptData.amount} د.ع</span></div>
          <div class="row" style="font-size:.75rem;color:#94a3b8">
            <span>الامبيرات: ${this.receiptData.amps}</span>
            <span>سعر الامبير: ${this.receiptData.pricePerAmp} د.ع</span>
          </div>
          <div class="footer"><i class="fas fa-check-circle" style="color:#10b981"></i> تم الدفع بنجاح</div>
        </div>
        <div class="no-print" style="text-align:center;margin-top:1rem">
          <button onclick="window.print()" style="padding:.5rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-family:Tajawal;font-size:.9rem;cursor:pointer"><i class="fas fa-print"></i> طباعة</button>
        </div>
        </body></html>
      `);
      win.document.close();
    },
    whatsApp(sub) {
      const price = this.pricePerAmp;
      const total = sub.amps * price;
      const msg = encodeURIComponent(
        `عزيزي المشترك ${sub.name}\nفاتورة شهر ${this.monthName(this.payMonth)} ${this.payYear}\n` +
        `المبلغ: ${this.formatMoney(total)} د.ع\nالرجاء التكرم بالدفع`
      );
      let phone = sub.phone.replace(/\s/g, '');
      if (phone.startsWith('0')) phone = '964' + phone.slice(1);
      else if (!phone.startsWith('964')) phone = '964' + phone;
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    },
    showToast(msg, type) { this.$emit('toast', msg, type); }
  }
});
