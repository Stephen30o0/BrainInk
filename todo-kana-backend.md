# Kana Backend Gemini Failures Fix TODO

- [ ] Inspect `kana-backend` server code paths that call Gemini (e.g., `index.js`, `services/quizService.js`, grading services) to understand current retry + fallback logic.
- [ ] Review configuration for Google Generative AI client (API version, model names, quota handling) and identify incompatibilities with deployed environment.
- [ ] Design a fix (e.g., adjust model selection, throttle retries, add graceful degradation) that resolves the observed 429 quota and 404 model errors.
- [ ] Implement the fix in code, including any configuration updates and improved error handling/logging.
- [ ] Run relevant automated tests or targeted checks to verify the fix locally.
- [ ] Document the change (code comments or README/ops notes) so deployment owners know the new behavior.
