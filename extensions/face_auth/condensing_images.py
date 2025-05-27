import os
import random
import shutil
import argparse
from pathlib import Path
import sys

def get_image_files(folder_path):
    """
    Get all image files from a folder
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    image_files = []
    
    for file_path in Path(folder_path).iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            image_files.append(file_path)
    
    return image_files

def sample_images(input_folder, output_folder, num_images=None, min_images=100, max_images=200):
    """
    Randomly sample images from input folder and copy to output folder
    
    Args:
        input_folder: Path to folder containing all images
        output_folder: Path to output folder for sampled images
        num_images: Exact number of images to sample (if None, random between min_images and max_images)
        min_images: Minimum number of images to sample
        max_images: Maximum number of images to sample
    """
    
    # Get all image files
    print(f"Scanning folder: {input_folder}")
    image_files = get_image_files(input_folder)
    
    if not image_files:
        print("No image files found in the input folder!")
        return
    
    print(f"Found {len(image_files)} image files")
    
    # Determine number of images to sample
    if num_images is None:
        # Random number between min and max
        target_count = random.randint(min_images, min(max_images, len(image_files)))
    else:
        target_count = min(num_images, len(image_files))
    
    print(f"Sampling {target_count} images...")
    
    # Randomly sample images
    sampled_images = random.sample(image_files, target_count)
    
    # Create output directory
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Copy sampled images
    copied_count = 0
    failed_count = 0
    
    for i, image_path in enumerate(sampled_images):
        try:
            # Create new filename with sequential numbering
            new_filename = f"img_{i+1:03d}{image_path.suffix}"
            output_file_path = output_path / new_filename
            
            # Copy file
            shutil.copy2(image_path, output_file_path)
            copied_count += 1
            
            if copied_count % 20 == 0:
                print(f"Copied {copied_count}/{target_count} images...")
                
        except Exception as e:
            print(f"Failed to copy {image_path}: {e}")
            failed_count += 1
    
    print(f"\nSampling completed!")
    print(f"Successfully copied: {copied_count} images")
    print(f"Failed to copy: {failed_count} images")
    print(f"Output folder: {output_folder}")
    
    return copied_count

def sample_multiple_folders(base_input_folder, base_output_folder, num_images=None, min_images=100, max_images=200):
    """
    Sample images from multiple subfolders (useful for multiple people)
    
    Args:
        base_input_folder: Path to folder containing subfolders for each person
        base_output_folder: Path to output folder structure
        num_images: Exact number of images to sample per person
        min_images: Minimum number of images to sample per person
        max_images: Maximum number of images to sample per person
    """
    
    base_input_path = Path(base_input_folder)
    base_output_path = Path(base_output_folder)
    
    if not base_input_path.exists():
        print(f"Input folder {base_input_folder} does not exist!")
        return
    
    # Get all subdirectories
    subdirs = [d for d in base_input_path.iterdir() if d.is_dir()]
    
    if not subdirs:
        print("No subdirectories found. Processing as single folder...")
        sample_images(base_input_folder, base_output_folder, num_images, min_images, max_images)
        return
    
    print(f"Found {len(subdirs)} person folders: {[d.name for d in subdirs]}")
    
    total_sampled = 0
    
    for person_folder in subdirs:
        person_name = person_folder.name
        input_person_folder = base_input_path / person_name
        output_person_folder = base_output_path / person_name
        
        print(f"\n--- Processing {person_name} ---")
        
        sampled_count = sample_images(
            input_person_folder, 
            output_person_folder, 
            num_images, 
            min_images, 
            max_images
        )
        
        total_sampled += sampled_count
    
    print(f"\n=== SUMMARY ===")
    print(f"Total images sampled across all people: {total_sampled}")
    print(f"Output base folder: {base_output_folder}")

def main():
    parser = argparse.ArgumentParser(description="Randomly sample images from a folder for face recognition training")
    
    parser.add_argument("input_folder", 
                       help="Path to input folder containing images")
    
    parser.add_argument("output_folder", 
                       help="Path to output folder for sampled images")
    
    parser.add_argument("--num_images", "-n", 
                       type=int, 
                       help="Exact number of images to sample (if not specified, random between min and max)")
    
    parser.add_argument("--min_images", 
                       type=int, 
                       default=100, 
                       help="Minimum number of images to sample (default: 100)")
    
    parser.add_argument("--max_images", 
                       type=int, 
                       default=200, 
                       help="Maximum number of images to sample (default: 200)")
    
    parser.add_argument("--multiple_people", "-m", 
                       action="store_true", 
                       help="Process multiple subfolders (one per person)")
    
    parser.add_argument("--seed", 
                       type=int, 
                       help="Random seed for reproducible sampling")
    
    args = parser.parse_args()
    
    # Set random seed if provided
    if args.seed:
        random.seed(args.seed)
        print(f"Using random seed: {args.seed}")
    
    # Validate arguments
    if args.min_images > args.max_images:
        print("Error: min_images cannot be greater than max_images")
        sys.exit(1)
    
    if args.num_images and (args.num_images < 1):
        print("Error: num_images must be positive")
        sys.exit(1)
    
    # Check if input folder exists
    if not os.path.exists(args.input_folder):
        print(f"Error: Input folder '{args.input_folder}' does not exist")
        sys.exit(1)
    
    print("=== Image Sampling Script ===")
    print(f"Input folder: {args.input_folder}")
    print(f"Output folder: {args.output_folder}")
    
    if args.num_images:
        print(f"Target images: {args.num_images}")
    else:
        print(f"Target images: {args.min_images}-{args.max_images} (random)")
    
    print()
    
    # Process images
    if args.multiple_people:
        sample_multiple_folders(
            args.input_folder, 
            args.output_folder, 
            args.num_images, 
            args.min_images, 
            args.max_images
        )
    else:
        sample_images(
            args.input_folder, 
            args.output_folder, 
            args.num_images, 
            args.min_images, 
            args.max_images
        )

# Quick function for simple usage without command line
def quick_sample(input_folder, output_folder, target_images=150):
    """
    Quick function to sample images without command line arguments
    
    Usage:
        quick_sample("/path/to/700/images", "/path/to/output", 150)
    """
    print(f"Quick sampling {target_images} images...")
    sample_images(input_folder, output_folder, num_images=target_images)

if __name__ == "__main__":
    quick_sample(
        input_folder="./indep_data/loknar",
        output_folder="./indep_data/loknar/sample",
        target_images=150
    )
    
    main()