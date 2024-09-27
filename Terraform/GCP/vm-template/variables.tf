variable "project" {
  type    = string
  default = "labaratoriya"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "vm_names" {
  type    = list(string)
  default = ["config-server1", "config-server2", "config-server3"]
}

variable "machine_types" {
  type    = list(string)
  default = ["e2-medium", "e2-medium", "e2-medium"]
}

variable "disk_size" {
  type    = list(number)
  default = [50, 50, 50]
}

variable "zone" {
  type    = string
  default = "us-central1-a"
}

variable "subnetwork" {
  type    = string
  default = "projects/labaratoriya/regions/us-central1/subnetworks/default"
}

variable "ssh_keys" {
  type    = string
  description = "SSH public key for accessing VMs"
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOsX4I3rwJr+/NL3aPA7rIS/4/XtlnJRIpn/0C9T3os0 ismoilovdev@vivobook"
}

variable "os_image" {
  type    = string
  description = "The OS image to use for the VMs"
  default     = "projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20240830"
}