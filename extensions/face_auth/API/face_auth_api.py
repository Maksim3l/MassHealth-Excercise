# app.py
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from io import BytesIO
import base64
from PIL import Image
import os
from tensorflow.keras.layers import Layer


app = Flask(__name__)

class L1Dist(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super().__init__()

    def call(self, input_embedding, validation_embedding):
        return tf.math.abs(input_embedding - validation_embedding)

class EuclideanDistance(Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def call(self, inputs):
        anchor, comparison = inputs
        return tf.sqrt(tf.reduce_sum(tf.square(anchor - comparison), axis=-1, keepdims=True))

class ContrastiveLoss(tf.keras.losses.Loss):
    def __init__(self, margin=1.0, **kwargs):
        super().__init__(**kwargs)
        self.margin = margin
    
    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32) 
        loss = y_true * tf.square(y_pred) + \
               (1 - y_true) * tf.square(tf.maximum(0.0, self.margin - y_pred))
        return tf.reduce_mean(loss)

class Cast(Layer):
    def __init__(self, dtype=tf.float32, **kwargs):
        super(Cast, self).__init__(**kwargs)
        self.dtype_to_cast = dtype

    def call(self, inputs):
        return tf.cast(inputs, self.dtype_to_cast)

MODEL_PATH = 'models/face_verification.h5'

model = None

def load_model():
    global model
    try:
        custom_objects = {
            'L1Dist': L1Dist,
            'EuclideanDistance': EuclideanDistance,
            'ContrastiveLoss': ContrastiveLoss,
            'Cast': Cast,
            'BinaryCrossentropy': tf.losses.BinaryCrossentropy,
            'cast': tf.cast, 
            'l2_normalize': tf.nn.l2_normalize,
        }
        
        with tf.keras.utils.custom_object_scope(custom_objects):
            model = load_model(model_path, compile=False)
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise e

def preprocess_image(image_data):
    """Preprocess image data to match training format"""
    try:
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_data))
        image = image.convert('RGB')
        img_array = np.array(image)
        img_resized = cv2.resize(img_array, (100, 100))
        img_normalized = img_resized / 255.0
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        return img_batch
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })

@app.route('/compare', methods=['POST'])
def compare_faces():
    try:
        data = request.get_json()
        
        if not data or 'image1' not in data or 'image2' not in data:
            return jsonify({
                "error": "Missing required fields: image1, image2"
            }), 400

        img1 = preprocess_image(data['image1'])
        img2 = preprocess_image(data['image2'])
        similarity_score = model.predict([img1, img2])[0][0]
        threshold = data.get('threshold', 0.5)
        is_match = float(similarity_score) > threshold
        
        return jsonify({
            "similarity_score": float(similarity_score),
            "is_match": is_match,
            "threshold": threshold,
            "confidence": "high" if abs(similarity_score - 0.5) > 0.3 else "medium" if abs(similarity_score - 0.5) > 0.1 else "low"
        })
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/batch_compare', methods=['POST'])
def batch_compare():
    try:
        data = request.get_json()
        
        if not data or 'pairs' not in data:
            return jsonify({
                "error": "Missing required field: pairs (array of {image1, image2} objects)"
            }), 400
        
        results = []
        threshold = data.get('threshold', 0.5)
        
        for i, pair in enumerate(data['pairs']):
            if 'image1' not in pair or 'image2' not in pair:
                results.append({
                    "pair_index": i,
                    "error": "Missing image1 or image2 in pair"
                })
                continue
            
            try:
                img1 = preprocess_image(pair['image1'])
                img2 = preprocess_image(pair['image2'])
                
                similarity_score = model.predict([img1, img2])[0][0]
                is_match = float(similarity_score) > threshold
                
                results.append({
                    "pair_index": i,
                    "similarity_score": float(similarity_score),
                    "is_match": is_match,
                    "confidence": "high" if abs(similarity_score - 0.5) > 0.3 else "medium" if abs(similarity_score - 0.5) > 0.1 else "low"
                })
                
            except Exception as e:
                results.append({
                    "pair_index": i,
                    "error": str(e)
                })
        
        return jsonify({
            "results": results,
            "threshold": threshold,
            "total_pairs": len(data['pairs'])
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=5000, debug=False)