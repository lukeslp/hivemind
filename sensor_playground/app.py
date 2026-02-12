from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
import time
import json
import requests
# Import your sensor libraries here (e.g., Adafruit_DHT, etc.)
# Placeholder for sensor reading function

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app)

# Mock sensor data (replace with actual sensor reading code)
def read_sensors():
    return {
        "temperature": {"value": 25.3, "unit": "C", "normal_range": [18, 28], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")},
        "humidity": {"value": 60, "unit": "%", "normal_range": [40, 70], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")},
        # Add other sensors here
    }

# Send sensor data to VPS for LLM context (replace with your VPS endpoint)
def send_sensor_data_to_vps(sensor_data):
    try:
        response = requests.post('https://dr.eamer.dev/api/sensor_context', json=sensor_data, headers={'Authorization': 'Bearer your-api-key'})
        return response.json()
    except Exception as e:
        print(f"Error sending data to VPS: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sensors')
def get_sensors():
    return jsonify(read_sensors())

# Background task to update sensor data
def sensor_update_task():
    with app.app_context():
        while True:
            sensor_data = read_sensors()
            socketio.emit('sensor_update', sensor_data)
            send_sensor_data_to_vps(sensor_data)
            time.sleep(5)  # Update every 5 seconds

@socketio.on('connect')
def handle_connect():
    print('Client connected')

if __name__ == '__main__':
    socketio.start_background_task(sensor_update_task)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
