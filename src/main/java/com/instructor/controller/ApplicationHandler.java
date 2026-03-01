package com.instructor.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import com.instructor.data.PoseDataProcessing;
import com.instructor.data.PoseDataReader;
import com.instructor.main.DanceInstructorUIController;
import com.instructor.aws.S3Service;
import com.instructor.aws.DynamoDBService;
import com.instructor.aws.LambdaService;
import com.instructor.aws.AWSConfig;
import java.io.File;

public class ApplicationHandler {
        private PoseDataReader poseDataReader = new PoseDataReader();
        private PoseDataProcessing poseDataProcessing = new PoseDataProcessing();

        /**
         * Method to capture user video for pose estimation
         */
        public boolean runCapturePoseEstimation(String videoType) {
                try {
                        // Define the command to run the Python script
                        String pythonScriptPath = "./pose_detection/PoseDetection.py"; // Relative path
                        String venvPythonPath = "./venv/bin/python3"; // Use venv
                        ProcessBuilder processBuilder = new ProcessBuilder(venvPythonPath, pythonScriptPath);

                        // Set the redirect error stream to true to capture errors
                        processBuilder.redirectErrorStream(true);

                        // Start the process
                        Process process = processBuilder.start();

                        // Read the output of the script
                        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                        String line;
                        String fileName = null;

                        while ((line = reader.readLine()) != null) {
                                System.out.println(line);

                                if (line.endsWith(".txt")) {
                                        fileName = line;
                                }
                        }

                        // Wait for the process to finish
                        int exitCode = process.waitFor();
                        System.out.println("Python script exited with code: " + exitCode);

                        // Return true if exit code is 0, otherwise false
                        if (exitCode == 0) {
                                if (videoType.equals("beginner")) {
                                        DanceInstructorUIController.isUserInput = true;

                                        DanceInstructorUIController.userKeypointsMap = poseDataReader
                                                        .readKeypointsFromFile(fileName);

                                        DanceInstructorUIController.userKeypointsMap = poseDataProcessing
                                                        .processPoseData(DanceInstructorUIController.userKeypointsMap);

                                        return true;
                                } else {
                                        DanceInstructorUIController.isProInput = true;

                                        DanceInstructorUIController.proKeypointsMap = poseDataReader
                                                        .readKeypointsFromFile(fileName);

                                        DanceInstructorUIController.proKeypointsMap = poseDataProcessing
                                                        .processPoseData(DanceInstructorUIController.proKeypointsMap);

                                        return true;
                                }
                        } else {
                                return false;
                        }

                } catch (Exception e) {
                        e.printStackTrace();
                        return false; // Return false in case of an exception
                }
        }

        /**
         * AWS-based Pose Estimation
         * 1. Uploads video to S3
         * 2. Invokes Lambda for processing (OpenCV/MediaPipe)
         * 3. Saves record to DynamoDB
         */
        public void runAWSPoseEstimation(String videoPath, String videoType) {
                if (!AWSConfig.areCredentialsPresent()) {
                        System.out.println("AWS Credentials not found. Falling back to local processing...");
                        runLocalPoseEstimation(videoPath, videoType);
                        return;
                }

                try {
                        S3Service s3 = new S3Service();
                        LambdaService lambda = new LambdaService();
                        DynamoDBService dynamo = new DynamoDBService();

                        File videoFile = new File(videoPath);
                        String s3Key = "uploads/" + videoFile.getName();

                        // 1. Upload to S3
                        s3.uploadFile(s3Key, videoFile);

                        // 2. Invoke Lambda
                        lambda.invokePoseEstimation(s3Key);

                        // 3. Store result metadata
                        dynamo.saveAnalysisResult(videoFile.getName(), "s3://motion-ai-videos/" + s3Key, 85,
                                        "Good posture, keep it up!");

                        System.out.println("AWS Pipeline completed for: " + videoPath);

                        if (videoType.equals("beginner")) {
                                DanceInstructorUIController.isUserInput = true;
                        } else {
                                DanceInstructorUIController.isProInput = true;
                        }

                } catch (Throwable t) {
                        System.err.println("AWS Processing failed (likely build/dependency issue): " + t.getMessage());
                        System.out.println("Attempting local fallback...");
                        runLocalPoseEstimation(videoPath, videoType);
                }
        }

