/* ===========================================
   data.js - إدارة البيانات والتخزين المحلي
   ===========================================
   هذا الملف يحتوي على:
   - إنشاء التخزين المؤقت (reactive store)
   - دوال المساعدة (helpers)
   - حفظ واسترجاع البيانات من localStorage
   =========================================== */

const STORAGE_KEY = 'gm_v2_data';

// --- Global Namespace & Registration ---
const GM = window.GM || {};
GM.components = {};
GM.views = {};
GM.registerComponent = function (name, def) {
  GM.components[name] = def;
};
GM.registerView = function (name, def) {
  GM.views[name] = def;
};

// --- Helper Functions ---
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthName(m) {
  const names = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
                 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
  return names[m - 1] || m;
}

function formatMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US');
}

// --- Default Data Structure ---
function getDefaultData() {
  return {
    areas: [],
    boards: [],
    generators: [],
    subscribers: [],
    monthlySettings: [],
    payments: [],
    expenses: [],
    expenseCategories: [],
    messageTemplates: [
      {
        id: 'default_1',
        title: 'تذكير بالدفع',
        body: 'عزيزي المشترك {name}\nنود اعلامك بوجود فاتورة غير مسددة لشهر {month} بقيمة {amount} دينار عراقي\nيرجى التكرم بالدفع في اقرب وقت\nشكرا لتعاونكم'
      },
      {
        id: 'default_2',
        title: 'اشعار قطع الخدمة',
        body: 'عزيزي المشترك {name}\nنود اعلامك انه في حال عدم دفع فاتورة شهر {month} بقيمة {amount} دينار عراقي سيتم قطع الخدمة\nيرجى مراجعة مكتب الادارة\nشكرا'
      }
    ],
    defaultPricePerAmp: 1500,
    generatorDetails: {}
  };
}

// --- Load / Save ---
GM.loadData = function () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load data:', e);
  }
  return null;
};

GM.saveData = function (data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
};

// --- Reactive Store using Vue reactivity ---
// We'll access Vue via the global Vue object
const { reactive, computed } = Vue;

