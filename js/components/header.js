/* ===========================================
   header.js - مكون الهدر (Header Component)
   ===========================================
   التصميم: مستوحى من The Sovereign Ledger
   - زر القائمة (هامبورجر)
   - الشعار
   - زر بحث مع dropdown
   - مفتاح تبديل الوضع (ليلي/نهاري)
   =========================================== */

GM.registerComponent('app-header', {
  template: `
    <header class="app-header">
      <button class="search-btn" @click="$emit('toggleSidebar')" aria-label="القائمة">
        <span class="material-icons">menu</span>
      </button>
      <div class="logo">
        <h1>نظام إدارة المولدات</h1>
        <span>Premium Edition</span>
      </div>
      <div style="display:flex; gap:6px;">
        <!-- 🔍 زر البحث -->
        <div class="search-container" style="position:relative;">
          <button class="search-btn" @click="toggleSearch" aria-label="بحث">
            <span class="material-icons">search</span>
          </button>
          <div class="search-dropdown" :class="{active: searchOpen}">
            <span class="material-icons search-icon">search</span>
            <input type="text" placeholder="ابحث..." v-model="searchQuery" @keyup.enter="doSearch" ref="searchInput" />
          </div>
        </div>
        <!-- 🎚️ مفتاح التبديل -->
        <label class="theme-switch">
          <input type="checkbox" :checked="theme === 'light'" @change="$emit('toggleTheme')" />
          <div class="switch-track"><div class="switch-thumb"></div></div>
          <span class="material-icons">dark_mode</span>
          <span class="material-icons">light_mode</span>
        </label>
      </div>
      <!-- overlay لإغلاق البحث -->
      <div v-if="searchOpen" @click="searchOpen = false" style="position:fixed;inset:0;z-index:80"></div>
    </header>
  `,
  props: {
    theme: { type: String, default: 'dark' },
    user: { type: Object, default: null }
  },
  emits: ['toggleSidebar', 'toggleTheme', 'logout', 'navigate'],
  data() {
    return {
      searchOpen: false,
      searchQuery: ''
    };
  },
  methods: {
    toggleSearch() {
      this.searchOpen = !this.searchOpen;
      if (this.searchOpen) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) this.$refs.searchInput.focus();
        });
      }
    },
    doSearch() {
      if (!this.searchQuery.trim()) return;
      const q = this.searchQuery.trim().toLowerCase();
      const subs = GM.store ? GM.store.subscribers || [] : [];
      const found = subs.find(s => s.name && s.name.toLowerCase().includes(q));
      if (found) {
        this.searchQuery = '';
        this.searchOpen = false;
        this.$emit('navigate', 'subscribers');
      }
    }
  }
});
