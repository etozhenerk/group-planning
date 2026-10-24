mock_provider "yandex" {
  mock_data "yandex_vpc_subnet" {
    defaults = {
      network_id = "test-network"
      zone       = "ru-central1-d"
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
  telegram_bot_enabled = true
  telegram_async_enabled = true
  telegram_bot = {
    chat_id        = "123456789"
    release_zip    = "README.md"
    release_sha256 = filesha256("README.md")
    dashboards     = { vm = "test-vm", postgres = "test-postgres" }
  }
}

run "private_bot_plan" {
  command = plan

  assert {
    condition = (
      yandex_function.telegram[0].memory == 128 &&
      yandex_function.telegram[0].execution_timeout == "35" &&
      yandex_function.telegram[0].concurrency == 1 &&
      yandex_function.telegram[0].async_invocation[0].retries_count == 1 &&
      yandex_function.telegram[0].metadata_options[0].aws_v1_http_endpoint == 2 &&
      yandex_function.telegram[0].metadata_options[0].gce_http_endpoint == 1 &&
      toset(keys(yandex_function.telegram[0].environment)) == toset(["BOT_CONFIG_JSON"])
    )
    error_message = "Нужны ограниченные вызовы, GCE metadata и конфиг без токена в environment."
  }

  assert {
    condition = (
      yandex_resourcemanager_folder_iam_member.telegram_metrics[0].role == "monium.metrics.reader" &&
      yandex_lockbox_secret_iam_member.telegram_read[0].role == "lockbox.payloadViewer" &&
      toset(keys(yandex_function_iam_member.telegram_invoke)) == toset(["functions.functionInvoker", "functions.viewer"]) &&
      alltrue([for policy in yandex_function_scaling_policy.telegram[0].policy :
        policy.zone_instances_limit == 1 && policy.zone_requests_limit == 1
      ])
    )
    error_message = "Runtime только читает метрики и секрет; вызывающий аккаунт имеет права только на функцию."
  }
}

run "reject_unverified_release" {
  command = plan

  variables {
    telegram_bot = {
      chat_id        = "123456789"
      release_zip    = "README.md"
      release_sha256 = "incorrect"
      dashboards     = { vm = "test-vm", postgres = "test-postgres" }
    }
  }

  expect_failures = [yandex_function.telegram]
}

run "reject_unknown_recipient" {
  command = plan

  variables {
    telegram_bot = {
      chat_id        = "@unknown"
      release_zip    = "README.md"
      release_sha256 = filesha256("README.md")
      dashboards     = { vm = "test-vm", postgres = "test-postgres" }
    }
  }

  expect_failures = [yandex_function.telegram]
}
