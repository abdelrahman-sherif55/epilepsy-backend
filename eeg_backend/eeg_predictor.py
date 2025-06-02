import os
import re
import h5py
import pandas as pd
import numpy as np
import pyedflib
from pyedflib import highlevel
import torch
from scipy.signal import stft
from scipy import signal
import warnings
import mne
import time
from collections import Counter
import torch.nn as nn
import torch.nn.functional as F
import shutil
from concurrent.futures import ThreadPoolExecutor

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

# --- Global Configurations ---
# Define the device for PyTorch (GPU if available, else CPU)
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {DEVICE}")

# Define EEG channel prefixes for initial filtering
EEG_PREFIXES = ('F', 'P', 'FP', 'C', 'O', 'T')

# Define the standard set of 23 EEG channels required by the model
# This order is CRUCIAL for the model's input consistency
SET_1_CHANNELS = (
    'C3-P3', 'C4-P4', 'CZ-PZ', 'F3-C3', 'F4-C4', 'F7-T7', 'F8-T8',
    'FP1-F3', 'FP1-F7', 'FP2-F4', 'FP2-F8', 'FT10-T8', 'FT9-FT10',
    'FZ-CZ', 'P3-O1', 'P4-O2', 'P7-O1', 'P7-T7', 'P8-O2', 'T7-FT9',
    'T7-P7', 'T8-P8-0', 'T8-P8-1'
)
SET_1 = set(SET_1_CHANNELS) # For quick lookup

# Sampling frequency and segment length (should match model's training)
SFREQ = 256 # Hz
SEGMENT_LENGTH_SECONDS = 4 # seconds
SEGMENT_DATA_POINTS = int(SFREQ * SEGMENT_LENGTH_SECONDS) # 1024 data points

# --- Reference channel set (Set 1) from the first snippet ---
# Load the list of non-EEG channels
try:
    with open("E:/Graduation Project/data/non_eeg_channels.txt", "r") as file:
        non_eeg_channels = {line.strip() for line in file}
    print("INFO: Loaded non_eeg_channels from file.")
except FileNotFoundError:
    non_eeg_channels = set()
    print("WARNING: 'non_eeg_channels.txt' not found. Channel filtering based on prefixes and SET_1_CHANNELS will still apply.")


# --- Helper Functions for EEG Processing Pipeline ---

def is_eeg_channel(ch_name):
    """
    Checks if a channel name starts with one of the defined EEG prefixes.
    """
    return any(ch_name.upper().startswith(prefix) for prefix in EEG_PREFIXES)

# Helper function to filter EEG channels (from first snippet)
def filter_eeg_channels(raw):
    """
    Filters out non-EEG channels from the raw data using the loaded non_eeg_channels.

    Args:
        raw (mne.io.Raw): The raw EEG data.

    Returns:
        mne.io.Raw: The raw data with only EEG channels.
    """
    if non_eeg_channels:
        eeg_channels = [ch for ch in raw.ch_names if ch not in non_eeg_channels]
        return raw.pick_channels(eeg_channels)
    else:
        print("INFO: No non-EEG channels loaded from file. Returning raw data without this specific filter.")
        return raw

def save_to_h5(raw_data, output_file, labels=None, segment_type=None):
    """
    Save EEG segment to HDF5 in format (1, C, T), ensuring 1024 timepoints.
    This function is adapted from the first snippet.

    :param raw_data: MNE Raw object
    :param output_file: Output path (.h5)
    :param labels: Optional label (e.g. 0 = pre-ictal, 1 = ictal, 2 = non-ictal)
    :param segment_type: Optional string to mark type (e.g. 'ictal')
    """
    eeg = raw_data.get_data()  # (channels, timepoints)

    # Transpose to shape (1, C, T)
    eeg = eeg[np.newaxis, :, :]  # (1, C, T)

    # Auto-fix timepoints: clip/pad to 1024
    T = eeg.shape[2]
    if T < 1024:
        padded = np.zeros((1, eeg.shape[1], 1024))
        padded[:, :, :T] = eeg
        eeg = padded
    else:
        eeg = eeg[:, :, :1024]

    with h5py.File(output_file, 'w') as f:
        f.create_dataset("eeg_data", data=eeg)
        f.create_dataset("times", data=raw_data.times[:1024])
        f.create_dataset("channels", data=np.array(raw_data.info['ch_names'], dtype='S'))

        if labels is not None:
            f.create_dataset("labels", data=np.array([labels], dtype=np.int32))

        if segment_type:
            f.attrs["segment_type"] = segment_type

        f.attrs["sampling_rate"] = raw_data.info['sfreq']

