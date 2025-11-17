from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
import os

app = Flask(__name__)
CORS(app)

class PredictionService:
    def __init__(self):
        self.model_data = None
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            self.model_data = joblib.load('sales_model.joblib')
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model_data = None
    
    def preprocess_input(self, input_data):
        """Preprocess input data for prediction"""
        if not self.model_data:
            raise Exception("Model not loaded")
        
        # Create a DataFrame from input data
        df = pd.DataFrame([input_data])
        
        # Convert date
        df['Invoice Date'] = pd.to_datetime(df['Invoice Date'])
        df['Year'] = df['Invoice Date'].dt.year
        df['Month'] = df['Invoice Date'].dt.month
        df['Day'] = df['Invoice Date'].dt.day
        df['DayOfWeek'] = df['Invoice Date'].dt.dayofweek
        df['Quarter'] = df['Invoice Date'].dt.quarter
        
        # Encode categorical variables
        for col, encoder in self.model_data['label_encoders'].items():
            if col in df.columns:
                # Handle unseen labels
                transformed_col = df[col].astype(str).apply(
                    lambda x: x if x in encoder.classes_ else 'unknown'
                )
                if 'unknown' in transformed_col.values:
                    # Use most frequent class for unknown labels
                    transformed_col = transformed_col.replace('unknown', encoder.classes_[0])
                df[col + '_encoded'] = encoder.transform(transformed_col)
        
        # Ensure all feature columns are present
        for col in self.model_data['feature_columns']:
            if col not in df.columns:
                df[col] = 0  # Default value for missing columns
        
        # Select and scale features
        features = df[self.model_data['feature_columns']]
        features_scaled = self.model_data['scaler'].transform(features)
        
        return features_scaled
    
    def predict(self, input_data):
        """Make prediction"""
        try:
            if not self.model_data:
                return None, "Model not loaded"
            
            processed_features = self.preprocess_input(input_data)
            prediction = self.model_data['model'].predict(processed_features)[0]
            
            return prediction, None
        except Exception as e:
            return None, str(e)

# Initialize prediction service
prediction_service = PredictionService()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': prediction_service.model_data is not None})

@app.route('/api/predict', methods=['POST'])
def predict_sales():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['Invoice Date', 'Product', 'Region', 'Retailer', 'Sales Method', 'State', 'Price per Unit', 'Units Sold']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Make prediction
        prediction, error = prediction_service.predict(data)
        
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify({
            'prediction': float(prediction),
            'currency': 'USD',
            'message': 'Success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/features', methods=['GET'])
def get_features():
    """Get available feature values for the frontend"""
    if not prediction_service.model_data:
        return jsonify({'error': 'Model not loaded'}), 500
    
    feature_values = {}
    
    # Get unique values for categorical features
    for col, encoder in prediction_service.model_data['label_encoders'].items():
        feature_values[col] = encoder.classes_.tolist()
    
    return jsonify(feature_values)

@app.route('/api/stats', methods=['GET'])
def get_dataset_stats():
    """Get dataset statistics"""
    try:
        df = pd.read_csv('data/Nike US Dataset11.csv')
        
        stats = {
            'total_records': len(df),
            'total_sales': float(df['Total Sales'].sum()),
            'average_sale': float(df['Total Sales'].mean()),
            'products': df['Product'].nunique(),
            'regions': df['Region'].nunique(),
            'retailers': df['Retailer'].nunique(),
            'date_range': {
                'start': df['Invoice Date'].min(),
                'end': df['Invoice Date'].max()
            }
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Train model if it doesn't exist
    if not os.path.exists('sales_model.joblib'):
        print("Training model...")
        os.system('python train_model.py')
    
    app.run(debug=True, port=5000)