from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from io import BytesIO
import base64
from PIL import Image
import os
import requests
from supabase import create_client, Client
from tensorflow.keras.layers import Layer
from tensorflow.keras.models import load_model
import itertools
from typing import List, Dict, Any, Optional

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
app = Flask(__name__)

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'http://localhost:8000')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q')

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print(f"✅ Supabase client initialized: {SUPABASE_URL}")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    supabase = None

class L1Dist(Layer):
    def __init__(self, **kwargs):
        super().__init__()

    def call(self, input_embedding, validation_embedding):
        return tf.math.abs(input_embedding - validation_embedding)

class ContrastiveLoss(tf.keras.losses.Loss):
    def __init__(self, margin=1.0, **kwargs):
        super().__init__(**kwargs)
        self.margin = margin
    
    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32) 
        loss = y_true * tf.square(y_pred) + \
               (1 - y_true) * tf.square(tf.maximum(0.0, self.margin - y_pred))
        return tf.reduce_mean(loss)

class EuclideanDistance(Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def call(self, inputs):
        anchor, comparison = inputs
        return tf.sqrt(tf.reduce_sum(tf.square(anchor - comparison), axis=-1, keepdims=True))

class Cast(Layer):
    def __init__(self, dtype=tf.float32, **kwargs):
        super(Cast, self).__init__(**kwargs)
        self.dtype_to_cast = dtype

    def call(self, inputs):
        return tf.cast(inputs, self.dtype_to_cast)

MODEL_PATH = '/app/models/face_verification_v2.h5'
model = None

def load_face_verification_model(model_path=MODEL_PATH):
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

        return model
    except Exception as e:
        print(f"❌ Error loading model with Method 1: {str(e)}")
        
        try:
            print("Trying alternative loading method...")
            tf.keras.utils.get_custom_objects()['L1Dist'] = L1Dist
            tf.keras.utils.get_custom_objects()['BinaryCrossentropy'] = tf.losses.BinaryCrossentropy
            
            model = tf.keras.models.load_model(model_path)
            print(f"Model loaded successfully (alternative method)")
            return model
        except Exception as e2:
            print(f"❌ Error loading model with alternative method: {str(e2)}")
            return None

def download_image_from_supabase(bucket_name: str, file_path: str) -> Optional[bytes]:
    """Download image from Supabase storage"""
    try:
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
        # Download file from storage
        response = supabase.storage.from_(bucket_name).download(file_path)
        return response
    except Exception as e:
        print(f"❌ Error downloading image from Supabase: {e}")
        return None

def preprocess_image_from_data(image_data):
    try:
        if isinstance(image_data, str):
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            image_data = base64.b64decode(image_data)
        
        image = Image.open(BytesIO(image_data))
        image = image.convert('RGB')
        img_array = np.array(image)
        img = tf.convert_to_tensor(img_array, dtype=tf.float32)
        img = tf.image.resize(img, (100, 100))
        img = img / 255.0
        return img
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {e}")

def verify_faces_api(model, img1_data, img2_data, threshold=0.5):
    try:
        img1 = preprocess_image_from_data(img1_data)
        img2 = preprocess_image_from_data(img2_data)
        img1 = tf.expand_dims(img1, axis=0)
        img2 = tf.expand_dims(img2, axis=0)
        prediction = model.predict([img1, img2], verbose=0)
        similarity_score = prediction[0][0]
        is_match = similarity_score > threshold
        
        return {
            'similarity_score': float(similarity_score),
            'is_match': bool(is_match),
            'confidence': 'High' if abs(similarity_score - 0.5) > 0.3 else 'Medium' if abs(similarity_score - 0.5) > 0.1 else 'Low'
        }
        
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return None

def get_user_images_from_supabase(user_id: str, provided_images: List[str]) -> Dict[str, Any]:
    """Get user images from Supabase storage and compare with provided images"""
    try:
        bucket_name = "images"
        user_folder = f"{user_id}"
        
        # Download verify images (1.jpg to 10.jpg)
        verify_images = {}
        for i in range(1, 11):
            file_path = f"{user_folder}/verify{i}.jpg"
            image_data = download_image_from_supabase(bucket_name, file_path)
            if image_data:
                verify_images[f"verify{i}"] = image_data
        
        if not verify_images:
            return {"error": "No verification images found in Supabase storage"}
        
        print(f"✅ Found {len(verify_images)} verification images for user {user_id}")
        return {"verify_images": verify_images}
        
    except Exception as e:
        print(f"❌ Error getting user images: {e}")
        return {"error": str(e)}

def initialize_model():
    global model
    print("Initializing face verification model...")
    print(f"Looking for model at: {MODEL_PATH}")
    model = load_face_verification_model()
    if model is not None:
        print("Model initialization complete!")
        print("Model summary:")
        try:
            model.summary()
        except Exception as e:
            print(f"Could not display model summary: {e}")
    else:
        print("❌ Failed to initialize model")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "tensorflow_version": tf.__version__,
        "working_directory": os.getcwd(),
        "port": os.environ.get('PORT', 9002),
        "supabase_connected": supabase is not None,
        "supabase_url": SUPABASE_URL
    })

