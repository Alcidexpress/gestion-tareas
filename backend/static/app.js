console.log("¡FlowDays Calendar cargado!");

const API_URL = "http://localhost:5000/api/tasks";

// Variables globales del calendario
let currentDate = new Date();
let selectedDate = new Date();
let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
  initializeCalendar();
  initializeForm();
  loadTasks();
  updateStats();
  
  // Configurar fecha actual en el formulario
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // --- Chat flotante robusto ---
  const chatToggle = document.getElementById('chat-toggle');
  const chatWidget = document.getElementById('chat-widget');
  const chatBody = document.getElementById('chat-body');
  const icon = chatToggle.querySelector('i');

  chatToggle.addEventListener('click', () => {
    chatWidget.classList.toggle('collapsed');
    if (chatWidget.classList.contains('collapsed')) {
      icon.className = 'fas fa-plus';
      chatBody.style.display = 'none';
    } else {
      icon.className = 'fas fa-minus';
      chatBody.style.display = 'flex';
    }
  });

  // Forzar el estado inicial
  if (chatWidget.classList.contains('collapsed')) {
    icon.className = 'fas fa-plus';
    chatBody.style.display = 'none';
  } else {
    icon.className = 'fas fa-minus';
    chatBody.style.display = 'flex';
  }
});

// Inicializar calendario
function initializeCalendar() {
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const currentMonthEl = document.getElementById('current-month');
  
  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  renderCalendar();
}

// Renderizar calendario
function renderCalendar() {
  const currentMonthEl = document.getElementById('current-month');
  const calendarDaysEl = document.getElementById('calendar-days');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Actualizar título del mes
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  currentMonthEl.textContent = `${monthNames[month]} ${year}`;
  
  // Obtener primer día del mes y último día
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Limpiar calendario
  calendarDaysEl.innerHTML = '';
  
  // Generar días
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = date.getDate();
    
    // Verificar si es del mes actual
    if (date.getMonth() !== month) {
      dayEl.classList.add('other-month');
    }
    
    // Verificar si es hoy
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayEl.classList.add('today');
    }
    
    // Verificar si está seleccionado
    if (date.toDateString() === selectedDate.toDateString()) {
      dayEl.classList.add('selected');
    }
    
    // Verificar si tiene tareas
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.date === dateStr);
    if (dayTasks.length > 0) {
      dayEl.classList.add('has-tasks');
      dayEl.title = `${dayTasks.length} tarea(s)`;
    }
    
    // Evento de clic
    dayEl.addEventListener('click', () => {
      if (!dayEl.classList.contains('other-month')) {
        selectedDate = date;
        renderCalendar();
        loadTasksForDate(dateStr);
        updateSelectedDateInfo(date);
      }
    });
    
    calendarDaysEl.appendChild(dayEl);
  }
}

// Inicializar formulario
function initializeForm() {
  const form = document.getElementById('task-form');
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const prioritySelect = document.getElementById('priority');
  const locationInput = document.getElementById('location');
  const reminderTypeSelect = document.getElementById('reminder-type');
  const reminderBeforeSelect = document.getElementById('reminder-before');
  
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const taskData = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      date: dateInput.value,
      time: timeInput.value || null,
      priority: prioritySelect.value,
      location: locationInput.value.trim(),
      reminder_type: reminderTypeSelect.value,
      reminder_before: parseInt(reminderBeforeSelect.value)
    };
    
    if (!taskData.title || !taskData.priority) {
      showNotification("Título y prioridad son requeridos", "error");
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        const newTask = await response.json();
        tasks.push(newTask);
        
        // Limpiar formulario
        form.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        
        // Actualizar interfaz
        renderCalendar();
        loadTasksForDate(selectedDate.toISOString().split('T')[0]);
        updateStats();
        
        showNotification("Tarea creada exitosamente", "success");
        createParticles(event.clientX, event.clientY);
      } else {
        showNotification("Error al crear la tarea", "error");
      }
    } catch (error) {
      showNotification("Error de conexión", "error");
    }
  });
}

