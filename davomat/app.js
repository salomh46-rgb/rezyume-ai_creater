/**
 * Davomat Pro - Core Application Logic
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
    kundalik_title: "🌙 Kundalik.com (eMaktab) Yordamchisi",
    kundalik_desc: "Kechqurun Kundalik.com ga kiritish uchun qisqa va qulay ro'yxat:",
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
    kundalik_title: "🌙 Помощник для Kundalik.com (eMaktab)",
    kundalik_desc: "Готовый краткий список отсутствующих для быстрого ввода в Kundalik:",
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
  records: {}
};

// --- 3. APP STATE MANAGEMENT ---
class DavomatApp {
  constructor() {
    this.state = this.loadState();
    this.selectedDate = this.getTodayDateString();
    this.activeTab = 'attendance';
    
    this.initElements();
    this.bindEvents();
    this.render();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('davomat_pro_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return DEFAULT_DATA;
  }

  saveState() {
    try {
      localStorage.setItem('davomat_pro_data', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
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

    let html = `
      <div class="stats-banner">
        <div class="stats-group">
          <div class="stat-item">
            <span class="stat-label">${this.t('total_students')}</span>
            <span class="stat-val">${currentClass.students.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">${this.t('present_count')}</span>
            <span class="stat-val present">${presentCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">${this.t('absent_count')}</span>
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

      <div class="student-list">
    `;

    currentClass.students.forEach((s, idx) => {
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

    this.contentEl.querySelectorAll('.student-card').forEach(card => {
      card.addEventListener('click', () => {
        const studentId = card.dataset.studentId;
        this.toggleStudentStatus(studentId);
      });
    });

    document.getElementById('btnSetAllPresent').addEventListener('click', () => {
      this.setAllPresent();
    });
  }

  renderKundalikView() {
    let html = `
      <div style="margin-bottom:14px;">
        <h2 style="font-size:17px; font-weight:800; color:#0f172a; margin-bottom:4px;">${this.t('kundalik_title')}</h2>
        <p style="font-size:12.5px; color:#64748b;">${this.t('kundalik_desc')} <strong>(${this.selectedDate})</strong></p>
      </div>
    `;

    let totalAbsentAllClasses = 0;
    let fullReportText = `📋 DAVOMAT HISOBOTI (${this.selectedDate}):\n\n`;

    this.state.classes.forEach(cls => {
      const absentStudents = [];
      const excusedStudents = [];
      const lateStudents = [];

      cls.students.forEach(s => {
        const st = this.getStudentStatus(s.id, cls.id);
        if (st === 'absent') absentStudents.push(s.name);
        else if (st === 'excused') excusedStudents.push(s.name);
        else if (st === 'late') lateStudents.push(s.name);
      });

      const totalNotFull = absentStudents.length + excusedStudents.length + lateStudents.length;
      totalAbsentAllClasses += totalNotFull;

      let classReportSnippet = `🔹 ${cls.name} sinf: `;
      if (totalNotFull === 0) {
        classReportSnippet += `Barcha o'quvchilar darsda (${cls.students.length} ta)\n`;
      } else {
        const details = [];
        if (absentStudents.length > 0) details.push(`Yo'q: ${absentStudents.join(', ')}`);
        if (excusedStudents.length > 0) details.push(`Sababli: ${excusedStudents.join(', ')}`);
        if (lateStudents.length > 0) details.push(`Kechikkan: ${lateStudents.join(', ')}`);
        classReportSnippet += `${details.join(' | ')}\n`;
      }
      fullReportText += classReportSnippet;

      html += `
        <div class="kundalik-card">
          <div class="kundalik-header">
            <span class="kundalik-title">${cls.name} sinf (${cls.students.length} o'quvchi)</span>
            ${totalNotFull === 0 ? `
              <span class="absent-badge all-present">${this.t('all_present_badge')}</span>
            ` : `
              <span class="absent-badge has-absent">${totalNotFull} ${this.t('absent_students_count')}</span>
            `}
          </div>
          
          ${totalNotFull > 0 ? `
            <div class="absent-names-list">
              ${absentStudents.length > 0 ? `<div><strong>🔴 Yo'q (НБ):</strong> ${absentStudents.map((n, i) => `${i+1}. ${n}`).join(', ')}</div>` : ''}
              ${excusedStudents.length > 0 ? `<div style="margin-top:4px;"><strong>🟡 Sababli (СБ):</strong> ${excusedStudents.map((n, i) => `${i+1}. ${n}`).join(', ')}</div>` : ''}
              ${lateStudents.length > 0 ? `<div style="margin-top:4px;"><strong>🔵 Kechikkan (К):</strong> ${lateStudents.map((n, i) => `${i+1}. ${n}`).join(', ')}</div>` : ''}
            </div>
          ` : ''}

          <div style="display:flex; justify-content:flex-end;">
            <button class="copy-btn copy-single-class-btn" data-text="${encodeURIComponent(classReportSnippet)}">
              ${this.t('copy_report')}
            </button>
          </div>
        </div>
      `;
    });

    html += `
      <div style="margin-top:20px; text-align:center;">
        <button class="btn-primary" id="btnCopyAllReport" style="width:100%; justify-content:center;">
          📋 Barcha sinflar hisobotini nusxalash (Telegram / Kundalik)
        </button>
      </div>
    `;

    this.contentEl.innerHTML = html;

    document.querySelectorAll('.copy-single-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        navigator.clipboard.writeText(text).then(() => {
          this.showToast(this.t('copied_toast'));
        });
      });
    });

    document.getElementById('btnCopyAllReport').addEventListener('click', () => {
      navigator.clipboard.writeText(fullReportText).then(() => {
        this.showToast(this.t('copied_toast'));
      });
    });
  }

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
          <div style="display:flex; gap:8px;">
            <button class="btn-secondary" id="btnDownloadBackup" style="flex:1;">
              📥 Zaxira yuklab olish
            </button>
            <label class="btn-secondary" style="flex:1; text-align:center; cursor:pointer;">
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `davomat_pro_backup_${this.getTodayDateString()}.json`);
    dlAnchorElem.click();
    this.showToast('Zaxira fayli yuklandi!');
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
