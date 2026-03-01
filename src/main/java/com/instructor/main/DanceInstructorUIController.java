package com.instructor.main;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.instructor.algorithms.DynamicTimeWarping;
import com.instructor.controller.ApplicationHandler;
import com.instructor.evaluation.PoseFeedback;
import com.instructor.evaluation.PoseScoring;

import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.TextField;
import javafx.scene.control.ScrollPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

public class DanceInstructorUIController {
	private Button startButton;
	private Button inputButton;
	private Button doneButton;
	private Stage primaryStage;
	private Button userButton;
	private Button profButton;
	private Button backButton;
	private Scene mainScene;

	public static Map<String, Map<Integer, float[]>> userKeypointsMap = new HashMap<>();
	public static Map<String, Map<Integer, float[]>> proKeypointsMap = new HashMap<>();
	private PoseFeedback poseFeedback = new PoseFeedback();
	private PoseScoring poseScoring = new PoseScoring();
	public static boolean isUserInput = false;
	public static boolean isProInput = false;
	private boolean isPartChosen = false;

	public DanceInstructorUIController(Stage primaryStage, Button startButton, Button inputButton, Button doneButton,
			Button userButton, Button profButton, Button backButton) {
		this.startButton = startButton;
		this.inputButton = inputButton;
		this.doneButton = doneButton;
		this.primaryStage = primaryStage;
		this.userButton = userButton;
		this.profButton = profButton;
		this.backButton = backButton;

		setupEventHandlers();
	}

	// Set up button event handlers
	private void setupEventHandlers() {

		doneButton.setOnAction(event -> {

			if (isUserInput && isProInput) {
				showOption();
			} else {
				if (!isUserInput && !isProInput) {
					// Show alert to input missing file
					showError("Input Missing", "Please input a user video and a professional video.");
				} else if (!isUserInput) {
					// Show alert to input missing file
					showError("Input Missing", "Please input a user video.");
				} else if (!isProInput) {
					// Show alert to input missing file
					showError("Input Missing", "Please input a professional video.");
				}
			}
		});

		// Set up button event handlers for user
		userButton.setOnAction(event -> handleUserButton());
		// Set up button event handlers for pro
		profButton.setOnAction(event -> handleProfButton());

		backButton.setOnAction(event -> {
			showMainScreen();
		});
	}

	/**
	 * Handles the event when the user button is pressed.
	 * Arranges the buttons in an HBox, sets up the action for the input button
	 * to open the file chooser for user input, reads user keypoints from "User.txt"
	 * file, and sets the scene with the arranged buttons.
	 */
	private void handleUserButton() {
		VBox layout = new VBox(40);
		layout.setAlignment(Pos.CENTER);
		layout.setStyle("-fx-background-color: #0f172a;");
		layout.setPadding(new Insets(50));

		VBox card = new VBox(30);
		card.setAlignment(Pos.CENTER);
		card.setMaxWidth(800);
		card.setStyle(
				"-fx-background-color: rgba(30, 41, 59, 0.5); -fx-background-radius: 24; -fx-padding: 60; -fx-border-color: rgba(255,255,255,0.1); -fx-border-radius: 24;");

		Label title = new Label("Refining Your Input");
		title.setStyle("-fx-text-fill: white; -fx-font-family: 'Outfit'; -fx-font-size: 32; -fx-font-weight: 800;");

		Label subtitle = new Label("Choose how you want to provide your movement data for analysis.");
		subtitle.setStyle("-fx-text-fill: #94a3b8; -fx-font-family: 'Outfit'; -fx-font-size: 16;");

		HBox buttonBox = new HBox(25, startButton, inputButton, backButton);
		buttonBox.setAlignment(Pos.CENTER);

		// Re-style buttons to be consistent
		String primaryStyle = "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit'; -fx-cursor: hand;";
		String secondaryStyle = "-fx-background-color: #334155; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit'; -fx-cursor: hand;";

		startButton.setStyle(primaryStyle);
		inputButton.setStyle(primaryStyle);
		backButton.setStyle(secondaryStyle);

		card.getChildren().addAll(title, subtitle, buttonBox);
		layout.getChildren().add(card);

		startButton.setOnAction(event -> startVideoCapture(primaryStage, "beginner"));
		inputButton.setOnAction(e -> openFileChooser(primaryStage, "beginner"));

		Scene scene = new Scene(layout, 1100, 850);
		if (getClass().getResource("/style.css") != null) {
			scene.getStylesheets().add(getClass().getResource("/style.css").toExternalForm());
		}
		primaryStage.setScene(scene);
	}

