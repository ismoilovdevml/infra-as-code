variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "vpc_name" {
  description = "Name of the VPC network"
  type        = string
}

variable "public_subnet_cidr" {
  description = "CIDR range for the public subnet"
  type        = string
}

variable "mtu" {
  description = "MTU size for the VPC network"
  type        = number
  default     = 1460
}

variable "routing_mode" {
  description = "Routing mode for the VPC network"
  type        = string
  default     = "REGIONAL"
}

variable "firewall_priority" {
  description = "Priority for firewall rules"
  type        = number
  default     = 65534
}

variable "custom_source_range" {
  description = "Source range for custom firewall rule"
  type        = string
}

variable "icmp_source_range" {
  description = "Source range for ICMP firewall rule"
  type        = string
}

variable "rdp_source_range" {
  description = "Source range for RDP firewall rule"
  type        = string
}

variable "ssh_source_range" {
  description = "Source range for SSH firewall rule"
  type        = string
}