# Vow & Verse beta API

GitHub Pages serves the public editor. This API stores invitation drafts and RSVP replies in Firestore, and privately stores photos in Cloud Storage. Guests receive temporary, signed photo links when they open an invitation; the bucket itself is not public.

## Beta deployment

The project is `vow-and-verse`. These commands use the Mumbai region (`asia-south1`) and a separate beta bucket. The Firestore location is permanent once created, so keep the API and bucket in the same region.

### 1. Set up the budget and APIs

The ₹100 monthly budget below sends email alerts at 50%, 80%, and 100%. A normal budget is an alert, not a spending stop. Cloud Run is also capped at one instance, but Cloud Storage and network delivery can still incur charges.

```sh
gcloud services enable billingbudgets.googleapis.com --project=vow-and-verse
gcloud billing budgets create --billing-account=0106E3-189CE6-03B63A --billing-project=vow-and-verse --display-name="Vow and Verse beta — INR 100/month" --budget-amount=100INR --calendar-period=month --filter-projects=projects/vow-and-verse --threshold-rule=percent=0.5 --threshold-rule=percent=0.8 --threshold-rule=percent=1.0
gcloud services enable run.googleapis.com firestore.googleapis.com storage.googleapis.com iamcredentials.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project=vow-and-verse
```

### 2. Create the database and private photo bucket

If a Firestore database already exists, use its location instead of creating another one. Bucket names are globally unique; replace the example with a unique name if it is taken.

```sh
gcloud firestore databases create --project=vow-and-verse --database="(default)" --location=asia-south1 --type=firestore-native
gcloud storage buckets create gs://vow-verse-beta-assets-532112246955 --project=vow-and-verse --location=asia-south1 --default-storage-class=STANDARD --uniform-bucket-level-access --public-access-prevention=enforced
gcloud storage buckets update gs://vow-verse-beta-assets-532112246955 --cors-file=backend/cors.json
```

Uniform bucket-level access and public access prevention keep photos private. The API signs each viewing link for 24 hours after checking the invitation link. Do not add `allUsers` to the bucket policy.

### 3. Create a narrowly scoped API identity

Cloud Run uses this service account without a downloaded key. It needs Firestore access, permission to create and read objects in this bucket, and permission to sign its own short-lived URLs.

```sh
gcloud iam service-accounts create vow-verse-api --project=vow-and-verse
gcloud projects add-iam-policy-binding vow-and-verse --member=serviceAccount:vow-verse-api@vow-and-verse.iam.gserviceaccount.com --role=roles/datastore.user
gcloud storage buckets add-iam-policy-binding gs://vow-verse-beta-assets-532112246955 --member=serviceAccount:vow-verse-api@vow-and-verse.iam.gserviceaccount.com --role=roles/storage.objectCreator
gcloud storage buckets add-iam-policy-binding gs://vow-verse-beta-assets-532112246955 --member=serviceAccount:vow-verse-api@vow-and-verse.iam.gserviceaccount.com --role=roles/storage.objectViewer
gcloud iam service-accounts add-iam-policy-binding vow-verse-api@vow-and-verse.iam.gserviceaccount.com --project=vow-and-verse --member=serviceAccount:vow-verse-api@vow-and-verse.iam.gserviceaccount.com --role=roles/iam.serviceAccountTokenCreator
```

### 4. Deploy the API with beta limits

```sh
gcloud run deploy vow-verse-api --project=vow-and-verse --source=backend --region=asia-south1 --allow-unauthenticated --service-account=vow-verse-api@vow-and-verse.iam.gserviceaccount.com --cpu=1 --memory=256Mi --min=0 --max=1 --concurrency=20 --timeout=15s
gcloud run services update vow-verse-api --project=vow-and-verse --region=asia-south1 --update-env-vars=^@^STORAGE_BUCKET=vow-verse-beta-assets-532112246955@FIRESTORE_COLLECTION=invitations@ALLOWED_ORIGINS=https://beta.akshaysdigitalforest.in --min=0 --max=1
```

After deployment, open `https://YOUR_CLOUD_RUN_URL/api/health`. Then set that URL in the public `config.js` file:

```js
window.VOW_CONFIG = { apiBaseUrl: "https://YOUR_CLOUD_RUN_URL" };
```

Commit and push the frontend update to `main`; GitHub Pages will publish it. The API URL is public configuration, not a secret.

## How the beta works

- The first share or upload creates a random invitation ID and an edit token. The edit token stays in that browser's local storage and is never put in the guest link.
- Uploaded photos go directly from the browser to the private bucket using a signed upload policy, with an 8 MB server-enforced limit per image.
- A guest link reads invitation details from Firestore and receives temporary signed photo URLs. RSVP replies are stored in Firestore; only the invitation owner can read the reply list.
- The API allows beta traffic from the GitHub Pages domain and localhost. The API has a per-instance request limit and Cloud Run has a one-instance maximum.
- Downloaded standalone invitation files use temporary signed photo links, so use the hosted guest link when sharing uploaded images.

This is a friends-and-family beta, not yet a commercial multi-tenant service. The edit token is a browser-held bearer token. Add customer accounts, deletion and retention controls, abuse protection, and operational monitoring before a public paid launch.
