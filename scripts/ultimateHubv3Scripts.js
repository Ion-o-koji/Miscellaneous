
    // ===== Default Colors =====
    const DEFAULT_COLORS = {
      brand: '#7aa2ff',
      brand2: '#5f86ff',
      bg: '#0f1220',
      bg2: '#13172a',
      panel: '#171b2e',
      panel2: '#1e2440',
      text: '#e8eaf6',
      muted: '#9aa3b2',
      textSize: 16,
      letterSpacing: 0,
      lineHeight: 1.5
    };

    // ===== State Management =====
    const STATE_KEY = 'ultimateHub:v3';
    let state = {
      tasks: [],
      notes: [],
      habits: [],
      pinnedNotes: [],
      timerPresets: [{
          id: 1,
          name: 'Focus',
          minutes: 25
        },
        {
          id: 2,
          name: 'Short Break',
          minutes: 5
        },
        {
          id: 3,
          name: 'Long Break',
          minutes: 15
        }
      ],
      theme: 'dark',
      brandColor: '#7aa2ff',
      brand2Color: '#5f86ff',
      bgColor: '#0f1220',
      bg2Color: '#13172a',
      panelColor: '#171b2e',
      panel2Color: '#1e2440',
      textColor: '#e8eaf6',
      mutedColor: '#9aa3b2',
      font: 'system-ui',
      textSize: 16,
      letterSpacing: 0,
      lineHeight: 1.5,
      currentMonth: new Date(),
      showCompletedOnCalendar: true,
      timerState: {
        running: false,
        paused: false,
        remainingSeconds: 0,
        totalSeconds: 0,
        currentPresetId: null
      },
      editingNoteId: null,
      editingTaskId: null,
      originalTheme: 'dark'
    };

    // ===== Utility Functions =====
    function saveState() {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    function loadState() {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        state = {
          ...state,
          ...JSON.parse(saved)
        };
      }
      state.currentMonth = new Date(state.currentMonth);
      state.originalTheme = state.theme;
    }

    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function showSection(sectionId) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(sectionId).classList.add('active');
      document.getElementById('navMenu').classList.remove('active');
      closeAllModals();
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function closeAllModals() {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    function openModal(modalId) {
      document.getElementById(modalId).classList.add('active');
    }

    function sortTasks(tasks) {
      return tasks.slice().sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }

    // ===== Theme & Customization =====
    function applyTheme() {
      document.body.classList.toggle('light-theme', state.theme === 'light');
      document.body.classList.remove('timer-alert');
      document.documentElement.style.setProperty('--brand', state.brandColor);
      document.documentElement.style.setProperty('--brand2', state.brand2Color);
      document.documentElement.style.setProperty('--bg', state.bgColor);
      document.documentElement.style.setProperty('--bg2', state.bg2Color);
      document.documentElement.style.setProperty('--panel', state.panelColor);
      document.documentElement.style.setProperty('--panel2', state.panel2Color);
      document.documentElement.style.setProperty('--text', state.textColor);
      document.documentElement.style.setProperty('--muted', state.mutedColor);
      document.body.style.fontFamily = state.font;
      document.body.style.fontSize = state.textSize + 'px';
      document.body.style.letterSpacing = state.letterSpacing + 'px';
      document.body.style.lineHeight = state.lineHeight;
    }

    // ===== Reset Functions =====
    function resetBrandColor() {
      state.brandColor = DEFAULT_COLORS.brand;
      saveState();
      applyTheme();
      document.getElementById('brandColor').value = state.brandColor;
    }

    function resetBrand2Color() {
      state.brand2Color = DEFAULT_COLORS.brand2;
      saveState();
      applyTheme();
      document.getElementById('brand2Color').value = state.brand2Color;
    }

    function resetBgColor() {
      state.bgColor = DEFAULT_COLORS.bg;
      saveState();
      applyTheme();
      document.getElementById('bgColor').value = state.bgColor;
    }

    function resetBg2Color() {
      state.bg2Color = DEFAULT_COLORS.bg2;
      saveState();
      applyTheme();
      document.getElementById('bg2Color').value = state.bg2Color;
    }

    function resetPanelColor() {
      state.panelColor = DEFAULT_COLORS.panel;
      saveState();
      applyTheme();
      document.getElementById('panelColor').value = state.panelColor;
    }

    function resetPanel2Color() {
      state.panel2Color = DEFAULT_COLORS.panel2;
      saveState();
      applyTheme();
      document.getElementById('panel2Color').value = state.panel2Color;
    }

    function resetTextColor() {
      state.textColor = DEFAULT_COLORS.text;
      saveState();
      applyTheme();
      document.getElementById('textColor').value = state.textColor;
    }

    function resetMutedColor() {
      state.mutedColor = DEFAULT_COLORS.muted;
      saveState();
      applyTheme();
      document.getElementById('mutedColor').value = state.mutedColor;
    }

    function resetTextSize() {
      state.textSize = DEFAULT_COLORS.textSize;
      document.getElementById('textSize').value = state.textSize;
      document.getElementById('textSizeValue').textContent = state.textSize;
      saveState();
      applyTheme();
    }

    function resetLetterSpacing() {
      state.letterSpacing = DEFAULT_COLORS.letterSpacing;
      document.getElementById('letterSpacing').value = state.letterSpacing;
      document.getElementById('letterSpacingValue').textContent = state.letterSpacing;
      saveState();
      applyTheme();
    }

    function resetLineHeight() {
      state.lineHeight = DEFAULT_COLORS.lineHeight;
      document.getElementById('lineHeight').value = state.lineHeight;
      document.getElementById('lineHeightValue').textContent = state.lineHeight;
      saveState();
      applyTheme();
    }

    // ===== Navigation =====
    document.getElementById('hamburger').addEventListener('click', () => {
      const hamburger = document.getElementById('hamburger');
      const navMenu = document.getElementById('navMenu');
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        showSection(item.dataset.section);
        document.getElementById('hamburger').classList.remove('active');
      });
    });

    // ===== Quick Add =====
    function openQuickAddTask() {
      closeModal('quickAddModal');
      openModal('quickTaskModal');
    }

    function openQuickAddNote() {
      closeModal('quickAddModal');
      openModal('quickNoteModal');
    }

    function openQuickAddHabit() {
      closeModal('quickAddModal');
      openModal('quickHabitModal');
    }

    function quickAddTask() {
      const title = document.getElementById('quickTaskTitle').value.trim();
      const priority = document.getElementById('quickTaskPriority').value;
      const dueDate = document.getElementById('quickTaskDue').value;
      const notes = document.getElementById('quickTaskNotes').value.trim();

      if (!title) {
        alert('Please enter a task title');
        return;
      }

      state.tasks.push({
        id: generateId(),
        title,
        priority,
        dueDate: dueDate || null,
        notes,
        completed: false,
        createdAt: new Date().toISOString()
      });

      saveState();
      closeModal('quickTaskModal');
      document.getElementById('quickTaskTitle').value = '';
      document.getElementById('quickTaskPriority').value = 'medium';
      document.getElementById('quickTaskDue').value = '';
      document.getElementById('quickTaskNotes').value = '';
      showSection('tasks');
      renderTasks();
      updateHome();
      renderCalendar();
      renderKanban();
    }

    function quickAddNote() {
      const title = document.getElementById('quickNoteTitle').value.trim();
      const content = document.getElementById('quickNoteContent').value.trim();

      if (!title) {
        alert('Please enter a note title');
        return;
      }

      state.notes.unshift({
        id: generateId(),
        title,
        content,
        createdAt: new Date().toISOString()
      });

      saveState();
      closeModal('quickNoteModal');
      document.getElementById('quickNoteTitle').value = '';
      document.getElementById('quickNoteContent').value = '';
      renderNotes();
    }

    function quickAddHabit() {
      const name = document.getElementById('quickHabitName').value.trim();

      if (!name) {
        alert('Please enter a habit name');
        return;
      }

      state.habits.unshift({
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        completedDays: {}
      });

      saveState();
      closeModal('quickHabitModal');
      document.getElementById('quickHabitName').value = '';
      renderHabits();
    }

    // ===== Tasks =====
    function addTask() {
      const title = document.getElementById('taskTitle').value.trim();
      const priority = document.getElementById('taskPriority').value;
      const dueDate = document.getElementById('taskDueDate').value;
      const notes = document.getElementById('taskNotes').value.trim();

      if (!title) {
        alert('Please enter a task title');
        return;
      }

      state.tasks.push({
        id: generateId(),
        title,
        priority,
        dueDate: dueDate || null,
        notes,
        completed: false,
        createdAt: new Date().toISOString()
      });

      saveState();
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskDueDate').value = '';
      document.getElementById('taskNotes').value = '';
      document.getElementById('taskPriority').value = 'medium';
      renderTasks();
      updateHome();
      renderCalendar();
      renderKanban();
    }

    function deleteTask(id) {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveState();
      renderTasks();
      updateHome();
      renderCalendar();
      renderKanban();
    }

    function toggleTaskComplete(id) {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        saveState();
        renderTasks();
        updateHome();
        renderCalendar();
        renderKanban();
      }
    }

    function editTask(id) {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        state.editingTaskId = id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        document.getElementById('editTaskNotes').value = task.notes;
        openModal('editTaskModal');
      }
    }

    function saveEditedTask() {
      if (!state.editingTaskId) return;

      const task = state.tasks.find(t => t.id === state.editingTaskId);
      if (task) {
        task.title = document.getElementById('editTaskTitle').value.trim();
        task.priority = document.getElementById('editTaskPriority').value;
        task.dueDate = document.getElementById('editTaskDueDate').value || null;
        task.notes = document.getElementById('editTaskNotes').value.trim();

        saveState();
        state.editingTaskId = null;
        closeModal('editTaskModal');
        renderTasks();
        updateHome();
        renderCalendar();
        renderKanban();
      }
    }

    function renderTaskItem(task, editableOnly = false) {
      const el = document.createElement('div');
      el.className = `task-item ${task.priority}`;

      let notesHTML = '';
      if (task.notes) {
        notesHTML = `<div class="task-notes">${task.notes}</div>`;
      }

      el.innerHTML = `
                <div class="task-content">
                    <div class="task-title" style="text-decoration: ${task.completed ? 'line-through' : 'none'}; opacity: ${task.completed ? '0.6' : '1'};">
                        ${task.title}
                        <span class="task-priority-badge ${task.priority}">${task.priority}</span>
                    </div>
                    <div class="task-meta">
                        ${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                    </div>
                    ${notesHTML}
                </div>
                <div class="task-actions">
                    ${editableOnly && !task.completed ? `<button class="btn btn-small" onclick="editTask('${task.id}')">✏️</button>` : ''}
                    <button class="btn btn-small" onclick="toggleTaskComplete('${task.id}')">${task.completed ? '↩️' : '✓'}</button>
                    ${editableOnly ? `<button class="btn btn-small btn-delete" onclick="deleteTask('${task.id}')">🗑️</button>` : ''}
                </div>
            `;
      return el;
    }

    function renderTasks() {
      const container = document.getElementById('tasksList');
      const completedContainer = document.getElementById('completedTasksList');

      container.innerHTML = '';
      completedContainer.innerHTML = '';

      const uncompleted = state.tasks.filter(t => !t.completed).sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      const completed = state.tasks.filter(t => t.completed);

      if (uncompleted.length === 0) {
        container.innerHTML = '<p style="color: var(--muted);">No uncompleted tasks</p>';
      } else {
        uncompleted.forEach(task => {
          container.appendChild(renderTaskItem(task, true));
        });
      }

      if (completed.length === 0) {
        completedContainer.innerHTML = '<p style="color: var(--muted);">No completed tasks</p>';
      } else {
        completed.forEach(task => {
          completedContainer.appendChild(renderTaskItem(task, true));
        });
      }
    }

    // ===== Kanban =====
    function renderKanban() {
      const todoContainer = document.getElementById('kanbanTodo');

      todoContainer.innerHTML = '';

      const uncompleted = state.tasks.filter(t => !t.completed);

      if (uncompleted.length === 0) {
        todoContainer.innerHTML = '<p style="color: var(--muted); text-align: center;">No tasks</p>';
        return;
      }

      uncompleted.forEach(task => {
        const el = document.createElement('div');
        el.className = `task-item ${task.priority}`;
        el.style.marginBottom = '8px';
        el.innerHTML = `
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
                    </div>
                    <button class="btn btn-small" onclick="toggleTaskComplete('${task.id}')">✓</button>
                `;

        todoContainer.appendChild(el);
      });

      if (todoContainer.innerHTML === '') {
        todoContainer.innerHTML = '<p style="color: var(--muted); text-align: center;">No tasks</p>';
      }
    }

    // ===== Habits =====
    function addHabit() {
      const name = document.getElementById('habitName').value.trim();

      if (!name) {
        alert('Please enter a habit name');
        return;
      }

      state.habits.push({
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        completedDays: {}
      });

      saveState();
      document.getElementById('habitName').value = '';
      renderHabits();
      updateHome();
    }

    function deleteHabit(id) {
      state.habits = state.habits.filter(h => h.id !== id);
      saveState();
      renderHabits();
      updateHome();
    }

    function toggleHabitDay(habitId, day) {
      const habit = state.habits.find(h => h.id === habitId);
      if (habit) {
        const key = String(day);
        habit.completedDays[key] = !habit.completedDays[key];
        saveState();
        renderHabits();
        updateHome();
      }
    }

    function renderHabits() {
      const container = document.getElementById('habitsList');
      container.innerHTML = '';

      if (state.habits.length === 0) {
        container.innerHTML = '<div class="card"><p style="color: var(--muted);">No habits yet. Create one to get started!</p></div>';
        return;
      }

      state.habits.forEach(habit => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = now.getDate();

        let html = `<div class="card habit-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="habit-title">${habit.name}</div>
                        <button class="btn btn-small btn-delete" onclick="deleteHabit('${habit.id}')">🗑️</button>
                    </div>
                    <div class="calendar-grid">`;

        for (let day = 1; day <= daysInMonth; day++) {
          const key = String(day);
          const isCompleted = habit.completedDays[key];
          const isToday = day === today;

          html += `<div class="day-box ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" onclick="toggleHabitDay('${habit.id}', ${day})">
                        <div class="day-box-content">
                            <div class="day-number">${day}</div>
                            <div class="day-status">${isCompleted ? '✓' : ''}</div>
                        </div>
                    </div>`;
        }

        html += `</div></div>`;
        container.insertAdjacentHTML('beforeend', html);
      });
    }

    // ===== Calendar =====
    function goToToday() {
      state.currentMonth = new Date();
      renderCalendar();
    }

    function renderCalendar() {
      const container = document.getElementById('calendarGrid');
      const monthYear = document.getElementById('monthYear');
      const now = new Date();
      const currentMonth = state.currentMonth.getMonth();
      const currentYear = state.currentMonth.getFullYear();

      monthYear.textContent = state.currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

      container.innerHTML = '';

      // Previous month days
      for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const el = document.createElement('div');
        el.className = 'calendar-day other-month';
        el.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        container.appendChild(el);
      }

      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
        el.className = `calendar-day ${isToday ? 'today' : ''}`;

        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${dayStr}`;

        let content = `<div class="calendar-day-number">${day}</div>`;

        // Show tasks due on this day
        const tasksOnDay = state.tasks.filter(t => {
          if (state.showCompletedOnCalendar) {
            return t.dueDate === dateStr;
          } else {
            return t.dueDate === dateStr && !t.completed;
          }
        });

        tasksOnDay.forEach(task => {
          content += `<div class="calendar-event ${task.priority}">${task.title}</div>`;
        });

        el.innerHTML = content;
        container.appendChild(el);
      }

      // Next month days
      const remainingDays = (7 - ((firstDay + daysInMonth) % 7)) % 7;
      for (let day = 1; day <= remainingDays; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day other-month';
        el.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        container.appendChild(el);
      }
    }

    // ===== Notes =====
    function addNote() {
      const title = document.getElementById('noteTitle').value.trim();
      const content = document.getElementById('noteContent').value.trim();

      if (!title) {
        alert('Please enter a note title');
        return;
      }

      if (state.editingNoteId) {
        const note = state.notes.find(n => n.id === state.editingNoteId);
        if (note) {
          note.title = title;
          note.content = content;
        }
        state.editingNoteId = null;
      } else {
        state.notes.unshift({
          id: generateId(),
          title,
          content,
          createdAt: new Date().toISOString()
        });
      }

      saveState();
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';
      closeModal('editNoteModal');
      renderNotes();
      updateHome();
    }

    function editNote(id) {
      const note = state.notes.find(n => n.id === id);
      if (note) {
        state.editingNoteId = id;
        document.getElementById('editNoteTitle').value = note.title;
        document.getElementById('editNoteContent').value = note.content;
        openModal('editNoteModal');
      }
    }

    function saveEditedNote() {
      if (!state.editingNoteId) return;

      const title = document.getElementById('editNoteTitle').value.trim();
      const content = document.getElementById('editNoteContent').value.trim();

      if (!title) {
        alert('Please enter a note title');
        return;
      }

      const note = state.notes.find(n => n.id === state.editingNoteId);
      if (note) {
        note.title = title;
        note.content = content;
        saveState();
        state.editingNoteId = null;
        closeModal('editNoteModal');
        renderNotes();
        updateHome();
      }
    }

    function deleteNote(id) {
      state.notes = state.notes.filter(n => n.id !== id);
      if (state.pinnedNotes.includes(id)) {
        state.pinnedNotes = state.pinnedNotes.filter(pId => pId !== id);
      }
      saveState();
      renderNotes();
      updateHome();
    }

    function togglePin(id) {
      if (state.pinnedNotes.includes(id)) {
        state.pinnedNotes = state.pinnedNotes.filter(pId => pId !== id);
      } else {
        state.pinnedNotes.push(id);
      }
      saveState();
      renderNotes();
      updateHome();
    }

    function renderNotes() {
      const container = document.getElementById('notesList');
      container.innerHTML = '';

      if (state.notes.length === 0) {
        container.innerHTML = '<p style="color: var(--muted);">No notes yet. Create one to get started!</p>';
        return;
      }

      state.notes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'note-item';
        const isPinned = state.pinnedNotes.includes(note.id);
        el.innerHTML = `
                    <div class="note-content" onclick="editNote('${note.id}')">
                        <div class="note-title">${note.title}</div>
                        <div class="note-preview">${note.content}</div>
                    </div>
                    <div class="note-actions">
                        <button class="btn-pin ${isPinned ? 'pinned' : ''}" onclick="togglePin('${note.id}')" title="Pin note">📌</button>
                        <button class="btn btn-small btn-delete" onclick="deleteNote('${note.id}')">🗑️</button>
                    </div>
                `;
        container.appendChild(el);
      });
    }

    function renderPinnedNotes() {
      const container = document.getElementById('pinnedNotesContainer');
      const card = document.getElementById('pinnedNotesCard');
      container.innerHTML = '';

      const pinnedNotes = state.notes.filter(n => state.pinnedNotes.includes(n.id));

      if (pinnedNotes.length === 0) {
        card.style.display = 'none';
        return;
      }

      card.style.display = 'block';

      pinnedNotes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'pinned-note-item';
        el.innerHTML = `
                    <div class="pinned-note-content">
                        <div class="pinned-note-title">${note.title}</div>
                        <div class="pinned-note-text">${note.content}</div>
                    </div>
                `;
        container.appendChild(el);
      });
    }

    // ===== Timer =====
    let timerInterval = null;

    function updateTimerDisplay() {
      const mins = Math.floor(state.timerState.remainingSeconds / 60);
      const secs = state.timerState.remainingSeconds % 60;
      document.getElementById('timerDisplay').textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Update progress bar
      const percent = state.timerState.totalSeconds > 0 ?
        ((state.timerState.totalSeconds - state.timerState.remainingSeconds) / state.timerState.totalSeconds) * 100 :
        0;
      document.getElementById('timerProgressBar').style.width = percent + '%';
    }

    function startTimer() {
      if (state.timerState.running) return;

      if (state.timerState.remainingSeconds === 0) {
        alert('Please select a timer preset or set a custom time first');
        return;
      }

      state.timerState.running = true;
      state.timerState.paused = false;
      document.getElementById('pauseBtn').textContent = 'Pause';

      timerInterval = setInterval(() => {
        if (state.timerState.remainingSeconds > 0) {
          state.timerState.remainingSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          state.timerState.running = false;
          // Switch to light theme or inverse of current
          state.originalTheme = state.theme;
          state.theme = state.theme === 'dark' ? 'light' : 'dark';
          document.body.classList.add('timer-alert');
          alert('Timer finished! Press OK to dismiss.');
          resetTimer();
        }
      }, 1000);
    }

    function pauseTimer() {
      if (state.timerState.running) {
        state.timerState.running = false;
        state.timerState.paused = true;
        clearInterval(timerInterval);
        document.getElementById('pauseBtn').textContent = 'Resume';
      } else if (state.timerState.paused) {
        state.timerState.running = true;
        state.timerState.paused = false;
        document.getElementById('pauseBtn').textContent = 'Pause';
        startTimer();
      }
    }

    function resetTimer() {
      state.timerState.running = false;
      state.timerState.paused = false;
      state.timerState.remainingSeconds = 0;
      state.timerState.totalSeconds = 0;
      state.timerState.currentPresetId = null;
      clearInterval(timerInterval);
      document.getElementById('pauseBtn').textContent = 'Pause';

      // Return to original theme
      state.theme = state.originalTheme;
      document.body.classList.remove('timer-alert');
      applyTheme();

      updateTimerDisplay();
      renderPresets();
    }

    function setCustomTimer() {
      const minutes = parseInt(document.getElementById('customMinutes').value);
      if (!minutes || minutes < 1) {
        alert('Please enter a valid number of minutes');
        return;
      }

      state.timerState.currentPresetId = null;
      state.timerState.totalSeconds = minutes * 60;
      state.timerState.remainingSeconds = minutes * 60;
      state.timerState.running = false;
      state.timerState.paused = false;
      clearInterval(timerInterval);
      document.getElementById('pauseBtn').textContent = 'Pause';
      document.getElementById('customMinutes').value = '';
      updateTimerDisplay();
      renderPresets();
    }

    function addPreset() {
      const name = document.getElementById('presetName').value.trim();
      const minutes = parseInt(document.getElementById('presetTime').value);

      if (!name || !minutes || minutes < 1) {
        alert('Please enter valid preset name and minutes');
        return;
      }

      state.timerPresets.push({
        id: generateId(),
        name,
        minutes
      });

      saveState();
      document.getElementById('presetName').value = '';
      document.getElementById('presetTime').value = '';
      renderPresets();
    }

    function setTimerPreset(presetId) {
      const preset = state.timerPresets.find(p => p.id === presetId);
      if (preset) {
        state.timerState.currentPresetId = presetId;
        state.timerState.totalSeconds = preset.minutes * 60;
        state.timerState.remainingSeconds = preset.minutes * 60;
        state.timerState.running = false;
        state.timerState.paused = false;
        clearInterval(timerInterval);
        document.getElementById('pauseBtn').textContent = 'Pause';
        updateTimerDisplay();
        renderPresets();
      }
    }

    function deletePreset(presetId) {
      state.timerPresets = state.timerPresets.filter(p => p.id !== presetId);
      saveState();
      renderPresets();
    }

    function renderPresets() {
      const container = document.getElementById('presetsContainer');
      container.innerHTML = '';

      state.timerPresets.forEach(preset => {
        const isSelected = state.timerState.currentPresetId === preset.id;
        const btn = document.createElement('button');
        btn.className = `preset-btn ${isSelected ? 'btn-primary' : 'btn'}`;
        btn.innerHTML = `<div>${preset.name}</div><div style="font-size: 12px; opacity: 0.8;">${preset.minutes}m</div>`;
        btn.onclick = () => setTimerPreset(preset.id);

        if (preset.id > 3) {
          btn.style.position = 'relative';
          const deleteBtn = document.createElement('span');
          deleteBtn.textContent = '✕';
          deleteBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; background: #ff6b6b; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deletePreset(preset.id);
          };
          btn.appendChild(deleteBtn);
        }

        container.appendChild(btn);
      });
    }

    // ===== Home Dashboard =====
    function updateHome() {
      // Remaining tasks
      const remainingList = document.getElementById('tasksRemainingList');
      remainingList.innerHTML = '';
      const remainingTasksList = state.tasks.filter(t => !t.completed).sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      if (remainingTasksList.length === 0) {
        remainingList.innerHTML = '<p style="color: var(--muted);">All tasks completed!</p>';
      } else {
        remainingTasksList.forEach(task => {
          const el = document.createElement('div');
          el.className = `task-item ${task.priority}`;

          let notesHTML = '';
          if (task.notes) {
            notesHTML = `<div class="task-notes">${task.notes}</div>`;
          }

          el.innerHTML = `
                        <div class="task-content">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
                            ${notesHTML}
                        </div>
                        <button class="btn btn-small" onclick="toggleTaskComplete('${task.id}')">✓</button>
                    `;
          remainingList.appendChild(el);
        });
      }

      // Quick habits
      renderQuickHabits();

      // Pinned notes
      renderPinnedNotes();
    }

    function renderQuickHabits() {
      const container = document.getElementById('quickHabitsContainer');
      container.innerHTML = '';

      if (state.habits.length === 0) {
        container.innerHTML = '<p style="color: var(--muted);">No habits yet. Create one to get started!</p>';
        return;
      }

      const now = new Date();
      const today = now.getDate();

      state.habits.forEach(habit => {
        const key = String(today);
        const isCompleted = habit.completedDays[key];

        const habitView = document.createElement('div');
        habitView.className = 'habit-quick-view';
        habitView.innerHTML = `
                    <div class="habit-quick-view-name">${habit.name}</div>
                    <div class="habit-quick-box ${isCompleted ? 'completed' : ''}" onclick="toggleHabitDay('${habit.id}', ${today})">
                        ${isCompleted ? '✓' : today}
                    </div>
                `;
        container.appendChild(habitView);
      });
    }

    // ===== Export/Import =====
    async function exportData() {
      const fullContent = JSON.stringify(state, null, 2);
      const fileName = `ultimate-hub-backup-${new Date().toISOString().split('T')[0]}.json`;

      const blob = new Blob([fullContent], {
        type: 'application/json;charset=utf-8;'
      });

      // 1️⃣ Try File System Access API first
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: "JSON Files",
              accept: {
                "application/json": [".json"]
              }
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log("File saved using File System Access API.");
          alert('File saved successfully!');
          return;
        } catch (err) {
          console.warn("File System Access API failed:", err);
        }
      }

      // 2️⃣ Fallback to regular download
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("File saved via regular download fallback.");
        alert('File downloaded successfully!');
        return;
      } catch (err) {
        console.warn("Regular download fallback failed:", err);
      }

      // 3️⃣ Final fallback: Web Share API
      try {
        const file = new File([blob], fileName, {
          type: "application/json"
        });
        if (navigator.canShare && navigator.canShare({
            files: [file]
          })) {
          await navigator.share({
            files: [file],
            title: fileName
          });
          console.log("File shared successfully via Web Share API.");
          alert('File shared successfully!');
          return;
        }
      } catch (err) {
        console.error("Unable to save or share the file on this device.", err);
        alert('Could not export file. Try Copy to Clipboard instead.');
      }
    }

    function copyDataToClipboard() {
      const fullContent = JSON.stringify(state, null, 2);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullContent).then(() => {
          alert('Data copied to clipboard! You can paste it in a text file.');
        }).catch(() => {
          fallbackCopyToClipboard(fullContent);
        });
      } else {
        fallbackCopyToClipboard(fullContent);
      }
    }

    function fallbackCopyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('Data copied to clipboard! You can paste it in a text file.');
      } catch (e) {
        alert('Could not copy to clipboard. Try using the Export button instead.');
      }
      document.body.removeChild(textarea);
    }

    function importData() {
      document.getElementById('importFile').click();
    }

    document.getElementById('importFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          state = {
            ...state,
            ...imported
          };
          state.currentMonth = new Date(state.currentMonth);
          saveState();
          alert('Data imported successfully!');
          location.reload();
        } catch (err) {
          alert('Error importing file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // ===== Event Listeners =====
    document.getElementById('quickAddBtn').addEventListener('click', () => openModal('quickAddModal'));

    // Tasks
    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    // Habits
    document.getElementById('addHabitBtn').addEventListener('click', addHabit);

    // Calendar
    document.getElementById('prevMonth').addEventListener('click', () => {
      state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
      renderCalendar();
    });

    document.getElementById('todayBtn').addEventListener('click', goToToday);

    document.getElementById('nextMonth').addEventListener('click', () => {
      state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
      renderCalendar();
    });

    document.getElementById('toggleCompleted').addEventListener('click', () => {
      state.showCompletedOnCalendar = !state.showCompletedOnCalendar;
      const btn = document.getElementById('toggleCompleted');
      btn.classList.toggle('active');
      btn.textContent = state.showCompletedOnCalendar ? 'Hide Completed' : 'Show Completed';
      saveState();
      renderCalendar();
    });

    // Notes
    document.getElementById('addNoteBtn').addEventListener('click', addNote);
    document.getElementById('cancelNoteBtn').addEventListener('click', cancelEditNote);

    function cancelEditNote() {
      state.editingNoteId = null;
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';
      closeModal('editNoteModal');
    }

    // Timer
    document.getElementById('startBtn').addEventListener('click', startTimer);
    document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
    document.getElementById('resetBtn').addEventListener('click', resetTimer);
    document.getElementById('addPresetBtn').addEventListener('click', addPreset);
    document.getElementById('setCustomBtn').addEventListener('click', setCustomTimer);

    // Settings - Theme
    document.getElementById('darkThemeBtn').addEventListener('click', () => {
      state.theme = 'dark';
      state.originalTheme = 'dark';
      saveState();
      applyTheme();
    });

    document.getElementById('lightThemeBtn').addEventListener('click', () => {
      state.theme = 'light';
      state.originalTheme = 'light';
      saveState();
      applyTheme();
    });

    // Settings - Colors
    document.getElementById('brandColor').addEventListener('change', (e) => {
      state.brandColor = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('brand2Color').addEventListener('change', (e) => {
      state.brand2Color = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('bgColor').addEventListener('change', (e) => {
      state.bgColor = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('bg2Color').addEventListener('change', (e) => {
      state.bg2Color = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('panelColor').addEventListener('change', (e) => {
      state.panelColor = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('panel2Color').addEventListener('change', (e) => {
      state.panel2Color = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('textColor').addEventListener('change', (e) => {
      state.textColor = e.target.value;
      saveState();
      applyTheme();
    });

    document.getElementById('mutedColor').addEventListener('change', (e) => {
      state.mutedColor = e.target.value;
      saveState();
      applyTheme();
    });

    // Settings - Font
    document.getElementById('fontSystemBtn').addEventListener('click', () => {
      state.font = 'system-ui';
      saveState();
      applyTheme();
    });

    document.getElementById('fontSerifBtn').addEventListener('click', () => {
      state.font = 'serif';
      saveState();
      applyTheme();
    });

    document.getElementById('fontMonoBtn').addEventListener('click', () => {
      state.font = 'monospace';
      saveState();
      applyTheme();
    });

    document.getElementById('fontGeorgiaBtn').addEventListener('click', () => {
      state.font = 'Georgia, serif';
      saveState();
      applyTheme();
    });

    document.getElementById('fontVerdanaBtn').addEventListener('click', () => {
      state.font = 'Verdana, sans-serif';
      saveState();
      applyTheme();
    });

    document.getElementById('fontCourierBtn').addEventListener('click', () => {
      state.font = 'Courier New, monospace';
      saveState();
      applyTheme();
    });

    // Settings - Text Size
    document.getElementById('textSize').addEventListener('change', (e) => {
      state.textSize = e.target.value;
      document.getElementById('textSizeValue').textContent = state.textSize;
      saveState();
      applyTheme();
    });

    // Settings - Letter Spacing
    document.getElementById('letterSpacing').addEventListener('change', (e) => {
      state.letterSpacing = e.target.value;
      document.getElementById('letterSpacingValue').textContent = state.letterSpacing;
      saveState();
      applyTheme();
    });

    // Settings - Line Height
    document.getElementById('lineHeight').addEventListener('change', (e) => {
      state.lineHeight = e.target.value;
      document.getElementById('lineHeightValue').textContent = state.lineHeight;
      saveState();
      applyTheme();
    });

    // Settings - Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('copyDataBtn').addEventListener('click', copyDataToClipboard);
    document.getElementById('importBtn').addEventListener('click', importData);

    // Settings - Clear Data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure? This will delete all data permanently.')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    });

    // ===== Initialize =====
    document.addEventListener('DOMContentLoaded', () => {
      loadState();
      applyTheme();
      updateHome();
      renderTasks();
      renderHabits();
      renderCalendar();
      renderNotes();
      renderKanban();
      renderPresets();
      updateTimerDisplay();

      // Update color pickers
      document.getElementById('brandColor').value = state.brandColor;
      document.getElementById('brand2Color').value = state.brand2Color;
      document.getElementById('bgColor').value = state.bgColor;
      document.getElementById('bg2Color').value = state.bg2Color;
      document.getElementById('panelColor').value = state.panelColor;
      document.getElementById('panel2Color').value = state.panel2Color;
      document.getElementById('textColor').value = state.textColor;
      document.getElementById('mutedColor').value = state.mutedColor;
      document.getElementById('textSize').value = state.textSize;
      document.getElementById('letterSpacing').value = state.letterSpacing;
      document.getElementById('lineHeight').value = state.lineHeight;
      document.getElementById('textSizeValue').textContent = state.textSize;
      document.getElementById('letterSpacingValue').textContent = state.letterSpacing;
      document.getElementById('lineHeightValue').textContent = state.lineHeight;

      // Set toggle button state
      const toggleBtn = document.getElementById('toggleCompleted');
      if (!state.showCompletedOnCalendar) {
        toggleBtn.classList.remove('active');
        toggleBtn.textContent = 'Show Completed';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('header') && !e.target.closest('.nav-menu')) {
        document.getElementById('hamburger').classList.remove('active');
        document.getElementById('navMenu').classList.remove('active');
      }
    });

    (() => {
      const ENTRY = 'Ultimate Hub v3',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
