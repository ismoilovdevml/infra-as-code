variable "credentials_file" {
  description = "Path to the service account credentials file"
  type        = string
}

variable "project_name" {
  description = "The name of the GCP project"
  type        = string
}

variable "project_id" {
  description = "The unique ID for the GCP project"
  type        = string
}

# variable "organization_id" {
#   description = "The organization ID where the project will be created"
#   type        = string
# }

variable "billing_account" {
  description = "The billing account ID to link with the project"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "services_to_enable" {
  description = "List of services to enable after project creation"
  type        = list(string)
  default     = [
    "compute.googleapis.com",       # Compute Engine
    "container.googleapis.com"      # Kubernetes Engine
  ]
}