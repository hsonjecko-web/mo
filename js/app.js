/* ===========================================
   app.js - ملف التطبيق الرئيسي
   ===========================================
   هذا الملف يقوم بـ:
   - إنشاء التخزين المؤقت (Store)
   - تهيئة نظام المصادقة
   - تسجيل Vue components
   - إنشاء تطبيق Vue الرئيسي
   =========================================== */

// ===========================================
// إنشاء التطبيق
// ===========================================
(function () {
  // تهيئة المخزن
  const store = GM.createStore();
  GM.store = store;

  // تهيئة المصادقة
  GM.auth.init();

  // إنشاء تطبيق Vue
  const app = Vue.createApp({
    data() {
      return {
        // --- حالة التطبيق ---
        loggedIn: false,
        currentUser: null,
        currentView: 'dashboard',
        sidebarOpen: false,
        theme: localStorage.getItem('gm_theme') || 'light',

        // --- حالة تسجيل الدخول ---
        loginForm: { username: '', password: '' },
        loginError: '',

        // --- الإشعارات ---
        toast: null,
        toastTimer: null
      };
    },
    computed: {
      // إحصائيات للمتاخرين (للسايدبار)
      lateCount() {
        const now = new Date();
        return store.getUnpaidCount(now.getMonth() + 1, now.getFullYear());
      }
    },
    watch: {
      theme(v) {
        document.documentElement.className = v === 'dark' ? 'dark' : '';
        localStorage.setItem('gm_theme', v);
      }
    },
    methods: {
      // --- المصادقة ---
      doLogin() {
        this.loginError = '';
        if (!this.loginForm.username || !this.loginForm.password) {
          this.loginError = 'الرجاء ادخال اسم المستخدم وكلمة المرور';
          return;
        }
        const user = GM.auth.login(this.loginForm.username, this.loginForm.password);
        if (user) {
          this.loggedIn = true;
          this.currentUser = user;
          this.loginForm = { username: '', password: '' };
          this.showToast('مرحباً ' + user.name, 'success');
        } else {
          this.loginError = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
      },
      doLogout() {
        GM.auth.logout();
        this.loggedIn = false;
        this.currentUser = null;
        this.currentView = 'dashboard';
        this.showToast('تم تسجيل الخروج', 'warning');
      },

      // --- التصفح ---
      navigate(view) {
        this.currentView = view;
        this.sidebarOpen = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      // --- الوضع الليلي ---
      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
      },

      // --- التحقق من الصلاحية (تمرير إلى القوالب) ---
      can(permission) {
        return GM.auth.hasPermission(permission);
      },

      // --- الإشعارات ---
      showToast(message, type) {
        if (this.toastTimer) clearTimeout(this.toastTimer);
        const icons = {
          success: 'fas fa-check-circle',
          error: 'fas fa-exclamation-circle',
          warning: 'fas fa-exclamation-triangle'
        };
        this.toast = { message, type, icon: icons[type] || icons.success };
        this.toastTimer = setTimeout(() => { this.toast = null; }, 3000);
      }
    },
    mounted() {
      // استعادة الوضع الليلي
      if (this.theme === 'dark') {
        document.documentElement.className = 'dark';
      }

      // التحقق من تسجيل الدخول المسبق
      if (GM.auth.isLoggedIn()) {
        this.loggedIn = true;
        this.currentUser = GM.auth.getCurrentUser();
      }
    }
  });

  // ===========================================
  // تسجيل جميع المكونات والنوافذ
  // ===========================================

  // --- المكونات العامة ---
  for (const [name, comp] of Object.entries(GM.components)) {
    app.component(name, comp);
  }

  // --- النوافذ (Views) ---
  // كل view تسجل كـ component بهذا الشكل
  for (const [name, viewDef] of Object.entries(GM.views)) {
    app.component(name + '-view', {
      ...viewDef,
      emits: [...(viewDef.emits || []), 'navigate', 'toast']
    });
  }

  // ===========================================
  // تثبيت التطبيق
  // ===========================================
  app.mount('#app');

})();
