import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


class ImagePreprocessor:
    """Preprocess images with OpenCV CLAHE for enhanced OCR and face analysis."""

    def prepare_document(self, image: Image.Image) -> Image.Image:
        prepared = image.convert("RGB")
        prepared.thumbnail((1600, 1600))
        prepared = self._clahe(prepared)
        prepared = ImageEnhance.Contrast(prepared).enhance(1.25)
        prepared = ImageEnhance.Sharpness(prepared).enhance(1.15)
        return prepared.filter(ImageFilter.MedianFilter(size=3))

    def prepare_face(self, image: Image.Image) -> Image.Image:
        prepared = image.convert("RGB")
        prepared.thumbnail((900, 900))
        prepared = self._clahe(prepared)
        return ImageEnhance.Contrast(prepared).enhance(1.1)

    def _clahe(self, image: Image.Image) -> Image.Image:
        rgb = np.asarray(image)
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_l = clahe.apply(l_channel)
        enhanced = cv2.merge((enhanced_l, a_channel, b_channel))
        return Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB))
