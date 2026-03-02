# Motion AI | Premium Flow Analysis
**Kinematic Intelligence Platform: Enterprise-Grade Movement Telemetry & Real-Time Biometric Feedback**

## Modern Web Interface (New)
Motion AI has transitioned to a high-performance, streamlined **Web Dashboard** powered by **React** and **FastAPI**, replacing the legacy JavaFX interface with a premium, glassmorphic design system. This new architecture provides a unified single-page experience for live motion capture, video analysis, and AI-driven posture coaching.

## Technical Achievements
*   **Web-First Architecture**: Implemented a responsive SPA using **React (Vite)** and **Framer Motion**, delivering a state-of-the-art UX with real-time status telemetry.
*   **FastAPI Backend Core**: Engineered a high-throughput Python API to bridge edge-vision (MediaPipe/OpenCV) with deep-learning insights.
*   **AI Posture Coaching**: Integrated **Groq (Llama 3.1)** for sub-second, actionable motion analysis feedback based on professional standards.
*   **Proprietary Kinematic Engine**: Ported the professional **Dynamic Time Warping (DTW)** engine to Python for seamless server-side sequence alignment and morphological normalization.

---

## System Architecture

### 1. Modern Web Stack (Primary)
The current production environment utilizes a distributed web architecture:
*   **Frontend**: React 18, Vite, Lucide Icons, Framer Motion (Glassmorphic UI).
*   **Backend**: FastAPI, Uvicorn, Python 3.10+.
*   **Processing**: MediaPipe Pose/Hands, OpenCV, NumPy.
*   **AI Engine**: Groq Cloud API (Llama-3.1-8b-instant).
*   **Cloud Ecosystem**: AWS (Lambda, S3, DynamoDB) for serverless orchestration.

### 2. Legacy Java Engine (Alternative)
The original high-performance JavaFX interface remains available for desktop-native workflows, utilizing:
*   **Core**: Java 21 LTS, Maven.
*   **Processing**: MediaPipe Pose/Hands, OpenCV, NumPy.
*   **AI Engine**: Groq Cloud API (Llama-3.1-8b-instant).
*   **Cloud Ecosystem**: AWS (Lambda, S3, DynamoDB) for serverless orchestration.

---

## Getting Started

### Prerequisites
*   **Python 3.10+**: Core logic and backend server.
*   **Node.js 18+**: Frontend development server.
*   **Java 21+**: (Optional) For legacy JavaFX client.

### Environmental Configuration
1. **API Keys**: Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY="your_groq_api_key"
   AWS_ACCESS_KEY_ID="your_aws_access_key_id"
   AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
   AWS_REGION="your_aws_region"
   ```

2. **Backend Setup**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

---

## Operation Guide

### 1. Launching the Web Dashboard
To run the full modernized stack, open two terminal sessions:

**Terminal 1: Backend API**
```bash
source venv/bin/activate
python backend/main.py
```

**Terminal 2: Frontend UI**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` to access the Motion AI Dashboard.

### 2. Operating the UI
*   **Input**: Choose between **Live Capture** (starts local camera) or **Upload Video**.
*   **Target Selection**: Select a specific body part from the sidebar for granular alignment analysis.
*   **Analyze**: Click **"Analyze Now"**. The system will align your motion data with professional benchmarks using DTW and return AI coaching insights.

---

## Legacy JavaFX Client
If you require the original desktop interface:
```bash
# Ensure Java 21 is active
mvn clean install
mvn javafx:run
```