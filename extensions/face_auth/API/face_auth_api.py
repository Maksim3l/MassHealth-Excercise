from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import numpy as np
from io import BytesIO
import base64
from PIL import Image
import os
import requests
from supabase import create_client, Client
from torchvision import transforms
from facenet_pytorch import InceptionResnetV1
from typing import List, Dict, Any, Optional

app = Flask(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'http://localhost:8000')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q')

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print(f"✅ Supabase client initialized: {SUPABASE_URL}")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    supabase = None

class RealVGGFace2Model(nn.Module):
    def __init__(self, num_classes, pretrained='vggface2'):
        super(RealVGGFace2Model, self).__init__()
        self.backbone = InceptionResnetV1(pretrained=pretrained)
        feature_dim = 512

        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

        for param in self.backbone.parameters():
            param.requires_grad = False
    
    def forward(self, x):
        features = self.backbone(x)
        output = self.classifier(features)
        return output
    
    def get_embeddings(self, x):
        with torch.no_grad():
            embeddings = self.backbone(x)
        return embeddings
    
    def unfreeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = True

MODEL_PATH = '/app/models/face_ver_v3.pth'
model = None
class_names = None
device = None

def get_vggface2_transforms():
    transform = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    ])
    return transform

def load_vggface2_model(model_path=MODEL_PATH):
    global device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    try:
        print(f"Loading model from: {model_path}")
        checkpoint = torch.load(model_path, map_location=device)
        
        num_classes = checkpoint['num_classes']
        class_names = checkpoint['class_names']
        
        model = RealVGGFace2Model(num_classes=num_classes, pretrained='vggface2')
        model.load_state_dict(checkpoint['model_state_dict'])
        model.to(device)
        model.eval()
        
        print(f"✅ Model loaded successfully!")
        print(f"   - Classes: {num_classes}")
        print(f"   - Class names: {class_names}")
        print(f"   - Device: {device}")
        
        return model, class_names
        
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return None, None

def download_image_from_supabase(bucket_name: str, file_path: str) -> Optional[bytes]:
    try:
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
        response = supabase.storage.from_(bucket_name).download(file_path)
        return response
    except Exception as e:
        print(f"❌ Error downloading image from Supabase: {e}")
        return None

def list_files_in_supabase_folder(bucket_name: str, folder_path: str) -> List[str]:
    """List all files in a Supabase storage folder"""
    try:
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
        # List files in the folder
        response = supabase.storage.from_(bucket_name).list(folder_path)
        
        # Filter for image files and sort by name
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        image_files = []
        
        for file_info in response:
            if isinstance(file_info, dict) and 'name' in file_info:
                filename = file_info['name']
                # Check if it's a file (not a folder) and has image extension
                if '.' in filename:
                    ext = '.' + filename.split('.')[-1].lower()
                    if ext in image_extensions:
                        image_files.append(filename)
        
        # Sort files to ensure consistent ordering
        image_files.sort()
        return image_files
        
    except Exception as e:
        print(f"❌ Error listing files in Supabase folder: {e}")
        return []

def preprocess_image_from_data(image_data):
    try:
        if isinstance(image_data, str):
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            image_data = base64.b64decode(image_data)
        
        image = Image.open(BytesIO(image_data)).convert('RGB')
        transform = get_vggface2_transforms()
        img_tensor = transform(image).unsqueeze(0)
        
        return img_tensor
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {e}")

def verify_faces_vggface2(model, img1_data, img2_data, threshold=0.6):
    try:
        global device
        
        img1_tensor = preprocess_image_from_data(img1_data).to(device)
        img2_tensor = preprocess_image_from_data(img2_data).to(device)
        
        with torch.no_grad():
            emb1 = model.get_embeddings(img1_tensor)
            emb2 = model.get_embeddings(img2_tensor)
            
            similarity = torch.nn.functional.cosine_similarity(emb1, emb2).item()
            
            is_match = similarity > threshold
            
            confidence_distance = abs(similarity - threshold)
            if confidence_distance > 0.3:
                confidence = 'High'
            elif confidence_distance > 0.1:
                confidence = 'Medium'
            else:
                confidence = 'Low'
        
        return {
            'similarity_score': float(similarity),
            'is_match': bool(is_match),
            'confidence': confidence
        }
        
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return None

def get_user_images_from_supabase(user_id: str, provided_images: List[str], min_images: int = 4, max_images: int = 10) -> Dict[str, Any]:
    """
    Get verification images from user's folder in Supabase storage.
    Takes the first min_images to max_images found in the folder.
    """
    try:
        bucket_name = "images"
        user_folder = f"{user_id}"
        
        # List all image files in the user's folder
        image_files = list_files_in_supabase_folder(bucket_name, user_folder)
        
        if not image_files:
            return {"error": f"No image files found in folder: {user_folder}"}
        
        # Take between min_images and max_images
        if len(image_files) < min_images:
            return {"error": f"Not enough verification images found. Found {len(image_files)}, need at least {min_images}"}
        
        # Select the first max_images files
        selected_files = image_files[:max_images]
        
        verify_images = {}
        successful_downloads = 0
        
        for filename in selected_files:
            file_path = f"{user_folder}/{filename}"
            image_data = download_image_from_supabase(bucket_name, file_path)
            if image_data:
                verify_images[filename] = image_data
                successful_downloads += 1
            else:
                print(f"⚠️ Failed to download {file_path}")
        
        if successful_downloads < min_images:
            return {"error": f"Could not download enough verification images. Downloaded {successful_downloads}, need at least {min_images}"}
        
        print(f"✅ Successfully loaded {successful_downloads} verification images for user {user_id}")
        print(f"   Files: {list(verify_images.keys())}")
        
        return {
            "verify_images": verify_images,
            "total_files_found": len(image_files),
            "files_used": list(verify_images.keys())
        }
        
    except Exception as e:
        print(f"❌ Error getting user images: {e}")
        return {"error": str(e)}