	/**
	 * Handles the event when the professional button is pressed.
	 * Arranges the input and back buttons in an HBox, sets up the action for
	 * the input button to open the file chooser for professional input,
	 * reads professional keypoints from "Pro.txt" file, and sets the scene
	 * with the arranged buttons.
	 */
	private void handleProfButton() {
		VBox layout = new VBox(40);
		layout.setAlignment(Pos.CENTER);
		layout.setStyle("-fx-background-color: #0f172a;");
		layout.setPadding(new Insets(50));

		VBox card = new VBox(30);
		card.setAlignment(Pos.CENTER);
		card.setMaxWidth(800);
		card.setStyle(
				"-fx-background-color: rgba(30, 41, 59, 0.5); -fx-background-radius: 24; -fx-padding: 60; -fx-border-color: rgba(255,255,255,0.1); -fx-border-radius: 24;");

		Label title = new Label("Reference Professional Setup");
		title.setStyle("-fx-text-fill: white; -fx-font-family: 'Outfit'; -fx-font-size: 32; -fx-font-weight: 800;");

		Label subtitle = new Label("Import a professional recording to use as the standard for comparison.");
		subtitle.setStyle("-fx-text-fill: #94a3b8; -fx-font-family: 'Outfit'; -fx-font-size: 16;");

		HBox buttonBox = new HBox(25, startButton, inputButton, backButton);
		buttonBox.setAlignment(Pos.CENTER);

		// Re-style buttons to be consistent
		String primaryStyle = "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit'; -fx-cursor: hand;";
		String secondaryStyle = "-fx-background-color: #334155; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 12; -fx-padding: 15 30; -fx-font-family: 'Outfit'; -fx-cursor: hand;";

		startButton.setStyle(primaryStyle);
		inputButton.setStyle(primaryStyle);
		backButton.setStyle(secondaryStyle);

		card.getChildren().addAll(title, subtitle, buttonBox);
		layout.getChildren().add(card);

		startButton.setOnAction(event -> startVideoCapture(primaryStage, "pro"));
		inputButton.setOnAction(e -> openFileChooser(primaryStage, "pro"));

		Scene scene = new Scene(layout, 1100, 850);
		if (getClass().getResource("/style.css") != null) {
			scene.getStylesheets().add(getClass().getResource("/style.css").toExternalForm());
		}
		primaryStage.setScene(scene);
	}

	/**
	 * Starts the video capture process if it has not started yet.
	 * 
	 * If the recording has already started, it will not do anything.
	 * 
	 * @see #stopVideoCapture()
	 */
	private void startVideoCapture(Stage stage, String videoType) {
		ApplicationHandler handler = new ApplicationHandler();
		new Thread(() -> {
			handler.runCapturePoseEstimation(videoType);
		}).start();
	}

	/**
	 * Opens a FileChooser and allows the user to select a file to upload to the
	 * application. Currently, only .mp4 files are supported.
	 * 
	 * @param stage The stage to open the FileChooser on
	 */
	private void openFileChooser(Stage stage, String videoType) {

		// Create a FileChooser
		FileChooser fileChooser = new FileChooser();

		// Allow all file types
		fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("All Files", "*.*"));

		// Open the file chooser and get the selected file
		File selectedFile = fileChooser.showOpenDialog(primaryStage);