// Cargar todas las tareas
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      tasks = await response.json();
      renderCalendar();
      loadTasksForDate(selectedDate.toISOString().split('T')[0]);
      updateStats();
    }
  } catch (error) {
    console.error("Error cargando tareas:", error);
  }
}

// Cargar tareas para una fecha específica
async function loadTasksForDate(dateStr) {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  
  const dayTasks = tasks.filter(task => task.date === dateStr);
  
  if (dayTasks.length === 0) {
    taskList.innerHTML = '<li class="no-tasks">No hay tareas para este día</li>';
    return;
  }
  
  // Ordenar tareas por hora
  dayTasks.sort((a, b) => {
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.time ? -1 : 1;
  });
  
  dayTasks.forEach(task => {
    renderTask(task);
  });
}

// Renderizar una tarea
function renderTask(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement("li");
  li.className = `task-item ${task.priority}`;
  if (task.completed) li.classList.add("completada");
  
  // Contenido principal de la tarea
  const taskContent = document.createElement("div");
  taskContent.className = "task-content";
  
  const taskTitle = document.createElement("div");
  taskTitle.className = "task-title";
  taskTitle.textContent = task.title;
  
  const taskDetails = document.createElement("div");
  taskDetails.className = "task-details";
  
  if (task.time) {
    const timeEl = document.createElement("span");
    timeEl.className = "task-time";
    timeEl.innerHTML = `<i class="fas fa-clock"></i> ${task.time}`;
    taskDetails.appendChild(timeEl);
  }
  
  if (task.location) {
    const locationEl = document.createElement("span");
    locationEl.className = "task-location";
    locationEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${task.location}`;
    taskDetails.appendChild(locationEl);
  }
  
  if (task.description) {
    const descEl = document.createElement("div");
    descEl.className = "task-description";
    descEl.textContent = task.description;
    taskDetails.appendChild(descEl);
  }
  
  const taskPriority = document.createElement("span");
  taskPriority.className = `task-priority priority-${task.priority}`;
  taskPriority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  
  taskContent.appendChild(taskTitle);
  taskContent.appendChild(taskDetails);
  taskContent.appendChild(taskPriority);
  li.appendChild(taskContent);
  
  // Acciones de la tarea
  const taskActions = document.createElement("div");
  taskActions.className = "task-actions";
  
  // Botón Completar
  const completeBtn = document.createElement("button");
  completeBtn.innerHTML = `<i class="fas fa-${task.completed ? 'check' : 'check'}"></i>`;
  completeBtn.className = `btn ${task.completed ? 'btn-success' : 'btn-success'}`;
  completeBtn.title = task.completed ? "Completado" : "Marcar como completada";
  completeBtn.onclick = async () => {
    try {
      const newStatus = !task.completed;
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newStatus })
      });
      
      if (response.ok) {
        li.classList.toggle("completada");
        task.completed = newStatus;
        completeBtn.title = newStatus ? "Completado" : "Marcar como completada";
        showNotification(newStatus ? "¡Tarea completada!" : "Tarea marcada como pendiente", "success");
        updateStats();
        if (newStatus) {
          createParticles(completeBtn.offsetLeft, completeBtn.offsetTop);
        }
      } else {
        showNotification("Error al actualizar la tarea", "error");
      }
    } catch (error) {
      showNotification("Error de conexión", "error");
    }
  };
  
  // Botón Editar
  const editBtn = document.createElement("button");
  editBtn.innerHTML = `<i class="fas fa-edit"></i>`;
  editBtn.className = "btn btn-warning";
  editBtn.title = "Editar tarea";
  editBtn.onclick = () => {
    // Rellenar el formulario con los datos de la tarea
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description || '';
    document.getElementById('date').value = task.date;
    document.getElementById('time').value = task.time || '';
    document.getElementById('priority').value = task.priority;
    document.getElementById('location').value = task.location || '';
    document.getElementById('reminder-type').value = task.reminder_type || 'none';
    document.getElementById('reminder-before').value = task.reminder_before || 0;
    
    // Cambiar el texto del botón
    const submitBtn = document.querySelector('#task-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Tarea';
    
    // Cambiar el comportamiento del submit temporalmente
    const originalSubmit = document.getElementById('task-form').onsubmit;
    document.getElementById('task-form').onsubmit = async (event) => {
      event.preventDefault();
      
      const taskData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value || null,
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value.trim(),
        reminder_type: document.getElementById('reminder-type').value,
        reminder_before: parseInt(document.getElementById('reminder-before').value)
      };
      
      try {
        const response = await fetch(`${API_URL}/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
          // Actualizar tarea en el array
          const updatedTask = await response.json();
          const index = tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            tasks[index] = updatedTask;
          }
          
          // Limpiar formulario
          document.getElementById('task-form').reset();
          document.getElementById('date').value = new Date().toISOString().split('T')[0];
          
          // Restaurar comportamiento original
          document.getElementById('task-form').onsubmit = originalSubmit;
          submitBtn.innerHTML = originalText;
          
          // Actualizar interfaz
          renderCalendar();
          loadTasksForDate(selectedDate.toISOString().split('T')[0]);
          updateStats();
          
          showNotification("Tarea actualizada correctamente", "success");
        } else {
          showNotification("Error al actualizar la tarea", "error");
        }
      } catch (error) {
        showNotification("Error de conexión", "error");
      }
    };
  };
  
  // Botón Eliminar
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = `<i class="fas fa-trash"></i>`;
  deleteBtn.className = "btn btn-danger";
  deleteBtn.title = "Eliminar tarea";
  deleteBtn.onclick = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      try {
        const response = await fetch(`${API_URL}/${task.id}`, { method: "DELETE" });
        if (response.ok) {
          // Remover tarea del array
          tasks = tasks.filter(t => t.id !== task.id);
          
          li.style.animation = "slideOutLeft 0.3s ease-out";
          setTimeout(() => {
            li.remove();
            showNotification("Tarea eliminada correctamente", "success");
            renderCalendar();
            updateStats();
          }, 300);
        } else {
          showNotification("Error al eliminar la tarea", "error");
        }
      } catch (error) {
        showNotification("Error de conexión", "error");
      }
    }
  };
  
  taskActions.appendChild(completeBtn);
  taskActions.appendChild(editBtn);
  taskActions.appendChild(deleteBtn);
  li.appendChild(taskActions);
  
  taskList.appendChild(li);
}

