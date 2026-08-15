from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(slots=True)
class ImageQuality:
    width: int
    height: int
    brightness: float
    contrast: float
    sharpness: float
    entropy: float
    score: float
    anomalies: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ProcessingContext:
    customer_id: str
    document_type: str
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
