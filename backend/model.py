import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import re

class PhishingModel:
    def __init__(self):
        # We will build a simple mock model using a small dataset of known phishing and safe URLs.
        # In a real scenario, this would load a pretrained model (e.g., joblib.load('model.pkl'))
        self.model = make_pipeline(
            TfidfVectorizer(analyzer='char', ngram_range=(3, 5)),
            LogisticRegression(max_iter=1000)
        )
        self.is_trained = False
        
    def _extract_features(self, url):
        # We process the URL to extract text features
        return [url]

    def train_mock_model(self):
        # A tiny dataset for demonstration purposes
        urls = [
            "https://www.google.com",
            "http://example.com",
            "https://github.com",
            "https://stackoverflow.com",
            "http://secure-login-paypal-update.com",
            "http://verify-your-account-apple.com",
            "http://free-iphone-winner.xyz",
            "http://login.bankofamerica.update-info.com"
        ]
        labels = [0, 0, 0, 0, 1, 1, 1, 1]  # 0 for Safe, 1 for Phishing
        
        self.model.fit(urls, labels)
        self.is_trained = True
        
    def predict(self, url):
        if not self.is_trained:
            self.train_mock_model()
            
        if "127.0.0.1" in url or "localhost" in url:
            return {
                "status": "Safe",
                "risk_score": 0
            }

        features = self._extract_features(url)
        prediction = self.model.predict(features)[0]
        prob = self.model.predict_proba(features)[0].max()
        
        # Simple heuristic fallback on keywords since the dataset is tiny
        suspicious_keywords = ['login', 'verify', 'update', 'secure', 'account', 'banking', 'free', 'winner', 'paypal', 'apple']
        has_suspicious_keyword = any(kw in url.lower() for kw in suspicious_keywords)
        
        # More aggressive heuristic for the demo
        dangerous_keywords = ['free-iphone', 'login.bankofamerica', 'secure-login']
        has_dangerous_keyword = any(kw in url.lower() for kw in dangerous_keywords)
        
        if prediction == 1 or has_dangerous_keyword:
            status = "Phishing"
            score = 90 + int(prob * 10) if prob > 0 else 95
        elif has_suspicious_keyword:
            status = "Suspicious"
            score = 60 + int(prob * 30) # Boost score due to keywords
        else:
            status = "Safe"
            score = int((1 - prob) * 100) if prediction == 0 else int(prob * 20)
            
        return {
            "status": status,
            "risk_score": score
        }

# Singleton instance
phishing_detector = PhishingModel()
