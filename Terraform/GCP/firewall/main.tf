provider "google" {
  project = var.project_id
  region  = var.region
}

# Using existing VPC network (no need to create a new one)
data "google_compute_network" "existing_vpc_network" {
  name = var.network_name  # Your existing network name
}

# Create a firewall rule for HTTP/HTTPS ports (using dynamic ports)
resource "google_compute_firewall" "allow_http_https" {
  name    = "allow-http-https"
  network = data.google_compute_network.existing_vpc_network.self_link

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = var.source_ranges
  target_tags   = ["web-server"]  # Only for specific VM instances
}

# Create a firewall rule for SSH (using dynamic SSH ports)
resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = data.google_compute_network.existing_vpc_network.self_link

  allow {
    protocol = "tcp"
    ports    = var.ssh_ports
  }

  source_ranges = var.source_ranges
  target_tags   = ["ssh-access"]  # Specific tag for SSH access
}

# # Create a Compute Engine VM instance
# resource "google_compute_instance" "default" {
#   name         = var.instance_name
#   machine_type = var.instance_type
#   zone         = var.zone

#   boot_disk {
#     initialize_params {
#       image = "debian-cloud/debian-11"  # Hardcoded OS image
#     }
#   }

#   network_interface {
#     network = data.google_compute_network.existing_vpc_network.self_link

#     access_config {
#       # This provides a public IP for the VM
#     }
#   }

#   tags = ["web-server", "ssh-access"]  # Static tags
# }
