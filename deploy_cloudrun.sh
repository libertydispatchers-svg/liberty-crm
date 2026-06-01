#!/usr/bin/env bash
set -e

# Configuration
SERVICE_NAME="liberty-crm"
REGION="europe-west1"

# Step 1: Ensure gcloud is configured
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project configured. Run 'gcloud config set project <PROJECT_ID>' first."
  exit 1
fi

echo "Deploying to Google Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"

# Step 2: Ensure Artifact Registry Docker repository exists
REPO_NAME="crm-repo"
echo "Ensuring Artifact Registry repository '$REPO_NAME' exists in '$REGION'..."
gcloud artifacts repositories create "$REPO_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --description="CRM Docker repository" \
  --quiet 2>/dev/null || true

# Step 3: Build container image using Cloud Build (Artifact Registry)
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"
echo "Building image $IMAGE_TAG via Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG" .

# Step 4: Deploy to Cloud Run
echo "Ensuring Compute service account has access to Secret Manager secrets..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:736433125033-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet 2>/dev/null || true

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-secrets="GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_REFRESH_TOKEN=GOOGLE_REFRESH_TOKEN:latest" \
  --port 8080

echo "Deployment complete!"
