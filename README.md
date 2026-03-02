# Motion AI | Premium Flow Analysis
**Kinematic Intelligence Platform: Enterprise-Grade Movement Telemetry & Real-Time Biometric Feedback**

## Project Overview
Motion AI is a versatile Kinematic Intelligence platform designed for anyone looking to master their physical form—from elite athletes and professional dancers to individuals in physical therapy or those seeking to improve daily ergonomic posture. By leveraging advanced computer vision and cloud-native serverless architecture, the system performs real-time skeletal alignment comparison against professional benchmarks, delivering sub-second AI coaching insights to optimize movement efficiency, accelerate rehabilitation, and prevent long-term injury.

## Technical Highlights
*   **Enterprise AWS Ecosystem**: Architected with a serverless backbone. Uses **S3** for kinematic session storage, **DynamoDB** for telemetry persistence, and **AWS Lambda** for high-throughput motion processing.
*   **AI Posture Coaching**: Leverages **Groq (Llama 3.1)** for sub-second, actionable feedback based on professional skeletal alignment benchmarks.
*   **Modern Web Architecture**: A responsive SPA built with **React (Vite)** and **Framer Motion**, delivering a unified experience for live capture and analysis.
*   **Kinematic Engine**: Utilizes **Dynamic Time Warping (DTW)** and **MediaPipe** to perform high-precision sequence alignment between user and pro movements.

---

## System Architecture

### 1. Modern Web Stack (Primary)
The production environment utilizes a distributed cloud architecture:
*   **Frontend**: React 18, Vite, Lucide Icons, Framer Motion (Glassmorphic UI).
*   **Backend**: FastAPI (Python 3.10+), Uvicorn.
*   **Processing**: MediaPipe Pose/Hands, OpenCV, NumPy.
*   **AI Engine**: Groq Cloud API (Llama-3.1-8b-instant).
*   **Infrastructure**: AWS SDK (Boto3 & AWS SDK v2 for Java).

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

---

## AWS Cloud Infrastructure & Deployment

### 1. Resource Configuration
To enable the full serverless stack, ensure the following AWS resources are provisioned:
*   **Amazon S3**: Create a bucket named `motion-ai-videos` to store processed video frames and skeletal keypoint files.
*   **Amazon DynamoDB**: Create a table with `SessionID` (String) as the partition key to store kinematic telemetry metrics.
*   **AWS Lambda**: Deploy a function named `PoseEstimationFunction` using the `python3.10` runtime.

### 2. Lambda Deployment (API Bridge)
Since the engine relies on **OpenCV** and **MediaPipe**, we recommend deploying via **Docker Container** to handle package sizes:
```bash
# Example deployment flow
docker build -t motion-ai-lambda .
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <acc-id>.dkr.ecr.<region>.amazonaws.com
docker tag motion-ai-lambda:latest <acc-id>.dkr.ecr.<region>.amazonaws.com/motion-ai:latest
docker push <acc-id>.dkr.ecr.<region>.amazonaws.com/motion-ai:latest
# Update Lambda to use the new image
```

### 3. IAM Permissions
Ensure your AWS credentials/role has the following permissions:
- `s3:PutObject`, `s3:GetObject` on `arn:aws:s3:::motion-ai-videos/*`
- `dynamodb:PutItem`, `dynamodb:GetItem` on your telemetry table.
- `lambda:InvokeFunction` for the frontend orchestration.