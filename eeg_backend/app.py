import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import torch
import numpy as np 
import pyedflib
import h5py
from scipy.signal import resample  # For resampling EEG signals if needed

# Import your model, prediction function, device and sample frequency constants
from eeg_predictor import EEGNet3D_LSTM, predict_eeg_file_from_app, DEVICE, SFREQ

app = Flask(__name__)

# Directory to temporarily save uploaded EEG files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Path to the pretrained model weights
MODEL_PATH = "best_eegnet.pth" 

# Load the model once at startup
loaded_model = EEGNet3D_LSTM(num_classes=3).to(DEVICE)
try:
    loaded_model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    loaded_model.eval()  # Set model to evaluation mode
    print(f"✅ Model loaded successfully from {MODEL_PATH}!")
except FileNotFoundError:
    print(f"❌ Model file not found at {MODEL_PATH}. Please place it in the correct directory.")
    exit()  # Stop the app if model file is missing
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# Prediction endpoint which also returns raw EEG data along with prediction
@app.route('/predict_eeg', methods=['POST'])
def predict_eeg_endpoint():
    # Check if the file part is included in the POST request
    if 'eeg_file' not in request.files:
        return jsonify({"status": "error", "message": "No file part in the request"}), 400

    file = request.files['eeg_file']

    # Validate that a file was selected
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    # Secure filename and save the file temporarily
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        # Read raw EEG data from the uploaded file (EDF or H5)
        if filename.lower().endswith('.edf'):
            f = pyedflib.EdfReader(filepath)
            n_channels_in_file = f.signals_in_file
            signal_labels = f.getSignalLabels()

            # Use up to first 23 channels
            num_channels_to_use = min(23, n_channels_in_file)
            channels = signal_labels[:num_channels_to_use]
            target_num_samples = 1024  # Number of samples per channel to extract

            eeg_data_list = []
            for i in range(num_channels_to_use):
                sig_raw = f.readSignal(i)
                current_sfreq = f.getSampleFrequency(i)

                # Resample signal if sampling frequency differs from target SFREQ
                if current_sfreq != SFREQ:
                    new_num_samples = int(len(sig_raw) * (SFREQ / current_sfreq))
                    sig_processed = resample(sig_raw, new_num_samples)
                else:
                    sig_processed = sig_raw

                # Ensure signal length matches target by trimming or zero-padding
                if len(sig_processed) >= target_num_samples:
                    eeg_data_list.append(sig_processed[:target_num_samples])
                else:
                    padded_sig = np.pad(sig_processed, (0, target_num_samples - len(sig_processed)), 'constant')
                    eeg_data_list.append(padded_sig)

            f.close()
            eeg_data = np.array(eeg_data_list)

        elif filename.lower().endswith('.h5'):
            with h5py.File(filepath, 'r') as f:
                eeg_data = f['eeg_data'][:]
                channels = [ch.decode('utf-8') for ch in f['channels'][:]]
                # Handle different EEG data shapes
                if eeg_data.ndim == 3:  # Shape (1, channels, samples)
                    eeg_data = eeg_data[0, :23, :1024]
                else:  # Already (channels, samples)
                    eeg_data = eeg_data[:23, :1024]
        else:
            return jsonify({"status": "error", "message": "Unsupported file format"}), 400

        # Run prediction on the saved file using your model
        predicted_label, class_probabilities_dict, error_message = predict_eeg_file_from_app(loaded_model, filepath)

        # Convert numpy.float32 values in probabilities dict to native Python floats for JSON serialization
        if class_probabilities_dict:
            for key, value in class_probabilities_dict.items():
                if isinstance(value, np.float32):
                    class_probabilities_dict[key] = float(value)

        # Remove the temporary EEG file after processing
        os.remove(filepath)

        # Compose the response containing prediction, probabilities, and raw EEG data
        if error_message:
            return jsonify({
                "status": "error",
                "message": error_message,
                "prediction": predicted_label,
                "probabilities": class_probabilities_dict,
                "channels": channels,
                "eeg_data": eeg_data.tolist()
            }), 500
        else:
            return jsonify({
                "status": "success",
                "prediction": predicted_label,
                "probabilities": class_probabilities_dict,
                "channels": channels,
                "eeg_data": eeg_data.tolist()
            }), 200

    except Exception as e:
        # Clean up file if an exception occurs
        if os.path.exists(filepath):
            os.remove(filepath)
        # Return error message in JSON response
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    # Run Flask app accessible on all network interfaces, port 5000, debug enabled
    app.run(host='0.0.0.0', port=5100, debug=True)
