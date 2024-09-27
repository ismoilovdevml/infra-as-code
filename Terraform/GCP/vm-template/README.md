# GCP VM Terraform Template

This repository contains a Terraform template to create 3 Virtual Machines (VMs) on Google Cloud Platform (GCP).

## Features 🌟

- **Creates 3 VMs** - Dynamically assigns names, disk sizes, and machine types to each VM.
- **Ubuntu OS** - Uses Ubuntu 20.04 Focal OS image for the VMs.
- **Auto Disk Delete** - Disks are automatically deleted when the VM is deleted.
- **SSH Keys** - Connect to the VMs via SSH keys.

## Usage 📘

Follow these steps to use this template in your project:

**Initialize Terraform:**

```bash
terraform init
```
**Review the Terraform plan:**

```bash
terraform plan
```
Apply the Terraform configuration to create the resources:

```bash
terraform apply
```

Destroy

```bash
terraform destroy
```