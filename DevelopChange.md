```bash
sudo docker logs full-stack-fastapi-template-prestart-1
sudo docker compose -f docker-compose.yml up --build -d
sudo docker compose -f docker-compose.yml down
sudo docker compose -f docker-compose.traefik.yml down 
```

```bash
mkdir certs
openssl req -x509 -newkey rsa:4096 -keyout certs/selfsigned.key -out certs/selfsigned.crt -days 365 -nodes
```

```bash
sudo docker exec -it full-stack-fastapi-template-db-1 mysql -u root -p
# enter root mysql pass
CREATE USER IF NOT EXISTS 'newuser'@'%' IDENTIFIED BY 'newpassword';
GRANT ALL PRIVILEGES ON mydatabase.* TO 'newuser'@'%';
FLUSH PRIVILEGES;
# on update db
docker-compose exec db mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cfms; GRANT ALL PRIVILEGES ON cfms.* TO 'newuser'@'%'; FLUSH PRIVILEGES;"
# use python
docker-compose cp .\add_new_column.py backend:/app/app/add_new_column.py
docker-compose exec -it backend python /app/app/add_new_column.py
# Access the Container's Shell
docker ps
docker exec -it <container_id> sh 
docker-compose exec -it <image_name> sh
```


```bash
sudo docker compose down -v  # Remove volumes (clears database)
sudo docker compose up --build
docker save -o my_image.tar my_image:latest
docker load -i my_image.tar
# ________________________________
# Export/import volum
docker run --rm -v command-fund_app-db-data:/data -v ${PWD}:/backup busybox tar czf /backup/app-db-data.tar.gz -C /data .
docker volume create command-fund_app-db-data
docker run --rm -v command-fund_app-db-data:/data -v ${PWD}:/backup busybox tar xzf /backup/app-db-data.tar.gz -C /data
# ________________________________
sudo docker compose up --remove-orphans -d
sudo docker image prune -a -f
sudo docker compose down && sudo docker compose up -d
# After update the column
alembic revision --autogenerate -m "Add update_password_status column"
alembic upgrade head
# install nano in backend
apt-get install nano
```

```bash
sudo systemctl start mysql
sudo systemctl start apache2
```

```bash
sudo docker network ls
sudo docker network rm id
sudo docker network create traefik-public
```