@app.route('/verify_user', methods=['POST'])
def verify_user():
    """
    Verify user-provided images against stored verification images in Supabase.
    Expects: {"userId": "string", "images": ["base64_image1", "base64_image2", ...]}
    aka:
    {
        "userId": "user123",
        "images": ["base64_image1", "base64_image2", ...],
        "threshold": 0.5
    }
    """
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        if supabase is None:
            return jsonify({"error": "Supabase not connected"}), 503
        
        data = request.get_json()
        
        if not data or 'userId' not in data or 'images' not in data:
            return jsonify({"error": "Missing required fields: userId, images"}), 400
        
        user_id = data['userId']
        provided_images = data['images']
        threshold = data.get('threshold', 0.5)
        
        if len(provided_images) == 0:
            return jsonify({"error": "No images provided"}), 400
        
        if len(provided_images) > 10:
            return jsonify({"error": "Maximum 10 images allowed"}), 400
        
        # Get verification images from Supabase
        result = get_user_images_from_supabase(user_id, provided_images)
        if "error" in result:
            return jsonify(result), 404
        
        verify_images = result["verify_images"]
        
        # Compare each provided image against all verification images
        comparisons = []
        matches_found = 0
        
        for i, provided_img in enumerate(provided_images):
            image_matches = []
            best_match_score = 0
            
            for verify_name, verify_img_data in verify_images.items():
                try:
                    comparison_result = verify_faces_api(model, provided_img, verify_img_data, threshold)
                    if comparison_result:
                        is_match = comparison_result['is_match']
                        score = comparison_result['similarity_score']
                        
                        image_matches.append({
                            "verification_image": verify_name,
                            "similarity_score": score,
                            "is_match": is_match,
                            "confidence": comparison_result['confidence']
                        })
                        
                        if is_match and score > best_match_score:
                            best_match_score = score
                
                except Exception as e:
                    print(f"Error comparing with {verify_name}: {e}")
            
            # Determine if this provided image has any matches
            has_match = any(match['is_match'] for match in image_matches)
            if has_match:
                matches_found += 1
            
            comparisons.append({
                "provided_image_index": i,
                "matches": image_matches,
                "has_match": has_match,
                "best_score": best_match_score
            })
        
        # Overall verification result
        verification_passed = matches_found > 0
        match_percentage = (matches_found / len(provided_images)) * 100
        
        return jsonify({
            "user_id": user_id,
            "verification_passed": verification_passed,
            "images_matched": matches_found,
            "total_images_provided": len(provided_images),
            "match_percentage": round(match_percentage, 2),
            "threshold": threshold,
            "detailed_comparisons": comparisons,
            "verification_images_found": len(verify_images)
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/compare', methods=['POST'])
def compare_faces():
    """
    Compare two images and return similarity result.
    Expects: {"image1": "base64_image", "image2": "base64_image", "threshold": 0.5}
    Returns: true/false for match
    aka:
    {
        "image1": "base64_image",
        "image2": "base64_image", 
        "threshold": 0.5
    }
    """
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        
        if not data or 'image1' not in data or 'image2' not in data:
            return jsonify({"error": "Missing required fields: image1, image2"}), 400

        threshold = data.get('threshold', 0.5)
        result = verify_faces_api(model, data['image1'], data['image2'], threshold)
        
        if result is None:
            return jsonify({"error": "Failed to process images"}), 500
        
        # Return simple true/false as requested
        return jsonify({
            "match": result['is_match'],
            "similarity_score": result['similarity_score'],
            "threshold": threshold,
            "confidence": result['confidence'].lower()
        })
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/batch_compare', methods=['POST'])
def batch_compare():
    """
    Compare multiple pairs of images.
    Expects: {"pairs": [{"image1": "base64", "image2": "base64"}, ...], "threshold": 0.5}
    Returns: array of true/false for each pair
    aka:
    {
      "pairs": [
        {"image1": "base64_img1", "image2": "base64_img2"},
        {"image1": "base64_img3", "image2": "base64_img4"}
      ],
      "threshold": 0.5
    }
    """
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503
            
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
                    "match": False,
                    "error": "Missing image1 or image2 in pair"
                })
                continue
            
            try:
                result = verify_faces_api(model, pair['image1'], pair['image2'], threshold)
                if result:
                    results.append({
                        "pair_index": i,
                        "match": result['is_match'],
                        "similarity_score": result['similarity_score'],
                        "confidence": result['confidence'].lower()
                    })
                else:
                    results.append({
                        "pair_index": i,
                        "match": False,
                        "error": "Failed to process this pair"
                    })
            except Exception as e:
                results.append({
                    "pair_index": i,
                    "match": False,
                    "error": str(e)
                })
        
        # Create simple boolean array as requested
        match_results = []
        for result in results:
            match_results.append(result.get('match', False))
        
        return jsonify({
            "matches": match_results,  # Simple array of true/false
            "detailed_results": results,  # Detailed results for debugging
            "threshold": threshold,
            "total_pairs": len(data['pairs']),
            "successful_pairs": len([r for r in results if 'error' not in r])
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    if model is None:
        return jsonify({
            "error": "Model not loaded"
        }), 503
    
    try:
        total_params = model.count_params()
        
        return jsonify({
            "model_loaded": True,
            "total_parameters": int(total_params),
            "input_shape": str(model.input_shape) if hasattr(model, 'input_shape') else "Multiple inputs",
            "output_shape": str(model.output_shape) if hasattr(model, 'output_shape') else "Unknown",
            "model_layers": len(model.layers)
        })
    except Exception as e:
        return jsonify({
            "error": f"Error getting model info: {str(e)}"
        }), 500

if __name__ == '__main__':
    initialize_model()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 9002)),
        debug=False
    )