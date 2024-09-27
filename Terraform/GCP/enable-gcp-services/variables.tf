variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "region" {
  description = "The region of the GCP project"
  type        = string
  default     = "us-central1"
}

variable "gcp_services" {
  description = "List of GCP services to enable or disable"
  type        = map(bool)
  default = {
    "compute.googleapis.com"           = true,   # Compute Engine
    "container.googleapis.com"         = true,   # Kubernetes Engine
    "containerregistry.googleapis.com" = true,   # Container Registry
    "bigquery.googleapis.com"          = true,   # BigQuery
    "sqladmin.googleapis.com"          = true    # Cloud SQL
  }
}