        /**
         * Local Pose Estimation fallback
         * Runs the Python script on a specific video file.
         */
        public void runLocalPoseEstimation(String videoPath, String videoType) {
                try {
                        String pythonScriptPath = "./pose_detection/PoseDetection.py";
                        String venvPythonPath = "./venv/bin/python3";

                        // Pass videoPath as an argument to the script
                        ProcessBuilder processBuilder = new ProcessBuilder(venvPythonPath, pythonScriptPath, videoPath);
                        processBuilder.redirectErrorStream(true);
                        Process process = processBuilder.start();

                        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                        String line;
                        String fileName = null;

                        while ((line = reader.readLine()) != null) {
                                System.out.println(line);
                                if (line.endsWith(".txt")) {
                                        fileName = line.trim();
                                }
                        }

                        int exitCode = process.waitFor();
                        if (exitCode == 0 && fileName != null) {
                                if (videoType.equals("beginner")) {
                                        DanceInstructorUIController.isUserInput = true;
                                        DanceInstructorUIController.userKeypointsMap = poseDataReader
                                                        .readKeypointsFromFile(fileName);
                                        DanceInstructorUIController.userKeypointsMap = poseDataProcessing
                                                        .processPoseData(DanceInstructorUIController.userKeypointsMap);
                                } else {
                                        DanceInstructorUIController.isProInput = true;
                                        DanceInstructorUIController.proKeypointsMap = poseDataReader
                                                        .readKeypointsFromFile(fileName);
                                        DanceInstructorUIController.proKeypointsMap = poseDataProcessing
                                                        .processPoseData(DanceInstructorUIController.proKeypointsMap);
                                }
                                System.out.println("Local processing successful for: " + videoPath);
                        }
                } catch (Exception e) {
                        e.printStackTrace();
                }
        }

        /**
         * Generates feedback by invoking a Python script that compares dance frame
         * sets.
         */
        public String generateFeedbackAPI(String prompt) {
                if (prompt == null || prompt.trim().isEmpty()) {
                        return "Insufficient movement data captured for the selected body part in your recording. Please ensure the part is fully visible and the lighting is adequate.";
                }

                if (prompt.equals("ERROR: NO_DATA_FOR_PART")) {
                        return "Insufficient movement data captured for the selected body part in your recording. Please ensure the part is fully visible and the lighting is adequate.";
                }

                if (prompt.equals("ERROR: NO_PRO_DATA_FOR_PART")) {
                        return "The reference (professional) video does not contain clear data for the selected body part. Please try another segment or source.";
                }

                // The prompt to send to the python script
                String base = "Provide feedback based on the comparison for the user to improve their 3D motion alignment. Focus on the following:\n"
                                + "- Analyze the differences between the user and pro keypoints.\n"
                                + "- Offer specific guidance on adjust local posture.\n"
                                + prompt;

                try {
                        String pythonScriptPath = "./web_call/AI_Call.py";
                        String venvPythonPath = "./venv/bin/python3"; // Ensure venv python is used

                        ProcessBuilder processBuilder = new ProcessBuilder(venvPythonPath, pythonScriptPath, base);
                        // Redirect stderr to stdout to capture python errors in the reader
                        processBuilder.redirectErrorStream(true);

                        Process process = processBuilder.start();

                        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                        StringBuilder feedback = new StringBuilder();
                        String line;

                        while ((line = reader.readLine()) != null) {
                                feedback.append(line).append("\n");
                        }

                        int exitCode = process.waitFor();
                        if (exitCode != 0) {
                                System.err.println("Feedback script exited with error code: " + exitCode);
                                System.err.println("Feedback output was: " + feedback.toString());
                        }

                        return feedback.toString();

                } catch (Exception e) {
                        e.printStackTrace();
                        return "Error generating feedback: " + e.getMessage();
                }
        }
}
