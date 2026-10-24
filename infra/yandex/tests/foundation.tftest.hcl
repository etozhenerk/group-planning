mock_provider "yandex" {
  mock_data "yandex_vpc_subnet" {
    defaults = {
      network_id = "test-network"
      zone       = "ru-central1-a"
    }
  }
}

variables {
  cloud_id             = "test-cloud"
  folder_id            = "test-folder"
  subnet_id            = "test-subnet"
  image_id             = "test-image"
  admin_ipv4_cidr      = "203.0.113.10/32"
  admin_ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
}

run "foundation_plan" {
  command = plan

  assert {
    condition = (
      yandex_compute_instance.app.resources[0].cores == 2 &&
      yandex_compute_instance.app.resources[0].core_fraction == 50 &&
      yandex_compute_instance.app.resources[0].memory == 4 &&
      !yandex_compute_instance.app.scheduling_policy[0].preemptible &&
      yandex_compute_disk.boot.size == 40 &&
      yandex_compute_disk.boot.type == "network-ssd"
    )
    error_message = "Конфигурация должна соответствовать принятой смете A."
  }

  assert {
    condition = (
      toset([for rule in yandex_vpc_security_group.app.ingress : rule.port]) == toset([22, 80, 443]) &&
      alltrue([for rule in yandex_vpc_security_group.app.ingress : rule.protocol == "TCP"]) &&
      alltrue([for rule in yandex_vpc_security_group.app.ingress :
        rule.port != 22 || (length(rule.v4_cidr_blocks) == 1 && contains(rule.v4_cidr_blocks, var.admin_ipv4_cidr))
      ])
    )
    error_message = "Снаружи допустимы только HTTP/HTTPS и SSH с адреса администратора."
  }

  assert {
    condition = (
      !yandex_compute_instance.app.boot_disk[0].auto_delete &&
      !yamldecode(yandex_compute_instance.app.metadata["user-data"]).ssh_pwauth &&
      yamldecode(yandex_compute_instance.app.metadata["user-data"]).disable_root
    )
    error_message = "Нельзя удалять диск вместе с ВМ или включать парольный/root-вход."
  }
}

run "reject_public_ssh" {
  command = plan

  variables {
    admin_ipv4_cidr = "0.0.0.0/0"
  }

  expect_failures = [var.admin_ipv4_cidr]
}

run "reject_private_key" {
  command = plan

  variables {
    admin_ssh_public_key = "-----BEGIN OPENSSH PRIVATE KEY-----"
  }

  expect_failures = [var.admin_ssh_public_key]
}

run "reject_wrong_zone" {
  command = plan

  variables {
    zone = "ru-central1-d"
  }

  expect_failures = [yandex_compute_instance.app]
}
