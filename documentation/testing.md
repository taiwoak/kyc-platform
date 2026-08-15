# Testing Notes

The thesis testing model maps to the prototype as follows:

| Test Stage | Current Coverage |
| --- | --- |
| Unit testing | AI decision-engine tests in `ai-engine/tests/test_decision_engine.py` |
| Integration testing | Backend-to-AI integration through `AiEngineClient` and FastAPI multipart endpoints |
| System testing | End-to-end flow through React upload, NestJS orchestration, and FastAPI scoring |
| UAT | Seeded customer, officer, and admin journeys for demonstration |

## Commands

```bash
python -m pytest ai-engine/tests
npm --prefix frontend run build
npm --prefix backend run build
```

The Node build commands require dependencies to be installed first:

```bash
npm install
```
