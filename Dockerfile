# Gunakan image Python ringan
FROM python:3.11-slim

# Info author
LABEL maintainer="Arya Prathama"

# Set direktori kerja
WORKDIR /app

# Copy file environment dan source code
COPY .env .
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port FastAPI (default 8000 atau 80 kalau mau)
EXPOSE 80

# Jalankan aplikasi dengan uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
