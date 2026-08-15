from io import BytesIO

import numpy as np
from fastapi import UploadFile
from PIL import Image, ImageFilter, ImageStat

from app.models.domain import ImageQuality


async def read_upload(file: UploadFile) -> bytes:
    data = await file.read()
    await file.seek(0)
    return data


def load_image(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data)).convert("RGB")


def image_quality(image: Image.Image) -> ImageQuality:
    gray = image.convert("L")
    stat = ImageStat.Stat(gray)
    brightness = float(stat.mean[0])
    contrast = float(stat.stddev[0])

    edges = gray.filter(ImageFilter.FIND_EDGES)
    sharpness = float(ImageStat.Stat(edges).stddev[0])

    histogram = np.array(gray.histogram(), dtype=np.float64)
    histogram = histogram / max(histogram.sum(), 1)
    entropy = float(-(histogram[histogram > 0] * np.log2(histogram[histogram > 0])).sum())

    score = 100.0
    anomalies: list[str] = []
    if image.width < 500 or image.height < 350:
        score -= 25
        anomalies.append("Image resolution is below recommended minimum")
    if brightness < 45 or brightness > 220:
        score -= 20
        anomalies.append("Lighting appears too dark or too bright")
    if contrast < 25:
        score -= 15
        anomalies.append("Low contrast may reduce OCR and face detection reliability")
    if sharpness < 10:
        score -= 20
        anomalies.append("Image appears blurred")
    if entropy < 3.5:
        score -= 10
        anomalies.append("Image contains limited visual detail")

    return ImageQuality(
        width=image.width,
        height=image.height,
        brightness=brightness,
        contrast=contrast,
        sharpness=sharpness,
        entropy=entropy,
        score=max(0.0, min(100.0, score)),
        anomalies=anomalies,
    )


def perceptual_vector(image: Image.Image) -> np.ndarray:
    small = image.convert("L").resize((32, 32))
    vector = np.asarray(small, dtype=np.float32).flatten()
    vector = vector - vector.mean()
    norm = np.linalg.norm(vector)
    return vector / norm if norm else vector
