# AI consultation connection

The UI and Worker gateway are implemented. Live inference requires a separately authorized API connection; a ChatGPT subscription does not configure an API key for this application.

Runtime secret names: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4.1-mini`), and optional `PUBLIC_SITE_ORIGIN` when proxy routing requires a fixed canonical origin. Never put real values in source, `.openai/hosting.json`, browser local storage, or the client bundle. Use the supported secure OpenAI Developers connection and hosted secret configuration.

The Site remains owner-private. Its gateway supplies authenticated request identity. AI consultation rejects missing identity, non-matching origins, wrong content types, oversized bodies, and invalid fields. A per-isolate request limit restricts short bursts; this is not a global billing cap. Provider-side budgets and authorized audience settings must be managed by the operator before broader distribution.

The client sends case context only when explicitly selected, and the server forwards only the submitted question and context. No file upload or tool execution is supported. Model output is rendered as text and marked for analyst review. `store:false` is requested; this is not a promise of zero provider retention.

Core tests use a mock provider and do not make live paid API calls. A configured credential must be verified with an authorized real consultation before reporting that live inference works. The Android app uses a separate browser link for this private web feature and retains local tools without a network permission.

Primary API documentation: https://developers.openai.com/api/reference/resources/responses/methods/create
