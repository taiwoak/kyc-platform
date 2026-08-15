from datetime import datetime, timezone
from typing import Any


class AuditRepository:
    def __init__(self) -> None:
        self._events: list[dict[str, Any]] = []

    def append(self, event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        event = {
            "event_type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._events.append(event)
        return event

    def list(self) -> list[dict[str, Any]]:
        return list(self._events)
