output "project_id" {
  description = "The project ID of the newly created project"
  value       = google_project.my_project.project_id
}

output "enabled_services" {
  value = [for service in google_project_service.enable_services : service.id]
}