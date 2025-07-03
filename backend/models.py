from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()

class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    priority = db.Column(db.String(10), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, nullable=False, default=datetime.now().date)
    time = db.Column(db.Time, nullable=True)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    reminder_type = db.Column(db.String(20), default='none')  # none, email, sms, push
    reminder_before = db.Column(db.Integer, default=0)  # minutos antes
    reminder_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "completed": self.completed,
            "date": self.date.strftime('%Y-%m-%d') if self.date else None,
            "time": self.time.strftime('%H:%M') if self.time else None,
            "description": self.description,
            "location": self.location,
            "reminder_type": self.reminder_type,
            "reminder_before": self.reminder_before,
            "reminder_sent": self.reminder_sent,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "updated_at": self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }

    def get_datetime(self):
        """Obtiene la fecha y hora combinadas"""
        if self.date and self.time:
            return datetime.combine(self.date, self.time)
        elif self.date:
            return datetime.combine(self.date, datetime.min.time())
        return None

    def get_reminder_datetime(self):
        """Obtiene cuándo debe enviarse el recordatorio"""
        task_datetime = self.get_datetime()
        if task_datetime and self.reminder_before > 0:
            return task_datetime - timedelta(minutes=self.reminder_before)
        return None

class WorkShift(db.Model):
    __tablename__ = "work_shifts"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    shift_type = db.Column(db.String(10), nullable=False)  # M (Mañana), T (Tarde), N (Noche), F (Festivo)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    hours_worked = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.strftime('%Y-%m-%d') if self.date else None,
            "shift_type": self.shift_type,
            "start_time": self.start_time.strftime('%H:%M') if self.start_time else None,
            "end_time": self.end_time.strftime('%H:%M') if self.end_time else None,
            "hours_worked": self.hours_worked,
            "notes": self.notes,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "updated_at": self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }

    def get_shift_name(self):
        """Obtiene el nombre completo del turno"""
        shift_names = {
            'M': 'Mañana',
            'T': 'Tarde', 
            'N': 'Noche',
            'F': 'Festivo',
            'L': 'Libre',
            'V': 'Vacaciones'
        }
        return shift_names.get(self.shift_type, self.shift_type)

    def get_shift_color(self):
        """Obtiene el color del turno"""
        shift_colors = {
            'M': '#28a745',  # Verde para mañana
            'T': '#ffc107',  # Amarillo para tarde
            'N': '#6f42c1',  # Púrpura para noche
            'F': '#dc3545',  # Rojo para festivo
            'L': '#17a2b8',  # Azul para libre
            'V': '#fd7e14'   # Naranja para vacaciones
        }
        return shift_colors.get(self.shift_type, '#6c757d')

class WorkStats(db.Model):
    __tablename__ = "work_stats"
    id = db.Column(db.Integer, primary_key=True)
    period_type = db.Column(db.String(10), nullable=False)  # week, month, year
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    total_hours = db.Column(db.Float, default=0.0)
    total_days = db.Column(db.Integer, default=0)
    morning_shifts = db.Column(db.Integer, default=0)
    afternoon_shifts = db.Column(db.Integer, default=0)
    night_shifts = db.Column(db.Integer, default=0)
    holiday_shifts = db.Column(db.Integer, default=0)
    free_days = db.Column(db.Integer, default=0)
    vacation_days = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "period_type": self.period_type,
            "period_start": self.period_start.strftime('%Y-%m-%d'),
            "period_end": self.period_end.strftime('%Y-%m-%d'),
            "total_hours": self.total_hours,
            "total_days": self.total_days,
            "morning_shifts": self.morning_shifts,
            "afternoon_shifts": self.afternoon_shifts,
            "night_shifts": self.night_shifts,
            "holiday_shifts": self.holiday_shifts,
            "free_days": self.free_days,
            "vacation_days": self.vacation_days,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # email, sms, push
    sent_at = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.String(20), default='pending')  # pending, sent, failed
    message = db.Column(db.Text, nullable=True)
    
    task = db.relationship('Task', backref='notifications')