def convert_edf_to_h5_initial(edf_file_path, h5_output_path, sfreq=SFREQ):
    """
    Converts an EDF file to an initial H5 file format with raw EEG data.
    Downsamples if the original EDF sampling frequency is different.
    This function is from the second snippet.
    """
    try:
        raw = mne.io.read_raw_edf(edf_file_path, preload=True, verbose=False)
        print(f"DEBUG: Original EDF info - Channels: {raw.info['ch_names']}, SFreq: {raw.info['sfreq']}")
        
        # Ensure consistent sampling frequency with the model's training
        if raw.info['sfreq'] != sfreq:
            print(f"DEBUG: Resampling EEG from {raw.info['sfreq']}Hz to {sfreq}Hz...")
            raw.resample(sfreq=sfreq, verbose=False)
        
        eeg_data = raw.get_data(units='uV')
        ch_names = raw.ch_names
        print(f"DEBUG: Raw data shape after MNE read (uV): {eeg_data.shape}")
        print(f"DEBUG: Raw channel names from EDF: {ch_names}")

        with h5py.File(h5_output_path, 'w') as f:
            f.create_dataset("eeg_data", data=eeg_data[np.newaxis, :, :])
            f.create_dataset("channels", data=np.array([ch.encode('utf-8') for ch in ch_names]))
        
        print(f"DEBUG: Successfully converted EDF to initial H5: {os.path.basename(h5_output_path)} with shape {eeg_data[np.newaxis, :, :].shape}")
        return True
    except Exception as e:
        print(f"ERROR: Error converting EDF to H5 for {os.path.basename(edf_file_path)}: {e}")
        return False

