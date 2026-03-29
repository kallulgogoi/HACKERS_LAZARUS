import pandas as pd
import numpy as np
import os

input_folder = "../data/raw"
output_folder = "../data/cleaned"

os.makedirs(output_folder, exist_ok=True)

# Caesar Cipher Decryption
def caesar_decrypt(text, shift=3):
    result = ""
    for char in str(text):
        if char.isalpha():
            result += chr((ord(char.upper()) - shift - 65) % 26 + 65)
        else:
            result += char
    return result


# Cleaning function
def clean_data(df):
    print("Cleaning dataset...")

    # Remove duplicates
    df = df.drop_duplicates()

    # Convert HEX values to decimal (for telemetry logs)
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                df[col] = df[col].apply(lambda x: int(x, 16))
            except:
                pass

    # Convert time column to datetime
    for col in df.columns:
        if "time" in col.lower() or "date" in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df = df.sort_values(by=col)

    # Handle missing numeric values using interpolation
    numeric_cols = df.select_dtypes(include=np.number).columns
    df[numeric_cols] = df[numeric_cols].interpolate(method='linear')

    # Remove anomalies (mean ± 2*std)
    for col in numeric_cols:
        mean = df[col].mean()
        std = df[col].std()
        df = df[(df[col] > mean - 2*std) & (df[col] < mean + 2*std)]

    # Identity resolution (patient_id mod 2)
    for col in df.columns:
        if "patient_id" in col.lower():
            df["identity_group"] = df[col] % 2

    # Decrypt medication names (Caesar cipher)
    for col in df.columns:
        if "med" in col.lower() or "drug" in col.lower():
            df[col] = df[col].apply(lambda x: caesar_decrypt(x))

    return df


# Process all CSV files
for file in os.listdir(input_folder):
    if file.endswith(".csv"):
        print("Processing:", file)

        file_path = os.path.join(input_folder, file)
        df = pd.read_csv(file_path)

        cleaned_df = clean_data(df)

        output_path = os.path.join(output_folder, "cleaned_" + file)
        cleaned_df.to_csv(output_path, index=False)

print("All Lazarus datasets cleaned successfully.")