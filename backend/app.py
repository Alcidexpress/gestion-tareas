from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from models import db, Task, Notification, WorkShift, WorkStats
import os
import google.generativeai as genai
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import time

app = Flask(__name__)
CORS(app)  # No estricto aquí, pero puedes quitar si sirves frontend directamente

# Cambia estos datos con tus credenciales MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:Telco0032@localhost/tasks_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Configurar Gemini - Usar una API key válida
# IMPORTANTE: Obtén una API key gratuita en: https://makersuite.google.com/app/apikey
# Reemplaza la línea de abajo con tu API key real
GEMINI_API_KEY = "AIzaSyCFCwANcUSW0q3wtaHFMMIwoTmA2hrTfl8"  # API key real

try:
    print(f"🔑 Configurando Gemini con API key: {GEMINI_API_KEY[:10]}...")
    genai.configure(api_key=GEMINI_API_KEY)
    # Usar el modelo correcto disponible
    model = genai.GenerativeModel("gemini-1.5-flash")
    # Probar la conexión con una pregunta simple
    test_response = model.generate_content("Hola")
    print(f"✅ Gemini configurado correctamente. Test response: {test_response.text[:50]}...")
except Exception as e:
    print(f"❌ Error configurando Gemini: {e}")
    print(f"❌ Tipo de error: {type(e).__name__}")
    model = None

with app.app_context():
    db.create_all()

@app.route('/')
def serve_frontend():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static_files(path):
    return send_from_directory('static', path)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    title = data.get("title")
    priority = data.get("priority")

    if not title or not priority:
        return jsonify({"error": "Título y prioridad son requeridos"}), 400

    # Parsear fecha y hora
    date_str = data.get("date")
    time_str = data.get("time")
    
    task_date = None
    task_time = None
    
    if date_str:
        task_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    if time_str:
        task_time = datetime.strptime(time_str, '%H:%M').time()
    
    task = Task(
        title=title,
        priority=priority,
        date=task_date or datetime.now().date(),
        time=task_time,
        description=data.get("description", ""),
        location=data.get("location", ""),
        reminder_type=data.get("reminder_type", "none"),
        reminder_before=data.get("reminder_before", 0)
    )
    
    db.session.add(task)
    db.session.commit()
    
    # Programar recordatorio si está configurado
    if task.reminder_type != "none" and task.reminder_before > 0:
        schedule_reminder(task)

    return jsonify(task.to_dict()), 201

@app.route('/guardar', methods=['POST'])
def guardar():
    datos = request.get_json()
    title = datos.get("title")
    priority = datos.get("priority")

    if not title or not priority:
        return jsonify({"error": "Título y prioridad son requeridos"}), 400

    task = Task(title=title, priority=priority)
    db.session.add(task)
    db.session.commit()

    return jsonify({'mensaje': 'Guardado!', 'task': task.to_dict()}), 201

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'mensaje': 'Tarea eliminada'}), 200

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    data = request.get_json()
    
    # Actualizar todos los campos disponibles
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'priority' in data:
        task.priority = data['priority']
    if 'location' in data:
        task.location = data['location']
    if 'completed' in data:
        task.completed = data['completed']
    if 'date' in data:
        task.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'time' in data and data['time']:
        task.time = datetime.strptime(data['time'], '%H:%M').time()
    if 'reminder_type' in data:
        task.reminder_type = data['reminder_type']
    if 'reminder_before' in data:
        task.reminder_before = data['reminder_before']
    
    db.session.commit()
    return jsonify(task.to_dict()), 200

@app.route('/api/tasks/date/<string:date>', methods=['GET'])
def get_tasks_by_date(date):
    try:
        task_date = datetime.strptime(date, '%Y-%m-%d').date()
        tasks = Task.query.filter_by(date=task_date).all()
        return jsonify([task.to_dict() for task in tasks])
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido'}), 400

