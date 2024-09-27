# 🚀 Terraform Enable GCP Services

This Terraform module allows you to enable or disable specific Google Cloud Platform (GCP) services easily by toggling them on or off using a `true/false` configuration. It helps you automate the process of managing services across your GCP project.

## 📋 Prerequisites

- 🛠️ **Terraform** installed on your machine (version 0.13+ recommended)
- 🔐 A valid **Google Cloud Platform (GCP)** project
- 🌐 GCP credentials set up on your local environment (or in the Terraform provider configuration)

## 📝 Features

This module enables the following GCP services (with default settings):

- ☁️ Compute Engine: `compute.googleapis.com`
- 🐳 Kubernetes Engine: `container.googleapis.com`
- 📦 Container Registry: `containerregistry.googleapis.com`
- 🛠️ BigQuery: `bigquery.googleapis.com`
- 🗃️ Cloud SQL: `sqladmin.googleapis.com`

You can easily modify which services to enable or disable by updating the configuration.

## ⚙️ Usage

### 1. Initialize Terraform:

Make sure you have Terraform installed and your GCP credentials are set up. Run the following command to initialize the Terraform configuration:

```bash
terraform init
```

### 2. Plan the changes:
You can preview the changes that Terraform will apply by running:
```bash
terraform plan
```
### 3. Apply the configuration:
To enable the desired GCP services, run:
```bash
terraform apply
```
Terraform will enable the GCP services that you have marked as `true` in the `terraform.tfvars` file or in `variables.tf`.

### Example terraform.tfvars Configuration:
```
gcp_services = {
  "compute.googleapis.com"          = true,   # Enable Compute Engine
  "container.googleapis.com"        = true,   # Enable Kubernetes Engine
  "containerregistry.googleapis.com" = true,  # Enable Container Registry
  "bigquery.googleapis.com"         = false,  # Disable BigQuery
  "sqladmin.googleapis.com"         = false   # Disable Cloud SQL
}
```
## 🔥 Destroying the Resources
If you need to disable or destroy the enabled services, you can run:

```bash
terraform destroy
```
This command will remove the enabled services from your GCP project.

⚠️ **Warning:** Make sure that you review the services you're disabling before running the `destroy` command to avoid affecting any critical infrastructure.

### 🛠️ Customization
Modify the `variables.tf` or `terraform.tfvars` file to add or remove services.
Change the `true/false` values to enable or disable specific services based on your requirements.
### 📝 Notes
The services that are enabled or disabled are controlled by the `gcp_services` map in the `variables.tf` or `terraform.tfvars` file.
This project helps streamline the process of managing GCP services in a programmatic way using Terraform.