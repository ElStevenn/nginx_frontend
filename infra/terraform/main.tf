provider "aws" {
  region = "eu-south-2" 
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's owner ID for Ubuntu AMIs

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
}


resource "aws_instance" "web_server" {
  ami                    = "ami-01c698987a62f1cee"
  instance_type          = "t3.medium"
  vpc_security_group_ids = ["sg-0ceebb5821128f97d"]

  tags = {
    Name = "Frontend part"
  }

  # Add the connection block
  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("/home/mrpau/Desktop/Secret_Project/other_layers/api_schedule_tasks/web-server/security/instance_key.pem") 
    host        = self.public_ip
  }

  # Upload Dockerfile
  provisioner "file" {
    source      = "Dockerfile"
    destination = "/home/ubuntu/Dockerfile"
  }

  # Upload src directory
  provisioner "file" {
    source      = "src"
    destination = "/home/ubuntu/src"
  }

  # Run commands to build and start the Docker container
  provisioner "remote-exec" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get install -y docker.io",
      "sudo systemctl start docker",
      "cd /home/ubuntu",
      "docker build -t front_end .",
      "docker run -d --name front_web_v1 -p 80:80 front_end"
    ]
  }
}

output "instance_public_ip" {
  value = aws_instance.web_server.public_ip
}