		ApplicationHandler handler = new ApplicationHandler();
		if (selectedFile != null) {
			String fileName = selectedFile.getName().toLowerCase();
			if (fileName.endsWith(".mp4") || fileName.endsWith(".avi") || fileName.endsWith(".mov")) {
				new Thread(() -> {
					handler.runAWSPoseEstimation(selectedFile.getPath(), videoType);
				}).start();
			} else {
				System.out.println("The selected file is invalid. Please upload a .mp4 or .avi file.");
				Platform.runLater(
						() -> showError("Invalid File", "Please upload a supported video file (.mp4, .avi, .mov)."));
			}
		} else {
			System.out.println("The selected file is invalid. Please upload a .mp4 file.");
		}

	}

	/**
	 * Displays a new scene with a label and a back button.
	 * 
	 * The label displays the string "Feedback:".
	 * The back button displays the string "Back" and when clicked, sets the scene
	 * back to the main scene.
	 * 
	 * @param stage The stage to set the new scene on
	 */
	private void showFeedbackScreen(Stage stage, String userInput) {
		// Show ProgressBar
		showProgressBar(stage);

		// Run processing in a separate thread
		new Thread(() -> {
			try {
				// Calculate initial insufficiency based on total DTW
				float similarityScore = DynamicTimeWarping.totalDtw(userKeypointsMap, proKeypointsMap);
				boolean initialCheck = (similarityScore == Float.MAX_VALUE);

				// Generate prompt and check for specific part errors
				String initialPrompt = initialCheck ? ""
						: poseScoring.generateComparisonPrompt(userKeypointsMap, proKeypointsMap, userInput);

				// Re-evaluate insufficiency based on the specific part being analyzed
				final boolean isDataInsufficient = initialCheck || (initialPrompt == null
						|| initialPrompt.trim().isEmpty() || initialPrompt.startsWith("ERROR:"));
				final String prompt = initialPrompt != null ? initialPrompt : "";

				float maxSimilarity = 1.5f;
				final int finalScore = isDataInsufficient ? 0
						: poseScoring.calculateScore(similarityScore, maxSimilarity);

				ApplicationHandler handler = new ApplicationHandler();
				final String aiAnalysis = handler.generateFeedbackAPI(prompt);

				Platform.runLater(() -> {
					// Main layout for feedback
					VBox feedbackLayout = new VBox(30);
					feedbackLayout.setPadding(new Insets(40));
					feedbackLayout.setAlignment(Pos.TOP_LEFT);
					feedbackLayout.setStyle("-fx-background-color: #0f172a;");

					VBox contentCard = new VBox(25);
					contentCard.setStyle(
							"-fx-background-color: rgba(30, 41, 59, 0.5); -fx-background-radius: 20; -fx-padding: 30; -fx-border-color: rgba(255,255,255,0.1); -fx-border-radius: 20;");

					// Section: Header
					Label headerLabel = new Label("Analysis Results");
					headerLabel.setStyle(
							"-fx-text-fill: white; -fx-font-family: 'Outfit'; -fx-font-size: 42; -fx-font-weight: 800;");

					// Section: Final Score
					VBox scoreBox = new VBox(5);
					Label scoreHeader = new Label("OVERALL ACCURACY");
					scoreHeader.setStyle(
							"-fx-text-fill: #94a3b8; -fx-font-family: 'Outfit'; -fx-font-size: 16; -fx-font-weight: bold; -fx-letter-spacing: 1;");

					Label scoreLabel = new Label(isDataInsufficient ? "N/A" : finalScore + "%");
					String scoreColor = isDataInsufficient ? "#94a3b8"
							: (finalScore > 80 ? "#10b981" : (finalScore > 50 ? "#3b82f6" : "#ef4444"));
					scoreLabel.setStyle("-fx-text-fill: " + scoreColor
							+ "; -fx-font-family: 'Outfit'; -fx-font-size: 64; -fx-font-weight: 900;");
					scoreBox.getChildren().addAll(scoreHeader, scoreLabel);

					// Section: AI Narrative Breakdown
					VBox aiFeedbackBox = new VBox(15);
					aiFeedbackBox.setStyle("-fx-background-color: transparent;");

					Label aiTitle = new Label("AI POSTURE INSIGHTS");
					aiTitle.setStyle(
							"-fx-text-fill: #3b82f6; -fx-font-family: 'Outfit'; -fx-font-size: 16; -fx-font-weight: bold; -fx-letter-spacing: 1.5;");
					aiFeedbackBox.getChildren().add(aiTitle);

					// Parse the wall of text into styled blocks
					String[] feedbackPoints = aiAnalysis.split("\n");
					for (String point : feedbackPoints) {
						if (point.trim().isEmpty())
							continue;

						HBox pointCard = new HBox(15);
						pointCard.setAlignment(Pos.TOP_LEFT);
						pointCard.setStyle(
								"-fx-background-color: rgba(15, 23, 42, 0.4); -fx-padding: 22; -fx-background-radius: 12; -fx-border-color: rgba(59, 130, 246, 0.1); -fx-border-radius: 12;");

						Label indicator = new Label("◆");
						indicator.setStyle("-fx-text-fill: #3b82f6; -fx-font-size: 14;");

						Label text = new Label(point.trim().replaceAll("^[-* ]+", ""));
						text.setWrapText(true);
						text.setMaxWidth(750);
						text.setStyle(
								"-fx-text-fill: #f1f5f9; -fx-font-family: 'Outfit'; -fx-font-size: 18; -fx-line-spacing: 6;");

						pointCard.getChildren().addAll(indicator, text);
						aiFeedbackBox.getChildren().add(pointCard);
					}

					// Section: Keypoint Comparison Data
					VBox dataBox = new VBox(10);
					Label dataTitle = new Label("COMPARISON DATA (TECH DETAILS)");
					dataTitle.setStyle(
							"-fx-text-fill: #94a3b8; -fx-font-family: 'Outfit'; -fx-font-size: 16; -fx-font-weight: bold; -fx-letter-spacing: 1;");

					Label comparisonLabel = new Label(prompt);
					comparisonLabel.setWrapText(true);
					comparisonLabel.setMaxWidth(800);
					comparisonLabel.setStyle(
							"-fx-text-fill: #cbd5e1; -fx-font-family: 'JetBrains Mono'; -fx-font-size: 14; -fx-background-color: #020617; -fx-padding: 20; -fx-background-radius: 8;");
					dataBox.getChildren().addAll(dataTitle, comparisonLabel);

					Button returnButton = new Button("New Analysis");
					returnButton.setStyle(
							"-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-family: 'Outfit'; -fx-font-weight: bold; -fx-padding: 12 24; -fx-background-radius: 10;");
					returnButton.setOnAction(e -> {
						isPartChosen = false;
						showMainScreen();
					});

					contentCard.getChildren().addAll(scoreBox, aiFeedbackBox, dataBox, returnButton);
					feedbackLayout.getChildren().addAll(headerLabel, contentCard);

					ScrollPane scrollPane = new ScrollPane(feedbackLayout);
					scrollPane.setFitToWidth(true);
					scrollPane.setVvalue(0.0); // Ensure it starts from the top
					scrollPane.setStyle(
							"-fx-background: #0f172a; -fx-background-color: #0f172a; -fx-border-color: transparent;");

					Scene feedbackScene = new Scene(scrollPane, 1100, 850);
					if (getClass().getResource("/style.css") != null) {
						feedbackScene.getStylesheets().add(getClass().getResource("/style.css").toExternalForm());
					}
					stage.setScene(feedbackScene);

					// Force scroll to top again after layout is done
					Platform.runLater(() -> scrollPane.setVvalue(0.0));

					stage.centerOnScreen();
				});
			} catch (Exception e) {
				e.printStackTrace();
				Platform.runLater(() -> showError("Analysis Error", "Failed to generate feedback: " + e.getMessage()));
			}
		}).start();
	}

	/**
	 * Displays a loading screen with a progress bar on the given stage.
	 * 
	 * @param stage The stage on which to set the loading scene.
	 */
	private void showProgressBar(Stage stage) {
		// Show loading screen with progress bar
		ProgressBar progressBar = new ProgressBar();
		progressBar.setPrefWidth(400);
		progressBar.setPrefHeight(20);

		progressBar.setStyle(
				"-fx-accent: #3b82f6;" + // Vibrant blue
						"-fx-control-inner-background: #1e293b;" + // Dark background
						"-fx-background-color: transparent;" + // Transparent wrapper
						"-fx-background-radius: 10px;" +
						"-fx-border-radius: 10px;");

		Label loadingLabel = new Label("Analyzing your flow...");
		loadingLabel.setStyle(
				"-fx-text-fill: #ffffff; -fx-font-family: 'Outfit'; -fx-font-size: 32px; -fx-font-weight: 800;");

		VBox loadingLayout = new VBox(30, loadingLabel, progressBar);
		loadingLayout.setAlignment(Pos.CENTER);
		loadingLayout.setStyle("-fx-background-color: linear-gradient(to bottom right, #1a1a2e, #16213e);");

		Scene loadingScene = new Scene(loadingLayout, 1100, 850); // Match app size
		stage.setScene(loadingScene);
		stage.centerOnScreen();
	}

	/**
	 * Displays the main scene on the primary stage.
	 */
	private void showMainScreen() {

		primaryStage.setScene(mainScene);
	}

	/**
	 * Sets the main scene for the application to the given scene.
	 * 
	 * @param scene The main scene for the application.
	 */
	public void setMainScene(Scene scene) {
		this.mainScene = scene;
	}

	/**
	 * Shows an option screen with a list of valid body parts and a text input
	 * field.
	 * The user can input a body part, and the application will show a feedback
	 * screen
	 * with the corresponding feedback for the input body part.
	 */
	private void showOption() {

		// Define valid body parts
		List<String> validBodyParts = List.of(
				"shoulder_left", "shoulder_right",
				"elbow_left", "elbow_right",
				"wrist_left", "wrist_right",
				"hip_left", "hip_right",
				"knee_left", "knee_right",
				"ankle_left", "ankle_right",
				"heel_left", "heel_right",
				"foot_index_left", "foot_index_right",
				"nose");

		// Create layout with padding and alignment
		VBox optionLayout = new VBox(20);
		optionLayout.setAlignment(Pos.CENTER);
		optionLayout.setPadding(new Insets(30));
		optionLayout.setStyle("-fx-background-color: linear-gradient(to bottom right, #1a1a2e, #16213e);");

		// Style the available options label to improve readability
		Label availableOptionsLabel = new Label("Select Body Part for Feedback:");
		availableOptionsLabel.setStyle(
				"-fx-text-fill: #ffffff; -fx-font-family: 'Segoe UI', sans-serif; -fx-font-size: 22px; -fx-font-weight: bold;");

		// List body parts in a scrollable area for better user experience
		ListView<String> bodyPartsListView = new ListView<>();
		bodyPartsListView.getItems().addAll(validBodyParts);
		bodyPartsListView.setPrefHeight(400);

		// Add a custom style to match the layout
		bodyPartsListView.setStyle(
				"-fx-control-inner-background: #1e293b; " +
						"-fx-text-fill: white; " +
						"-fx-background-color: #334155; " +
						"-fx-background-radius: 8px; " +
						"-fx-border-color: #475569; " +
						"-fx-border-radius: 8px; " +
						"-fx-font-family: 'Segoe UI'; " +
						"-fx-font-size: 16px; " +
						"-fx-padding: 5px;");

		// Label for the text input prompt
		Label label = new Label("Refine your target:");
		label.setStyle("-fx-text-fill: #a0aec0; -fx-font-family: 'Segoe UI', sans-serif; -fx-font-size: 16px;");

		// TextField for user input with styling
		TextField textField = new TextField();
		textField.setPromptText("e.g. shoulder_left");
		textField.setPrefHeight(40);
		textField.setStyle(
				"-fx-background-color: #1e293b; -fx-text-fill: white; -fx-prompt-text-fill: #64748b; -fx-font-family: 'Segoe UI'; -fx-font-size: 16px; -fx-background-radius: 8px; -fx-border-color: #475569; -fx-border-radius: 8px;");

		// Submit button with styling
		Button button = new Button("Analyze Body Part");
		button.setPrefWidth(250);
		String btnBase = "-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-family: 'Segoe UI', sans-serif; -fx-font-size: 18px; -fx-font-weight: bold; -fx-background-radius: 8px; -fx-padding: 12px 24px; -fx-cursor: hand; -fx-effect: dropshadow(three-pass-box, rgba(16, 185, 129, 0.4), 10, 0, 0, 4);";
		String btnHover = "-fx-background-color: #059669; -fx-text-fill: white; -fx-font-family: 'Segoe UI', sans-serif; -fx-font-size: 18px; -fx-font-weight: bold; -fx-background-radius: 8px; -fx-padding: 12px 24px; -fx-cursor: hand; -fx-effect: dropshadow(three-pass-box, rgba(5, 150, 105, 0.6), 12, 0, 0, 6);";
		button.setStyle(btnBase);
		button.setOnMouseEntered(e -> button.setStyle(btnHover));
		button.setOnMouseExited(e -> button.setStyle(btnBase));

		// Select body part on double click
		bodyPartsListView.setOnMouseClicked(event -> {
			if (event.getClickCount() == 2) {
				String selectedPart = bodyPartsListView.getSelectionModel().getSelectedItem();
				textField.setText(selectedPart);
			}
		});

		// Add elements to the layout
		optionLayout.getChildren().addAll(availableOptionsLabel, bodyPartsListView, label, textField, button);

		// Create a new stage
		Stage stage = new Stage();

		// Set button action to submit the input
		button.setOnAction(event -> {
			String userInput = textField.getText().trim(); // Get trimmed input
			isPartChosen = true;

			if (poseScoring.isPartNeeded(userInput) && isPartChosen) {
				stage.close();
				showFeedbackScreen(primaryStage, userInput); // Show feedback with the user input if valid
			} else {
				// Show error if the input is invalid
				showError("Invalid input!", "Please select a valid body part.");
			}
		});

		// Set up and show the scene
		Scene scene = new Scene(optionLayout, 600, 750);
		stage.setScene(scene);
		stage.show();
	}

	/**
	 * Shows an error dialog with the given title and message.
	 * 
	 * @param title   The title of the error dialog.
	 * @param message The message of the error dialog.
	 */
	private void showError(String title, String message) {
		Alert alert = new Alert(Alert.AlertType.ERROR);
		alert.setTitle(title);
		alert.setHeaderText(message);
		alert.showAndWait();
	}

}
