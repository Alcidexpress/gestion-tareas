import pytest
from app import app, db, Task

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://usuario:tu_password@localhost/tasks_db_test'  # Base test separada
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_get_empty(client):
    rv = client.get('/api/tasks')
    assert rv.status_code == 200
    assert rv.json == []

def test_post_task(client):
    rv = client.post('/api/tasks', json={"title": "Tarea test", "priority": "media"})
    assert rv.status_code == 201
    data = rv.json
    assert data["title"] == "Tarea test"
    assert data["priority"] == "media"

def test_get_after_post(client):
    client.post('/api/tasks', json={"title": "Otra tarea", "priority": "alta"})
    rv = client.get('/api/tasks')
    assert len(rv.json) == 1
    assert rv.json[0]["title"] == "Otra tarea"
