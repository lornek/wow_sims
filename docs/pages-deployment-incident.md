# GitHub Pages artifact lookup incident — November 26, 2026

Failed run: https://github.com/lornek/wow_sims/actions/runs/45913915649
Source: `ff9d080de7d676d222b900436a9cee1fd098b499`.

The clean source build and all 248 tests passed locally. The failed run's summary lists the uploaded `github-pages-45913915649-1` artifact (87 MB), but `actions/deploy-pages@v4` failed with `No artifacts named "github-pages-45913915649-1" were found for this workflow run`.

The workflow already checked artifact visibility using the REST API. That did not protect the next step: deploy-pages v4 discovers artifacts through a separate Actions Results/Twirp `ListArtifacts` service. The evidence demonstrates inconsistent artifact discovery; it does not establish the underlying GitHub service fault or timing cause. Node 20 deprecation was a separate warning, not the reported failure.

## Prevention

The workflow now takes `artifact_id` directly from the upload-pages-artifact output, verifies its name, run ID, and expiry through REST, and submits that exact ID to the Pages deployment API with the workflow OIDC token. It polls the resulting deployment until `succeed` and fails on terminal deployment errors or timeout. Tokens are masked and never intentionally logged. It creates a deployment once, avoiding blind retries that could start duplicate deployments after an ambiguous response.

Keep per-run/per-attempt artifact names and the existing main-only environment/concurrency restrictions. Do not treat a successful push, upload, or local build as proof of publication. Confirm the workflow's final status and source SHA.

Tests cover exact-ID selection, rejection of another run's artifact, and propagation of hosting failures. The deployment script's injected wait/client allow those paths to be checked without publishing.

## Verification

Pending the first live run of this fix; record its run URL and successful source SHA below after completion.
