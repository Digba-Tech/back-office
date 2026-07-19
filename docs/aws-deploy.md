# One-time AWS setup — S3 + CloudFront for back-office

Do this via the AWS Console — it's simpler than CLI for CloudFront in
particular. Run it inside a **new, dedicated AWS account** under your
Organization (not the account running the prod API) — this frontend only
talks to the API over public HTTPS, so there's no need to share an account,
and keeping it separate limits blast radius if the deploy credentials are
ever compromised. Creating a new account: AWS Organizations console →
"Add an AWS account" → "Create an AWS account" → it inherits your org's
consolidated billing/credits automatically.

## 1. S3 bucket

Console → **S3** → Create bucket
- Bucket name: something globally unique, e.g. `digba-back-office-web`
- Region: your preferred region (e.g. `us-east-1`)
- Block all public access: **leave ON** (CloudFront reads it privately via OAC — no public bucket needed)
- Create bucket

## 2. CloudFront distribution

Console → **CloudFront** → Create distribution
- Origin domain: select your bucket from the dropdown (pick the S3 option, not "static website hosting")
- Origin access: **Origin access control settings (recommended)** → Create new OAC → accept defaults
- Viewer protocol policy: **Redirect HTTP to HTTPS**
- Default root object: `index.html`
- Create distribution

Right after creation, CloudFront shows a banner: *"The S3 bucket policy needs
to be updated"* with a **Copy policy** button. Click it, then go to your S3
bucket → Permissions → Bucket policy → Edit → paste → Save. This is what
lets CloudFront (and only CloudFront) read the bucket.

## 3. SPA routing fix (required — the app uses React Router's BrowserRouter)

On the distribution → **Error pages** tab → Create custom error response, twice:

| HTTP error code | Customize response | Response page path | HTTP response code |
|---|---|---|---|
| 403 | Yes | `/index.html` | 200 |
| 404 | Yes | `/index.html` | 200 |

Without this, refreshing on a deep link like `/sources/123` 404s.

## 4. GitHub OIDC role (lets GitHub Actions deploy without storing AWS keys)

Console → **IAM** → Identity providers → Add provider (skip if one for
GitHub already exists in this account):
- Provider type: OpenID Connect
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Then IAM → Roles → Create role:
- Trusted entity type: **Web identity**
- Identity provider: the one just created
- Audience: `sts.amazonaws.com`
- GitHub organization: `Digba-Tech`, GitHub repository: `back-office`

The graphical form scopes trust to the repo but not to a specific branch —
after creating the role, open its **Trust relationships** tab → Edit, and
tighten the condition to main only:

```json
"Condition": {
  "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
  "StringLike": { "token.actions.githubusercontent.com:sub": "repo:Digba-Tech/back-office:ref:refs/heads/main" }
}
```

Attach an inline permissions policy to the role (Permissions tab → Add
permissions → Create inline policy → JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::BUCKET_NAME", "arn:aws:s3:::BUCKET_NAME/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

Copy the role's ARN (top of its Summary page) — that's `AWS_ROLE_ARN` below.

## GitHub repo secrets to set (Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `AWS_ROLE_ARN` | the IAM role ARN from step 4 |
| `AWS_REGION` | the region you created the bucket in |
| `S3_BUCKET` | the bucket name from step 1 |
| `CLOUDFRONT_DISTRIBUTION_ID` | from the distribution's detail page |
| `VITE_SUPABASE_URL` | from your `.env` |
| `VITE_SUPABASE_ANON_KEY` | from your `.env` (anon key — safe to expose in a browser bundle) |
| `VITE_API_BASE_URL` | from your `.env` |

Once secrets are set, push to `main` and `.github/workflows/deploy.yml`
builds and deploys automatically.
