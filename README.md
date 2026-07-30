# Gerry's Docks Microservices

Microservice version of the Gerry's Docks capstone project. The frontend is
hosted by Firebase Hosting, while products, quotes, administration, and AI run
as independent Google Cloud Run services.

## Project Structure

```text
├── docs/                      # Documentation & Presentation Materials
│   ├── deployment/            # Deployment guides (Google Cloud, CI/CD)
│   └── presentation/          # Slides, mockups, and assets
├── frontend/                  # Main React/Vite Frontend Application
├── services/                  # Microservices
│   ├── admin-service/         # Admin Management API
│   ├── ai-service/            # AI & Assistant Service
│   ├── product-service/       # Product Catalog API
│   └── quote-service/         # Quote Calculation API
├── deploy/                    # Infrastructure & Deployment scripts
│   ├── k8s/                   # Kubernetes manifest configurations
│   └── scripts/               # PowerShell & automation deployment scripts
├── compose.yaml               # Local Docker Compose setup
├── firebase.json              # Firebase Hosting configuration
└── README.md
```

## Documentation

* [Google Cloud Run Deployment](docs/deployment/GOOGLE_DEPLOYMENT.md)
* [CI/CD Setup Guide](docs/deployment/CI_CD_SETUP.md)
