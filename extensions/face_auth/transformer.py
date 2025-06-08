class CustomTransforms:
    def __init__(self):
        pass
    
    @staticmethod
    def resize(image, size=(160, 160)):
        if isinstance(image, np.ndarray):
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            pil_img = Image.fromarray(image)
            resized = pil_img.resize(size, Image.LANCZOS)
            return np.array(resized)
        elif isinstance(image, Image.Image):
            return image.resize(size, Image.LANCZOS)
        return image
    
    @staticmethod
    def random_horizontal_flip(image, p=0.5):
        if random.random() < p:
            if isinstance(image, np.ndarray):
                return np.fliplr(image)
            elif isinstance(image, Image.Image):
                return image.transpose(Image.FLIP_LEFT_RIGHT)
        return image
    
    @staticmethod
    def random_rotation(image, degrees=10):
        angle = random.uniform(-degrees, degrees)
        
        if isinstance(image, np.ndarray):
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            pil_img = Image.fromarray(image)
            rotated = pil_img.rotate(angle, fillcolor=(0, 0, 0))
            return np.array(rotated)
        elif isinstance(image, Image.Image):
            return image.rotate(angle, fillcolor=(0, 0, 0))
        return image
    
    @staticmethod
    def color_jitter(image, brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1):
        if isinstance(image, np.ndarray):
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            pil_img = Image.fromarray(image)
        else:
            pil_img = image
        
        if brightness > 0:
            brightness_factor = random.uniform(max(0, 1 - brightness), 1 + brightness)
            enhancer = ImageEnhance.Brightness(pil_img)
            pil_img = enhancer.enhance(brightness_factor)
        
        if contrast > 0:
            contrast_factor = random.uniform(max(0, 1 - contrast), 1 + contrast)
            enhancer = ImageEnhance.Contrast(pil_img)
            pil_img = enhancer.enhance(contrast_factor)
        
        if saturation > 0:
            saturation_factor = random.uniform(max(0, 1 - saturation), 1 + saturation)
            enhancer = ImageEnhance.Color(pil_img)
            pil_img = enhancer.enhance(saturation_factor)

        if hue > 0:
            hue_shift = random.uniform(-hue, hue)
            hsv = pil_img.convert('HSV')
            hsv_array = np.array(hsv)
            hsv_array[:, :, 0] = (hsv_array[:, :, 0] + hue_shift * 180) % 180
            pil_img = Image.fromarray(hsv_array, 'HSV').convert('RGB')
        
        if isinstance(image, np.ndarray):
            return np.array(pil_img)
        return pil_img
    
    @staticmethod
    def to_tensor(image):
        if isinstance(image, Image.Image):
            image = np.array(image)
        
        if image.dtype != np.uint8:
            if image.max() <= 1.0:
                image = (image * 255).astype(np.uint8)
            else:
                image = image.astype(np.uint8)

        if len(image.shape) == 3:
            tensor = image.transpose(2, 0, 1).astype(np.float32) / 255.0
        else:
            tensor = image.astype(np.float32) / 255.0
            tensor = np.expand_dims(tensor, axis=0)
        
        return tensor
    
    @staticmethod
    def normalize(tensor, mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]):
        mean = np.array(mean).reshape(-1, 1, 1)
        std = np.array(std).reshape(-1, 1, 1)
        
        if tensor.shape[0] == 1 and len(mean) == 3:
            mean = mean[0:1]
            std = std[0:1]
        
        normalized = (tensor - mean) / std
        return normalized

class CustomCompose:
    def __init__(self, transforms_list):
        self.transforms = transforms_list
    
    def __call__(self, image):
        for transform in self.transforms:
            image = transform(image)
        return image

