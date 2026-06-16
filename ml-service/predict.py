import os
import sys
import json
import joblib
import pandas as pd
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_PATH = 'models/rf_carbon_model.pkl'

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please run train_model.py first.")
    return joblib.load(MODEL_PATH)

def predict_for_user(user_id: str):
    print(f"Generating prediction for user: {user_id}")
    
    # Calculate date 30 days ago
    date_30_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    features = {
        'transport': 0.0,
        'food': 0.0,
        'energy': 0.0,
        'shopping': 0.0,
        'waste': 0.0
    }
    
    try:
        # Query carbon_calculations table for user calculations in the last 30 days
        calculations_res = supabase.table('carbon_calculations') \
            .select('category, co2_amount') \
            .eq('user_id', user_id) \
            .gte('created_at', date_30_days_ago) \
            .execute()
            
        calculations = calculations_res.data or []
        print(f"Fetched {len(calculations)} carbon calculations for user.")
        
        if len(calculations) > 0:
            for record in calculations:
                cat = (record.get('category') or '').lower().strip()
                amount = float(record.get('co2_amount') or 0.0)
                
                # Map database category names to model feature names
                if cat in ['transport', 'transportation']:
                    features['transport'] += amount
                elif cat in ['food', 'diet']:
                    features['food'] += amount
                elif cat in ['energy', 'home', 'home energy', 'home_energy']:
                    features['energy'] += amount
                elif cat in ['shopping', 'retail']:
                    features['shopping'] += amount
                else:
                    features['waste'] += amount
        else:
            print("No recent calculations found. Falling back to default averages.")
            features = {
                'transport': 45.0,
                'food': 30.5,
                'energy': 50.2,
                'shopping': 20.0,
                'waste': 10.0
            }
    except Exception as e:
        print(f"Error querying carbon calculations: {e}. Using default fallback averages.")
        features = {
            'transport': 45.0,
            'food': 30.5,
            'energy': 50.2,
            'shopping': 20.0,
            'waste': 10.0
        }
    
    df_features = pd.DataFrame([features], columns=['transport', 'food', 'energy', 'shopping', 'waste'])
    
    model = load_model()
    prediction = model.predict(df_features)[0]
    
    current_total = sum(features.values())
    if current_total == 0:
        expected_increase = 0.0
    else:
        expected_increase = ((prediction - current_total) / current_total) * 100
    
    print(f"Current Monthly Footprint: {current_total:.1f} kg CO2")
    print(f"Predicted Next Month: {prediction:.1f} kg CO2")
    print(f"Expected Increase: {expected_increase:.1f}%")
    
    # Save prediction to Supabase
    next_month = datetime.now(timezone.utc) + relativedelta(months=1)
    
    data = {
        "user_id": user_id,
        "predicted_month": next_month.isoformat(),
        "predicted_co2": round(prediction, 2),
        "model_version": "v1.0-rf"
    }
    
    try:
        supabase.table('predictions').insert(data).execute()
        print("Prediction saved to Supabase successfully.")
    except Exception as e:
        print(f"Error saving to Supabase: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <user_id>")
        sys.exit(1)
        
    target_user_id = sys.argv[1]
    predict_for_user(target_user_id)
