FROM python:3.9

COPY requirements.txt /
RUN pip install -r /requirements.txt
WORKDIR /app
EXPOSE 5000
VOLUME /app

ENTRYPOINT ["python", "app.py"]
