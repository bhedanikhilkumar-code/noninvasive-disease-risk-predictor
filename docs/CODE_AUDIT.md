# Code Audit — Production Hardening Pass

## Scope

Audited the React frontend, Express/MongoDB backend, and FastAPI/scikit-learn ML service, with emphasis on correctness, data flow, error handling, privacy boundaries, and honest model claims.

## Findings and Changes

| Area | Finding | Change |
| --- | --- | --- |
| ML training | Synthetic labels were used and the implementation could be mistaken for a clinically trained predictor. | README/UI now explicitly disclose synthetic-data limitations. Training code documents the demo-only status. |
| ML features | Diastolic BP was accepted but not used by the original training signal; symptoms were accepted but not part of the model. | Added diastolic BP and a bounded symptom-keyword burden feature to the demo training/prediction path. |
| ML compatibility | An old `model.joblib` could have the wrong feature count after feature changes. | Startup checks the expected feature count and retrains when necessary. |
| ML validation | Input validation was split between services with loose text bounds. | Added Pydantic bounds, forbidden extra fields, normalized categorical values, and bounded symptom text. |
| API errors | Backend returned `error.message`, which could expose implementation details. | Production-facing responses now return generic service errors. Client validation errors remain actionable. |
| API payloads | Express accepted unbounded JSON bodies. | Added a 20 KB JSON body limit. |
| CORS | CORS allowed all methods by default. | Restricted allowed methods to GET/POST and configured the known frontend origin. |
| Privacy | History/stats were globally queryable with no user/session boundary. | Added an anonymous browser session ID and scope history/statistics to that session. This is privacy scoping, not authentication. |
| Caching | Health/history/stats responses could be cached by intermediaries. | Added `Cache-Control: no-store` for sensitive/result-oriented endpoints. |
| Frontend result flow | Result disappeared after a browser refresh because it only lived in router state. | Last result is also stored in session storage. |
| Frontend UX | Loading/error/empty states were inconsistent. | Added resilient states to history and dashboard and clearer prediction errors. |
| Accessibility | Minimal focus and responsive behavior. | Added visible keyboard focus, responsive layouts, reduced-motion handling, labels, and accessible error announcements. |

## Important Remaining Risks

The application is **not production clinical software** after this pass. The largest remaining risk is model validity: the classifier still learns from generated synthetic data and has not undergone clinical validation, calibration, external testing, or prospective evaluation.

For a real health product, the next engineering phase should include authentication/authorization, encryption and privacy controls, audit logging, abuse/rate limiting, observability, dependency scanning, automated unit/integration tests, and formal clinical/data governance.

## Verification Note

The repository connector used for this audit provides GitHub source access but does not provide a local Node/Python build environment. Therefore this pass was a source-level audit and hardening commit; dependency installation, Docker startup, browser smoke tests, and model execution should be run in CI or a local development environment before release.
