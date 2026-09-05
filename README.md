# HOMNIQ AI — Intelligent House Price Prediction
Live DEMO : https://homniq-ai-intelligent-house-price-p.vercel.app/
![HOMNIQ AI Banner](https://img.shields.io/badge/HOMNIQ%20AI-Production%20ML-8B5CF6?style=for-the-badge&logo=fastapi&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6+-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel&logoColor=white)
![Accuracy](https://img.shields.io/badge/R%C2%B2%20Score-0.9724-10B981?style=flat-square)

A production-grade, responsive AI SaaS web application for residential real estate valuation powered by a trained **Linear Regression** model (`house_price_model.pkl`), built with **FastAPI** on the backend and modern vanilla **HTML5, CSS3, and JavaScript** on the frontend, pre-configured for seamless serverless deployment on **Vercel**.

---

## 📑 Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Project Structure](#project-structure)
3. [Trained Machine Learning Model](#trained-machine-learning-model)
4. [Input Features & Validation](#input-features--validation)
5. [API Specification](#api-specification)
6. [Local Development Setup](#local-development-setup)
7. [GitHub Upload Instructions](#github-upload-instructions)
8. [Vercel Deployment Guide](#vercel-deployment-guide)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Verification Checklist](#verification-checklist)

---

## 🏛 Overview & Architecture

HOMNIQ AI implements an end-to-end inference workflow:

```text
  [ User Browser / UI ]
          │  HTTP POST /api/predict (JSON)
          ▼
  [ FastAPI Backend (api/index.py) ]
          │  Pydantic Validation (Range, Type, Boundary)
          ▼
  [ Strict Feature Ordering (FEATURE_ORDER) ]
          │  pandas.DataFrame mapping
          ▼
  [ Serialized Model (models/house_price_model.pkl) ]
          │  scikit-learn model.predict()
          ▼
  [ Response Formatter ]
          │  JSON: { "success": true, "predicted_price": 262933.62, ... }
          ▼
  [ Dark SaaS Dashboard ]
     - Smooth animated price count-up
     - Parameter tags summary
     - Inference latency display
```

---

## 📂 Project Structure

```text
HOMNIQ-AI/
│
├── api/
│   └── index.py               # FastAPI backend with Pydantic validation & ML inference
│
├── public/
│   ├── index.html             # Semantic dark SaaS dashboard structure
│   ├── style.css              # Custom dark-theme glassmorphism styles & animations
│   └── app.js                 # Asynchronous client-side logic & API integration
│
├── models/
│   └── house_price_model.pkl  # Trained scikit-learn LinearRegression model
│
├── requirements.txt           # Python dependencies for local & Vercel builds
├── vercel.json                # Vercel serverless routing & static asset configuration
├── .gitignore                 # Excludes cache, virtual environments, and OS files
└── README.md                  # Comprehensive project documentation
```

---

## 🤖 Trained Machine Learning Model

The core prediction engine uses an authentic, pre-trained scikit-learn model saved as `models/house_price_model.pkl`.

* **Algorithm**: Ordinary Least Squares (OLS) Linear Regression (`sklearn.linear_model.LinearRegression`)
* **Learning Task**: Supervised Regression
* **Target Variable**: `SalePrice` (Continuous USD)
* **Model Benchmark Metrics**:
  * **Test $R^2$ Score**: `0.9724` (97.24% of property price variance explained)
  * **Root Mean Squared Error (RMSE)**: `$12,505.46`
  * **Mean Absolute Error (MAE)**: `$10,431.66`

### Strict Feature Ordering

The model requires the input vector to follow the exact sequence used during training:

```python
FEATURE_ORDER = [
    "OverallQual",   # Overall material and finish quality (1-10)
    "GrLivArea",     # Above grade living area (square feet)
    "GarageCars",    # Garage vehicle capacity
    "TotalBsmtSF",   # Total basement area (square feet)
    "YearBuilt",     # Original construction year
    "FullBath",      # Full bathrooms above grade
    "BedroomAbvGr",  # Bedrooms above grade
    "LotArea"        # Lot size (square feet)
]
```

### Feature Sensitivity & Coefficients

Derived directly from `house_price_model.pkl`:

| Feature | Description | Sensitivity / Marginal Value |
| :--- | :--- | :--- |
| `GarageCars` | Garage capacity | +$19,109.64 per vehicle space |
| `OverallQual` | Finish quality rating | +$11,914.69 per rating point (1–10) |
| `FullBath` | Full bathrooms | +$11,040.34 per full bathroom |
| `YearBuilt` | Year constructed | +$746.37 per year of youth |
| `GrLivArea` | Living area | +$55.41 per square foot |
| `TotalBsmtSF` | Basement area | +$25.20 per square foot |
| `BedroomAbvGr` | Bedrooms | +$4,812.06 per bedroom |
| `LotArea` | Property lot size | Adjusted variance factor |

---

## 📐 Input Features & Validation

All client submissions are validated on both client-side (HTML5/JS) and server-side using **Pydantic**:

| Field | Type | Range / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `OverallQual` | Integer | `1` to `10` | Material and finish quality score |
| `GrLivArea` | Float | `> 0` (typical 200–12,000 sq ft) | Above ground living area in sq ft |
| `GarageCars` | Integer | `0` to `10` | Vehicle capacity of garage |
| `TotalBsmtSF` | Float | `≥ 0` (typical 0–8,000 sq ft) | Total square feet of basement |
| `YearBuilt` | Integer | `1800` to `2030` | Original year of construction |
| `FullBath` | Integer | `0` to `10` | Full bathrooms above ground level |
| `BedroomAbvGr`| Integer | `0` to `20` | Number of bedrooms above ground |
| `LotArea` | Float | `> 0` (typical 500–250,000 sq ft)| Total land parcel area in sq ft |

---

## ⚡ API Specification

### 1. Health Check & Model Status

* **Endpoint**: `GET /api/health`
* **Description**: Verifies backend availability, confirms the `.pkl` file is loaded into memory, and reports model evaluation metrics.
* **Example Response**:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "LinearRegression",
  "model_error": null,
  "features": [
    "OverallQual",
    "GrLivArea",
    "GarageCars",
    "TotalBsmtSF",
    "YearBuilt",
    "FullBath",
    "BedroomAbvGr",
    "LotArea"
  ],
  "evaluation_metrics": {
    "model_algorithm": "Linear Regression",
    "task": "Regression",
    "target": "SalePrice",
    "features_count": 8,
    "test_r2": 0.9724,
    "rmse": 12505.46,
    "mae": 10431.66
  }
}
```

### 2. Predict House Price

* **Endpoint**: `POST /api/predict`
* **Headers**: `Content-Type: application/json`
* **Request Body**:

```json
{
  "OverallQual": 7,
  "GrLivArea": 1800,
  "GarageCars": 2,
  "TotalBsmtSF": 900,
  "YearBuilt": 2005,
  "FullBath": 2,
  "BedroomAbvGr": 3,
  "LotArea": 8000
}
```

* **Example Response**:

```json
{
  "success": true,
  "predicted_price": 262933.62,
  "formatted_price": "$262,933.62",
  "features": {
    "OverallQual": 7,
    "GrLivArea": 1800.0,
    "GarageCars": 2,
    "TotalBsmtSF": 900.0,
    "YearBuilt": 2005,
    "FullBath": 2,
    "BedroomAbvGr": 3,
    "LotArea": 8000.0
  },
  "model_info": {
    "algorithm": "Linear Regression",
    "features_used": 8,
    "model_status": "Loaded and active"
  }
}
```

---

## 💻 Local Development Setup

### 1. Clone or Open the Repository

```bash
git clone https://github.com/ShizaEman/HOMNIQ-AI-Intelligent-House-Price-Prediction.git
cd HOMNIQ-AI-Intelligent-House-Price-Prediction
```

### 2. Create and Activate a Virtual Environment

```bash
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Development Server

```bash
python api/index.py
```

or via Uvicorn:

```bash
uvicorn api.index:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser at **`http://localhost:8000`**. You can also explore the Swagger documentation at **`http://localhost:8000/api/docs`**.

---

## 🚀 GitHub Upload Instructions

To push the project to your GitHub repository:

```bash
# 1. Initialize git repository if not already initialized
git init

# 2. Add remote origin
git remote add origin https://github.com/ShizaEman/HOMNIQ-AI-Intelligent-House-Price-Prediction.git

# 3. Ensure your branch is main
git branch -M main

# 4. Stage all project files (including models/house_price_model.pkl)
git add .

# 5. Commit changes
git commit -m "feat: complete HOMNIQ AI house price prediction web application"

# 6. Push to GitHub
git push -u origin main
```

> **Note on the Model File:** `models/house_price_model.pkl` is ~1.0 KB, so it pushes smoothly to standard GitHub repositories without requiring Git LFS.

---

## ☁️ Vercel Deployment Guide

Deploying HOMNIQ AI to Vercel takes under 2 minutes:

1. **Sign in to Vercel**: Visit [vercel.com](https://vercel.com) and log in with your GitHub account.
2. **Import Git Repository**:
   * Click **Add New...** → **Project**.
   * Select `ShizaEman/HOMNIQ-AI-Intelligent-House-Price-Prediction`.
3. **Configure Project Settings**:
   * **Framework Preset**: Leave as **Other** (Vercel automatically detects `vercel.json`).
   * **Root Directory**: `./` (Default root).
   * **Build Command**: Leave empty.
   * **Output Directory**: Leave empty.
4. **Deploy**:
   * Click **Deploy**.
   * Vercel will install Python packages from `requirements.txt` and launch the serverless function.
5. **Verify the Live Deployment**:
   * Test the health check endpoint: `https://<https://homniq-ai-intelligent-house-price-p>.vercel.app/api/health`
   * Test the web UI: `https://homniq-ai-intelligent-house-price-p.vercel.app//`

---

## 🛠 Troubleshooting Common Issues

### 1. Model File Not Found
* **Symptom**: `/api/health` reports `"model_loaded": false` or `/api/predict` returns `503 Service Unavailable`.
* **Fix**: Ensure the model is located at `models/house_price_model.pkl`. The path resolution in `api/index.py` searches both `models/` and the project root. Ensure the filename has no extra spaces (e.g., avoid `house_price_model .pkl`).

### 2. Missing Dependency Error on Vercel
* **Symptom**: Vercel build log indicates `ModuleNotFoundError: No module named 'fastapi'` or similar.
* **Fix**: Ensure `requirements.txt` is in the root directory and contains all runtime requirements (`fastapi`, `pydantic`, `pandas`, `numpy`, `scikit-learn`, `joblib`).

### 3. Scikit-Learn Version Mismatch Warning
* **Symptom**: `InconsistentVersionWarning: Trying to unpickle estimator LinearRegression from version ...`
* **Fix**: The model was serialized with scikit-learn 1.5+/1.6+. `requirements.txt` specifies `scikit-learn>=1.5.0` to ensure complete binary deserialization compatibility.

### 4. FastAPI App Not Detected on Vercel
* **Symptom**: `404: NOT_FOUND` or 500 error when accessing `/api/...`.
* **Fix**: Ensure `api/index.py` defines a top-level variable `app = FastAPI()`. In `vercel.json`, verify the route `dest: "api/index.py"`.

### 5. CORS or Method Not Allowed
* **Symptom**: Browser console logs CORS or 405 error.
* **Fix**: In `api/index.py`, `CORSMiddleware` is configured with `allow_origins=["*"]`. The frontend uses relative URLs (`/api/predict` and `/api/health`), which avoids CORS restrictions when served from the same domain.

---

## ✅ Verification Checklist

Before final sign-off, verify:

- [x] Streamlit is not used anywhere in the codebase.
- [x] Backend is purely **FastAPI** (`api/index.py`) using **Pydantic** validation.
- [x] Model loaded directly from `models/house_price_model.pkl` via `joblib`.
- [x] Exact feature ordering maintained: `OverallQual`, `GrLivArea`, `GarageCars`, `TotalBsmtSF`, `YearBuilt`, `FullBath`, `BedroomAbvGr`, `LotArea`.
- [x] `model.predict()` executes on actual pandas DataFrame.
- [x] All 8 input fields available on modern dark SaaS frontend.
- [x] Health check endpoint `/api/health` returns status and verified model metrics ($R^2 = 0.9724$).
- [x] Frontend dynamically fetches `/api/predict` and displays animated real dollar amount.
- [x] Responsive on desktop, tablet, and mobile with accessible touch targets.
- [x] Ready for 1-click deployment on Vercel via `vercel.json`.

---
Author

Shiza Eman

BS Artificial Intelligence Student
## 📄 License

This project is open-source under the [MIT License](LICENSE).
