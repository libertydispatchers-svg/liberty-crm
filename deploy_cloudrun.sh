#!/usr/bin/env bash
set -e

# Configuration
SERVICE_NAME="liberty-crm"
REGION="us-central1"

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

# Step 2: Build container image using Cloud Build
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
echo "Building image $IMAGE_TAG via Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG" .

# Step 3: Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080

echo "Deployment complete!"
