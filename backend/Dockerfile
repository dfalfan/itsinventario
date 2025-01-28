FROM python:3.9

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
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