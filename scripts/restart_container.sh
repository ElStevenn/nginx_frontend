#!/bin/bash

image_name="nginx-webserver" 
container_name="main-user-page" 

# Stop and remove container
docker container stop $container_name
docker container rm $container_name

# Remove image
docker image rm $image_name

echo "Wanna run the image? (y/n)"
read response

if [ "$response" == "y" ]; then
    # Rebuild the image from Dockerfile (no need to pull Nginx separately)
    docker build -t $image_name .

    # Run the container in detached mode
    docker run -d --name $container_name -p 80:80 $image_name

    # Follow the logs
    docker logs --follow $container_name

else
    echo "OK."
fi
