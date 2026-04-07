from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np, os
from config import MODEL_PATH, DATASET_PATH
from utils.preprocess import preprocess_image

app = Flask(__name__)
model = load_model(MODEL_PATH)
class_names = sorted(os.listdir(DATASET_PATH))

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files['image']
    img = Image.open(file).convert("RGB")
    img = preprocess_image(img)
    pred = model.predict(img)
    idx = int(np.argmax(pred))
    conf = float(np.max(pred))
    return jsonify({"class": class_names[idx], "confidence": conf})

if __name__ == "__main__":
    app.run(debug=True)
