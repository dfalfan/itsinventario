FROM python:3.9

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install reportlab
COPY . .

# Crear directorio static y copiar el logo
RUN mkdir -p static

EXPOSE 5000

CMD ["python", "app.py"]