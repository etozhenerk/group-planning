locals {
  name   = "somewhere-mvp"
  labels = { project = "somewhere", environment = "mvp", managed_by = "terraform" }
}

data "yandex_vpc_subnet" "existing" {
  subnet_id = var.subnet_id
}

resource "yandex_iam_service_account" "runtime" {
  name        = "${local.name}-runtime"
  description = "Учётная запись ВМ somewhere; роли выдаются адресно при подключении сервисов."
  folder_id   = var.folder_id
}

resource "yandex_vpc_address" "public" {
  name      = local.name
  folder_id = var.folder_id
  labels    = local.labels

  external_ipv4_address {
    zone_id = var.zone
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "yandex_vpc_security_group" "app" {
  name        = local.name
  description = "HTTP/HTTPS публично; SSH только администратору; PostgreSQL и Go закрыты."
  folder_id   = var.folder_id
  network_id  = data.yandex_vpc_subnet.existing.network_id
  labels      = local.labels

  ingress {
    description    = "SSH администратора"
    protocol       = "TCP"
    port           = 22
    v4_cidr_blocks = [var.admin_ipv4_cidr]
  }

  ingress {
    description    = "HTTP redirect и ACME"
    protocol       = "TCP"
    port           = 80
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "HTTPS приложения"
    protocol       = "TCP"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description    = "Исходящие подключения к DNS, обновлениям и облачным API"
    protocol       = "ANY"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "yandex_compute_disk" "boot" {
  name      = "${local.name}-boot"
  folder_id = var.folder_id
  zone      = var.zone
  image_id  = var.image_id
  type      = "network-ssd"
  size      = var.boot_disk_gib
  labels    = local.labels

  lifecycle {
    prevent_destroy = true
  }
}

resource "yandex_compute_instance" "app" {
  name                      = local.name
  folder_id                 = var.folder_id
  zone                      = var.zone
  platform_id               = "standard-v3"
  service_account_id        = yandex_iam_service_account.runtime.id
  allow_stopping_for_update = false
  labels                    = local.labels

  resources {
    cores         = 2
    core_fraction = 50
    memory        = 4
  }

  boot_disk {
    disk_id     = yandex_compute_disk.boot.id
    auto_delete = false
  }

  network_interface {
    subnet_id          = var.subnet_id
    nat                = true
    nat_ip_address     = yandex_vpc_address.public.external_ipv4_address[0].address
    security_group_ids = [yandex_vpc_security_group.app.id]
  }

  scheduling_policy {
    preemptible = false
  }

  metadata = {
    serial-port-enable = "0"
    user-data = templatefile("${path.module}/cloud-init.yaml.tftpl", {
      admin_ssh_public_key = var.admin_ssh_public_key
    })
  }

  lifecycle {
    prevent_destroy = true

    precondition {
      condition     = data.yandex_vpc_subnet.existing.zone == var.zone
      error_message = "Зона подсети должна совпадать с зоной ВМ и диска."
    }
  }
}
