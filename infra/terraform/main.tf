provider "aws" {
  region = "eu-south-2"
}

# Key Pair
resource "aws_key_pair" "instance_pub_key" {
  key_name   = "instance_key_frontend"
  public_key = file("../../security/instance_key.pub")
}

# IAM Role for SSM
resource "aws_iam_role" "ssm_role" {
  name = "ssm_full_acces_"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "ec2.amazonaws.com" },
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_full_access" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMFullAccess"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_security_group" "paus-security-group" {
  name = "paus-security-group"
  id   = "sg-0ceebb5821128f97d"
}

data "aws_iam_instance_profile" "ssm-fullacces" {
  name = "ssm-fullacces"
}

resource "aws_eip" "main_api_eip" {
  domain = "vpc"
  tags = {
    Name = "Fundy Frontend web server"
  }
}

resource "aws_instance" "web_server" {
  ami                    = var.ami_id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.instance_pub_key.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [data.aws_security_group.paus-security-group.id]
  iam_instance_profile   = data.aws_iam_instance_profile.ssm-fullacces.name

  tags = {
    Name = "Fundy WebServer"
    Type = "Pau's architecture"
  }

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  lifecycle {
    ignore_changes = [ami] # Prevent Terraform from recreating due to AMI drift
  }

  # Push changes locally before proceeding
  provisioner "local-exec" {
    command = <<EOT
      cd .. &&
      cd .. &&
      git add . &&
      git commit -m "${var.commit_message}" &&
      git push -u origin main
    EOT
  }

  # Copy all scripts from local to remote
  provisioner "file" {
    source      = "/home/mrpau/Desktop/Secret_Project/other_layers/front_end/web-server/scripts"
    destination = "/home/ubuntu/scripts"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = self.public_ip
    }
  }

  # Run source.sh after scripts are copied and before build.sh
  provisioner "remote-exec" {
    inline = [
      "chmod +x /home/ubuntu/scripts/*",
      "bash /home/ubuntu/scripts/CI/source.sh",
      "mkdir -p /home/ubuntu/nginx_frontend/.env"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = self.public_ip
    }
  }

  provisioner "file" {
    source      = "/home/mrpau/Desktop/Secret_Project/other_layers/front_end/web-server/.env/test.env"
    destination = "/home/ubuntu/nginx_frontend/.env/test.env"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = self.public_ip
    }
  }

}

# Associate the EIP after the instance is created
resource "aws_eip_association" "main_api_eip_assoc" {
  instance_id   = aws_instance.web_server.id
  allocation_id = aws_eip.main_api_eip.id
}

resource "null_resource" "post_eip_setup" {
  depends_on = [aws_eip_association.main_api_eip_assoc]

  provisioner "remote-exec" {
    inline = [
      "chmod +x /home/ubuntu/scripts/CI/build.sh",
      "bash /home/ubuntu/scripts/CI/build.sh"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = aws_eip.main_api_eip.public_ip
    }
  }
}

resource "null_resource" "update_container" {
  depends_on = [aws_instance.web_server]

  triggers = {
    manual_trigger = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
      cd .. &&
      cd .. &&
      git add . &&
      git commit -m "${var.commit_message}" &&
      git push -u origin main
    EOT
  }

  # Re-upload the scripts/CI directory to ensure updated build.sh is present
  provisioner "file" {
    source      = "/home/mrpau/Desktop/Secret_Project/other_layers/front_end/web-server/scripts/CI"
    destination = "/home/ubuntu/scripts/CI"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = aws_eip.main_api_eip.public_ip
    }
  }

  # Update .env file if needed
  provisioner "file" {
    source      = "/home/mrpau/Desktop/Secret_Project/other_layers/front_end/web-server/.env/test.env"
    destination = "/home/ubuntu/scripts/.env/test.env"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = aws_eip.main_api_eip.public_ip
    }
  }

  provisioner "remote-exec" {
    inline = [
      "sudo chown -R ubuntu:ubuntu /home/ubuntu/nginx_frontend",
      "chmod +x /home/ubuntu/scripts/CI/*",
      "git -C /home/ubuntu/nginx_frontend reset --hard",
      "git -C /home/ubuntu/nginx_frontend config pull.rebase false",
      "git -C /home/ubuntu/nginx_frontend pull origin main",
      "bash /home/ubuntu/scripts/CI/build.sh",
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("../../security/instance_key")
      host        = aws_eip.main_api_eip.public_ip
    }
  }
}

output "elastic_ip" {
  value       = aws_eip.main_api_eip.public_ip
  description = "The Elastic IP address associated with the EC2 instance."
}
