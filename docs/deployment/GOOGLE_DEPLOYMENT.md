# Google deployment

The frontend is hosted by Firebase Hosting. Products, quotes, admin, and AI run
as four independent Google Cloud Run services. Hosting forwards `/api/*` calls
to the correct service.

## One-time setup

1. Rotate any Firebase service-account key that was previously shared. Cloud Run
   uses Google Application Default Credentials, so no private-key file is needed.
2. Confirm the `gerrys-docks-capstone` project is on the Blaze billing plan.
3. Install the Google Cloud CLI:

   ```powershell
   winget install --id Google.CloudSDK
   ```

4. Reopen PowerShell, then install the Firebase CLI:

   ```powershell
   npm install -g firebase-tools
   ```

5. Sign in:

   ```powershell
   gcloud auth login
   gcloud auth application-default login
   firebase login
   ```

6. In Firebase Console, confirm Firestore Database and Email/Password
   Authentication are enabled.

## Deploy everything

Run from the repository root:

```powershell
cd "C:\Gerry-docks-final"
.\scripts\deploy-google.ps1
```

The script enables required APIs, creates a dedicated runtime service account,
deploys all four services, and deploys Firebase Hosting.

## Optional OpenAI secret

The AI service works with its local fallback without an API key. To enable
OpenAI, create the secret without putting the key in GitHub:

```powershell
gcloud secrets create openai-api-key --replication-policy=automatic
"PASTE_NEW_OPENAI_KEY_HERE" | gcloud secrets versions add openai-api-key --data-file=-
gcloud secrets add-iam-policy-binding openai-api-key --member="serviceAccount:gerrys-backend@gerrys-docks-capstone.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud run services update gerrys-ai --region us-west1 --set-secrets="OPENAI_API_KEY=openai-api-key:latest" --set-env-vars="OPENAI_MODEL=gpt-4o-mini"
```

## Deploy later changes

For a full redeployment, run the script again. To deploy only one service:

```powershell
gcloud run deploy gerrys-products --source services/product-service --region us-west1 --service-account gerrys-backend@gerrys-docks-capstone.iam.gserviceaccount.com --allow-unauthenticated
```

To deploy frontend-only changes:

```powershell
firebase deploy --only hosting
```