def initialize_model():
    global model, class_names
    print("Initializing VGG-Face2 model...")
    print(f"Looking for model at: {MODEL_PATH}")
    
    model, class_names = load_vggface2_model()
    
    if model is not None:
        print("✅ Model initialization complete!")
        print(f"Model type: VGG-Face2 (PyTorch)")
        print(f"Available classes: {len(class_names) if class_names else 'Unknown'}")
    else:
        print("❌ Failed to initialize model")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "model_type": "VGG-Face2 (PyTorch)",
        "pytorch_version": torch.__version__,
        "device": str(device) if device else "Not initialized",
        "working_directory": os.getcwd(),
        "port": os.environ.get('PORT', 9002),
        "supabase_connected": supabase is not None,
        "supabase_url": SUPABASE_URL,
        "classes": len(class_names) if class_names else 0
    })

@app.route('/verify_user', methods=['POST'])
def verify_user():
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
        threshold = data.get('threshold', 0.6)
        min_verification_images = data.get('min_verification_images', 4)
        max_verification_images = data.get('max_verification_images', 10)
        
        if len(provided_images) == 0:
            return jsonify({"error": "No images provided"}), 400
        
        if len(provided_images) > 10:
            return jsonify({"error": "Maximum 10 images allowed"}), 400
        
        result = get_user_images_from_supabase(user_id, provided_images, min_verification_images, max_verification_images)
        if "error" in result:
            return jsonify(result), 404
        
        verify_images = result["verify_images"]
        
        comparisons = []
        matches_found = 0
        
        for i, provided_img in enumerate(provided_images):
            image_matches = []
            best_match_score = 0
            
            for verify_filename, verify_img_data in verify_images.items():
                try:
                    comparison_result = verify_faces_vggface2(model, provided_img, verify_img_data, threshold)
                    if comparison_result:
                        is_match = comparison_result['is_match']
                        score = comparison_result['similarity_score']
                        
                        image_matches.append({
                            "verification_image": verify_filename,
                            "similarity_score": score,
                            "is_match": is_match,
                            "confidence": comparison_result['confidence']
                        })
                        
                        if is_match and score > best_match_score:
                            best_match_score = score
                
                except Exception as e:
                    print(f"Error comparing with {verify_filename}: {e}")
            
            has_match = any(match['is_match'] for match in image_matches)
            if has_match:
                matches_found += 1
            
            comparisons.append({
                "provided_image_index": i,
                "matches": image_matches,
                "has_match": has_match,
                "best_score": best_match_score
            })
        
        verification_passed = matches_found > 0
        match_percentage = (matches_found / len(provided_images)) * 100
        
        return jsonify({
            "user_id": user_id,
            "verification_passed": verification_passed,
            "images_matched": matches_found,
            "total_images_provided": len(provided_images),
            "match_percentage": round(match_percentage, 2),
            "threshold": threshold,
            "model_type": "VGG-Face2",
            "detailed_comparisons": comparisons,
            "verification_images_found": len(verify_images),
            "verification_files_used": result.get("files_used", []),
            "total_files_in_folder": result.get("total_files_found", 0)
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/compare', methods=['POST'])
def compare_faces():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        
        if not data or 'image1' not in data or 'image2' not in data:
            return jsonify({"error": "Missing required fields: image1, image2"}), 400

        threshold = data.get('threshold', 0.6)
        result = verify_faces_vggface2(model, data['image1'], data['image2'], threshold)
        
        if result is None:
            return jsonify({"error": "Failed to process images"}), 500
        
        return jsonify({
            "match": result['is_match'],
            "similarity_score": result['similarity_score'],
            "threshold": threshold,
            "confidence": result['confidence'].lower(),
            "model_type": "VGG-Face2"
        })
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/batch_compare', methods=['POST'])
def batch_compare():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503
            
        data = request.get_json()
        
        if not data or 'pairs' not in data:
            return jsonify({
                "error": "Missing required field: pairs (array of {image1, image2} objects)"
            }), 400
        
        results = []
        threshold = data.get('threshold', 0.6)
        
        for i, pair in enumerate(data['pairs']):
            if 'image1' not in pair or 'image2' not in pair:
                results.append({
                    "pair_index": i,
                    "match": False,
                    "error": "Missing image1 or image2 in pair"
                })
                continue
            
            try:
                result = verify_faces_vggface2(model, pair['image1'], pair['image2'], threshold)
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
        
        match_results = [result.get('match', False) for result in results]
        
        return jsonify({
            "matches": match_results,
            "detailed_results": results,
            "threshold": threshold,
            "model_type": "VGG-Face2",
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
        total_params = sum(p.numel() for p in model.parameters())
        trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
        
        return jsonify({
            "model_loaded": True,
            "model_type": "VGG-Face2 (PyTorch)",
            "total_parameters": int(total_params),
            "trainable_parameters": int(trainable_params),
            "input_size": "160x160x3",
            "embedding_size": 512,
            "num_classes": len(class_names) if class_names else 0,
            "class_names": class_names if class_names else [],
            "device": str(device),
            "similarity_metric": "Cosine Similarity",
            "default_threshold": 0.6
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