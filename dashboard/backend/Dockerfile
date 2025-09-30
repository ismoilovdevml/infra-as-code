FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Ansible
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ansible \
    openssh-client \
    sshpass \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]