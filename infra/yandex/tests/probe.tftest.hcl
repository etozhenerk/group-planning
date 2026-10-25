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
  probe_enabled        = true
  probe_timer_enabled  = true
  probe = {
    origin         = "https://smwhere.ru"
    release_zip    = "README.md"
    release_sha256 = filesha256("README.md")
  }
}

run "bounded_private_probe" {
  command = plan

  assert {
    condition = (
      yandex_function.probe[0].memory == 256 &&
      yandex_function.probe[0].execution_timeout == "30" &&
      yandex_function.probe[0].concurrency == 1 &&
      toset(keys(yandex_function.probe[0].environment)) == toset(["PROBE_CONFIG_JSON"]) &&
      yandex_resourcemanager_folder_iam_member.probe_metrics[0].role == "monium.metrics.writer" &&
      yandex_function_iam_member.probe_invoke[0].role == "functions.functionInvoker" &&
      alltrue([for policy in yandex_function_scaling_policy.probe[0].policy :
        policy.zone_instances_limit == 1 && policy.zone_requests_limit == 1
      ])
    )
    error_message = "Проверка должна иметь ограниченные вызовы, только запись метрик и отдельного invoker."
  }

  assert {
    condition = (
      yandex_function_trigger.probe[0].timer[0].cron_expression == "* * * * ? *" &&
      yandex_function_trigger.probe[0].function[0].tag == "production" &&
      yandex_function_trigger.probe[0].function[0].retry_attempts == "1"
    )
    error_message = "Таймер вызывает production раз в минуту с максимум одним повтором."
  }
}

run "deploy_before_scheduling" {
  command = plan

  variables {
    probe_timer_enabled = false
  }

  assert {
    condition     = length(yandex_function.probe) == 1 && length(yandex_function_trigger.probe) == 0
    error_message = "Первую версию нужно проверить до создания таймера."
  }
}

run "reject_unverified_probe_release" {
  command = plan

  variables {
    probe = {
      origin         = "https://smwhere.ru"
      release_zip    = "README.md"
      release_sha256 = "incorrect"
    }
  }

  expect_failures = [yandex_function.probe]
}

run "reject_private_probe_target" {
  command = plan

  variables {
    probe = {
      origin         = "http://127.0.0.1:8080/private"
      release_zip    = "README.md"
      release_sha256 = filesha256("README.md")
    }
  }

  expect_failures = [yandex_function.probe]
}