def clean_and_standardize_h5_channels(file_path):
    """
    Cleans an H5 file by keeping only standard EEG channels and reordering them.
    This ensures input consistency for the model.
    Returns the cleaned and reordered EEG data array (1, 23, T) or None if critical channels are missing.
    This function is from the second snippet.
    """
    try:
        with h5py.File(file_path, 'r+') as f:
            ch_raw = f["channels"][:]
            ch_names = [ch.decode('utf-8') for ch in ch_raw]
            eeg_data_raw = f["eeg_data"][:]
            print(f"DEBUG: Raw data shape from H5: {eeg_data_raw.shape}, channels: {ch_names}")

            temp_eeg_channels_map = {ch: i for i, ch in enumerate(ch_names) if is_eeg_channel(ch)}
            
            reordered_indices_in_raw = []
            missing_channels = []
            for standard_ch in SET_1_CHANNELS:
                if standard_ch in temp_eeg_channels_map:
                    reordered_indices_in_raw.append(temp_eeg_channels_map[standard_ch])
                else:
                    missing_channels.append(standard_ch)
            
            if missing_channels:
                print(f"ERROR: Critical missing standard channels in {os.path.basename(file_path)}: {missing_channels}. Cannot proceed.")
                return None

            if len(reordered_indices_in_raw) != len(SET_1_CHANNELS):
                print(f"ERROR: Inconsistent number of standard channels ({len(reordered_indices_in_raw)} instead of {len(SET_1_CHANNELS)}) in file {os.path.basename(file_path)}. Cannot proceed.")
                return None

            eeg_data_filtered_and_reordered = eeg_data_raw[:, reordered_indices_in_raw, :]
            print(f"DEBUG: Shape after filtering and reordering channels: {eeg_data_filtered_and_reordered.shape}")

            # Overwrite data in the H5 file (this is a temporary file)
            del f["eeg_data"]
            del f["channels"]
            f.create_dataset("eeg_data", data=eeg_data_filtered_and_reordered)
            f.create_dataset("channels", data=np.array([ch.encode('utf-8') for ch in SET_1_CHANNELS]))

            print(f"DEBUG: Cleaned and standardized channels for {os.path.basename(file_path)}.")
            return f["eeg_data"][:]
    except Exception as e:
        print(f"ERROR: Error during channel cleaning/standardization for {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return None

def segment_eeg_data(eeg_data_array, sfreq=SFREQ, segment_length=SEGMENT_LENGTH_SECONDS):
    """
    Segments a single EEG data array (after channel cleaning) into fixed-length chunks.
    Expected input shape: (1, 23, total_time_points)
    Output: List of numpy arrays, each (1, 23, 1024)
    This function is from the second snippet.
    """
    if eeg_data_array.shape[0] != 1 or eeg_data_array.shape[1] != len(SET_1_CHANNELS):
        print(f"ERROR: Unexpected input shape for segmentation: {eeg_data_array.shape}. Expected (1, {len(SET_1_CHANNELS)}, {SEGMENT_DATA_POINTS}).")
        return []

    total_time_points = eeg_data_array.shape[2]
    segment_points = int(segment_length * sfreq)

    segments = []
    for i in range(0, total_time_points, segment_points):
        if i + segment_points <= total_time_points:
            segment = eeg_data_array[:, :, i:i+segment_points]
            segments.append(segment)
            
    print(f"DEBUG: Extracted {len(segments)} segments of {segment_length} seconds each.")
    return segments

def process_file(file, folder_path, output_folder, segment_length, labels):
    """
    Process a single EEG file, divide it into segments of the specified length, and save each segment in an H5 file.
    This function is directly from the first snippet.

    :param file: The name of the EEG file to process.
    :param folder_path: The directory where the original EEG file is located.
    :param output_folder: The directory where the segmented H5 files will be saved.
    :param segment_length: The length of each segment in seconds.
    :param labels: Optional labels to be applied to all segments.
    """
    try:
        start_time = time.time()

        file_path = os.path.join(folder_path, file)

        raw = mne.io.read_raw_edf(file_path, preload=True)
        
        raw = filter_eeg_channels(raw)

        duration = raw.times[-1] - raw.times[0]

        num_segments = int(duration // segment_length)

        remainder = duration % segment_length

        for i in range(num_segments):
            start_time_segment = i * segment_length
            end_time_segment = (i + 1) * segment_length

            segment_data = raw.copy().crop(start_time_segment, end_time_segment)

            segment_filename = f"{file[:-4]}_segment_{i+1}.h5"
            output_file_path = os.path.join(output_folder, segment_filename)

            save_to_h5(segment_data, output_file_path, labels=labels)

        print(f"✅ Processed {file}, {num_segments} segments saved.")

        if remainder > 0:
            print(f"⚠️ Ignored remainder of {remainder:.2f} seconds for file {file}.")

        end_time = time.time()
        execution_time = end_time - start_time
        print(f"⏱️ Time taken to process {file}: {execution_time:.2f} seconds.")
        print("\n")

    except Exception as e:
        print(f"❌ Error processing {file}: {e}")

def clean_files(folder):
    """
    Function to check and fix files (from first snippet).
    Filters and removes/trims H5 files based on SET_1_CHANNELS.
    """
    kept = 0
    removed = 0
    fixed = 0

    for file in os.listdir(folder):
        if not file.endswith(".h5"):
            continue

        file_path = os.path.join(folder, file)
        try:
            with h5py.File(file_path, 'r') as f:
                ch_raw = f["channels"][:]
                ch_names = [ch.decode('utf-8') for ch in ch_raw]
                eeg_channels = [ch for ch in ch_names if ch in SET_1]

            if len(eeg_channels) < len(SET_1_CHANNELS):
                os.remove(file_path)
                print(f"❌ Removed {file} — only {len(eeg_channels)} valid EEG channels")
                removed += 1

            elif len(ch_names) == len(SET_1_CHANNELS):
                if set(ch_names) == SET_1:
                    print(f"✅ {file} already contains exactly {len(SET_1_CHANNELS)} valid channels")
                    kept += 1
                else:
                    os.remove(file_path)
                    print(f"❌ Removed {file} — {len(SET_1_CHANNELS)} channels, but mismatch in content")
                    removed += 1

            elif len(ch_names) > len(SET_1_CHANNELS):
                if SET_1.issubset(set(ch_names)):
                    with h5py.File(file_path, 'r+') as f:
                        keep_indices = [i for i, ch in enumerate(ch_names) if ch in SET_1_CHANNELS]
                        new_data = f["eeg_data"][:, keep_indices, :]
                        new_channels = [ch_names[i] for i in keep_indices]

                        del f["eeg_data"]
                        del f["channels"]
                        f.create_dataset("eeg_data", data=new_data)
                        f.create_dataset("channels", data=np.array([ch.encode('utf-8') for ch in new_channels]))

                    print(f"✂️ Trimmed {file} — reduced to {len(SET_1_CHANNELS)} valid channels")
                    fixed += 1
                else:
                    os.remove(file_path)
                    print(f"❌ Removed {file} — too many channels and doesn't include required {len(SET_1_CHANNELS)}")
                    removed += 1

        except Exception as e:
            print(f"⚠️ Error processing {file}: {e}")

    print(f"\n📊 Summary:\n✅ Kept: {kept}\n✂️ Fixed: {fixed}\n❌ Removed: {removed}")

def extract_stft_features_for_segment(eeg_segment, fs=SFREQ):
    """
    Applies STFT to a single EEG segment to extract time-frequency features.
    Parameters:
    - eeg_segment: numpy array of shape (1, 23, 1024)
    - fs: sampling rate (default = 256Hz)
    Returns:
    - features: numpy array of shape (23, 65, 17)
    """
    assert eeg_segment.shape == (1, len(SET_1_CHANNELS), SEGMENT_DATA_POINTS), \
        f"ERROR: Invalid shape for STFT input. Expected (1, {len(SET_1_CHANNELS)}, {SEGMENT_DATA_POINTS}), got {eeg_segment.shape}"
    
    eeg_segment_2d = eeg_segment[0]
    print(f"DEBUG: eeg_segment_2d shape for STFT: {eeg_segment_2d.shape}")

    features = []
    for ch_data in eeg_segment_2d:
        f, t, Zxx = signal.stft(
            ch_data,
            fs=fs,
            nperseg=128,
            noverlap=64,
            window='hann',
            return_onesided=True,
            scaling='spectrum'
        )
        stft_mag = np.abs(Zxx)
        features.append(stft_mag)
    
    final_features_array = np.array(features)
    print(f"DEBUG: STFT features shape before return: {final_features_array.shape}")
    return final_features_array

def process_stft_folder(input_folder, output_folder, fs=SFREQ):
    """
    Apply STFT on all .h5 files in input_folder and save the output features to output_folder.
    Logs total time and average time per file.
    Parameters:
    - input_folder: path to the folder containing raw EEG .h5 files
    - output_folder: path to store the STFT feature .h5 files
    - fs: sampling rate (default 256Hz)
    """
    os.makedirs(output_folder, exist_ok=True)

    all_files = [f for f in os.listdir(input_folder) if f.endswith(".h5")]
    total_files = len(all_files)

    start_time = time.time()

    for idx, filename in enumerate(all_files, 1):
        file_path = os.path.join(input_folder, filename)
        out_path = os.path.join(output_folder, filename)

        try:
            with h5py.File(file_path, 'r') as f:
                eeg_data = f["eeg_data"][:]
                channels = f["channels"][:]
                label = f["labels"][:] if "labels" in f else None

            # Apply STFT
            stft_features = extract_stft_features_for_segment(eeg_data, fs=fs)

            # Save output
            with h5py.File(out_path, 'w') as out_f:
                out_f.create_dataset("features", data=stft_features)
                out_f.create_dataset("channels", data=channels)
                if label is not None:
                    out_f.create_dataset("labels", data=label)

            print(f"✅ [{idx}/{total_files}] Saved STFT features → {filename}")

        except Exception as e:
            print(f"❌ [{idx}/{total_files}] Failed {filename}: {e}")

    total_time = time.time() - start_time
    avg_time = total_time / total_files if total_files > 0 else 0

    print("\n⏱️ Execution Summary:")
    print(f"📦 Total files: {total_files}")
    print(f"🕐 Total time: {total_time:.2f} seconds")
    print(f"⚡ Average time per file: {avg_time:.2f} seconds")


# --- EEGNet3D_LSTM Model Definition ---
class EEGNet3D_LSTM(nn.Module):
    def __init__(self, num_classes=3): # Changed to 3 classes
        super(EEGNet3D_LSTM, self).__init__()

        # First convolutional block
        self.firstconv = nn.Sequential(
            nn.Conv3d(1, 8, kernel_size=(1, 65, 17), padding=(0, 32, 8), bias=False),
            nn.BatchNorm3d(8)
        )

        # Depthwise convolution block
        self.depthwiseConv = nn.Sequential(
            nn.Conv3d(8, 16, kernel_size=(len(SET_1_CHANNELS), 1, 1), groups=8, bias=False),
            nn.BatchNorm3d(16),
            nn.ELU(),
            nn.AvgPool3d(kernel_size=(1, 4, 2)),
            nn.Dropout(0.25)
        )
        
        # Separable convolution block
        self.separableConv = nn.Sequential(
            nn.Conv3d(16, 16, kernel_size=(1, 16, 5), padding=(0, 8, 2), bias=False),
            nn.BatchNorm3d(16),
            nn.ELU(),
            nn.AvgPool3d(kernel_size=(1, 4, 2)),
            nn.Dropout(0.25)
        )
        
        # Improved LSTM block
        self.lstm = nn.LSTM(
            input_size=16 * 4,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            dropout=0.3
        )

        # Final fully connected layer
        self.fc = nn.Linear(128, num_classes)

    def forward(self, x):
        print(f"DEBUG: Input shape to EEGNet3D_LSTM: {x.shape}")
        x = self.firstconv(x)
        print(f"DEBUG: Shape after firstconv: {x.shape}")

        x = self.depthwiseConv(x)
        print(f"DEBUG: Shape after depthwiseConv: {x.shape}")

        x = self.separableConv(x)
        print(f"DEBUG: Shape after separableConv: {x.shape}")

        x = x.squeeze(2)
        print(f"DEBUG: Shape after squeeze(2): {x.shape}")

        x = x.permute(0, 2, 3, 1)
        print(f"DEBUG: Shape after permute: {x.shape}")

        x = x.reshape(x.size(0), -1, 16 * 4)
        print(f"DEBUG: Shape before LSTM: {x.shape}")

        out, _ = self.lstm(x)
        print(f"DEBUG: Shape after LSTM: {out.shape}")

        out = out[:, -1, :]
        print(f"DEBUG: Shape after LSTM last timestep: {out.shape}")

        logits = self.fc(out)
        print(f"DEBUG: Shape of final logits: {logits.shape}")
        return logits
    
# --- Main Prediction Function for Flutter Integration ---

def predict_eeg_file_from_app(model, input_file_path):
    """
    Processes an EEG file (EDF or H5) from the Flutter app and makes predictions.
    This function encapsulates the entire preprocessing and prediction pipeline.
    
    Args:
        model (torch.nn.Module): The loaded EEGNet3D_LSTM model.
        input_file_path (str): The full path to the EEG file received from Flutter (can be .edf or .h5).
        
    Returns:
        tuple: (predicted_label_str, class_probabilities_dict, error_message_str)
                predicted_label_str: "Ictal", "Non-Ictal", "Pre-Ictal", "Uncertain", or "Unknown".
                class_probabilities_dict: A dictionary of probabilities for each class (e.g., {"Pre-ictal": 0.X, "Ictal": 0.Y, "Non-Ictal": 0.Z}).
                error_message_str: A string describing the error, or None if successful.
    """
    model.eval() # Set model to evaluation mode
    label_map = {0: "Pre-ictal", 1: "Ictal", 2: "Non-Ictal"} 
    
    temp_h5_path = "temp_eeg_file_for_prediction.h5"

    # --- New: Confidence Threshold ---
    CONFIDENCE_THRESHOLD = 0.2 # Adjust this value (e.g., 0.6 to 0.8) based on desired strictness

    try:
        # Step 1: Convert EDF to H5 if necessary, or copy H5 to a temp path
        if input_file_path.lower().endswith('.edf'):
            print(f"INFO: Processing {os.path.basename(input_file_path)} (EDF)")
            if not convert_edf_to_h5_initial(input_file_path, temp_h5_path, sfreq=SFREQ):
                return "Unknown", {k: 0.0 for k in label_map.values()}, "Failed to convert EDF to H5. Check file integrity or MNE installation."
            current_h5_path = temp_h5_path
        elif input_file_path.lower().endswith('.h5'):
            print(f"INFO: Processing {os.path.basename(input_file_path)} (H5)")
            shutil.copy(input_file_path, temp_h5_path)
            current_h5_path = temp_h5_path
        else:
            return "Unknown", {k: 0.0 for k in label_map.values()}, f"Unsupported file format for {os.path.basename(input_file_path)}. Please provide .edf or .h5 file."

        # Step 2: Clean and standardize channels
        cleaned_eeg_data = clean_and_standardize_h5_channels(current_h5_path)
        if cleaned_eeg_data is None:
            return "Unknown", {k: 0.0 for k in label_map.values()}, "Failed to standardize EEG channels. File might be missing critical channels."
        
        # Step 3: Segment the cleaned data
        eeg_segments = segment_eeg_data(cleaned_eeg_data, sfreq=SFREQ, segment_length=SEGMENT_LENGTH_SECONDS)
        if not eeg_segments:
            return "Unknown", {k: 0.0 for k in label_map.values()}, "No valid segments could be extracted from the EEG file. File might be too short or corrupted."
        
        print(f"INFO: Will process {len(eeg_segments)} segments for STFT feature extraction.")

        # Step 4: Apply STFT to each segment to extract features
        stft_processed_segments = []
        for i, segment in enumerate(eeg_segments):
            try:
                stft_features = extract_stft_features_for_segment(segment, fs=SFREQ)
                stft_processed_segments.append(stft_features)
            except AssertionError as e:
                print(f"WARNING: Skipping segment {i+1} due to STFT input shape mismatch: {e}")
                
        if not stft_processed_segments:
            return "Unknown", {k: 0.0 for k in label_map.values()}, "Failed to apply STFT to any segment. Data might be malformed after previous steps."
        
        print(f"INFO: STFT features extracted for {len(stft_processed_segments)} segments.")

        # Step 5: Make predictions for each segment and store *all* predicted IDs
        segment_predicted_ids = [] # Store predicted ID for each segment
        all_segment_probability_distributions = [] # To store [batch_size, num_classes] probabilities for each segment
        with torch.no_grad():
            for i, seg_features in enumerate(stft_processed_segments):
                seg_tensor = torch.tensor(seg_features, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(DEVICE)
                print(f"DEBUG: Segment {i} input tensor shape for model: {seg_tensor.shape}")

                output = model(seg_tensor)
                
                probabilities = F.softmax(output, dim=1) # Shape (1, num_classes)
                
                pred_id = probabilities.argmax(dim=1).item()
                segment_predicted_ids.append(pred_id) # Store the ID, not the probability
                all_segment_probability_distributions.append(probabilities.cpu().numpy())

                print(f"DEBUG: Segment {i} raw output: {output.cpu().numpy()}, Probabilities: {probabilities.cpu().numpy()}, Predicted ID: {pred_id} ({label_map.get(pred_id, 'Unknown')})")
        
        print(f"INFO: Made {len(segment_predicted_ids)} predictions for individual segments.")

        # Step 6: Aggregate segment predictions using Majority Voting and Confidence Thresholding
        if not segment_predicted_ids:
            return "Unknown", {k: 0.0 for k in label_map.values()}, "No individual segment predictions were generated."

        # 6a. Apply Majority Voting
        # Count occurrences of each predicted ID
        prediction_counts = Counter(segment_predicted_ids)
        print(f"DEBUG: Segment prediction counts: {prediction_counts}")

        # Find the most common predicted ID
        most_common_pred_id, count = prediction_counts.most_common(1)[0]
        
        # Calculate the proportion of segments that voted for the most common class
        majority_proportion = count / len(segment_predicted_ids)
        print(f"DEBUG: Most common ID: {most_common_pred_id}, Count: {count}, Proportion: {majority_proportion:.2f}")

        # Initial overall_predicted_label based on majority vote
        overall_predicted_label = label_map.get(most_common_pred_id, "Unknown")
        
        # 6b. Calculate average probabilities for output
        all_segment_probs_array = np.vstack([p.reshape(1, -1) for p in all_segment_probability_distributions])
        avg_class_probabilities = np.mean(all_segment_probs_array, axis=0)

        print("\n--- Diagnostic Information for Multi-Segment File ---")
        print(f"File: {os.path.basename(input_file_path)}")
        print(f"Total segments processed: {len(stft_processed_segments)}")
        print("Individual segment predictions (IDs):", segment_predicted_ids)
        print("Prediction Counts (ID: count):", prediction_counts)
        print(f"Average Class Probabilities (Order: {label_map[0]}, {label_map[1]}, {label_map[2]}):", avg_class_probabilities)
        print(f"Most common predicted ID (Majority Vote): {most_common_pred_id} ({label_map.get(most_common_pred_id, 'Unknown')})")
        print(f"Majority Proportion: {majority_proportion:.2f}")
        print("--- End Diagnostic Information ---\n")

        class_probabilities_dict = {}
        sorted_labels = [label_map[i] for i in sorted(label_map.keys())]
        for i, class_name in enumerate(sorted_labels):
            class_probabilities_dict[class_name] = round(avg_class_probabilities[i] * 100, 2)
        
        # 6c. Apply Confidence Threshold
        # Get the probability of the *majority voted* class from the average probabilities
        majority_class_avg_prob = avg_class_probabilities[most_common_pred_id]
        
        if majority_class_avg_prob < CONFIDENCE_THRESHOLD:
            overall_predicted_label = "Uncertain" # Or "Unknown"
            print(f"INFO: Prediction flagged as 'Uncertain' due to low confidence ({majority_class_avg_prob:.2f} < {CONFIDENCE_THRESHOLD}).")
        else:
            print(f"INFO: Overall predicted label (Majority Vote): {overall_predicted_label}")
        
        print(f"INFO: Average class probabilities (percentages): {class_probabilities_dict}")

        return overall_predicted_label, class_probabilities_dict, None

    except Exception as e:
        print(f"CRITICAL ERROR in predict_eeg_file_from_app: {e}")
        import traceback
        traceback.print_exc()
        return "Unknown", {k: 0.0 for k in label_map.values()}, f"An unexpected error occurred during prediction: {str(e)}"