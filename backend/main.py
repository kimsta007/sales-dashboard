# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import json

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    year: int
    product: str = None
    region: str = None
    retailer: str = None

class SalesData:
    def __init__(self):
        self.df = None
        self.model = None
        self.encoders = {}
        self.load_data()
        self.train_model()
    
    def load_data(self):
        # Load your data here - using the provided sample
        data = {
            'Invoice Date': ['1/1/2020', '2/1/2020', '3/1/2020', '4/1/2020', '5/1/2020', 
                           '6/1/2020', '7/1/2020', '8/1/2020', '21-01-2020', '22-01-2020',
                           '23-01-2020', '24-01-2020', '25-01-2020', '26-01-2020',
                           '27-01-2020', '28-01-2020', '29-01-2020'],
            'Product': ["Men's Street Footwear", "Men's Athletic Footwear", "Women's Street Footwear",
                       "Women's Athletic Footwear", "Men's Apparel", "Women's Apparel",
                       "Men's Street Footwear", "Men's Athletic Footwear", "Women's Street Footwear",
                       "Women's Athletic Footwear", "Men's Apparel", "Women's Apparel",
                       "Men's Street Footwear", "Men's Athletic Footwear", "Women's Street Footwear",
                       "Women's Athletic Footwear", "Men's Apparel"],
            'Region': ['Northeast'] * 17,
            'Retailer': ['Foot Locker'] * 17,
            'Sales Method': ['In-store', 'In-store', 'In-store', 'In-store', 'In-store',
                           'In-store', 'In-store', 'Outlet', 'Outlet', 'Outlet', 'Outlet',
                           'Outlet', 'Outlet', 'Outlet', 'Outlet', 'Outlet', 'Outlet'],
            'State': ['New York'] * 17,
            'Price per Unit': [50, 50, 40, 45, 60, 50, 50, 50, 40, 45, 60, 50, 50, 50, 40, 45, 60],
            'Total Sales': [6000, 5000, 4000, 3825, 5400, 5000, 6250, 4500, 3800, 3713, 
                          5400, 5000, 6100, 4625, 3800, 3600, 5100],
            'Units Sold': [120, 100, 100, 85, 90, 100, 125, 90, 95, 83, 90, 100, 122, 93, 95, 80, 85]
        }
        
        self.df = pd.DataFrame(data)
        # Convert dates
        self.df['Invoice Date'] = pd.to_datetime(self.df['Invoice Date'], errors='coerce')
        self.df = self.df.dropna()
        
        # Create features
        self.df['Year'] = self.df['Invoice Date'].dt.year
        self.df['Month'] = self.df['Invoice Date'].dt.month
        self.df['Day'] = self.df['Invoice Date'].dt.day
    
    def preprocess_data(self):
        # Encode categorical variables
        categorical_cols = ['Product', 'Region', 'Retailer', 'Sales Method', 'State']
        
        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                self.df[col] = self.encoders[col].fit_transform(self.df[col].astype(str))
    
    def train_model(self):
        self.preprocess_data()
        
        # Features and target
        features = ['Year', 'Month', 'Day', 'Product', 'Region', 'Retailer', 
                   'Sales Method', 'State', 'Price per Unit']
        X = self.df[features]
        y = self.df['Total Sales']
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost model
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        self.model.fit(X_train, y_train)
        
        # Calculate feature importance
        self.feature_importance = dict(zip(features, self.model.feature_importances_))
    
    def predict_sales(self, year, product=None, region=None, retailer=None):
        # Generate predictions for the entire year
        predictions = []
        
        for month in range(1, 13):
            # Create base prediction data
            pred_data = {
                'Year': year,
                'Month': month,
                'Day': 15,  # Mid-month
                'Product': 'Men\'s Street Footwear',  # Default or use input
                'Region': 'Northeast',
                'Retailer': 'Foot Locker',
                'Sales Method': 'In-store',
                'State': 'New York',
                'Price per Unit': 50.0  # Average price
            }
            
            # Update with provided values
            if product:
                pred_data['Product'] = product
            if region:
                pred_data['Region'] = region
            if retailer:
                pred_data['Retailer'] = retailer
            
            # Encode categorical variables
            encoded_data = []
            for feature in ['Year', 'Month', 'Day', 'Product', 'Region', 'Retailer', 
                           'Sales Method', 'State', 'Price per Unit']:
                if feature in self.encoders:
                    try:
                        encoded_val = self.encoders[feature].transform([str(pred_data[feature])])[0]
                    except:
                        encoded_val = 0
                    encoded_data.append(encoded_val)
                else:
                    encoded_data.append(pred_data[feature])
            
            # Make prediction
            prediction = self.model.predict([encoded_data])[0]
            predictions.append({
                'month': month,
                'predicted_sales': float(prediction),
                'year': year
            })
        
        return predictions

# Initialize data and model
sales_data = SalesData()

@app.get("/")
async def root():
    return {"message": "Sales Prediction API"}

@app.get("/api/sales-data")
async def get_sales_data():
    return sales_data.df.to_dict(orient='records')

@app.post("/api/predict-sales")
async def predict_sales(request: PredictionRequest):
    try:
        predictions = sales_data.predict_sales(
            request.year,
            request.product,
            request.region,
            request.retailer
        )
        return {
            "predictions": predictions,
            "feature_importance": sales_data.feature_importance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/feature-importance")
async def get_feature_importance():
    return sales_data.feature_importance

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)