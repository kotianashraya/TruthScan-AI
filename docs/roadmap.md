# Roadmap

1. Maintain the current landing and scan simulation experience.
2. Add authenticated product, scan, report, history, profile, and settings
   features as independently routed pages when product requirements are ready.
3. Define Firebase Functions contracts in the domain folders under
   `backend/functions` before implementation.
4. Add AI prompts, datasets, model artifacts, and reproducible experiments in
   `ai/`.
5. Deploy the Firebase callable AI vision function and configure the
   `GEMINI_API_KEY` secret.
6. Deploy hardened Firestore and Storage rules to the live Firebase project.
7. Run authenticated end-to-end scanner tests with representative real product
   images on desktop and physical Android/iOS devices.
8. Keep deterministic verification as the fallback when AI vision is unavailable.
