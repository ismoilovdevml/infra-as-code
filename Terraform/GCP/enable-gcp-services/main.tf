provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "enable_services" {
  for_each = { for service, enabled in var.gcp_services : service => enabled if enabled }
  project  = var.project_id
  service  = each.key
  disable_on_destroy = true
  disable_dependent_services = true
}

output "enabled_services" {
  value = [for service in google_project_service.enable_services : service.service]
}