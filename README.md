# 🚀 FlowDays Professional

**Organiza tus tareas, Recuerda, Actúa**

Una aplicación web moderna y profesional que combina la gestión de tareas personales con la administración de turnos laborales en una interfaz unificada.

![FlowDays Professional](https://img.shields.io/badge/FlowDays-Professional-blue?style=for-the-badge&logo=calendar)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-red?style=for-the-badge&logo=flask)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?style=for-the-badge&logo=mysql)

## 📋 Características Principales

### 🎯 Gestión Completa de Tareas
- ✅ Crear, editar y eliminar tareas
- ✅ Título, descripción y prioridad configurable
- ✅ Ubicación y hora específica
- ✅ Sistema de recordatorios inteligente
- ✅ Marcado de completado/pendiente
- ✅ Filtros y búsqueda avanzada

### 💼 Gestión Profesional de Turnos
- ✅ 6 tipos de turno (Mañana, Tarde, Noche, Festivo, Libre, Vacaciones)
- ✅ Horarios de inicio y fin con cálculo automático
- ✅ Notas adicionales para cada turno
- ✅ Estadísticas laborales detalladas
- ✅ Cálculo de horas por período

### 📅 Calendario Unificado
- ✅ Vista mensual integrada
- ✅ Indicadores visuales diferenciados
- ✅ Tareas: punto azul en esquina inferior
- ✅ Turnos: barras de colores en parte superior
- ✅ Múltiples elementos por día
- ✅ Navegación intuitiva

### 🤖 Asistente IA Integrado
- ✅ Chat flotante con Izán Bot
- ✅ Respuestas inteligentes sobre la aplicación
- ✅ Ayuda contextual en tiempo real
- ✅ Integración con Google Gemini AI

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.8+** - Lenguaje principal
- **Flask** - Framework web
- **SQLAlchemy** - ORM para base de datos
- **MySQL** - Base de datos relacional
- **Google Gemini AI** - Inteligencia artificial

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con gradientes y animaciones
- **JavaScript ES6+** - Interactividad y lógica
- **Font Awesome** - Iconografía profesional

### Características Técnicas
- **Responsive Design** - Compatible con todos los dispositivos
- **RESTful API** - Arquitectura de servicios
- **Real-time Updates** - Actualizaciones en tiempo real
- **Progressive Web App** - Experiencia de aplicación nativa

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.8 o superior
- MySQL 8.0 o superior
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Alcidexpress/gestion-tareas.git
   cd gestion-tareas
   ```

2. **Configurar entorno virtual**
   ```bash
   cd backend
   python -m venv env
   
   # En Windows
   env\Scripts\activate
   
   # En macOS/Linux
   source env/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar base de datos**
   ```sql
   CREATE DATABASE tasks_db;
   CREATE USER 'flowdays_user'@'localhost' IDENTIFIED BY 'tu_password';
   GRANT ALL PRIVILEGES ON tasks_db.* TO 'flowdays_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env en backend/
   GEMINI_API_KEY=tu_api_key_de_google
   DATABASE_URL=mysql+mysqlconnector://flowdays_user:tu_password@localhost/tasks_db
   ```

6. **Ejecutar la aplicación**
   ```bash
   python app.py
   ```

7. **Abrir en navegador**
   ```
   http://localhost:5000
   ```

## 📊 Estructura del Proyecto

```
gestion-tareas/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── models.py
│   │   └── routes/
│   │       ├── auth.py
│   │       └── chat.py
│   ├── static/
│   │   ├── app.js
│   │   └── styles.css
│   ├── templates/
│   │   └── index.html
│   ├── app.py
│   └── models.py
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── package.json
├── test_work_shifts.html
├── test_fixes.html
├── README.md
└── .gitignore
```

## 🔧 API Endpoints

### Gestión de Tareas
- `GET /api/tasks` - Obtener todas las tareas
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/{id}` - Actualizar tarea
- `DELETE /api/tasks/{id}` - Eliminar tarea
- `GET /api/tasks/date/{date}` - Obtener tareas por fecha

### Gestión de Turnos
- `GET /api/shifts` - Obtener todos los turnos
- `POST /api/shifts` - Crear nuevo turno
- `PUT /api/shifts/{id}` - Actualizar turno
- `DELETE /api/shifts/{id}` - Eliminar turno
- `GET /api/shifts/date/{date}` - Obtener turnos por fecha

### Estadísticas
- `GET /api/stats/week/{date}` - Estadísticas semanales
- `GET /api/stats/month/{date}` - Estadísticas mensuales
- `GET /api/stats/year/{year}` - Estadísticas anuales

### Chat IA
- `POST /api/chat` - Enviar mensaje al asistente IA

## 🎨 Características de Diseño

### Interfaz Moderna
- **Gradientes profesionales** - Diseño visual atractivo
- **Animaciones suaves** - Transiciones fluidas
- **Iconografía clara** - Font Awesome para mejor UX
- **Paleta de colores** - Azul y púrpura profesional

### Responsividad
- **Mobile-first** - Optimizado para dispositivos móviles
- **Tablet-friendly** - Interfaz adaptativa
- **Desktop-optimized** - Experiencia completa en escritorio

### Accesibilidad
- **Navegación por teclado** - Compatible con lectores de pantalla
- **Contraste adecuado** - Cumple estándares WCAG
- **Textos descriptivos** - Alt text y labels apropiados

## 🧪 Casos de Uso

### 👨‍💼 Profesional Independiente
- **Escenario:** Freelancer gestionando proyectos y horarios
- **Beneficio:** Control total de tiempo y proyectos
- **Funcionalidades:** Tareas de entregables, turnos de trabajo

### 🏢 Empleado Corporativo
- **Escenario:** Trabajador con horarios fijos y tareas diarias
- **Beneficio:** Organización personal y profesional
- **Funcionalidades:** Reportes, reuniones, horario laboral

### 👨‍⚕️ Profesional de la Salud
- **Escenario:** Médico con guardias y citas
- **Beneficio:** Gestión de tiempo crítico
- **Funcionalidades:** Citas, guardias, documentación

### 🎓 Estudiante Trabajador
- **Escenario:** Estudiante que trabaja y estudia
- **Beneficio:** Balance vida académica y laboral
- **Funcionalidades:** Tareas académicas, trabajo part-time

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Notificaciones avanzadas** - Email, SMS, push notifications
- [ ] **Reportes detallados** - Generación de PDF y Excel
- [ ] **Gestión de equipos** - Colaboración y gestión de equipos
- [ ] **App móvil** - Aplicación móvil nativa
- [ ] **Sincronización en la nube** - Backup automático
- [ ] **Integración con calendarios** - Google Calendar, Outlook

### Mejoras Técnicas
- [ ] **Autenticación OAuth** - Login con Google, GitHub
- [ ] **API REST completa** - Documentación con Swagger
- [ ] **Tests automatizados** - Unit tests y integration tests
- [ ] **CI/CD Pipeline** - Despliegue automático
- [ ] **Docker support** - Containerización completa

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Alcidexpress**
- GitHub: [@Alcidexpress](https://github.com/Alcidexpress)
- Proyecto: [gestion-tareas](https://github.com/Alcidexpress/gestion-tareas)

## 🙏 Agradecimientos

- **Google Gemini AI** - Por proporcionar la API de inteligencia artificial
- **Font Awesome** - Por los iconos profesionales
- **Flask Community** - Por el excelente framework web
- **MySQL** - Por la base de datos robusta y confiable

## 📞 Soporte

Si tienes alguna pregunta o necesitas ayuda:

- 📧 **Email:** [tu-email@ejemplo.com]
- 🐛 **Issues:** [GitHub Issues](https://github.com/Alcidexpress/gestion-tareas/issues)
- 📖 **Documentación:** [Wiki del proyecto](https://github.com/Alcidexpress/gestion-tareas/wiki)

---

<div align="center">

**¡Gracias por usar FlowDays Professional! 🚀**

*Organiza tus tareas, Recuerda, Actúa*

[![GitHub stars](https://img.shields.io/github/stars/Alcidexpress/gestion-tareas?style=social)](https://github.com/Alcidexpress/gestion-tareas/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Alcidexpress/gestion-tareas?style=social)](https://github.com/Alcidexpress/gestion-tareas/network)
[![GitHub issues](https://img.shields.io/github/issues/Alcidexpress/gestion-tareas)](https://github.com/Alcidexpress/gestion-tareas/issues)

</div> 