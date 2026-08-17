import re

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

import os

# Explicitly point to the Tesseract executable for Windows only
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

from app.schemas.verification import ExtractedDocument, OcrResponse

class OcrService:
    """Tesseract-powered OCR service optimised for Nigerian NIN slips."""

    def extract(
        self,
        image: Image.Image,
        declared_document_number: str | None = None,
        document_type: str = "NIN_SLIP",
    ) -> OcrResponse:
        text, engine = self._extract_with_tesseract(image)
        fields = self._parse_fields(text)
        field_sources = {
            key: "document_ocr"
            for key, value in fields.model_dump().items()
            if value
        }
        anomalies: list[str] = []

        cleaned_declared_number = self._normalize_identity_number(declared_document_number)
        if cleaned_declared_number and not fields.document_number:
            fields.document_number = cleaned_declared_number
            field_sources["document_number"] = "applicant_form"
            anomalies.append("Document number came from applicant input because OCR did not isolate a number")

        populated = sum(1 for value in fields.model_dump().values() if value)
        confidence = 45.0 + populated * 8.0 + min(len(text), 900) / 45.0

        if not text.strip() and not cleaned_declared_number:
            anomalies.append("No readable document text was extracted")
            confidence = 30.0
        if not text.strip() and cleaned_declared_number:
            confidence = max(confidence, 56.0)

        if document_type.upper() == "NIN_SLIP" and fields.document_number and not re.fullmatch(r"\d{11}", fields.document_number):
            anomalies.append("NIN should contain 11 digits")
            confidence -= 8.0

        return OcrResponse(
            status="SUCCESS" if text.strip() or fields.document_number else "FAILED",
            confidence_score=max(0.0, min(100.0, round(confidence, 2))),
            extracted_text=text,
            extracted_fields=fields,
            anomalies=anomalies,
            engine=engine,
            field_sources=field_sources,
        )

    def _extract_with_tesseract(self, image: Image.Image) -> tuple[str, str]:
        candidates = self._ocr_candidates(image)
        best_text = ""
        best_score = -1
        for candidate in candidates:
            try:
                text = pytesseract.image_to_string(candidate, config="--oem 3 --psm 6")
            except Exception:
                continue
            score = self._text_signal(text)
            if score > best_score:
                best_text = text
                best_score = score
        
        print("\n=== RAW TESSERACT OCR OUTPUT ===")
        print(best_text)
        print("================================\n")
        
        return best_text.strip(), "tesseract"

    def _ocr_candidates(self, image: Image.Image) -> list[Image.Image]:
        # Standard PIL candidates
        gray = ImageOps.grayscale(image)
        high_contrast = ImageEnhance.Contrast(gray).enhance(1.8)
        sharp = ImageEnhance.Sharpness(high_contrast).enhance(1.4)
        threshold = sharp.point(lambda pixel: 255 if pixel > 150 else 0)
        denoised = threshold.filter(ImageFilter.MedianFilter(size=3))

        # OpenCV-enhanced candidates
        arr = np.asarray(image)
        gray_cv = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

        # Adaptive thresholding
        adaptive = cv2.adaptiveThreshold(
            gray_cv, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2,
        )
        adaptive_pil = Image.fromarray(adaptive)

        # Otsu binarization
        _, otsu = cv2.threshold(gray_cv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        otsu_pil = Image.fromarray(otsu)

        # Color-based extraction (Targeting dark text on colored background)
        green_channel = arr[:, :, 1]
        _, green_otsu = cv2.threshold(green_channel, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        green_pil = Image.fromarray(green_otsu)
        
        # Dark pixel masking (Strict thresholding for black text)
        dark_mask = (arr[:, :, 0] < 100) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100)
        dark_isolated = np.ones_like(gray_cv) * 255
        dark_isolated[dark_mask] = 0
        dark_pil = Image.fromarray(dark_isolated)

        # LAB Color Space (Isolating Lightness)
        lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        # The L channel represents lightness (0=black, 255=white)
        # By thresholding just the lightness, we ignore the green color entirely
        _, lab_otsu = cv2.threshold(l_channel, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        lab_pil = Image.fromarray(lab_otsu)

        # Deskew attempt via rotation
        deskewed = self._deskew(gray_cv)
        deskewed_pil = Image.fromarray(deskewed)

        return [image, gray, high_contrast, sharp, denoised, adaptive_pil, otsu_pil, green_pil, dark_pil, lab_pil, deskewed_pil]

    def _deskew(self, gray: np.ndarray) -> np.ndarray:
        """Straighten slightly tilted document images using HoughLines angle estimation."""
        try:
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)
            if lines is None:
                return gray
            angles = []
            for rho, theta in lines[:, 0]:
                angle = (theta - np.pi / 2) * 180 / np.pi
                if -15 < angle < 15:
                    angles.append(angle)
            if not angles:
                return gray
            median_angle = float(np.median(angles))
            h, w = gray.shape
            center = (w // 2, h // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            return cv2.warpAffine(gray, rotation_matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        except Exception:
            return gray

    def _parse_fields(self, text: str) -> ExtractedDocument:
        normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        document_number = self._normalize_identity_number(
            self._first_match(
                normalized,
                [
                    # Look for NIN/ID label followed by characters that look like digits
                    r"\b(?:National Identification Number|NIN|ID|Document No\.?|Number)[:\s-]*([0-9OIlSB\s-]{10,})",
                    # Look for a standalone block of characters that look like 11 digits
                    r"\b([0-9OIlSB][0-9OIlSB\s-]{9,}[0-9OIlSB])\b",
                ],
            ),
        )
        date_of_birth = self._first_match(
            normalized,
            [
                r"\b(?:DOB|Date of Birth|Birth Date)[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})",
                r"\b(?:DOB|Date of Birth|Birth Date)[:\s-]*(\d{4}[/-]\d{2}[/-]\d{2})",
            ],
        )
        expiry_date = self._first_match(
            normalized,
            [
                r"\b(?:Expiry|Expires|Valid Until|Expiry Date)[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})",
                r"\b(?:Expiry|Expires|Valid Until|Expiry Date)[:\s-]*(\d{4}[/-]\d{2}[/-]\d{2})",
            ],
        )
        gender = self._normalize_gender(
            self._line_value(normalized, ["Gender", "Sex"])
            or self._first_match(normalized, [r"\b(Male|Female)\b"]),
        )
        surname = self._line_value(normalized, ["Surname", "Last Name"])
        first_name = self._line_value(normalized, ["First Name", "Given Name"])
        middle_name = self._line_value(normalized, ["Middle Name", "Other Names"])
        full_name = self._line_value(normalized, ["Full Name", "Name"])
        name = full_name or self._join_name_parts(surname, first_name, middle_name)
        address = self._line_value(normalized, ["Address", "Residential Address"])
        return ExtractedDocument(
            full_name=self._clean_name(name),
            date_of_birth=date_of_birth,
            gender=gender,
            document_number=document_number,
            expiry_date=expiry_date,
            address=address,
        )

    def _first_match(self, text: str, patterns: list[str]) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _line_value(self, text: str, labels: list[str]) -> str | None:
        for label in labels:
            escaped = re.escape(label)
            pattern = rf"(?:^|\n)\s*{escaped}\s*[:\-]?\s*([^\n]{{2,90}})"
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                value = re.sub(r"\s{2,}", " ", match.group(1)).strip(" :-")
                value = re.split(
                    r"\b(?:Surname|First Name|Middle Name|Gender|Sex|DOB|Date of Birth|Address|NIN)\b",
                    value,
                    maxsplit=1,
                    flags=re.IGNORECASE,
                )[0].strip(" :-")
                if value:
                    return value
        return None

    def _join_name_parts(self, *parts: str | None) -> str | None:
        cleaned = [part.strip() for part in parts if part and part.strip()]
        return " ".join(cleaned) if cleaned else None

    def _clean_name(self, value: str | None) -> str | None:
        if not value:
            return None
        cleaned = re.sub(r"[^A-Za-z ,.'-]", " ", value)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" ,.'-")
        return cleaned.title() if cleaned else None

    def _normalize_gender(self, value: str | None) -> str | None:
        if not value:
            return None
        token = value.strip().upper()[:1]
        if token == "M":
            return "Male"
        if token == "F":
            return "Female"
        return None

    def _normalize_identity_number(self, value: str | None) -> str | None:
        if not value:
            return None
        # Fix common Tesseract digit confusions
        value = value.upper().replace('O', '0').replace('I', '1').replace('L', '1').replace('S', '5').replace('B', '8')
        digits = re.sub(r"\D", "", value)
        if len(digits) >= 8:
            return digits
        return None

    def _text_signal(self, text: str) -> int:
        normalized = text.upper()
        keywords = ["NIN", "NAME", "SURNAME", "DATE OF BIRTH", "GENDER", "ADDRESS"]
        keyword_score = sum(20 for keyword in keywords if keyword in normalized)
        number_score = 40 if re.search(r"\b\d[\d\s-]{9,}\d\b", text) else 0
        return keyword_score + number_score + min(len(text), 1000)
