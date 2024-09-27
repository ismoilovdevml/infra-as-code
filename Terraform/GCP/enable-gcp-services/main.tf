provider "google" {
  project = var.project_id
  region  = var.region
}

# Xizmatlarni yoqish
resource "google_project_service" "enable_services" {
  for_each = { for service, enabled in var.gcp_services : service => enabled if enabled }
  project  = var.project_id
  service  = each.key
}

# Yoqqan xizmatlarni ko'rsatish
output "enabled_services" {
  value = [for service in google_project_service.enable_services : service.service]
}