# GCP VPC Network Setup with Terraform

![Terraform](https://img.shields.io/badge/Terraform-0.14%2B-brightgreen) ![GCP](https://img.shields.io/badge/GCP-Google%20Cloud-orange)

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Terraform**: Install [Terraform](https://www.terraform.io/downloads.html) version 0.14 or later.
- **GCP Account**: A Google Cloud Platform account with permissions to create resources.
- **gcloud CLI**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate using:

```bash
  gcloud auth login
```

## 🚀 Usage
### 1.Update Variables:
Edit the `terraform.tfvars` file to set your project ID, region, and other parameters.

### 2.Initialize Terraform:
Run the following command to initialize the Terraform configuration:
```bash
terraform init
```
### 3.Plan the Deployment:
Check what resources Terraform will create:

```bash
terraform plan
```
### 4.Apply the Configuration:
Deploy the resources to GCP:

```bash
terraform apply
```
Confirm the action by typing `yes` when prompted.

### 3 Verify Resources:
Log in to the Google Cloud Console and navigate to the VPC network section to verify that your VPC and subnets have been created.

## 📄 Resources
* **VPC Network:** A custom VPC network created with specified MTU and routing mode.
* **Subnets:** One public subnet configured with CIDR range `10.0.0.0/24`.
* **Firewall Rules:**
    * **Allow Custom Protocols:** Allows all traffic from `10.0.0.0/24.`
    * **Allow ICMP:** Allows ICMP traffic from anywhere.
    * **Allow RDP:** Allows RDP traffic (TCP 3389) from anywhere.
    * **Allow SSH:** Allows SSH traffic (TCP 22) from anywhere.