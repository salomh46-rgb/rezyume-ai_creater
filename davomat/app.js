/**
 * Davomat Pro - Core Application Logic
 * Featuring: Dual Attendance Mode (Real Internal vs Kundalik.com Official Safe Filter)
 */

// --- 1. LOCALIZATION DICTIONARY (UZ & RU) ---
const I18N = {
  uz: {
    app_title: "Davomat Pro",
    app_subtitle: "O'qituvchi yordamchisi",
    today: "Bugun",
    yesterday: "Kecha",
    select_class: "Sinfni tanlang",
    add_class: "+ Sinf qo'shish",
    all_present: "Barchasi bor (+)",
    total_students: "Jami",
    present_count: "Bor",
    absent_count: "Yo'q",
    excused_count: "Sababli",
    late_count: "Kechikkan",
    status_present: "Bor (+)",
    status_absent: "Yo'q (НБ)",
    status_excused: "Sababli (СБ)",
    status_late: "Kechikkan (К)",
    nav_attendance: "Davomat",
    nav_kundalik: "Kundalik.com",
    nav_classes: "Sinflar",
    nav_stats: "Arxiv & Excel",
    empty_class_title: "O'quvchilar ro'yxati bo'sh",
    empty_class_desc: "Ushbu sinfga o'quvchilarni qo'shing yoki ro'yxatdan nusxalab qo'ying.",
    btn_add_students: "+ O'quvchi qo'shish",
    modal_add_class_title: "Yangi Sinf Qo'shish",
    class_name_label: "Sinf nomi (Masalan: 5-A, 5-B, 8-V, 11-A):",
    class_name_placeholder: "5-B",
    btn_cancel: "Bekor qilish",
    btn_save: "Saqlash",
    modal_add_student_title: "O'quvchilarni Qo'shish",
    bulk_add_tab: "Ro'yxatdan nusxa olib qo'yish (Oson)",
    single_add_tab: "Bittalab kiritish",
    bulk_input_label: "O'quvchilar ism-familiyasini har bir qatorda yozing (yoki Word/Telegramdan tashlang):",
    bulk_input_placeholder: "Aliyev Ali\nKarimova Madina\nValiyev Sardor",
    student_name_label: "O'quvchi F.I.SH:",
    student_name_placeholder: "Aliyev Ali",
    kundalik_title: "🌙 Kundalik.com (eMaktab) Kiritish Yordamchisi",
    kundalik_desc: "Haqiqiy davomatdan Kundalik.com uchun xavfsiz (1-2 ta yo'q qilib) kiritish:",
    copy_report: "Nusxalash 📋",
    copied_toast: "Nusxalandi! Kundalik.com yoki Telegramga joylashingiz mumkin.",
    all_present_badge: "Barchasi darsda 🎉",
    absent_students_count: "ta yo'q",
    export_excel_btn: "Excel (XLSX) formatida yuklab olish 📊",
    backup_btn: "Zaxira nusxa olish (Backup JSON)",
    restore_btn: "Zaxiradan tiklash (Restore)",
    stats_title: "📊 1 Yillik Davomat Statistikasi",
    toast_saved: "Muvaffaqiyatli saqlandi!",
    confirm_delete_class: "Haqiqatan ham bu sinfni va uning barcha davomatini o'chirmoqchimisiz?",
    confirm_delete_student: "O'quvchini o'chirishni tasdiqlaysizmi?",
    search_placeholder: "O'quvchi ismini qidirish..."
  },
  ru: {
    app_title: "Давомат Про",
    app_subtitle: "Помощник учителя",
    today: "Сегодня",
    yesterday: "Вчера",
    select_class: "Выберите класс",
    add_class: "+ Добавить класс",
    all_present: "Все присутствуют (+)",
    total_students: "Всего",
    present_count: "Присутствуют",
    absent_count: "Отсутствуют",
    excused_count: "Уважительная",
    late_count: "Опоздали",
    status_present: "Присутствует (+)",
    status_absent: "НБ (Отсутствует)",
    status_excused: "СБ (Уважительная)",
    status_late: "К (Опоздал)",
    nav_attendance: "Посещаемость",
    nav_kundalik: "Kundalik.com",
    nav_classes: "Классы",
    nav_stats: "Архив и Excel",
    empty_class_title: "Список учеников пуст",
    empty_class_desc: "Добавьте учеников в этот класс по одному или вставьте списком.",
    btn_add_students: "+ Добавить учеников",
    modal_add_class_title: "Добавить новый класс",
    class_name_label: "Название класса (Например: 5-А, 5-Б, 8-В, 11-А):",
    class_name_placeholder: "5-Б",
    btn_cancel: "Отмена",
    btn_save: "Сохранить",
    modal_add_student_title: "Добавление учеников",
    bulk_add_tab: "Вставить списком (Быстро)",
    single_add_tab: "По одному",
    bulk_input_label: "Вставьте список учеников (из Word, Telegram или Excel):",
    bulk_input_placeholder: "Алиев Али\nКаримова Мадина\nВалиев Сардор",
    student_name_label: "Ф.И.О. ученика:",
    student_name_placeholder: "Алиев Али",
    kundalik_title: "🌙 Помощник для ввода в Kundalik.com",
    kundalik_desc: "Умное распределение для Kundalik.com (лимит 1-2 НБ для отчета):",
    copy_report: "Копировать 📋",
    copied_toast: "Скопировано! Можно вставить в Kundalik или Telegram.",
    all_present_badge: "Все на уроке 🎉",
    absent_students_count: "отсутствуют",
    export_excel_btn: "Скачать отчет в Excel (XLSX) 📊",
    backup_btn: "Резервная копия (Backup JSON)",
    restore_btn: "Восстановить из файла",
    stats_title: "📊 Годовая статистика посещаемости",
    toast_saved: "Успешно сохранено!",
    confirm_delete_class: "Вы уверены, что хотите удалить этот класс и всю его историю?",
    confirm_delete_student: "Удалить этого ученика?",
    search_placeholder: "Поиск ученика по имени..."
  }
};

