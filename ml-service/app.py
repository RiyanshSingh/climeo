import os
import joblib
import pandas as pd
import urllib.request
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load root .env file containing the Groq key
env_path = os.path.join(os.path.dirname(__file__), '../.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not GROQ_API_KEY:
            return jsonify({"error": "Groq API key missing on backend"}), 500
        
        data = request.json or {}
        messages = data.get('messages', [])
        system_prompt = data.get('systemPrompt', '')
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt}
            ] + messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            reply = res_data['choices'][0]['message']['content']
            return jsonify({"content": reply})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    try:
        if not GROQ_API_KEY:
            return jsonify({"error": "Groq API key missing on backend"}), 500
        
        data = request.json or {}
        user_habits = data.get('userHabits', '')
        
        system_prompt = (
            "You are a sustainability expert. Based on the user's answers, "
            "output exactly 3 short, highly actionable, and tailored recommendations. "
            "Format as a raw JSON array of strings (e.g. [\"Rec 1\", \"Rec 2\", \"Rec 3\"]). "
            "Return ONLY the JSON array, no extra text, no markdown codeblocks, no formatting."
        )
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_habits}
            ],
            "temperature": 0.5,
            "max_tokens": 300
        }
        
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            reply = res_data['choices'][0]['message']['content'].strip()
            # Clean and parse JSON array
            try:
                match = re.search(r'\[.*\]', reply, re.DOTALL)
                json_str = match.group(0) if match else '[]'
                recommendations_list = json.loads(json_str)
                return jsonify({"recommendations": recommendations_list})
            except Exception as parse_err:
                return jsonify({"recommendations": [], "raw": reply, "error_parsing": str(parse_err)})
                
    except Exception as e:
        return jsonify({"error": str(e)}), 400

MODEL_PATH = 'models/rf_carbon_model.pkl'

def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)

def estimate_next_month(features):
    current_total = sum(features.values())
    if current_total == 0:
        return 0.0

    category_weights = {
        'transport': 1.03,
        'food': 1.01,
        'energy': 1.04,
        'shopping': 1.02,
        'waste': 1.00
    }
    weighted_total = sum(features[key] * category_weights[key] for key in features)
    return weighted_total

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Extract features from the incoming request payload
        # Default to 0 if not provided
        transport = float(data.get('transport', 0))
        food = float(data.get('food', 0))
        energy = float(data.get('energy', 0))
        shopping = float(data.get('shopping', 0))
        waste = float(data.get('waste', 0))
        
        features = {
            'transport': transport,
            'food': food,
            'energy': energy,
            'shopping': shopping,
            'waste': waste
        }
        
        model = load_model()
        if model is None:
            prediction = estimate_next_month(features)
        else:
            df_features = pd.DataFrame([features])
            prediction = model.predict(df_features)[0]
        
        current_total = sum(features.values())
        if current_total == 0:
            expected_increase = 0.0
        else:
            expected_increase = ((prediction - current_total) / current_total) * 100
            
        return jsonify({
            "current_total_kg": round(current_total, 2),
            "predicted_next_month_kg": round(prediction, 2),
            "expected_trend_percentage": round(expected_increase, 1)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Run the server securely on localhost
    app.run(host='127.0.0.1', port=5001, debug=False)
