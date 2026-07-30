FROM python:3.12-slim

# ansible-core comes from pip so the version is explicit; the distro package lags
# badly and pulls in a large dependency set.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssh-client \
        sshpass \
        git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt "ansible-core>=2.17,<2.22"

COPY . .

# Runs as a non-root user. The container needs no root privileges: it only reads
# the mounted Ansible tree and shells out to ansible-playbook over SSH.
RUN useradd --create-home --uid 10001 dashboard && \
    mkdir -p /app/data && chown -R dashboard:dashboard /app
USER dashboard

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

# No --reload: that is a development flag and it doubles memory use.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