GM.createStore = function () {
  const saved = GM.loadData();
  const defaults = getDefaultData();
  const initial = saved || defaults;

  const store = reactive({
    // --- Data ---
    areas: initial.areas || [],
    boards: initial.boards || [],
    generators: initial.generators || [],
    subscribers: initial.subscribers || [],
    monthlySettings: initial.monthlySettings || [],
    payments: initial.payments || [],
    expenses: initial.expenses || [],
    expenseCategories: initial.expenseCategories || [],
    messageTemplates: initial.messageTemplates || defaults.messageTemplates,
    defaultPricePerAmp: initial.defaultPricePerAmp || 1500,
    generatorDetails: initial.generatorDetails || {},

    // --- Auto-persist on change ---
    _save() {
      GM.saveData({
        areas: this.areas,
        boards: this.boards,
        generators: this.generators,
        subscribers: this.subscribers,
        monthlySettings: this.monthlySettings,
        payments: this.payments,
        expenses: this.expenses,
        expenseCategories: this.expenseCategories,
        messageTemplates: this.messageTemplates,
        defaultPricePerAmp: this.defaultPricePerAmp,
        generatorDetails: this.generatorDetails
      });
    },

    // ========== CRUD: Areas ==========
    addArea(name) {
      this.areas.push({ id: genId(), name: name.trim(), createdAt: today() });
      this._save();
    },
    updateArea(id, name) {
      const item = this.areas.find(a => a.id === id);
      if (item) { item.name = name.trim(); this._save(); }
    },
    deleteArea(id) {
      this.areas = this.areas.filter(a => a.id !== id);
      // Also remove related boards that belong to this area
      const boardIds = this.boards.filter(b => b.areaId === id).map(b => b.id);
      this.boards = this.boards.filter(b => b.areaId !== id);
      this.subscribers = this.subscribers.filter(s => !boardIds.includes(s.boardId));
      this._save();
    },
    getAreaName(id) {
      if (!id) return '-';
      const a = this.areas.find(x => x.id === id);
      return a ? a.name : 'غير معروف';
    },

    // ========== CRUD: Boards ==========
    addBoard(name, areaId) {
      this.boards.push({ id: genId(), name: name.trim(), areaId, createdAt: today() });
      this._save();
    },
    updateBoard(id, name, areaId) {
      const item = this.boards.find(b => b.id === id);
      if (item) { item.name = name.trim(); item.areaId = areaId; this._save(); }
    },
    deleteBoard(id) {
      this.boards = this.boards.filter(b => b.id !== id);
      this.subscribers = this.subscribers.filter(s => s.boardId !== id);
      this._save();
    },
    getBoardName(id) {
      if (!id) return '-';
      const b = this.boards.find(x => x.id === id);
      return b ? b.name : 'غير معروف';
    },

    // ========== CRUD: Generators ==========
    addGenerator(name, areaId, details) {
      this.generators.push({
        id: genId(), name: name.trim(), areaId,
        owner: (details && details.owner) || '',
        ownerPhone: (details && details.ownerPhone) || '',
        generatorNumber: (details && details.generatorNumber) || '',
        createdAt: today()
      });
      this._save();
    },
    updateGenerator(id, name, areaId, details) {
      const item = this.generators.find(g => g.id === id);
      if (item) {
        item.name = name.trim(); item.areaId = areaId;
        if (details) {
          item.owner = details.owner || '';
          item.ownerPhone = details.ownerPhone || '';
          item.generatorNumber = details.generatorNumber || '';
        }
        this._save();
      }
    },
    deleteGenerator(id) {
      this.generators = this.generators.filter(g => g.id !== id);
      this.subscribers = this.subscribers.filter(s => s.generatorId !== id);
      this._save();
    },
    getGeneratorName(id) {
      if (!id) return '-';
      const g = this.generators.find(x => x.id === id);
      return g ? g.name : 'غير معروف';
    },

    // ========== CRUD: Subscribers ==========
    addSubscriber(data) {
      this.subscribers.push({
        id: genId(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: (data.address || '').trim(),
        boardId: data.boardId,
        generatorId: data.generatorId || '',
        amps: Number(data.amps) || 5,
        connectionNumber: data.connectionNumber || '',
        notes: data.notes || '',
        createdAt: today()
      });
      this._save();
    },
    updateSubscriber(id, data) {
      const s = this.subscribers.find(x => x.id === id);
      if (s) {
        s.name = data.name.trim();
        s.phone = data.phone.trim();
        s.address = (data.address || '').trim();
        s.boardId = data.boardId;
        s.generatorId = data.generatorId || '';
        s.amps = Number(data.amps) || 5;
        s.connectionNumber = data.connectionNumber || '';
        s.notes = data.notes || '';
        this._save();
      }
    },
    deleteSubscriber(id) {
      this.subscribers = this.subscribers.filter(x => x.id !== id);
      this.payments = this.payments.filter(p => p.subscriberId !== id);
      this._save();
    },

    // ========== Monthly Settings (Price per Amp) ==========
    getPricePerAmp(month, year) {
      const ms = this.monthlySettings.find(s => s.month === month && s.year === year);
      return ms ? ms.pricePerAmp : this.defaultPricePerAmp;
    },
    setPricePerAmp(month, year, price) {
      const idx = this.monthlySettings.findIndex(s => s.month === month && s.year === year);
      if (idx > -1) {
        this.monthlySettings[idx].pricePerAmp = price;
      } else {
        this.monthlySettings.push({ id: genId(), month, year, pricePerAmp: price });
      }
      this._save();
    },

    // ========== Payments ==========
    getPayment(subscriberId, month, year) {
      return this.payments.find(p => p.subscriberId === subscriberId && p.month === month && p.year === year);
    },
    togglePayment(subscriberId, month, year, paid) {
      const idx = this.payments.findIndex(p => p.subscriberId === subscriberId && p.month === month && p.year === year);
      if (idx > -1) {
        this.payments[idx].paid = paid;
        this.payments[idx].paidAt = paid ? today() : null;
      } else {
        this.payments.push({
          id: genId(), subscriberId, month, year, paid,
          paidAt: paid ? today() : null
        });
      }
      this._save();
    },

    // ========== CRUD: Expenses ==========
    addExpense(data) {
      this.expenses.push({
        id: genId(),
        categoryId: data.categoryId,
        amount: Number(data.amount) || 0,
        description: (data.description || '').trim(),
        date: data.date || today(),
        generatorId: data.generatorId || '',
        notes: data.notes || '',
        createdAt: today()
      });
      this._save();
    },
    updateExpense(id, data) {
      const e = this.expenses.find(x => x.id === id);
      if (e) {
        e.categoryId = data.categoryId;
        e.amount = Number(data.amount) || 0;
        e.description = (data.description || '').trim();
        e.date = data.date || today();
        e.generatorId = data.generatorId || '';
        e.notes = data.notes || '';
        this._save();
      }
    },
    deleteExpense(id) {
      this.expenses = this.expenses.filter(x => x.id !== id);
      this._save();
    },

    // ========== CRUD: Expense Categories ==========
    addExpenseCategory(name) {
      this.expenseCategories.push({ id: genId(), name: name.trim(), createdAt: today() });
      this._save();
    },
    deleteExpenseCategory(id) {
      this.expenseCategories = this.expenseCategories.filter(c => c.id !== id);
      this.expenses = this.expenses.filter(e => e.categoryId !== id);
      this._save();
    },

    // ========== CRUD: Message Templates ==========
    addMessageTemplate(title, body) {
      this.messageTemplates.push({
        id: genId(), title: title.trim(), body: body.trim()
      });
      this._save();
    },
    updateMessageTemplate(id, title, body) {
      const t = this.messageTemplates.find(x => x.id === id);
      if (t) { t.title = title.trim(); t.body = body.trim(); this._save(); }
    },
    deleteMessageTemplate(id) {
      this.messageTemplates = this.messageTemplates.filter(t => t.id !== id);
      this._save();
    },

    // ========== Computed Helpers (used in components) ==========
    getSubscribersByBoard(boardId) {
      return this.subscribers.filter(s => s.boardId === boardId);
    },
    getSubscribersByArea(areaId) {
      const boardIds = this.boards.filter(b => b.areaId === areaId).map(b => b.id);
      return this.subscribers.filter(s => boardIds.includes(s.boardId));
    },
    getBoardsByArea(areaId) {
      return this.boards.filter(b => b.areaId === areaId);
    },
    getGeneratorsByArea(areaId) {
      return this.generators.filter(g => g.areaId === areaId);
    },
    getExpensesByMonth(month, year) {
      return this.expenses.filter(e => {
        const [y, m] = e.date.split('-');
        return Number(m) === month && Number(y) === year;
      });
    },
    getExpensesTotal(month, year) {
      return this.getExpensesByMonth(month, year).reduce((sum, e) => sum + e.amount, 0);
    },
    // Billing list for a given month/year
    getBillingList(month, year, filterPaid, filterBoard) {
      const price = this.getPricePerAmp(month, year);
      let list = this.subscribers.map(s => {
        const p = this.getPayment(s.id, month, year);
        return {
          subscriberId: s.id,
          name: s.name,
          phone: s.phone,
          boardId: s.boardId,
          generatorId: s.generatorId,
          amps: s.amps,
          pricePerAmp: price,
          total: s.amps * price,
          paid: p ? p.paid : false,
          paidAt: p ? p.paidAt : null
        };
      });
      if (filterPaid === 'paid') list = list.filter(i => i.paid);
      if (filterPaid === 'unpaid') list = list.filter(i => !i.paid);
      if (filterBoard) list = list.filter(i => i.boardId === filterBoard);
      return list;
    },
    getPaidCount(month, year) {
      return this.payments.filter(p => p.month === month && p.year === year && p.paid).length;
    },
    getUnpaidCount(month, year) {
      return this.subscribers.length - this.getPaidCount(month, year);
    },
    getExpectedTotal(month, year) {
      const price = this.getPricePerAmp(month, year);
      return this.subscribers.reduce((sum, s) => sum + (s.amps * price), 0);
    },
    getCollectedTotal(month, year) {
      const price = this.getPricePerAmp(month, year);
      return this.payments
        .filter(p => p.month === month && p.year === year && p.paid)
        .reduce((sum, p) => {
          const sub = this.subscribers.find(s => s.id === p.subscriberId);
          return sum + (sub ? sub.amps * price : 0);
        }, 0);
    },
    getUnpaidTotal(month, year) {
      return this.getExpectedTotal(month, year) - this.getCollectedTotal(month, year);
    },
    getDebtTotal() {
      // Total unpaid across all months
      let total = 0;
      const allMonths = [...new Set(this.monthlySettings.map(s => `${s.year}-${s.month}`))];
      for (const key of allMonths) {
        const [year, month] = key.split('-').map(Number);
        total += this.getUnpaidTotal(month, year);
      }
      return total;
    }
  });

  return store;
};

GM.helpers = {
  genId,
  today,
  monthName,
  formatMoney
};