// --- 2. SAMPLE INITIAL DATA ---
const DEFAULT_DATA = {
  lang: 'uz',
  currentClassId: 'class_5a',
  classes: [
    {
      id: 'class_2a',
      name: '2-A',
      students: [
        { id: 's_2a_1', name: 'Abdullayev Jasur' },
        { id: 's_2a_2', name: 'Ergasheva Dilnoza' },
        { id: 's_2a_3', name: 'Karimov Behruz' },
        { id: 's_2a_4', name: 'Nazarova Sevinch' },
        { id: 's_2a_5', name: 'Rustamov Sardor' }
      ]
    },
    {
      id: 'class_5a',
      name: '5-A',
      students: [
        { id: 's_5a_1', name: 'Aliyev Temur' },
        { id: 's_5a_2', name: 'Boboyev Shoxrux' },
        { id: 's_5a_3', name: 'Ganiyeva Fotima' },
        { id: 's_5a_4', name: 'Ganiyeva Zuhra' },
        { id: 's_5a_5', name: 'Ibragimov Otabek' },
        { id: 's_5a_6', name: 'Jalolova Rayhona' },
        { id: 's_5a_7', name: 'Komilov Diyor' },
        { id: 's_5a_8', name: 'Mahmudov Jasur' },
        { id: 's_5a_9', name: 'Nematova Laylo' },
        { id: 's_5a_10', name: 'Odilov Farrux' }
      ]
    },
    {
      id: 'class_5b',
      name: '5-B',
      students: [
        { id: 's_5b_1', name: 'Akramov Javohir' },
        { id: 's_5b_2', name: 'Azizova Nigora' },
        { id: 's_5b_3', name: 'Bozorov Elyor' },
        { id: 's_5b_4', name: 'Davronov Sanjar' },
        { id: 's_5b_5', name: 'Hasanov Asad' }
      ]
    },
    {
      id: 'class_7a',
      name: '7-A',
      students: [
        { id: 's_7a_1', name: 'Anvarov Shodiyor' },
        { id: 's_7a_2', name: 'Bekmirzayev Sardor' },
        { id: 's_7a_3', name: 'Ismoilova Gulnoza' },
        { id: 's_7a_4', name: 'Qodirov Jamshid' }
      ]
    },
    {
      id: 'class_9v',
      name: '9-V',
      students: [
        { id: 's_9v_1', name: 'Alimov Ravshan' },
        { id: 's_9v_2', name: 'Nazarova Kamola' },
        { id: 's_9v_3', name: 'Saidov Ilhom' },
        { id: 's_9v_4', name: 'Tursunov Dilshod' }
      ]
    }
  ],
  records: {},
  // Stores Kundalik filter overrides: { "YYYY-MM-DD": { "classId": ["studentId1", "studentId2"] } }
  kundalikSelections: {}
};

// --- 2.5 INDEXEDDB DISASTER RECOVERY SHIELD ---
const IDB_NAME = 'DavomatProShieldDB';
const IDB_STORE = 'app_state';

function initIndexedDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function saveToIndexedDB(state) {
  initIndexedDB().then(db => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ id: 'davomat_pro_backup', data: state, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('IDB save error', e);
    }
  });
}

