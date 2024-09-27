provider "google" {
  credentials = file(var.credentials_file)
  project     = var.project_id
  region      = var.region
}

# GCP loyihasini yaratish
resource "google_project" "my_project" {
  name       = var.project_name
  project_id = var.project_id
#   org_id     = var.organization_id
  billing_account = var.billing_account
}

# Xizmatlarni yoqish (optional)
resource "google_project_service" "enable_services" {
  for_each = toset(var.services_to_enable)
  project  = google_project.my_project.project_id
  service  = each.key
}
