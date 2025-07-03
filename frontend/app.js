console.log("¡TaskMaster Pro cargado!");

const API_URL = "http://localhost:5000/api/tasks";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("task-form");
  const titleInput = document.getElementById("title");
  const prioritySelect = document.getElementById("priority");
  const taskList = document.getElementById("task-list");

  // Función para mostrar notificaciones
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;
    
    // Agregar estilos para la notificación
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
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Función para renderizar una tarea con el nuevo diseño
  function renderTask(task) {
    const li = document.createElement("li");
    li.className = `task-item ${task.priority}`;
    if (task.completed) li.classList.add("completada");
    
    // Contenido principal de la tarea
    const taskContent = document.createElement("div");
    taskContent.className = "task-content";
    
    const taskTitle = document.createElement("div");
    taskTitle.className = "task-title";
    taskTitle.textContent = task.title;
    
    const taskPriority = document.createElement("span");
    taskPriority.className = `task-priority priority-${task.priority}`;
    taskPriority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    taskContent.appendChild(taskTitle);
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
      titleInput.value = task.title;
      prioritySelect.value = task.priority;
      
      // Cambiar el texto del botón
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Tarea';
      
      // Cambiar el comportamiento del submit temporalmente
      const originalSubmit = form.onsubmit;
      form.onsubmit = async (event) => {
        event.preventDefault();
        const newTitle = titleInput.value.trim();
        const newPriority = prioritySelect.value;
        
        if (newTitle === "") {
          showNotification("El título no puede estar vacío", "error");
          return;
        }
        
        try {
          const response = await fetch(`${API_URL}/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, priority: newPriority })
          });
          
          if (response.ok) {
            form.reset();
            form.onsubmit = originalSubmit;
            submitBtn.innerHTML = originalText;
            loadTasks();
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
            li.style.animation = "slideOutLeft 0.3s ease-out";
            setTimeout(() => {
              li.remove();
              showNotification("Tarea eliminada correctamente", "success");
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

  // Función para crear una nueva tarea
  const createTask = async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const priority = prioritySelect.value;
    
    if (title === "") {
      showNotification("El título no puede estar vacío", "error");
      return;
    }
    
    if (!priority) {
      showNotification("Debes seleccionar una prioridad", "error");
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, priority })
      });
      
      if (response.ok) {
        const newTask = await response.json();
        renderTask(newTask);
        form.reset();
        showNotification("Tarea creada correctamente", "success");
        
        // Efecto de celebración para nuevas tareas
        const newTaskElement = taskList.lastElementChild;
        newTaskElement.style.animation = "bounce 0.6s ease-out";
      } else {
        showNotification("Error al crear la tarea", "error");
      }
    } catch (error) {
      showNotification("Error de conexión", "error");
    }
  };

  // Agregar event listener al formulario
  form.addEventListener("submit", createTask);

  // Función para cargar todas las tareas
  async function loadTasks() {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const tasks = await response.json();
        taskList.innerHTML = "";
        tasks.forEach(renderTask);
      } else {
        showNotification("Error al cargar las tareas", "error");
      }
    } catch (error) {
      showNotification("Error de conexión al cargar tareas", "error");
    }
  }

  // Función para actualizar estadísticas
  function updateStats() {
    const tasks = Array.from(document.querySelectorAll('.task-item'));
    const completed = tasks.filter(task => task.classList.contains('completada')).length;
    const highPriority = tasks.filter(task => task.classList.contains('alta')).length;
    
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const highPriorityEl = document.getElementById('high-priority');
    
    if (totalTasksEl) totalTasksEl.textContent = tasks.length;
    if (completedTasksEl) completedTasksEl.textContent = completed;
    if (pendingTasksEl) pendingTasksEl.textContent = tasks.length - completed;
    if (highPriorityEl) highPriorityEl.textContent = highPriority;
  }

  // Observar cambios en la lista de tareas para actualizar estadísticas
  const observer = new MutationObserver(updateStats);
  observer.observe(taskList, { childList: true, subtree: true, attributes: true });

  // Agregar animaciones CSS adicionales
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
    
    @keyframes slideOutLeft {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-100%);
      }
    }
    
    @keyframes bounce {
      0%, 20%, 60%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      80% {
        transform: translateY(-5px);
      }
    }
  `;
  document.head.appendChild(style);

  // Cargar tareas iniciales
  loadTasks();
  
  // Actualizar estadísticas iniciales después de un breve delay
  setTimeout(updateStats, 1000);
  
  // Función para crear efecto de partículas
  function createParticles(x, y) {
    const particles = document.createElement('div');
    particles.className = 'particles';
    
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.animationDelay = (i * 0.1) + 's';
      particles.appendChild(particle);
    }
    
    document.body.appendChild(particles);
    
    setTimeout(() => {
      particles.remove();
    }, 2000);
  }

  // Función para mostrar overlay de carga
  function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function hideLoading(overlay) {
    if (overlay) {
      overlay.remove();
    }
  }

  // Agregar efectos de partículas al completar tareas
  const originalCompleteTask = completeBtn.onclick;
  completeBtn.onclick = async (event) => {
    const rect = event.target.getBoundingClientRect();
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await originalCompleteTask(event);
  };

  // Agregar funcionalidad de búsqueda y filtros
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Buscar tareas...';
  searchInput.className = 'search-input';
  searchInput.style.cssText = `
    width: 100%;
    padding: 12px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  `;

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const tasks = document.querySelectorAll('.task-item');
    
    tasks.forEach(task => {
      const title = task.querySelector('.task-title').textContent.toLowerCase();
      if (title.includes(searchTerm)) {
        task.style.display = 'block';
      } else {
        task.style.display = 'none';
      }
    });
  });

  // Insertar búsqueda antes de la lista de tareas
  const taskListCard = document.querySelector('.card:has(#task-list)');
  if (taskListCard) {
    const taskListHeader = taskListCard.querySelector('h2');
    taskListCard.insertBefore(searchInput, taskListHeader.nextSibling);
  }

  // Agregar funcionalidad de filtros por prioridad
  const filterButtons = document.createElement('div');
  filterButtons.className = 'filter-buttons';
  filterButtons.style.cssText = `
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  `;

  const priorities = ['Todas', 'Alta', 'Media', 'Baja'];
  priorities.forEach(priority => {
    const button = document.createElement('button');
    button.textContent = priority;
    button.className = 'btn btn-primary';
    button.style.fontSize = '0.8rem';
    button.style.padding = '8px 12px';
    
    button.addEventListener('click', () => {
      const tasks = document.querySelectorAll('.task-item');
      const priorityLower = priority.toLowerCase();
      
      tasks.forEach(task => {
        if (priorityLower === 'todas' || task.classList.contains(priorityLower)) {
          task.style.display = 'block';
        } else {
          task.style.display = 'none';
        }
      });
      
      // Actualizar botón activo
      filterButtons.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      });
      button.classList.remove('btn-secondary');
      button.classList.add('btn-primary');
    });
    
    filterButtons.appendChild(button);
  });

  // Insertar filtros después de la búsqueda
  if (taskListCard) {
    taskListCard.insertBefore(filterButtons, searchInput.nextSibling);
  }

  // Agregar funcionalidad de ordenamiento
  const sortSelect = document.createElement('select');
  sortSelect.className = 'sort-select';
  sortSelect.style.cssText = `
    padding: 8px;
    border: 2px solid #e1e5e9;
    border-radius: 5px;
    margin-left: auto;
    font-size: 0.8rem;
  `;
  
  const sortOptions = [
    { value: 'date', text: 'Fecha' },
    { value: 'priority', text: 'Prioridad' },
    { value: 'title', text: 'Título' }
  ];
  
  sortOptions.forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.text;
    sortSelect.appendChild(optionEl);
  });

  sortSelect.addEventListener('change', () => {
    const tasks = Array.from(document.querySelectorAll('.task-item'));
    const sortBy = sortSelect.value;
    
    tasks.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { alta: 3, media: 2, baja: 1 };
        const aPriority = priorityOrder[a.classList.contains('alta') ? 'alta' : a.classList.contains('media') ? 'media' : 'baja'];
        const bPriority = priorityOrder[b.classList.contains('alta') ? 'alta' : b.classList.contains('media') ? 'media' : 'baja'];
        return bPriority - aPriority;
      } else if (sortBy === 'title') {
        const aTitle = a.querySelector('.task-title').textContent;
        const bTitle = b.querySelector('.task-title').textContent;
        return aTitle.localeCompare(bTitle);
      }
      return 0;
    });
    
    tasks.forEach(task => taskList.appendChild(task));
  });

  // Agregar selector de ordenamiento al header de la lista
  if (taskListCard) {
    const header = taskListCard.querySelector('h2');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.appendChild(sortSelect);
  }

  console.log("TaskMaster Pro inicializado correctamente con funcionalidades avanzadas");
});
