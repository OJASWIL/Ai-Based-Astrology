from flask import Flask, jsonify # type: ignore
from flask_cors import CORS # type: ignore

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Backend is running!"})

@app.route('/api/test')
def test():
    return jsonify({"status": "OK", "message": "Backend API is working"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)