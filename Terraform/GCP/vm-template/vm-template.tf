provider "google" {
  project = "labaratoriya"
}

resource "google_compute_instance" "custom-vm" {
  count = 14

  name         = var.vm_names[count.index]
  machine_type = var.machine_types[count.index]

  boot_disk {
    auto_delete = true
    initialize_params {
      image = "projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20240830"
      size  = var.disk_size[count.index]
      type  = "pd-balanced"
    }
  }

  network_interface {
    access_config {
      network_tier = "PREMIUM"
    }
    subnetwork = lookup(var.zone_to_subnet, var.zones[count.index], null)
  }

  zone = var.zones[count.index]
}

variable "vm_names" {
  type    = list(string)
  default = [
    "config-server1", "config-server2", "config-server3", 
    "shard1-primary", "shard1-secondary1", "shard1-secondary2", 
    "shard2-primary", "shard2-secondary1", "shard2-secondary2", 
    "shard3-primary", "shard3-secondary1", "shard3-secondary2", 
    "mongos-router1", "mongos-router2"
  ]
}

variable "machine_types" {
  type    = list(string)
  default = ["e2-medium", "e2-medium", "e2-medium", "e2-medium", 
             "e2-medium", "e2-medium", "e2-medium", "e2-medium", 
             "e2-medium", "e2-medium", "e2-medium", "e2-medium", 
             "e2-medium", "e2-medium"]
}

variable "disk_size" {
  type    = list(number)
  default = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
}

variable "zones" {
  type    = list(string)
  default = [
    "us-central1-a", "us-central1-b", "us-west1-a", "us-west1-b", 
    "europe-west1-b", "europe-west1-c", "asia-east1-a", "asia-east1-b",
    "europe-west3-a", "europe-west4-b", "asia-northeast1-a", "asia-northeast1-b",
    "us-west3-a", "us-west3-b"
  ]
}

variable "zone_to_subnet" {
  type = map(string)
  default = {
    "us-central1-a"        = "projects/labaratoriya/regions/us-central1/subnetworks/default",
    "us-central1-b"        = "projects/labaratoriya/regions/us-central1/subnetworks/default",
    "us-west1-a"           = "projects/labaratoriya/regions/us-west1/subnetworks/default",
    "us-west1-b"           = "projects/labaratoriya/regions/us-west1/subnetworks/default",
    "europe-west1-b"       = "projects/labaratoriya/regions/europe-west1/subnetworks/default",
    "europe-west1-c"       = "projects/labaratoriya/regions/europe-west1/subnetworks/default",
    "asia-east1-a"         = "projects/labaratoriya/regions/asia-east1/subnetworks/default",
    "asia-east1-b"         = "projects/labaratoriya/regions/asia-east1/subnetworks/default",
    "europe-west3-a"       = "projects/labaratoriya/regions/europe-west3/subnetworks/default",
    "europe-west4-b"       = "projects/labaratoriya/regions/europe-west4/subnetworks/default",
    "asia-northeast1-a"    = "projects/labaratoriya/regions/asia-northeast1/subnetworks/default",
    "asia-northeast1-b"    = "projects/labaratoriya/regions/asia-northeast1/subnetworks/default",
    "us-west3-a"           = "projects/labaratoriya/regions/us-west3/subnetworks/default",
    "us-west3-b"           = "projects/labaratoriya/regions/us-west3/subnetworks/default"
  }
}
