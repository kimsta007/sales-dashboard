import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class SalesPredictor:
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        
    def load_and_preprocess_data(self, file_path):
        """Load and preprocess the sales data"""
        df = pd.read_csv(file_path)
        
        # Convert date column to datetime (handling multiple formats)
        df['Invoice Date'] = pd.to_datetime(df['Invoice Date'], errors='coerce')
        
        # Extract date features
        df['Year'] = df['Invoice Date'].dt.year
        df['Month'] = df['Invoice Date'].dt.month
        df['Day'] = df['Invoice Date'].dt.day
        df['DayOfWeek'] = df['Invoice Date'].dt.dayofweek
        df['Quarter'] = df['Invoice Date'].dt.quarter
        
        # Handle categorical variables
        categorical_columns = ['Product', 'Region', 'Retailer', 'Sales Method', 'State']
        
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Define features and target
        feature_cols = [
            'Price per Unit', 'Units Sold', 'Year', 'Month', 'Day', 
            'DayOfWeek', 'Quarter'
        ]
        
        # Add encoded categorical features
        for col in categorical_columns:
            if col + '_encoded' in df.columns:
                feature_cols.append(col + '_encoded')
        
        self.feature_columns = feature_cols
        
        # Remove rows with missing target or features
        df_clean = df.dropna(subset=['Total Sales'] + feature_cols)
        
        return df_clean, feature_cols
    
    def train_model(self, df, feature_cols):
        """Train the Random Forest model"""
        X = df[feature_cols]
        y = df['Total Sales']
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"MAE: ${mae:.2f}")
        print(f"MSE: ${mse:.2f}")
        print(f"R² Score: {r2:.4f}")
        
        return X_test, y_test, y_pred
    
    def save_model(self, filepath='sales_model.joblib'):
        """Save the trained model and preprocessors"""
        model_data = {
            'model': self.model,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='sales_model.joblib'):
        """Load the trained model and preprocessors"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.label_encoders = model_data['label_encoders']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        print(f"Model loaded from {filepath}")

def main():
    predictor = SalesPredictor()
    
    # Load and preprocess data
    df, feature_cols = predictor.load_and_preprocess_data('dataset.csv')
    
    print(f"Dataset shape: {df.shape}")
    print(f"Features: {feature_cols}")
    
    # Train model
    X_test, y_test, y_pred = predictor.train_model(df, feature_cols)
    
    # Save model
    predictor.save_model()
    
    # Sample prediction
    sample_features = X_test.iloc[0:1].copy()
    prediction = predictor.model.predict(
        predictor.scaler.transform(sample_features)
    )[0]
    
    print(f"\nSample Prediction:")
    print(f"Actual: ${y_test.iloc[0]:.2f}")
    print(f"Predicted: ${prediction:.2f}")

if __name__ == "__main__":
    main()