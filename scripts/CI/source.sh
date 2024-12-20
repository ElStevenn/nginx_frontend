#!/bin/bash

config="/home/ubuntu/scripts/config.json"

# Variables
network_name="my_network"

if [ -f "$config" ]; then
    echo "Config file found."

    if [[ -s "$config" ]]; then

        NETWORK=$(jq -r '.network' "$config")
        FIRST_TIME=$(jq -r '.first_time' "$config")

        if [[ "$NETWORK" == "false" ]]; then
            echo "creating network"
            docker network create $network_name --driver bridge

            jq '.network = true' "$config" > temp.json && mv temp.json "$config"
        fi

        if [[ "$FIRST_TIME" == "true" ]]; then
            echo "Setup first time"
            git clone https://github.com/ElStevenn/nginx_frontend.git
            cd nginx_frontend

            jq '.first_time = false' "$config" > temp.json && mv temp.json "$config"

        else
            git config --global --add safe.directory /home/ubuntu/nginx_frontend
            git pull origin main
            cd nginx_frontend
        fi


    else
        echo "Config file is empty"
        exit 1
    fi

else
    echo "Config file not found"
    exit 1
fi