# Ruta para el chat con Gemini
@app.route('/api/chat', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos JSON"}), 400
            
        user_input = data.get("message")
        print(f"📨 Mensaje recibido: {user_input}")

        if not user_input:
            return jsonify({"error": "Falta el mensaje"}), 400

        # Obtener tareas reales de la base de datos
        tasks = Task.query.all()
        tasks_info = [f"- {task.title} (Prioridad: {task.priority})" for task in tasks]
        tasks_text = "\n".join(tasks_info) if tasks_info else "No hay tareas pendientes."

        # Crear contexto para Izán Bot con las tareas reales
        context = f"""
        Eres Izán Bot, un asistente IA especializado en FlowDays, una aplicación web moderna para gestionar tareas.
        
        INFORMACIÓN ACTUAL DE LA PÁGINA WEB:
        - Nombre de la aplicación: FlowDays
        - Lema: "Organiza tus tareas, Recuerda, Actúa"
        - Funcionalidades principales: Gestión de tareas, estadísticas en tiempo real, chat con IA
        - Tareas actuales en la base de datos: {tasks_text}
        - Estadísticas disponibles: Total tareas, completadas, pendientes, alta prioridad
        - Características de la página: Diseño moderno con gradientes, animaciones, efectos visuales
        - Funcionalidades dinámicas: Búsqueda, filtros, ordenamiento, notificaciones toast
        
        INSTRUCCIONES:
        1. SIEMPRE responde sobre el contenido específico de FlowDays
        2. Menciona las características reales de la página web cuando sea relevante
        3. Usa el nombre "Izán Bot" en tus respuestas
        4. Sé específico sobre las funcionalidades disponibles
        5. Si preguntan sobre tareas, usa la información real de la base de datos
        6. Explica cómo usar las características de la página web
        7. Menciona el lema "Organiza tus tareas, Recuerda, Actúa" cuando sea apropiado
        """

        # Intentar usar Gemini real primero
        if model is not None:
            try:
                print("🤖 Usando Gemini real...")
                # Combinar contexto con la pregunta del usuario
                full_prompt = f"{context}\n\nUsuario pregunta: {user_input}"
                response = model.generate_content(full_prompt)
                response_text = response.text
                print(f"✅ Respuesta de Gemini: {response_text}")
                return jsonify({"reply": response_text})
            except Exception as gemini_error:
                print(f"❌ Error con Gemini: {gemini_error}")
                # Si Gemini falla, usar respuestas inteligentes como fallback
                print("🔄 Usando respuestas inteligentes como fallback...")

        # Respuestas inteligentes de Izán Bot específicas sobre TaskMaster Pro
        user_input_lower = user_input.lower()
        
        # Buscar tareas específicas mencionadas
        mentioned_tasks = []
        for task in tasks:
            if task.title.lower() in user_input_lower:
                mentioned_tasks.append(task)
        
        if "hola" in user_input_lower or "buenos" in user_input_lower:
            response_text = "¡Hola! Soy Izán Bot, tu asistente personal de FlowDays. ¿En qué puedo ayudarte hoy? Puedo explicarte las funcionalidades de la aplicación, ayudarte con tus tareas, o responder cualquier pregunta sobre esta página web. Recuerda nuestro lema: 'Organiza tus tareas, Recuerda, Actúa'."
        
        elif "que puedes hacer" in user_input_lower or "funciones" in user_input_lower or "ayuda" in user_input_lower:
            response_text = "¡Como Izán Bot, puedo ayudarte con todo lo relacionado con FlowDays! 🚀\n\n• Explicarte las funcionalidades de la página\n• Informarte sobre tus tareas actuales\n• Ayudarte con la gestión de prioridades\n• Explicar cómo usar la búsqueda y filtros\n• Dar consejos sobre productividad\n• Responder preguntas sobre el diseño y características de la aplicación\n\nRecuerda nuestro lema: 'Organiza tus tareas, Recuerda, Actúa'"
        
        elif "caracteristicas" in user_input_lower or "diseño" in user_input_lower or "pagina" in user_input_lower:
            response_text = "FlowDays tiene un diseño moderno y dinámico con estas características:\n\n🎨 **Diseño Visual:**\n• Gradientes animados en el fondo\n• Tarjetas con efectos de hover\n• Animaciones suaves en todos los elementos\n• Iconos Font Awesome\n• Tipografía Poppins moderna\n\n⚡ **Funcionalidades Dinámicas:**\n• Estadísticas en tiempo real\n• Búsqueda instantánea de tareas\n• Filtros por prioridad\n• Ordenamiento dinámico\n• Notificaciones toast animadas\n• Efectos de partículas al completar tareas\n\n💡 **Filosofía:** Organiza tus tareas, Recuerda, Actúa"
        
        elif "estadisticas" in user_input_lower or "dashboard" in user_input_lower:
            response_text = f"En el dashboard de FlowDays puedes ver estas estadísticas en tiempo real:\n\n📊 **Estadísticas Actuales:**\n• Total de tareas: {len(tasks)}\n• Tareas completadas: {len([t for t in tasks if t.completed])}\n• Tareas pendientes: {len([t for t in tasks if not t.completed])}\n• Tareas de alta prioridad: {len([t for t in tasks if t.priority == 'alta'])}\n\nLas estadísticas se actualizan automáticamente cuando creas, completas o eliminas tareas. Esto te ayuda a 'Organizar tus tareas, Recuerda, Actúa'."
        
        elif "buscar" in user_input_lower or "filtros" in user_input_lower:
            response_text = "En FlowDays tienes varias opciones para organizar tus tareas:\n\n🔍 **Búsqueda:** Escribe en el campo de búsqueda para encontrar tareas específicas instantáneamente\n\n🏷️ **Filtros por Prioridad:** Usa los botones 'Todas', 'Alta', 'Media', 'Baja' para filtrar tareas\n\n📋 **Ordenamiento:** Usa el selector para ordenar por fecha, prioridad o título alfabético\n\nTodas estas funciones están en la sección 'Mis Tareas' y funcionan en tiempo real. Te ayudan a 'Organizar tus tareas, Recuerda, Actúa'."
        
        elif "tarea" in user_input_lower or "tareas" in user_input_lower:
            if tasks:
                response_text = f"En FlowDays tienes {len(tasks)} tareas registradas:\n\n{tasks_text}\n\nPuedes usar las funciones de búsqueda y filtros para organizarlas mejor, o preguntarme sobre tareas específicas. Recuerda: 'Organiza tus tareas, Recuerda, Actúa'."
            else:
                response_text = "¡Excelente! No tienes tareas pendientes en FlowDays. ¿Te gustaría crear una nueva tarea? Puedes usar el formulario en la sección 'Nueva Tarea' para agregar tareas con diferentes prioridades. Es hora de 'Organizar tus tareas, Recuerda, Actúa'."
        
        elif "prioridad" in user_input_lower and mentioned_tasks:
            response_text = f"Encontré estas tareas relacionadas con tu pregunta sobre prioridades:\n\n"
            for task in mentioned_tasks:
                priority_emoji = "🔴" if task.priority == "alta" else "🟡" if task.priority == "media" else "🟢"
                response_text += f"{priority_emoji} {task.title}: Prioridad {task.priority.capitalize()}\n"
        
        elif "crear" in user_input_lower or "nueva tarea" in user_input_lower:
            response_text = "Para crear una nueva tarea en FlowDays:\n\n1️⃣ Ve a la sección 'Nueva Tarea'\n2️⃣ Escribe el título de la tarea\n3️⃣ Selecciona la prioridad (Alta, Media, Baja)\n4️⃣ Haz clic en 'Crear Tarea'\n\nLa tarea aparecerá inmediatamente en tu lista con efectos de animación. ¡Organiza tus tareas, Recuerda, Actúa!"
        
        elif "completar" in user_input_lower or "marcar" in user_input_lower:
            response_text = "Para completar tareas en FlowDays:\n\n✅ Haz clic en el botón de check (✓) junto a cada tarea\n✅ La tarea se marcará como completada con efectos visuales\n✅ Las estadísticas se actualizarán automáticamente\n✅ Verás efectos de partículas de celebración\n\nTambién puedes editar o eliminar tareas usando los otros botones. ¡Actúa y completa tus tareas!"
        
        elif "como estas" in user_input_lower or "estado" in user_input_lower:
            response_text = "¡Muy bien, gracias por preguntar! Como Izán Bot, estoy funcionando perfectamente y listo para ayudarte con FlowDays. La aplicación está funcionando correctamente y todas las funcionalidades están disponibles. ¡Organiza tus tareas, Recuerda, Actúa!"
        
        elif mentioned_tasks:
            response_text = f"Encontré estas tareas en FlowDays relacionadas con tu pregunta:\n\n"
            for task in mentioned_tasks:
                status = "✅ Completada" if task.completed else "⏳ Pendiente"
                priority_emoji = "🔴" if task.priority == "alta" else "🟡" if task.priority == "media" else "🟢"
                response_text += f"{priority_emoji} {task.title}\n   Estado: {status}\n   Prioridad: {task.priority.capitalize()}\n\n"
        
        else:
            response_text = f"Como Izán Bot, estoy aquí para ayudarte con FlowDays. Tu pregunta '{user_input}' es interesante. Actualmente tienes {len(tasks)} tareas en la aplicación. ¿Te gustaría que te explique alguna funcionalidad específica de la página web o que te ayude con la gestión de tus tareas? Recuerda: 'Organiza tus tareas, Recuerda, Actúa'."

        print(f"🤖 Respuesta inteligente: {response_text}")
        return jsonify({"reply": response_text})
        
    except Exception as e:
        print(f"❌ Error en send_message: {str(e)}")
        return jsonify({"error": f"Error al procesar el mensaje: {str(e)}"}), 500

# Funciones para recordatorios
def send_email_reminder(task):
    """Envía recordatorio por email"""
    try:
        # Configuración de email (debes configurar estas variables)
        sender_email = os.getenv('EMAIL_USER', 'tu-email@gmail.com')
        sender_password = os.getenv('EMAIL_PASSWORD', 'tu-password')
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = sender_email  # Por ahora se envía al mismo email
        msg['Subject'] = f"Recordatorio: {task.title}"
        
        body = f"""
        ⏰ Recordatorio de FlowDays
        
        Tarea: {task.title}
        Fecha: {task.date.strftime('%d/%m/%Y')}
        Hora: {task.time.strftime('%H:%M') if task.time else 'Sin hora específica'}
        Prioridad: {task.priority.capitalize()}
        
        {task.description if task.description else ''}
        
        Ubicación: {task.location if task.location else 'No especificada'}
        
        ¡Organiza tus tareas, Recuerda, Actúa!
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, sender_email, text)
        server.quit()
        
        # Registrar notificación
        notification = Notification(
            task_id=task.id,
            type='email',
            status='sent',
            message=f"Recordatorio enviado por email para: {task.title}"
        )
        db.session.add(notification)
        db.session.commit()
        
        print(f"✅ Recordatorio por email enviado para: {task.title}")
        
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        # Registrar notificación fallida
        notification = Notification(
            task_id=task.id,
            type='email',
            status='failed',
            message=f"Error enviando email: {str(e)}"
        )
        db.session.add(notification)
        db.session.commit()

def schedule_reminder(task):
    """Programa un recordatorio para una tarea"""
    reminder_time = task.get_reminder_datetime()
    if not reminder_time:
        return
    
    def send_reminder():
        time.sleep((reminder_time - datetime.now()).total_seconds())
        if task.reminder_type == 'email':
            send_email_reminder(task)
        # Aquí puedes agregar más tipos de recordatorios (SMS, push, etc.)
    
    # Ejecutar en un hilo separado
    thread = threading.Thread(target=send_reminder)
    thread.daemon = True
    thread.start()

# Nuevas rutas para calendario
@app.route('/api/calendar/<string:date>', methods=['GET'])
def get_calendar_tasks(date):
    """Obtiene tareas para una fecha específica"""
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        tasks = Task.query.filter_by(date=date_obj).all()
        return jsonify([task.to_dict() for task in tasks])
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/calendar/range', methods=['GET'])
def get_calendar_range():
    """Obtiene tareas en un rango de fechas"""
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        tasks = Task.query.filter(
            Task.date >= start,
            Task.date <= end
        ).all()
        
        return jsonify([task.to_dict() for task in tasks])
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/tasks/<int:task_id>/reminder', methods=['POST'])
def update_reminder(task_id):
    """Actualiza la configuración de recordatorio de una tarea"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    data = request.get_json()
    task.reminder_type = data.get('reminder_type', 'none')
    task.reminder_before = data.get('reminder_before', 0)
    
    db.session.commit()
    
    # Reprogramar recordatorio si es necesario
    if task.reminder_type != 'none' and task.reminder_before > 0:
        schedule_reminder(task)
    
    return jsonify(task.to_dict()), 200

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Obtiene el historial de notificaciones"""
    notifications = Notification.query.order_by(Notification.sent_at.desc()).limit(50).all()
    return jsonify([{
        'id': n.id,
        'task_title': n.task.title,
        'type': n.type,
        'status': n.status,
        'sent_at': n.sent_at.strftime('%Y-%m-%d %H:%M:%S'),
        'message': n.message
    } for n in notifications])

# Rutas para gestión de turnos laborales
@app.route('/api/shifts', methods=['GET'])
def get_shifts():
    """Obtiene todos los turnos"""
    shifts = WorkShift.query.order_by(WorkShift.date.desc()).all()
    return jsonify([shift.to_dict() for shift in shifts])

@app.route('/api/shifts', methods=['POST'])
def create_shift():
    """Crea un nuevo turno"""
    data = request.get_json()
    
    # Parsear fecha y horas
    date_str = data.get("date")
    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")
    
    shift_date = None
    start_time = None
    end_time = None
    
    if date_str:
        shift_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    if start_time_str:
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
    if end_time_str:
        end_time = datetime.strptime(end_time_str, '%H:%M').time()
    
    # Calcular horas trabajadas
    hours_worked = 0.0
    if start_time and end_time:
        start_dt = datetime.combine(shift_date, start_time)
        end_dt = datetime.combine(shift_date, end_time)
        if end_dt < start_dt:  # Si termina al día siguiente
            end_dt += timedelta(days=1)
        hours_worked = (end_dt - start_dt).total_seconds() / 3600
    
    new_shift = WorkShift(
        date=shift_date,
        shift_type=data.get("shift_type"),
        start_time=start_time,
        end_time=end_time,
        hours_worked=hours_worked,
        notes=data.get("notes", "")
    )
    
    db.session.add(new_shift)
    db.session.commit()
    
    # Actualizar estadísticas
    update_work_stats(shift_date)
    
    return jsonify(new_shift.to_dict()), 201

@app.route('/api/shifts/<int:shift_id>', methods=['PUT'])
def update_shift(shift_id):
    """Actualiza un turno existente"""
    shift = WorkShift.query.get(shift_id)
    if not shift:
        return jsonify({'error': 'Turno no encontrado'}), 404
    
    data = request.get_json()
    
    # Actualizar campos
    if 'shift_type' in data:
        shift.shift_type = data['shift_type']
    if 'start_time' in data:
        shift.start_time = datetime.strptime(data['start_time'], '%H:%M').time() if data['start_time'] else None
    if 'end_time' in data:
        shift.end_time = datetime.strptime(data['end_time'], '%H:%M').time() if data['end_time'] else None
    if 'notes' in data:
        shift.notes = data['notes']
    
    # Recalcular horas trabajadas
    if shift.start_time and shift.end_time:
        start_dt = datetime.combine(shift.date, shift.start_time)
        end_dt = datetime.combine(shift.date, shift.end_time)
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        shift.hours_worked = (end_dt - start_dt).total_seconds() / 3600
    else:
        shift.hours_worked = 0.0
    
    db.session.commit()
    
    # Actualizar estadísticas
    update_work_stats(shift.date)
    
    return jsonify(shift.to_dict()), 200

@app.route('/api/shifts/<int:shift_id>', methods=['DELETE'])
def delete_shift(shift_id):
    """Elimina un turno"""
    shift = WorkShift.query.get(shift_id)
    if not shift:
        return jsonify({'error': 'Turno no encontrado'}), 404
    
    shift_date = shift.date
    db.session.delete(shift)
    db.session.commit()
    
    # Actualizar estadísticas
    update_work_stats(shift_date)
    
    return jsonify({'message': 'Turno eliminado'}), 200

@app.route('/api/shifts/date/<string:date>', methods=['GET'])
def get_shifts_by_date(date):
    """Obtiene turnos para una fecha específica"""
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        shifts = WorkShift.query.filter_by(date=date_obj).order_by(WorkShift.start_time).all()
        return jsonify([shift.to_dict() for shift in shifts])
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/shifts/range', methods=['GET'])
def get_shifts_range():
    """Obtiene turnos en un rango de fechas"""
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        shifts = WorkShift.query.filter(
            WorkShift.date >= start,
            WorkShift.date <= end
        ).order_by(WorkShift.date, WorkShift.start_time).all()
        
        return jsonify([shift.to_dict() for shift in shifts])
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/stats/week/<string:date>', methods=['GET'])
def get_week_stats(date):
    """Obtiene estadísticas de la semana"""
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        week_start = date_obj - timedelta(days=date_obj.weekday())
        week_end = week_start + timedelta(days=6)
        
        shifts = WorkShift.query.filter(
            WorkShift.date >= week_start,
            WorkShift.date <= week_end
        ).all()
        
        stats = calculate_period_stats(shifts, week_start, week_end)
        return jsonify(stats)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/stats/month/<string:date>', methods=['GET'])
def get_month_stats(date):
    """Obtiene estadísticas del mes"""
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        month_start = date_obj.replace(day=1)
        if date_obj.month == 12:
            month_end = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
        
        shifts = WorkShift.query.filter(
            WorkShift.date >= month_start,
            WorkShift.date <= month_end
        ).all()
        
        stats = calculate_period_stats(shifts, month_start, month_end)
        return jsonify(stats)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

@app.route('/api/stats/year/<int:year>', methods=['GET'])
def get_year_stats(year):
    """Obtiene estadísticas del año"""
    try:
        year_start = datetime(year, 1, 1).date()
        year_end = datetime(year, 12, 31).date()
        
        shifts = WorkShift.query.filter(
            WorkShift.date >= year_start,
            WorkShift.date <= year_end
        ).all()
        
        stats = calculate_period_stats(shifts, year_start, year_end)
        return jsonify(stats)
    except ValueError:
        return jsonify({"error": "Año inválido"}), 400

def calculate_period_stats(shifts, start_date, end_date):
    """Calcula estadísticas para un período"""
    total_hours = sum(shift.hours_worked for shift in shifts)
    total_days = len(set(shift.date for shift in shifts))
    
    morning_shifts = len([s for s in shifts if s.shift_type == 'M'])
    afternoon_shifts = len([s for s in shifts if s.shift_type == 'T'])
    night_shifts = len([s for s in shifts if s.shift_type == 'N'])
    holiday_shifts = len([s for s in shifts if s.shift_type == 'F'])
    free_days = len([s for s in shifts if s.shift_type == 'L'])
    vacation_days = len([s for s in shifts if s.shift_type == 'V'])
    
    return {
        "period_start": start_date.strftime('%Y-%m-%d'),
        "period_end": end_date.strftime('%Y-%m-%d'),
        "total_hours": round(total_hours, 2),
        "total_days": total_days,
        "morning_shifts": morning_shifts,
        "afternoon_shifts": afternoon_shifts,
        "night_shifts": night_shifts,
        "holiday_shifts": holiday_shifts,
        "free_days": free_days,
        "vacation_days": vacation_days,
        "shifts": [shift.to_dict() for shift in shifts]
    }

def update_work_stats(date):
    """Actualiza las estadísticas de trabajo para una fecha"""
    # Esta función se puede usar para mantener estadísticas en tiempo real
    # Por ahora solo calculamos las estadísticas cuando se solicitan
    pass

if __name__ == '__main__':
    app.run(debug=True)
