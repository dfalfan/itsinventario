FROM python:3.9

# Instalar herramientas de red
RUN apt-get update && apt-get install -y \
    iputils-ping \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install reportlab

# Crear directorio static
RUN mkdir -p static

# Copiar archivos estáticos
COPY static/logo_sura.png static/
COPY static/Montserrat-Regular.ttf static/
COPY static/Montserrat-Bold.ttf static/

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]