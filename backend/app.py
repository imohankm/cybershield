from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import datetime
import os
import random
import string
from fastapi.staticfiles import StaticFiles
# from model import phishing_detector  # Moved to local import

app = FastAPI(title="AI CyberShield API v2")

# Allow requests from the browser extension and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the database is in the same directory as app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "logs.db")

def init_db():
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identity_id TEXT UNIQUE NOT NULL,
            url TEXT NOT NULL,
            status TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

class URLRequest(BaseModel):
    url: str

def generate_id():
    return "CS-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@app.post("/api/analyze-url")
def analyze_url(req: URLRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        from model import phishing_detector
        # Analyze the URL using the ML model
        result = phishing_detector.predict(req.url)
        identity_id = generate_id()
        
        # Save to database
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO visit_logs (identity_id, url, status, risk_score, visited_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (identity_id, req.url, result['status'], result['risk_score'], datetime.datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        return {
            "identity_id": identity_id,
            "url": req.url,
            "status": result["status"],
            "risk_score": result["risk_score"]
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        with open(os.path.join(BASE_DIR, "error.log"), "a") as f:
            f.write(f"\n[{datetime.datetime.now()}] ERROR:\n{error_details}\n")
        print(f"ERROR analyzing URL:\n{error_details}")
        raise HTTPException(status_code=500, detail=error_details)

@app.get("/api/logs")
def get_logs(limit: int = 50):
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, identity_id, url, status, risk_score, visited_at
        FROM visit_logs
        ORDER BY visited_at DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    logs = [
        {
            "id": row[0], 
            "identity_id": row[1], 
            "url": row[2], 
            "status": row[3], 
            "risk_score": row[4], 
            "visited_at": row[5]
        }
        for row in rows
    ]
    return {"logs": logs}

@app.delete("/api/logs/{log_id}")
def delete_log(log_id: int):
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visit_logs WHERE id = ?', (log_id,))
    conn.commit()
    deleted_rows = cursor.rowcount
    conn.close()
    
    if deleted_rows == 0:
        raise HTTPException(status_code=404, detail="Log not found")
        
    return {"message": "Log deleted successfully"}

# Mount the dashboard directory to serve static files
# Dashboard is located one level up from backend
dashboard_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard"))
if os.path.exists(dashboard_path):
    app.mount("/dashboard", StaticFiles(directory=dashboard_path, html=True), name="dashboard")

extension_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "extension"))
if os.path.exists(extension_path):
    app.mount("/extension", StaticFiles(directory=extension_path), name="extension")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