// Actualizar información de fecha seleccionada
function updateSelectedDateInfo(date) {
  const selectedDateInfo = document.getElementById('selected-date-info');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = date.toLocaleDateString('es-ES', options);
  selectedDateInfo.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// Actualizar estadísticas
function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => task.date === today);
  const upcomingTasks = tasks.filter(task => task.date > today);
  const remindersActive = tasks.filter(task => task.reminder_type !== 'none' && task.reminder_before > 0);
  const completedTasks = tasks.filter(task => task.completed);
  
  document.getElementById('today-tasks').textContent = todayTasks.length;
  document.getElementById('upcoming-tasks').textContent = upcomingTasks.length;
  document.getElementById('reminders-active').textContent = remindersActive.length;
  document.getElementById('completed-tasks').textContent = completedTasks.length;
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Función para crear partículas
function createParticles(x, y) {
  const particles = document.createElement('div');
  particles.className = 'particles';
  particles.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    pointer-events: none;
    z-index: 1000;
  `;
  
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      animation: particle 1s ease-out forwards;
    `;
    particles.appendChild(particle);
  }
  
  document.body.appendChild(particles);
  
  setTimeout(() => {
    particles.remove();
  }, 1000);
}

// Funcionalidad del chat flotante Izán Bot
const chatWidget = document.getElementById("chat-widget");
const chatToggle = document.getElementById("chat-toggle");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Toggle para colapsar/expandir el chat - Optimizado para respuesta inmediata
chatToggle.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const isCollapsed = chatWidget.classList.contains("collapsed");
  
  // Cambiar inmediatamente el icono
  chatToggle.innerHTML = isCollapsed ? '<i class="fas fa-minus"></i>' : '<i class="fas fa-plus"></i>';
  
  // Aplicar la clase inmediatamente
  if (isCollapsed) {
    chatWidget.classList.remove("collapsed");
  } else {
    chatWidget.classList.add("collapsed");
  }
});

