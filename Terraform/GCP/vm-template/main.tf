provider "google" {
  project = var.project
  region  = var.region
}

resource "google_compute_instance" "custom-vm" {
  count = 3 
  name  = var.vm_names[count.index]

  machine_type = var.machine_types[count.index]

  boot_disk {
    auto_delete = true
    initialize_params {
      image = var.os_image
      size  = var.disk_size[count.index]
      type  = "pd-balanced"
    }
  }

  network_interface {
    access_config {
      network_tier = "PREMIUM"
    }

    subnetwork = var.subnetwork
  }

  metadata = {
    ssh-keys = var.ssh_keys
  }

  zone = var.zone
}