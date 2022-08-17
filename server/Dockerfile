FROM python:3.9

COPY requirements.txt /
RUN pip install https://download.pytorch.org/whl/cpu/torch-1.9.0%2Bcpu-cp39-cp39-linux_x86_64.whl
RUN pip install -r /requirements.txt
WORKDIR /app
EXPOSE 5000
VOLUME /app

ENTRYPOINT ["python", "app.py"]
