provider "google" {
  project = var.project_id
  region  = var.region
}

# Create VPC network
resource "google_compute_network" "my_vpc" {
  name                    = var.vpc_name
  description             = "my first vpc"
  auto_create_subnetworks  = false
  mtu                     = var.mtu
  routing_mode            = var.routing_mode
}

# Create subnet
resource "google_compute_subnetwork" "my_vpc_subnet" {
  name          = "${google_compute_network.my_vpc.name}-subnet"
  description   = "my first ${google_compute_network.my_vpc.name} subnet"
  ip_cidr_range = var.public_subnet_cidr
  region        = var.region
  network       = google_compute_network.my_vpc.id
  stack_type    = "IPV4_ONLY"
}

# Firewall rules
resource "google_compute_firewall" "allow_custom" {
  name        = "${google_compute_network.my_vpc.name}-allow-custom"
  description = "Allows connection from any source to any instance on the network using custom protocols."
  network     = google_compute_network.my_vpc.id
  direction   = "INGRESS"
  priority    = var.firewall_priority
  source_ranges = [var.custom_source_range]
  
  allow {
    protocol = "all"
  }
}

resource "google_compute_firewall" "allow_icmp" {
  name        = "${google_compute_network.my_vpc.name}-allow-icmp"
  description = "Allows ICMP connections from any source to any instance on the network."
  network     = google_compute_network.my_vpc.id
  direction   = "INGRESS"
  priority    = var.firewall_priority
  source_ranges = [var.icmp_source_range]
  
  allow {
    protocol = "icmp"
  }
}

resource "google_compute_firewall" "allow_rdp" {
  name        = "${google_compute_network.my_vpc.name}-allow-rdp"
  description = "Allows RDP connections from any source to any instance on the network using port 3389."
  network     = google_compute_network.my_vpc.id
  direction   = "INGRESS"
  priority    = var.firewall_priority
  source_ranges = [var.rdp_source_range]
  
  allow {
    protocol = "tcp"
    ports    = ["3389"]
  }
}

resource "google_compute_firewall" "allow_ssh" {
  name        = "${google_compute_network.my_vpc.name}-allow-ssh"
  description = "Allows TCP connections from any source to any instance on the network using port 22."
  network     = google_compute_network.my_vpc.id
  direction   = "INGRESS"
  priority    = var.firewall_priority
  source_ranges = [var.ssh_source_range]
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}
