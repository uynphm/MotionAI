package com.instructor.main;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class DanceInstructorUI extends Application {

        private Scene mainScene;
        private Button startButton;
        private Button inputFileButton;
        private Button doneButton;
        private Button userButton;
        private Button profButton;
        private Button backButton;

        @Override
        public void start(Stage primaryStage) {

                // Main Screen
                BorderPane mainLayout = new BorderPane();
                mainLayout.getStyleClass().add("root");
                mainLayout.setStyle("-fx-background-color: #0f172a;"); // Solid dark fallback

                // Load external CSS
                primaryStage.getScene(); // Just to be safe

                VBox cardWrapper = new VBox(20);
                cardWrapper.setAlignment(Pos.CENTER);
                cardWrapper.setPadding(new Insets(40));

                VBox mainCard = new VBox(40);
                mainCard.getStyleClass().add("card");
                mainCard.setMaxWidth(850);
                mainCard.setAlignment(Pos.CENTER);
                mainCard.setStyle(
                                "-fx-background-color: rgba(30, 41, 59, 0.5); -fx-background-radius: 24; -fx-padding: 60; -fx-border-color: rgba(255,255,255,0.1); -fx-border-radius: 24;");

                VBox headerBox = new VBox(15);
                headerBox.setAlignment(Pos.CENTER);

                Label title = new Label("Motion AI");
                title.getStyleClass().add("label-title");
                title.setStyle("-fx-text-fill: white; -fx-font-size: 64; -fx-font-weight: 900; -fx-font-family: 'Outfit';");

                Label description = new Label("Professional Motion Analysis & AI Alignment Feedback");
                description.getStyleClass().add("label-description");
                description.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 18; -fx-font-family: 'Outfit';");

                headerBox.getChildren().addAll(title, description);

                // Unused button style variables removed. Button styles are applied directly.

                startButton = new Button("Capture Live");
                startButton.setPrefWidth(220);
                startButton.getStyleClass().add("button-primary");
                startButton.setStyle(
                                "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit';");

                inputFileButton = new Button("Upload Recording");
                inputFileButton.setPrefWidth(220);
                inputFileButton.getStyleClass().add("button-secondary");
                inputFileButton.setStyle(
                                "-fx-background-color: #334155; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit';");

                doneButton = new Button("Analyze Results");
                doneButton.setPrefWidth(300);
                doneButton.getStyleClass().add("button-success");
                doneButton.setStyle(
                                "-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: 800; -fx-font-size: 20; -fx-background-radius: 14; -fx-padding: 18 36; -fx-font-family: 'Outfit';");

                userButton = new Button("User Setup");
                userButton.setPrefWidth(220);
                userButton.getStyleClass().add("button-primary");
                userButton.setStyle(
                                "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit';");

                profButton = new Button("Pro Source");
                profButton.setPrefWidth(220);
                profButton.getStyleClass().add("button-primary");
                profButton.setStyle(
                                "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit';");

                backButton = new Button("Back to Menu");
                backButton.setPrefWidth(200);
                backButton.getStyleClass().add("button-secondary");
                backButton.setStyle(
                                "-fx-background-color: #334155; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit';");

                // Event Handlers
                DanceInstructorUIController controller = new DanceInstructorUIController(primaryStage, startButton,
                                inputFileButton, doneButton, userButton, profButton, backButton);

                // Layouts

                HBox buttonBox = new HBox(25, userButton, profButton);
                buttonBox.setAlignment(Pos.CENTER);

                mainCard.getChildren().addAll(headerBox, buttonBox, doneButton);
                cardWrapper.getChildren().add(mainCard);

                mainLayout.setCenter(cardWrapper);

                mainScene = new Scene(mainLayout, 1100, 850);
                if (getClass().getResource("/style.css") != null) {
                        mainScene.getStylesheets().add(getClass().getResource("/style.css").toExternalForm());
                }

                controller.setMainScene(mainScene);

                // Set up the stage
                primaryStage.setTitle("Motion AI - Advanced Analysis");
                primaryStage.setScene(mainScene);
                primaryStage.show();
        }

        public static void main(String[] args) {
                launch(args);

        }
}