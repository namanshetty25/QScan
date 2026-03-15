from ai_ml.training_data import TrainingDataGenerator
from ai_ml.anomaly_detection import CryptoAnomalyDetector

# 1 Generate crypto configs
generator = TrainingDataGenerator()
generator.generate_synthetic(3000)

# Convert synthetic dataset back into scan-like format
scan_results = generator.dataset

# 2 Train anomaly detector
detector = CryptoAnomalyDetector()
detector.fit(scan_results)

# 3 Save model
detector.save_model()

print("Anomaly model trained and saved.")