function loadFromIndexedDB() {
  return new Promise((resolve) => {
    initIndexedDB().then(db => {
      if (!db) return resolve(null);
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get('davomat_pro_backup');
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

// --- 3. APP STATE MANAGEMENT ---
class DavomatApp {
  constructor() {
    this.state = this.loadState();
    this.selectedDate = this.getTodayDateString();
    this.activeTab = 'attendance';
    this.searchQuery = '';
    
    this.initElements();
    this.bindEvents();
    this.initPersistentStorageAndRecovery();
    this.render();
  }

  async initPersistentStorageAndRecovery() {
    // 1. Request browser Persistent Storage (protects against automatic browser storage eviction)
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          await navigator.storage.persist();
        }
      } catch (e) {}
    }

    // 2. Disaster recovery: if localStorage was cleared/empty, auto-recover from IndexedDB mirror
    try {
      const hasLocalData = localStorage.getItem('davomat_pro_data');
      if (!hasLocalData) {
        const idbData = await loadFromIndexedDB();
        if (idbData && idbData.classes && idbData.classes.length > 0) {
          this.state = idbData;
          this.saveState();
          this.render();
          this.showToast('🛡️ Ma\'lumotlar xavfsiz zaxiradan (IndexedDB) avtomatik tiklandi!');
        }
      } else {
        saveToIndexedDB(this.state);
      }
    } catch (e) {}
  }

  loadState() {
    try {
      const saved = localStorage.getItem('davomat_pro_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.kundalikSelections) parsed.kundalikSelections = {};
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return DEFAULT_DATA;
  }

  saveState() {
    try {
      localStorage.setItem('davomat_pro_data', JSON.stringify(this.state));
      saveToIndexedDB(this.state);
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  shouldShowBackupAlert() {
    if (!this.state.lastBackupDate) return true;
    const lastDate = new Date(this.state.lastBackupDate);
    const diffDays = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }

  t(key) {
    const lang = this.state.lang || 'uz';
    return (I18N[lang] && I18N[lang][key]) || (I18N['uz'][key]) || key;
  }

  getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getYesterdayDateString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  initElements() {
    this.dateInput = document.getElementById('attendanceDate');
    this.dateInput.value = this.selectedDate;

    this.classListEl = document.getElementById('classPills');
    this.contentEl = document.getElementById('mainContentArea');
    this.toastEl = document.getElementById('toastNotification');

    document.getElementById('langUzBtn').addEventListener('click', () => this.setLanguage('uz'));
    document.getElementById('langRuBtn').addEventListener('click', () => this.setLanguage('ru'));
  }

  setLanguage(lang) {
    this.state.lang = lang;
    this.saveState();
    this.render();
    this.showToast(this.t('toast_saved'));
  }

  bindEvents() {
    this.dateInput.addEventListener('change', (e) => {
      this.selectedDate = e.target.value || this.getTodayDateString();
      this.render();
    });

    document.getElementById('btnToday').addEventListener('click', () => {
      this.selectedDate = this.getTodayDateString();
      this.dateInput.value = this.selectedDate;
      this.render();
    });

    document.getElementById('btnYesterday').addEventListener('click', () => {
      this.selectedDate = this.getYesterdayDateString();
      this.dateInput.value = this.selectedDate;
      this.render();
    });

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    this.bindModalEvents();
  }

  bindModalEvents() {
    const addClassModal = document.getElementById('addClassModal');
    document.getElementById('saveClassBtn').addEventListener('click', () => {
      const input = document.getElementById('newClassNameInput');
      const name = input.value.trim();
      if (!name) return;

      const newId = 'class_' + Date.now();
      this.state.classes.push({
        id: newId,
        name: name,
        students: []
      });
      this.state.currentClassId = newId;
      input.value = '';
      this.saveState();
      this.closeModal(addClassModal);
      this.render();
      this.showToast(this.t('toast_saved'));
    });

    const addStudentModal = document.getElementById('addStudentModal');
    let studentAddMode = 'bulk';

    document.getElementById('tabBulkAdd').addEventListener('click', () => {
      studentAddMode = 'bulk';
      document.getElementById('tabBulkAdd').classList.add('active');
      document.getElementById('tabSingleAdd').classList.remove('active');
      document.getElementById('bulkAddSection').style.display = 'block';
      document.getElementById('singleAddSection').style.display = 'none';
    });

    document.getElementById('tabSingleAdd').addEventListener('click', () => {
      studentAddMode = 'single';
      document.getElementById('tabSingleAdd').classList.add('active');
      document.getElementById('tabBulkAdd').classList.remove('active');
      document.getElementById('bulkAddSection').style.display = 'none';
      document.getElementById('singleAddSection').style.display = 'block';
    });

    document.getElementById('saveStudentsBtn').addEventListener('click', () => {
      const currentClass = this.getCurrentClass();
      if (!currentClass) return;

      if (studentAddMode === 'bulk') {
        const textarea = document.getElementById('bulkStudentsInput');
        const rawText = textarea.value.trim();
        if (rawText) {
          const lines = rawText.split('\n');
          lines.forEach(line => {
            let cleanName = line.replace(/^\s*\d+[\.\)\-\:\s]+/g, '').trim();
            if (cleanName.length > 1) {
              currentClass.students.push({
                id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                name: cleanName
              });
            }
          });
          textarea.value = '';
        }
      } else {
        const singleInput = document.getElementById('singleStudentNameInput');
        const name = singleInput.value.trim();
        if (name) {
          currentClass.students.push({
            id: 's_' + Date.now(),
            name: name
          });
          singleInput.value = '';
        }
      }

      this.saveState();
      this.closeModal(addStudentModal);
      this.render();
      this.showToast(this.t('toast_saved'));
    });

    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      });
    });
  }

  openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }

  getCurrentClass() {
    if (!this.state.classes || this.state.classes.length === 0) return null;
    let cls = this.state.classes.find(c => c.id === this.state.currentClassId);
    if (!cls) {
      cls = this.state.classes[0];
      this.state.currentClassId = cls.id;
    }
    return cls;
  }

  getStudentStatus(studentId, classId = null) {
    const cId = classId || this.state.currentClassId;
    const dateRecords = this.state.records[this.selectedDate] || {};
    const classRecords = dateRecords[cId] || {};
    return (classRecords[studentId] && classRecords[studentId].status) || 'present';
  }

  setStudentStatus(studentId, status, classId = null) {
    const cId = classId || this.state.currentClassId;
    if (!this.state.records[this.selectedDate]) {
      this.state.records[this.selectedDate] = {};
    }
    if (!this.state.records[this.selectedDate][cId]) {
      this.state.records[this.selectedDate][cId] = {};
    }
    if (!this.state.records[this.selectedDate][cId][studentId]) {
      this.state.records[this.selectedDate][cId][studentId] = {};
    }
    this.state.records[this.selectedDate][cId][studentId].status = status;
    this.saveState();
  }

  toggleStudentStatus(studentId) {
    const current = this.getStudentStatus(studentId);
    let next = 'present';
    if (current === 'present') next = 'absent';
    else if (current === 'absent') next = 'excused';
    else if (current === 'excused') next = 'late';
    else if (current === 'late') next = 'present';

    this.setStudentStatus(studentId, next);
    this.render();
  }

  setAllPresent() {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return;

    currentClass.students.forEach(s => {
      this.setStudentStatus(s.id, 'present');
    });
    this.render();
    this.showToast(this.t('all_present_badge'));
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.innerText = message;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2400);
  }

  render() {
    document.getElementById('langUzBtn').classList.toggle('active', this.state.lang === 'uz');
    document.getElementById('langRuBtn').classList.toggle('active', this.state.lang === 'ru');

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
      const span = btn.querySelector('span');
      if (span && btn.dataset.tab) {
        if (btn.dataset.tab === 'attendance') span.innerText = this.t('nav_attendance');
        else if (btn.dataset.tab === 'kundalik') span.innerText = this.t('nav_kundalik');
        else if (btn.dataset.tab === 'classes') span.innerText = this.t('nav_classes');
        else if (btn.dataset.tab === 'stats') span.innerText = this.t('nav_stats');
      }
    });

    this.renderClassPills();

    if (this.activeTab === 'attendance') {
      this.renderAttendanceView();
    } else if (this.activeTab === 'kundalik') {
      this.renderKundalikView();
    } else if (this.activeTab === 'classes') {
      this.renderClassesManagementView();
    } else if (this.activeTab === 'stats') {
      this.renderStatsView();
    }
  }

  renderClassPills() {
    const isAttendanceOrClassTab = (this.activeTab === 'attendance' || this.activeTab === 'classes');
    this.classListEl.style.display = isAttendanceOrClassTab ? 'flex' : 'none';
    if (!isAttendanceOrClassTab) return;

    let html = '';
    this.state.classes.forEach(cls => {
      const active = cls.id === this.state.currentClassId ? 'active' : '';
      html += `
        <button class="class-pill ${active}" data-class-id="${cls.id}">
          <span>${cls.name}</span>
          <span style="font-size:11px; opacity:0.8;">(${cls.students.length})</span>
        </button>
      `;
    });

    html += `
      <button class="class-pill add-class-pill" id="btnAddClassPill">
        <span>+</span> <span>${this.t('add_class')}</span>
      </button>
    `;

    this.classListEl.innerHTML = html;

    this.classListEl.querySelectorAll('.class-pill[data-class-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.currentClassId = btn.dataset.classId;
        this.saveState();
        this.render();
      });
    });

    const addBtn = document.getElementById('btnAddClassPill');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openModal(document.getElementById('addClassModal'));
      });
    }
  }

  renderAttendanceView() {
    const currentClass = this.getCurrentClass();
    if (!currentClass) {
      this.contentEl.innerHTML = `
        <div class="empty-state">
          <h3>${this.t('empty_class_title')}</h3>
          <p>${this.t('empty_class_desc')}</p>
          <button class="btn-primary" id="btnOpenAddClassModal">${this.t('add_class')}</button>
        </div>
      `;
      document.getElementById('btnOpenAddClassModal').addEventListener('click', () => {
        this.openModal(document.getElementById('addClassModal'));
      });
      return;
    }

    if (currentClass.students.length === 0) {
      this.contentEl.innerHTML = `
        <div class="empty-state">
          <h3>${currentClass.name} — ${this.t('empty_class_title')}</h3>
          <p>${this.t('empty_class_desc')}</p>
          <button class="btn-primary" id="btnOpenAddStudentModal">${this.t('btn_add_students')}</button>
        </div>
      `;
      document.getElementById('btnOpenAddStudentModal').addEventListener('click', () => {
        this.openModal(document.getElementById('addStudentModal'));
      });
      return;
    }

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let lateCount = 0;

    currentClass.students.forEach(s => {
      const status = this.getStudentStatus(s.id);
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'excused') excusedCount++;
      else if (status === 'late') lateCount++;
    });

    let filteredStudents = currentClass.students;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredStudents = currentClass.students.filter(s => s.name.toLowerCase().includes(q));
    }

    const backupAlertHtml = this.shouldShowBackupAlert() ? `
      <div class="backup-alert-banner" id="backupAlertBanner">
        <div class="backup-alert-text">
          <span>💡</span>
          <span><strong>Haftalik zaxira:</strong> Ma'lumotlarni yo'qotmaslik uchun zaxira faylini saqlab qo'yish tavsiya etiladi.</span>
        </div>
        <button type="button" class="btn-backup-now" id="btnQuickBackupNow">📥 Zaxirani olish</button>
      </div>
    ` : '';

    let html = `
      ${backupAlertHtml}
      <!-- Stats & Quick Fill Banner -->
      <div class="stats-banner">
        <div class="stats-group">
          <div class="stat-item">
            <span class="stat-label">${this.t('total_students')}</span>
            <span class="stat-val">${currentClass.students.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Haqiqiy Bor</span>
            <span class="stat-val present">${presentCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Haqiqiy Yo'q</span>
            <span class="stat-val absent">${absentCount}</span>
          </div>
          ${excusedCount > 0 ? `
          <div class="stat-item">
            <span class="stat-label">${this.t('excused_count')}</span>
            <span class="stat-val excused">${excusedCount}</span>
          </div>` : ''}
        </div>
        <div class="quick-actions">
          <button class="btn-sm btn-present-all" id="btnSetAllPresent">
            <span>✓</span> ${this.t('all_present')}
          </button>
        </div>
      </div>

      <!-- Quick Search Input -->
      <div style="margin-bottom:12px;">
        <input type="text" id="studentSearchInput" class="form-control" placeholder="${this.t('search_placeholder')}" value="${this.searchQuery}" style="padding:8px 14px; font-size:13.5px; border-radius:9999px;">
      </div>

      <!-- Students List -->
      <div class="student-list">
    `;

    filteredStudents.forEach((s, idx) => {
      const status = this.getStudentStatus(s.id);
      let statusText = this.t('status_present');
      let statusIcon = '🟢';
      if (status === 'absent') { statusText = this.t('status_absent'); statusIcon = '🔴'; }
      else if (status === 'excused') { statusText = this.t('status_excused'); statusIcon = '🟡'; }
      else if (status === 'late') { statusText = this.t('status_late'); statusIcon = '🔵'; }

      html += `
        <div class="student-card status-${status}" data-student-id="${s.id}">
          <div class="student-info">
            <span class="student-num">${idx + 1}</span>
            <div>
              <div class="student-name">${s.name}</div>
            </div>
          </div>
          <div class="status-pill ${status}">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.contentEl.innerHTML = html;

    // Search input listener
    const sInput = document.getElementById('studentSearchInput');
    sInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderAttendanceViewOnly();
    });

    this.contentEl.querySelectorAll('.student-card').forEach(card => {
      card.addEventListener('click', () => {
        const studentId = card.dataset.studentId;
        this.toggleStudentStatus(studentId);
      });
    });

    document.getElementById('btnSetAllPresent').addEventListener('click', () => {
      this.setAllPresent();
    });

    const btnQuickBackup = document.getElementById('btnQuickBackupNow');
    if (btnQuickBackup) {
      btnQuickBackup.addEventListener('click', () => {
        this.downloadBackupJSON();
        this.render();
      });
    }
  }

  renderAttendanceViewOnly() {
    this.renderAttendanceView();
    const sInput = document.getElementById('studentSearchInput');
    if (sInput) {
      sInput.focus();
      sInput.setSelectionRange(sInput.value.length, sInput.value.length);
    }
  }

  // --- KUNDALIK.COM DUAL-MODE / SAFE FILTER VIEW ---
  renderKundalikView() {
    let html = `
      <div style="margin-bottom:14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px 16px;">
        <h2 style="font-size:16px; font-weight:800; color:#166534; margin-bottom:4px;">${this.t('kundalik_title')}</h2>
        <p style="font-size:12.5px; color:#15803d; line-height:1.4;">
          Siz kiritgan <strong>haqiqiy davomat</strong> xavfsiz saqlanadi. Kundalik.com da muammo bo'lmasligi uchun pastdagi ro'yxatdan <strong>faqat 1 yoki 2 ta o'quvchini</strong> rasmiy kiritish uchun tanlab oling:
        </p>
      </div>
    `;

    let totalClassesWithAbsents = 0;
    let fullKundalikReport = `📋 KUNDALIK.COM UCHUN RASMIY DAVOMAT (${this.selectedDate}):\n\n`;

    this.state.classes.forEach(cls => {
      // Find all actually absent or excused students
      const realAbsents = [];
      cls.students.forEach(s => {
        const st = this.getStudentStatus(s.id, cls.id);
        if (st === 'absent' || st === 'excused' || st === 'late') {
          realAbsents.push({ id: s.id, name: s.name, status: st });
        }
      });

      // Selected for Kundalik.com
      if (!this.state.kundalikSelections[this.selectedDate]) {
        this.state.kundalikSelections[this.selectedDate] = {};
      }
      let selectedIds = this.state.kundalikSelections[this.selectedDate][cls.id];
      if (!selectedIds) {
        // Default: take max 2 students automatically for safe Kundalik reporting
        selectedIds = realAbsents.slice(0, 2).map(s => s.id);
        this.state.kundalikSelections[this.selectedDate][cls.id] = selectedIds;
      }

      const officiallyAbsent = realAbsents.filter(s => selectedIds.includes(s.id));
      const officiallyPresentCount = cls.students.length - officiallyAbsent.length;

      let kundalikSnippet = `🔹 ${cls.name} sinf: Jami ${cls.students.length} ta — ${officiallyPresentCount} ta BOR`;
      if (officiallyAbsent.length > 0) {
        kundalikSnippet += `, ${officiallyAbsent.length} ta YO'Q (${officiallyAbsent.map(s => s.name).join(', ')})\n`;
      } else {
        kundalikSnippet += ` (Barchasi to'liq bor)\n`;
      }
      fullKundalikReport += kundalikSnippet;

      html += `
        <div class="kundalik-card" style="border: 1.5px solid ${realAbsents.length > 0 ? '#cbd5e1' : '#e2e8f0'};">
          <div class="kundalik-header">
            <div>
              <span class="kundalik-title">${cls.name} sinf</span>
              <span style="font-size:12px; color:#64748b; margin-left:6px;">(Jami: ${cls.students.length})</span>
            </div>
            <div>
              <span class="absent-badge" style="background:#f1f5f9; color:#334155; margin-right:4px;">
                Haqiqiy yo'q: ${realAbsents.length} ta
              </span>
              <span class="absent-badge ${officiallyAbsent.length > 0 ? 'has-absent' : 'all-present'}">
                Kundalik.com: ${officiallyAbsent.length} ta NB
              </span>
            </div>
          </div>
      `;

      if (realAbsents.length > 0) {
        html += `
          <div style="background:#f8fafc; border-radius:8px; padding:10px 12px; margin:10px 0; border:1px solid #e2e8f0;">
            <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:8px;">
              Qaysi o'quvchilarni Kundalik.com ga "Yo'q" deb kiritasiz? (Belgilang):
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
        `;

        realAbsents.forEach(s => {
          const isChecked = selectedIds.includes(s.id) ? 'checked' : '';
          const badgeText = s.status === 'absent' ? 'НБ (Yo\'q)' : (s.status === 'excused' ? 'СБ (Sababli)' : 'К (Kechikkan)');
          html += `
            <label style="display:flex; align-items:center; justify-content:space-between; background:#ffffff; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0; cursor:pointer;">
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" class="kundalik-checkbox" data-class-id="${cls.id}" data-student-id="${s.id}" ${isChecked} style="width:16px; height:16px; accent-color:#059669;">
                <span style="font-size:13.5px; font-weight:600; color:#0f172a;">${s.name}</span>
              </div>
              <span style="font-size:11px; font-weight:700; color:${s.status === 'absent' ? '#e11d48' : '#d97706'};">${badgeText}</span>
            </label>
          `;
        });

        html += `
            </div>
            <!-- Quick preset buttons -->
            <div style="display:flex; gap:6px; margin-top:8px;">
              <button class="btn-sm preset-btn" data-class-id="${cls.id}" data-count="1" style="background:#ffffff; border:1px solid #cbd5e1; font-size:11px;">Faqat 1 ta tanlash</button>
              <button class="btn-sm preset-btn" data-class-id="${cls.id}" data-count="2" style="background:#ffffff; border:1px solid #cbd5e1; font-size:11px;">Faqat 2 ta tanlash</button>
              <button class="btn-sm preset-btn" data-class-id="${cls.id}" data-count="0" style="background:#ffffff; border:1px solid #cbd5e1; font-size:11px;">Hamma keldi (0 ta NB)</button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="background:#f0fdf4; color:#166534; padding:8px 12px; border-radius:6px; font-size:13px; font-weight:600; margin:8px 0;">
            ✓ Barcha o'quvchilar to'liq darsda qatnashgan.
          </div>
        `;
      }

      html += `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <span style="font-size:12px; color:#64748b; font-weight:600;">
              Kundalik: <strong>${officiallyPresentCount} kelgan, ${officiallyAbsent.length} kelmagan</strong>
            </span>
            <button class="copy-btn copy-single-class-btn" data-text="${encodeURIComponent(kundalikSnippet)}">
              ${this.t('copy_report')}
            </button>
          </div>
        </div>
      `;
    });

    html += `
      <div style="margin-top:20px; text-align:center;">
        <button class="btn-primary" id="btnCopyAllReport" style="width:100%; justify-content:center; padding:14px; font-size:15px;">
          📋 Kundalik.com uchun barcha sinflarni nusxalash
        </button>
      </div>
    `;

    this.contentEl.innerHTML = html;

    // Checkbox change handlers
    document.querySelectorAll('.kundalik-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const classId = cb.dataset.classId;
        const studentId = cb.dataset.studentId;
        if (!this.state.kundalikSelections[this.selectedDate]) {
          this.state.kundalikSelections[this.selectedDate] = {};
        }
        let arr = this.state.kundalikSelections[this.selectedDate][classId] || [];
        if (cb.checked) {
          if (!arr.includes(studentId)) arr.push(studentId);
        } else {
          arr = arr.filter(id => id !== studentId);
        }
        this.state.kundalikSelections[this.selectedDate][classId] = arr;
        this.saveState();
        this.renderKundalikView();
      });
    });

    // Preset button handlers
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const classId = btn.dataset.classId;
        const count = parseInt(btn.dataset.count, 10);
        const cls = this.state.classes.find(c => c.id === classId);
        if (!cls) return;

        const realAbsents = [];
        cls.students.forEach(s => {
          const st = this.getStudentStatus(s.id, cls.id);
          if (st === 'absent' || st === 'excused' || st === 'late') {
            realAbsents.push(s.id);
          }
        });

        if (!this.state.kundalikSelections[this.selectedDate]) {
          this.state.kundalikSelections[this.selectedDate] = {};
        }
        this.state.kundalikSelections[this.selectedDate][classId] = realAbsents.slice(0, count);
        this.saveState();
        this.renderKundalikView();
        this.showToast(this.t('toast_saved'));
      });
    });

    // Copy handlers
    document.querySelectorAll('.copy-single-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        navigator.clipboard.writeText(text).then(() => {
          this.showToast(this.t('copied_toast'));
        });
      });
    });

    document.getElementById('btnCopyAllReport').addEventListener('click', () => {
      navigator.clipboard.writeText(fullKundalikReport).then(() => {
        this.showToast(this.t('copied_toast'));
      });
    });
  }

  // --- CLASSES & STUDENTS MANAGEMENT VIEW ---
  renderClassesManagementView() {
    const currentClass = this.getCurrentClass();
    if (!currentClass) return;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h2 style="font-size:17px; font-weight:800; color:#0f172a;">${currentClass.name} — O'quvchilar ro'yxati (${currentClass.students.length})</h2>
        <div style="display:flex; gap:6px;">
          <button class="btn-sm" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;" id="btnDeleteCurrentClass">
            🗑 Sinfni o'chirish
          </button>
          <button class="btn-primary btn-sm" id="btnOpenStudentModal">
            + O'quvchi qo'shish
          </button>
        </div>
      </div>

      <div class="student-list">
    `;

    if (currentClass.students.length === 0) {
      html += `
        <div class="empty-state">
          <h3>O'quvchilar yo'q</h3>
          <p>Ushbu sinfga o'quvchilarni bittalab yoki Word/Telegramdan nusxalab qo'shing.</p>
          <button class="btn-primary" id="btnEmptyAddStudent">+ O'quvchi qo'shish</button>
        </div>
      `;
    } else {
      currentClass.students.forEach((s, idx) => {
        html += `
          <div class="student-card" style="cursor:default;">
            <div class="student-info">
              <span class="student-num">${idx + 1}</span>
              <span class="student-name">${s.name}</span>
            </div>
            <button class="btn-sm delete-student-btn" data-student-id="${s.id}" style="background:transparent; color:#94a3b8; border:none; font-size:16px; cursor:pointer;">
              ✕
            </button>
          </div>
        `;
      });
    }

    html += `</div>`;
    this.contentEl.innerHTML = html;

    const addBtn = document.getElementById('btnOpenStudentModal');
    if (addBtn) addBtn.addEventListener('click', () => this.openModal(document.getElementById('addStudentModal')));

    const emptyAddBtn = document.getElementById('btnEmptyAddStudent');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => this.openModal(document.getElementById('addStudentModal')));

    document.getElementById('btnDeleteCurrentClass').addEventListener('click', () => {
      if (confirm(this.t('confirm_delete_class'))) {
        this.state.classes = this.state.classes.filter(c => c.id !== currentClass.id);
        if (this.state.classes.length > 0) {
          this.state.currentClassId = this.state.classes[0].id;
        }
        this.saveState();
        this.render();
        this.showToast(this.t('toast_saved'));
      }
    });

    this.contentEl.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const studentId = btn.dataset.studentId;
        if (confirm(this.t('confirm_delete_student'))) {
          currentClass.students = currentClass.students.filter(s => s.id !== studentId);
          this.saveState();
          this.render();
          this.showToast(this.t('toast_saved'));
        }
      });
    });
  }

  // --- STATS & EXCEL EXPORT VIEW ---
  renderStatsView() {
    let totalClasses = this.state.classes.length;
    let totalStudents = this.state.classes.reduce((acc, c) => acc + c.students.length, 0);
    let recordedDaysCount = Object.keys(this.state.records).length;

    let html = `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:4px;">${this.t('stats_title')}</h2>
        <p style="font-size:13px; color:#64748b;">Barcha sinflar davomatini 1 yilgacha saqlash va Excelga yuklash.</p>
      </div>

      <div class="stats-banner" style="margin-bottom:16px;">
        <div class="stat-item">
          <span class="stat-label">Sinflar</span>
          <span class="stat-val">${totalClasses} ta</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">O'quvchilar</span>
          <span class="stat-val">${totalStudents} nafar</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Qayd qilingan kunlar</span>
          <span class="stat-val">${recordedDaysCount} kun</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn-primary" id="btnExportExcel" style="padding:12px; justify-content:center; font-size:15px;">
          ${this.t('export_excel_btn')}
        </button>

        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-top:10px;">
          <h3 style="font-size:14px; font-weight:800; margin-bottom:8px;">💾 Ma'lumotlar xavfsizligi va Zaxira (Backup)</h3>
          <p style="font-size:12px; color:#64748b; margin-bottom:12px;">
            Barcha ma'lumotlar telefoningiz xotirasida 1 yil davomida ishonchli saqlanadi. Xohlasangiz, fayl shaklida kompyuterga yoki boshqa telefonga ko'chirishingiz mumkin.
          </p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-secondary" id="btnDownloadBackup" style="flex:1; min-width:140px;">
              📥 Zaxira yuklab olish
            </button>
            <button class="btn-secondary" id="btnTelegramBackup" style="flex:1; min-width:140px; background:#f0fdf4; border-color:#86efac; color:#166534; font-weight:700;">
              ✈️ Telegramga yuborish
            </button>
            <label class="btn-secondary" style="flex:1; min-width:140px; text-align:center; cursor:pointer;">
              📤 Zaxirani tiklash
              <input type="file" id="fileRestoreInput" accept=".json" style="display:none;">
            </label>
          </div>
        </div>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.getElementById('btnExportExcel').addEventListener('click', () => {
      this.exportToExcel();
    });

    document.getElementById('btnDownloadBackup').addEventListener('click', () => {
      this.downloadBackupJSON();
    });

    const btnTg = document.getElementById('btnTelegramBackup');
    if (btnTg) {
      btnTg.addEventListener('click', () => {
        this.shareBackupToTelegram();
      });
    }

    document.getElementById('fileRestoreInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data && data.classes) {
              this.state = data;
              this.saveState();
              this.render();
              this.showToast('Zaxira muvaffaqiyatli tiklandi!');
            }
          } catch (err) {
            alert('Xatolik: Fayl formati noto\'g\'ri!');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('XLSX kutubxonasi yuklanmoqda... Iltimos internet borligini tekshiring.');
      return;
    }

    const wb = XLSX.utils.book_new();

    this.state.classes.forEach(cls => {
      const rows = [];
      const dates = Object.keys(this.state.records).sort();
      const header = ['F.I.SH', 'Sinf', ...dates];
      rows.push(header);

      cls.students.forEach(s => {
        const row = [s.name, cls.name];
        dates.forEach(d => {
          const status = (this.state.records[d] && this.state.records[d][cls.id] && this.state.records[d][cls.id][s.id] && this.state.records[d][cls.id][s.id].status) || '+';
          let symbol = '+';
          if (status === 'absent') symbol = 'НБ';
          else if (status === 'excused') symbol = 'СБ';
          else if (status === 'late') symbol = 'К';
          row.push(symbol);
        });
        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, cls.name.replace(/[^a-zA-Z0-9]/g, '_'));
    });

    XLSX.writeFile(wb, `Davomat_Hisoboti_${this.getTodayDateString()}.xlsx`);
    this.showToast('Excel fayl yuklab olindi! 📊');
  }

  downloadBackupJSON() {
    this.state.lastBackupDate = new Date().toISOString();
    this.saveState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `davomat_pro_backup_${this.getTodayDateString()}.json`);
    dlAnchorElem.click();
    this.showToast('Zaxira fayli yuklandi! 💾');
  }

  shareBackupToTelegram() {
    this.state.lastBackupDate = new Date().toISOString();
    this.saveState();
    
    let summaryText = `📊 Davomat Pro — Zaxira va Hisobot (${this.getTodayDateString()}):\n`;
    summaryText += `Sinflar soni: ${this.state.classes.length} ta\n`;
    this.state.classes.forEach(c => {
      summaryText += `• ${c.name}: ${c.students.length} nafar o'quvchi\n`;
    });
    summaryText += `\nIlova: https://davomatpro.vercel.app`;
    
    this.downloadBackupJSON();
    
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent('https://davomatpro.vercel.app')}&text=${encodeURIComponent(summaryText)}`;
    window.open(tgUrl, '_blank');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new DavomatApp();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration skipped in local sandbox');
    });
  }
});
