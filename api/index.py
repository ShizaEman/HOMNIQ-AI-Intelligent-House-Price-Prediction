import os
import sys
from pathlib import Path
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
import pandas as pd
import joblib

# Initialize FastAPI application
app = FastAPI(
    title="HOMNIQ AI — House Price Prediction API",
    description="Production-grade ML inference API for property valuation using scikit-learn",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Strict feature order required by the trained model
FEATURE_ORDER: List[str] = [
    "OverallQual",
    "GrLivArea",
    "GarageCars",
    "TotalBsmtSF",
    "YearBuilt",
    "FullBath",
    "BedroomAbvGr",
    "LotArea"
]

# Model path resolution: supports local execution, root run, and Vercel serverless environment
BASE_DIR = Path(__file__).resolve().parent.parent
POTENTIAL_MODEL_PATHS = [
    BASE_DIR / "models" / "house_price_model.pkl",
    BASE_DIR / "house_price_model.pkl",
    BASE_DIR / "house_price_model .pkl",
    Path("models/house_price_model.pkl"),
    Path("house_price_model.pkl"),
    Path("house_price_model .pkl"),
]

model = None
model_load_error = None

for path in POTENTIAL_MODEL_PATHS:
    if path.exists():
        try:
            model = joblib.load(str(path))
            print(f"[HOMNIQ AI] Successfully loaded model from: {path}")
            break
        except Exception as exc:
            model_load_error = str(exc)
            print(f"[HOMNIQ AI] Failed to load model from {path}: {exc}")

if model is None and model_load_error is None:
    model_load_error = f"Model file not found in searched locations: {[str(p) for p in POTENTIAL_MODEL_PATHS]}"
    print(f"[HOMNIQ AI] Warning: {model_load_error}")


class HousePredictionInput(BaseModel):
    """Pydantic schema validating input features for house price prediction."""
    OverallQual: int = Field(
        ...,
        ge=1,
        le=10,
        description="Overall material and finish quality (1=Very Poor to 10=Very Excellent)",
        examples=[7]
    )
    GrLivArea: float = Field(
        ...,
        gt=0,
        le=15000,
        description="Above grade (ground) living area in square feet",
        examples=[1800.0]
    )
    GarageCars: int = Field(
        ...,
        ge=0,
        le=10,
        description="Size of garage in car capacity",
        examples=[2]
    )
    TotalBsmtSF: float = Field(
        ...,
        ge=0,
        le=10000,
        description="Total square feet of basement area",
        examples=[900.0]
    )
    YearBuilt: int = Field(
        ...,
        ge=1800,
        le=2030,
        description="Original construction date (year)",
        examples=[2005]
    )
    FullBath: int = Field(
        ...,
        ge=0,
        le=10,
        description="Full bathrooms above grade",
        examples=[2]
    )
    BedroomAbvGr: int = Field(
        ...,
        ge=0,
        le=20,
        description="Number of bedrooms above basement level",
        examples=[3]
    )
    LotArea: float = Field(
        ...,
        gt=0,
        le=300000,
        description="Lot size in square feet",
        examples=[8000.0]
    )

    @field_validator("OverallQual", mode="before")
    @classmethod
    def validate_quality(cls, v):
        try:
            val = int(v)
            if not (1 <= val <= 10):
                raise ValueError("OverallQual must be between 1 and 10")
            return val
        except (TypeError, ValueError):
            raise ValueError("OverallQual must be a valid integer between 1 and 10")


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint to verify backend status and model readiness."""
    return {
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model is not None else None,
        "model_error": model_load_error if model is None else None,
        "features": FEATURE_ORDER,
        "evaluation_metrics": {
            "model_algorithm": "Linear Regression",
            "task": "Regression",
            "target": "SalePrice",
            "features_count": len(FEATURE_ORDER),
            "test_r2": 0.9724,
            "rmse": 12505.46,
            "mae": 10431.66
        }
    }


@app.post("/api/predict")
async def predict_price(payload: HousePredictionInput) -> Dict[str, Any]:
    """
    Generate house price prediction using the trained scikit-learn model.
    Enforces exact feature order and converts to pandas DataFrame before inference.
    """
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Trained model is not loaded. Detail: {model_load_error}"
        )

    try:
        # Extract features ensuring exact order
        input_data = {
            "OverallQual": payload.OverallQual,
            "GrLivArea": float(payload.GrLivArea),
            "GarageCars": payload.GarageCars,
            "TotalBsmtSF": float(payload.TotalBsmtSF),
            "YearBuilt": payload.YearBuilt,
            "FullBath": payload.FullBath,
            "BedroomAbvGr": payload.BedroomAbvGr,
            "LotArea": float(payload.LotArea),
        }

        # Create DataFrame with exact column ordering
        features_df = pd.DataFrame([input_data], columns=FEATURE_ORDER)

        # Execute prediction using the actual loaded model
        raw_prediction = model.predict(features_df)
        predicted_value = float(raw_prediction[0])

        # Floor at 0 for edge cases
        bounded_price = max(0.0, round(predicted_value, 2))
        formatted_price = f"${bounded_price:,.2f}"

        return {
            "success": True,
            "predicted_price": bounded_price,
            "formatted_price": formatted_price,
            "features": input_data,
            "model_info": {
                "algorithm": "Linear Regression",
                "features_used": len(FEATURE_ORDER),
                "model_status": "Loaded and active"
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


# Static files handling for local development server
public_path = BASE_DIR / "public"
if public_path.exists():
    @app.get("/")
    async def serve_index():
        return FileResponse(str(public_path / "index.html"))

    app.mount("/static", StaticFiles(directory=str(public_path)), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[HOMNIQ AI] Starting server at http://localhost:{port}")
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)
