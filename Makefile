.PHONY: up down rebuild logs

IMAGE_NAME = nginx-webserver
CONTAINER_NAME = main-user-page
ENV_FILE = /home/mrpau/Desktop/Secret_Project/Fundy/front_end/web-server/.env/dev.env

up:
	@echo "Starting dependencies if available..."
	@docker start db-container >/dev/null 2>&1 || echo "db-container not found"
	@docker start redis_container >/dev/null 2>&1 || echo "redis_container not found"
	@docker start mongodb_v1 >/dev/null 2>&1 || echo "mongodb_v1 not found"

	@if [ ! -f Dockerfile ]; then \
		echo "Dockerfile not found in current directory: $$(pwd)"; \
		exit 1; \
	fi

	@echo "Building image..."
	@docker build --no-cache -t $(IMAGE_NAME) . || { echo "Image build failed"; exit 1; }

	@echo "Running container..."
	@docker run -d \
		--name $(CONTAINER_NAME) \
		-p 80:80 \
		--env-file $(ENV_FILE) \
		$(IMAGE_NAME) || { echo "Container failed to start"; exit 1; }

	@make logs

down:
	@echo "Stopping and removing container..."
	@docker container stop $(CONTAINER_NAME) >/dev/null 2>&1 || true
	@docker container rm $(CONTAINER_NAME) >/dev/null 2>&1 || true
	@docker image rm $(IMAGE_NAME) >/dev/null 2>&1 || true
	@echo "Container and image removed."

rebuild: down up

logs:
	@echo "Tailing logs for container: $(CONTAINER_NAME)"
	@docker logs --follow $(CONTAINER_NAME)