// Click en el header para expandir si está colapsado - Optimizado
document.getElementById("chat-header").addEventListener("click", (e) => {
  if (e.target !== chatToggle && chatWidget.classList.contains("collapsed")) {
    e.preventDefault();
    e.stopPropagation();
    
    chatWidget.classList.remove("collapsed");
    chatToggle.innerHTML = '<i class="fas fa-minus"></i>';
  }
});

function addMessage(content, type = 'bot') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  typingIndicator.style.display = 'block';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  typingIndicator.style.display = 'none';
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Mostrar mensaje del usuario
  addMessage(`<strong>Tú:</strong> ${message}`, 'user');
  userInput.value = '';

  // Mostrar indicador de escritura
  showTyping();

  try {
    const response = await fetch("http://localhost:5000/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    hideTyping();

    if (data.reply) {
      addMessage(`<strong>Izán Bot:</strong> ${data.reply}`, 'bot');
    } else {
      addMessage(`<strong>Error:</strong> No se recibió respuesta válida`, 'error');
    }
  } catch (error) {
    hideTyping();
    addMessage(`<strong>Error:</strong> ${error.message}`, 'error');
  }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

console.log("FlowDays Calendar inicializado correctamente con funcionalidades avanzadas");

// FlowDays Professional - Gestión Completa de Tareas y Turnos Laborales
class FlowDaysApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.tasks = [];
        this.shifts = [];
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.renderCalendar();
        this.updateStats();
        this.setCurrentDateInForms();
    }

    setupEventListeners() {
        // Navegación del calendario
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });

        // Formulario de tareas
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        // Formulario de turnos
        document.getElementById('shift-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createShift();
        });

        // Chat flotante
        const chatToggle = document.getElementById('chat-toggle');
        const chatWidget = document.getElementById('chat-widget');
        const chatBody = document.getElementById('chat-body');
        const icon = chatToggle.querySelector('i');

        chatToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isCollapsed = chatWidget.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expandir
                chatWidget.classList.remove('collapsed');
                icon.className = 'fas fa-minus';
                chatBody.style.display = 'flex';
            } else {
                // Colapsar
                chatWidget.classList.add('collapsed');
                icon.className = 'fas fa-plus';
                chatBody.style.display = 'none';
            }
        });

        // Forzar el estado inicial del chat
        const isInitiallyCollapsed = chatWidget.classList.contains('collapsed');
        if (isInitiallyCollapsed) {
            icon.className = 'fas fa-plus';
            chatBody.style.display = 'none';
        } else {
            icon.className = 'fas fa-minus';
            chatBody.style.display = 'flex';
        }

        // Chat input
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        
        sendButton.addEventListener('click', () => this.sendMessage());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    setCurrentDateInForms() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-date').value = today;
        document.getElementById('shift-date').value = today;
    }

    async loadData() {
        try {
            // Cargar tareas
            const tasksResponse = await fetch('/api/tasks');
            this.tasks = await tasksResponse.json();

            // Cargar turnos
            const shiftsResponse = await fetch('/api/shifts');
            this.shifts = await shiftsResponse.json();

            this.renderCalendar();
            this.updateStats();
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    // ===== GESTIÓN DE TAREAS =====
    async createTask() {
        const formData = new FormData(document.getElementById('task-form'));
        const taskData = {
            title: formData.get('task-title'),
            description: formData.get('task-description'),
            date: formData.get('task-date'),
            time: formData.get('task-time') || null,
            priority: formData.get('task-priority'),
            location: formData.get('task-location') || '',
            reminder_type: formData.get('task-reminder-type'),
            reminder_before: parseInt(formData.get('task-reminder-before'))
        };

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const newTask = await response.json();
                this.tasks.push(newTask);
                this.renderCalendar();
                this.updateStats();
                this.clearTaskForm();
                this.showNotification('Tarea creada exitosamente', 'success');
            } else {
                throw new Error('Error al crear tarea');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al crear tarea', 'error');
        }
    }

    async updateTask(taskId, taskData) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const updatedTask = await response.json();
                const index = this.tasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    this.tasks[index] = updatedTask;
                }
                this.renderCalendar();
                this.updateStats();
                this.showNotification('Tarea actualizada exitosamente', 'success');
            } else {
                throw new Error('Error al actualizar tarea');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al actualizar tarea', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderCalendar();
                this.updateStats();
                this.showNotification('Tarea eliminada exitosamente', 'success');
            } else {
                throw new Error('Error al eliminar tarea');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al eliminar tarea', 'error');
        }
    }

    // ===== GESTIÓN DE TURNOS =====
    async createShift() {
        const formData = new FormData(document.getElementById('shift-form'));
        const shiftData = {
            date: formData.get('shift-date'),
            shift_type: formData.get('shift-type'),
            start_time: formData.get('shift-start') || null,
            end_time: formData.get('shift-end') || null,
            notes: formData.get('shift-notes') || ''
        };

        try {
            const response = await fetch('/api/shifts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shiftData)
            });

            if (response.ok) {
                const newShift = await response.json();
                this.shifts.push(newShift);
                this.renderCalendar();
                this.updateStats();
                this.clearShiftForm();
                this.showNotification('Turno creado exitosamente', 'success');
            } else {
                throw new Error('Error al crear turno');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al crear turno', 'error');
        }
    }

    async updateShift(shiftId, shiftData) {
        try {
            const response = await fetch(`/api/shifts/${shiftId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shiftData)
            });

            if (response.ok) {
                const updatedShift = await response.json();
                const index = this.shifts.findIndex(s => s.id === shiftId);
                if (index !== -1) {
                    this.shifts[index] = updatedShift;
                }
                this.renderCalendar();
                this.updateStats();
                this.showNotification('Turno actualizado exitosamente', 'success');
            } else {
                throw new Error('Error al actualizar turno');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al actualizar turno', 'error');
        }
    }

    async deleteShift(shiftId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este turno?')) {
            return;
        }

        try {
            const response = await fetch(`/api/shifts/${shiftId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.shifts = this.shifts.filter(s => s.id !== shiftId);
                this.renderCalendar();
                this.updateStats();
                this.showNotification('Turno eliminado exitosamente', 'success');
            } else {
                throw new Error('Error al eliminar turno');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al eliminar turno', 'error');
        }
    }

    // ===== CALENDARIO UNIFICADO =====
    renderCalendar() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Actualizar título del mes
        document.getElementById('current-month').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();

            // Verificar si es el día actual
            if (this.isToday(currentDate)) {
                dayElement.classList.add('today');
            }

            // Verificar si es del mes actual
            if (currentDate.getMonth() !== this.currentMonth) {
                dayElement.classList.add('other-month');
            } else {
                // Verificar elementos del día
                const dayTasks = this.getTasksForDate(currentDate);
                const dayShifts = this.getShiftsForDate(currentDate);
                
                if (dayTasks.length > 0 || dayShifts.length > 0) {
                    dayElement.classList.add('has-elements');
                    this.addDayIndicators(dayElement, dayTasks, dayShifts);
                }

                // Hacer clickeable
                dayElement.addEventListener('click', () => {
                    this.selectDate(currentDate);
                });
            }

            calendarDays.appendChild(dayElement);
        }
    }

    addDayIndicators(dayElement, tasks, shifts) {
        // Indicador de tareas (punto azul)
        if (tasks.length > 0) {
            const taskIndicator = document.createElement('div');
            taskIndicator.className = 'task-indicator';
            taskIndicator.style.cssText = `
                position: absolute;
                bottom: 5px;
                left: 5px;
                width: 8px;
                height: 8px;
                background: #667eea;
                border-radius: 50%;
            `;
            dayElement.appendChild(taskIndicator);
        }

        // Indicador de turnos (barra superior)
        if (shifts.length > 0) {
            dayElement.classList.add('has-shifts');
            if (shifts.length === 1) {
                const shiftType = shifts[0].shift_type;
                dayElement.classList.add(`single-shift`, shiftType.toLowerCase());
            } else {
                const shiftTypes = [...new Set(shifts.map(s => s.shift_type))];
                if (shiftTypes.includes('M')) dayElement.classList.add('morning');
                if (shiftTypes.includes('T')) dayElement.classList.add('afternoon');
                if (shiftTypes.includes('N')) dayElement.classList.add('night');
                if (shiftTypes.includes('F')) dayElement.classList.add('holiday');
                if (shiftTypes.includes('L')) dayElement.classList.add('free');
                if (shiftTypes.includes('V')) dayElement.classList.add('vacation');
            }
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        this.loadElementsForDate(date);
        this.updateSelectedDateInfo();
    }

    async loadElementsForDate(date) {
        const dateStr = this.formatDate(date);
        
        // Cargar tareas
        try {
            const tasksResponse = await fetch(`/api/tasks/date/${dateStr}`);
            const tasks = await tasksResponse.json();
            this.renderTasksList(tasks);
        } catch (error) {
            console.error('Error cargando tareas:', error);
        }

        // Cargar turnos
        try {
            const shiftsResponse = await fetch(`/api/shifts/date/${dateStr}`);
            const shifts = await shiftsResponse.json();
            this.renderShiftsList(shifts);
        } catch (error) {
            console.error('Error cargando turnos:', error);
        }
    }

    renderTasksList(tasks) {
        const taskList = document.getElementById('task-list');
        const taskCounter = document.getElementById('task-counter');
        
        taskCounter.textContent = `${tasks.length} tarea${tasks.length !== 1 ? 's' : ''}`;
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="no-tasks">No hay tareas para este día</li>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    renderShiftsList(shifts) {
        const shiftList = document.getElementById('shift-list');
        const shiftCounter = document.getElementById('shift-counter');
        
        shiftCounter.textContent = `${shifts.length} turno${shifts.length !== 1 ? 's' : ''}`;
        shiftList.innerHTML = '';

        if (shifts.length === 0) {
            shiftList.innerHTML = '<li class="no-shifts">No hay turnos para este día</li>';
            return;
        }

        shifts.forEach(shift => {
            const shiftElement = this.createShiftElement(shift);
            shiftList.appendChild(shiftElement);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completada' : '';
        
        li.innerHTML = `
            <div class="task-content">
                <div class="task-title ${completedClass}">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-details">
                    ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}</span>` : ''}
                    ${task.location ? `<span class="task-location"><i class="fas fa-map-marker-alt"></i> ${task.location}</span>` : ''}
                </div>
                <span class="task-priority ${priorityClass}">${task.priority}</span>
            </div>
            <div class="task-actions">
                <button class="complete-btn ${task.completed ? 'completed' : ''}" onclick="flowDaysApp.toggleTaskComplete(${task.id})" title="${task.completed ? 'Desmarcar' : 'Completar'}">
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                </button>
                <button class="edit-btn" onclick="flowDaysApp.editTask(${task.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="flowDaysApp.deleteTask(${task.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return li;
    }

    createShiftElement(shift) {
        const li = document.createElement('li');
        li.className = 'shift-item';
        
        const shiftName = this.getShiftName(shift.shift_type);
        const timeText = shift.start_time && shift.end_time 
            ? `${shift.start_time} - ${shift.end_time}` 
            : 'Horario no especificado';
        
        li.innerHTML = `
            <div class="shift-content">
                <span class="shift-type ${shift.shift_type}">${shift.shift_type}</span>
                <div class="shift-time">${shiftName} - ${timeText}</div>
                ${shift.notes ? `<div class="shift-notes">${shift.notes}</div>` : ''}
                <div class="shift-meta">
                    ${shift.hours_worked > 0 ? `<span class="shift-hours"><i class="fas fa-clock"></i> ${shift.hours_worked}h</span>` : ''}
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(new Date(shift.date))}</span>
                </div>
            </div>
            <div class="shift-actions">
                <button class="edit-btn" onclick="flowDaysApp.editShift(${shift.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="flowDaysApp.deleteShift(${shift.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return li;
    }

    async toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedTask = { ...task, completed: !task.completed };
        await this.updateTask(taskId, updatedTask);
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Llenar el formulario con los datos de la tarea
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-time').value = task.time || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-location').value = task.location || '';
        document.getElementById('task-reminder-type').value = task.reminder_type || 'none';
        document.getElementById('task-reminder-before').value = task.reminder_before || '0';

        // Cambiar el botón del formulario
        const submitBtn = document.querySelector('#task-form button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Tarea';
        submitBtn.onclick = (e) => {
            e.preventDefault();
            this.updateTask(taskId);
        };
    }

    editShift(shiftId) {
        const shift = this.shifts.find(s => s.id === shiftId);
        if (!shift) return;

        // Llenar el formulario con los datos del turno
        document.getElementById('shift-date').value = shift.date;
        document.getElementById('shift-type').value = shift.shift_type;
        document.getElementById('shift-start').value = shift.start_time || '';
        document.getElementById('shift-end').value = shift.end_time || '';
        document.getElementById('shift-notes').value = shift.notes || '';

        // Cambiar el botón del formulario
        const submitBtn = document.querySelector('#shift-form button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Turno';
        submitBtn.onclick = (e) => {
            e.preventDefault();
            this.updateShift(shiftId);
        };
    }

    async updateStats() {
        try {
            // Estadísticas de la semana actual
            const weekStats = await this.getWeekStats();
            document.getElementById('week-hours').textContent = `${weekStats.total_hours}h`;

            // Estadísticas del mes actual
            const monthStats = await this.getMonthStats();
            document.getElementById('month-hours').textContent = `${monthStats.total_hours}h`;

            // Tareas de hoy
            const todayTasks = this.getTasksForDate(new Date());
            document.getElementById('today-tasks').textContent = todayTasks.length;

            // Turnos de hoy
            const todayShifts = this.getShiftsForDate(new Date());
            document.getElementById('today-shifts').textContent = todayShifts.length;

        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    async getWeekStats() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const response = await fetch(`/api/stats/week/${this.formatDate(weekStart)}`);
        return await response.json();
    }

    async getMonthStats() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const response = await fetch(`/api/stats/month/${this.formatDate(monthStart)}`);
        return await response.json();
    }

    updateSelectedDateInfo() {
        const dateStr = this.formatDate(this.selectedDate);
        // La información se muestra en los contadores de cada sección
    }

    getTasksForDate(date) {
        const dateStr = this.formatDate(date);
        return this.tasks.filter(task => task.date === dateStr);
    }

    getShiftsForDate(date) {
        const dateStr = this.formatDate(date);
        return this.shifts.filter(shift => shift.date === dateStr);
    }

    getShiftName(shiftType) {
        const names = {
            'M': 'Mañana',
            'T': 'Tarde',
            'N': 'Noche',
            'F': 'Festivo',
            'L': 'Libre',
            'V': 'Vacaciones'
        };
        return names[shiftType] || shiftType;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    clearTaskForm() {
        document.getElementById('task-form').reset();
        this.setCurrentDateInForms();
        const submitBtn = document.querySelector('#task-form button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Crear Tarea';
        submitBtn.onclick = null;
    }

    clearShiftForm() {
        document.getElementById('shift-form').reset();
        this.setCurrentDateInForms();
        const submitBtn = document.querySelector('#shift-form button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Crear Turno';
        submitBtn.onclick = null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Mostrar mensaje del usuario
        this.addMessage(message, 'user');
        userInput.value = '';
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            this.hideTypingIndicator();
            
            if (data.response) {
                this.addMessage(data.response, 'bot');
            } else {
                this.addMessage('Lo siento, no pude procesar tu mensaje.', 'error');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        }
    }

    addMessage(message, type) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'user') {
            messageDiv.innerHTML = `<strong>Tú:</strong> ${message}`;
        } else if (type === 'bot') {
            messageDiv.innerHTML = `<strong>Izán Bot:</strong> ${message}`;
        } else {
            messageDiv.innerHTML = `<strong>Error:</strong> ${message}`;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'block';
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'none';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.flowDaysApp = new FlowDaysApp();
});
  