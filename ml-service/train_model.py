import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib

def fetch_training_data():
    print("Using synthetic data for training...")
    return generate_synthetic_data()

def generate_synthetic_data():
    """Generate synthetic dataset for training the Random Forest model."""
    import numpy as np
    np.random.seed(42)
    n_samples = 1000
    
    # Features: emissions per category in kg
    transport = np.random.normal(50, 20, n_samples)
    food = np.random.normal(40, 15, n_samples)
    energy = np.random.normal(60, 25, n_samples)
    shopping = np.random.normal(30, 10, n_samples)
    waste = np.random.normal(10, 5, n_samples)
    
    # Ensure no negative emissions
    features = np.column_stack([transport, food, energy, shopping, waste])
    features = np.clip(features, 0, None)
    
    # Target: Next month's total footprint with some noise
    current_total = features.sum(axis=1)
    target = current_total * np.random.normal(1.02, 0.05, n_samples) # Slight expected increase/decrease
    
    return pd.DataFrame(features, columns=['transport', 'food', 'energy', 'shopping', 'waste']), pd.Series(target, name='next_month_total')

def train():
    print("Preparing dataset...")
    X, y = fetch_training_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    print(f"Model trained successfully. Mean Squared Error: {mse:.2f}")
    
    # Save the model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/rf_carbon_model.pkl')
    print("Model saved to models/rf_carbon_model.pkl")

if __name__ == "__main__":
    train()
