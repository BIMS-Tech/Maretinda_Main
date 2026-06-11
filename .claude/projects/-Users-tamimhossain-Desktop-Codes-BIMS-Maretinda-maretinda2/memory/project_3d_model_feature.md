---
name: project-3d-model-feature
description: 3D Model Generation feature — architecture, files, env config, and tier gating
metadata:
  type: project
---

3D Model Generator feature added to the vendor panel. Powered by Meshy.ai image-to-3D API. Gated to **Boost** and **Managed** subscription tiers only (Foundation tier sees a locked upgrade prompt).

**Why:** Seller requested premium showcase feature for tiers 2 and 3 to differentiate value.

**How to apply:** When working on subscription features or product display, remember this feature exists and uses the `product_3d_model` table.

## Backend

**Migration:** `backend/src/migrations/1752000000000_create_product_3d_models.ts`
- Table: `product_3d_model` (id, product_id, seller_id, status, source_image_url, model_url, thumbnail_url, provider, provider_task_id, error_message, progress, is_primary)

**API Routes (`/vendor/3d-models/`):**
- `POST .../generate` — start generation (subscription check inside)
- `GET .../tasks/[taskId]` — poll task status (syncs with Meshy.ai)
- `GET .../products/[productId]` — list models for a product
- `DELETE .../[modelId]` — delete a model
- `POST .../[modelId]/set-primary` — mark model as product showcase

**Env var required:** `MESHY_API_KEY` (get from meshy.ai)

## Frontend (maretinda-seller)

**Hooks:** `src/hooks/api/product-3d-models.ts`
- `useProduct3DModels(productId)` — list models, polls processing ones every 5s
- `useGenerate3DModel(productId)` — start generation mutation
- `useDelete3DModel(productId)` — delete mutation
- `useSetPrimary3DModel(productId)` — set showcase mutation

**Route:** `src/routes/products/product-3d-model/` (RouteFocusModal at `/products/:id/3d-model`)
- Components: `product-3d-model-view.tsx`, `generate-form.tsx`, `model-card.tsx`, `subscription-gate.tsx`, `model-viewer-element.tsx`
- 3D viewer uses `<model-viewer>` web component from Google CDN (loaded dynamically)

**Section:** `src/routes/products/product-detail/components/product-3d-model-section/` added to product detail sidebar

**Route registered:** In `route-map.tsx` under `/products/:id` children alongside `media`
