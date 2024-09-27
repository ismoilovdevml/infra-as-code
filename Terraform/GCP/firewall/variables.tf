# GCP project ID
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

# Region and zone
variable "region" {
  description = "Region for GCP resources"
  default     = "us-central1"
  type        = string
}

variable "zone" {
  description = "Zone for the Compute Engine instance"
  default     = "us-central1-a"
  type        = string
}

# Network name
variable "network_name" {
  description = "VPC network name"
  default     = "default"
  type        = string
}

# List of allowed ports in firewall rules
variable "allowed_ports" {
  description = "List of ports allowed in firewall rules"
  type        = list(string)
  default     = ["80", "443"]
}

# SSH ports
variable "ssh_ports" {
  description = "SSH access ports"
  type        = list(string)
  default     = ["22"]
}

# Source IP ranges for firewall rules
variable "source_ranges" {
  description = "Source IP ranges allowed to access the network"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# # VM instance name and type
# variable "instance_name" {
#   description = "Name of the VM instance"
#   type        = string
#   default     = "my-vm"
# }

# variable "instance_type" {
#   description = "Instance machine type"
#   type        = string
#   default     = "e2-medium"
# }

# # OS Image
# variable "os_image" {
#   description = "Operating system image"
#   type        = string
#   default     = "debian-cloud/debian-11"
# }

# # Instance tags
# variable "instance_tags" {
#   description = "Tags for instance"
#   type        = list(string)
#   default     = ["web-server", "ssh-access"]
# }