variable "telegram_bot_enabled" {
  description = "Включить закрытую функцию уведомлений после подготовки получателя и релизного ZIP."
  type        = bool
  default     = false
}

variable "telegram_async_enabled" {
  description = "Включить после первого apply, когда invoker уже получил права на созданную функцию."
  type        = bool
  default     = false
}

variable "telegram_bot" {
  description = "Локальная конфигурация бота. Сам токен загружается в Lockbox отдельно от Terraform."
  type = object({
    chat_id        = string
    release_zip    = string
    release_sha256 = string
    dashboards     = map(string)
  })
  default = null
}

resource "yandex_iam_service_account" "telegram_runtime" {
  count       = var.telegram_bot_enabled ? 1 : 0
  name        = "${local.name}-telegram"
  folder_id   = var.folder_id
  description = "Чтение метрик и одного Lockbox-секрета для Telegram-уведомлений."
}

resource "yandex_iam_service_account" "telegram_invoker" {
  count       = var.telegram_bot_enabled ? 1 : 0
  name        = "${local.name}-alerts-invoker"
  folder_id   = var.folder_id
  description = "Вызов одной закрытой функции из Monium."
}

resource "yandex_lockbox_secret" "telegram" {
  name                = "${local.name}-telegram"
  folder_id           = var.folder_id
  labels              = local.labels
  description         = "Токен бота; payload загружается отдельно, не хранится в Terraform state."
  deletion_protection = true

  lifecycle {
    prevent_destroy = true
  }
}

resource "yandex_lockbox_secret_iam_member" "telegram_read" {
  count     = var.telegram_bot_enabled ? 1 : 0
  secret_id = yandex_lockbox_secret.telegram.id
  role      = "lockbox.payloadViewer"
  member    = "serviceAccount:${yandex_iam_service_account.telegram_runtime[0].id}"
}

resource "yandex_resourcemanager_folder_iam_member" "telegram_metrics" {
  count     = var.telegram_bot_enabled ? 1 : 0
  folder_id = var.folder_id
  role      = "monium.metrics.reader"
  member    = "serviceAccount:${yandex_iam_service_account.telegram_runtime[0].id}"
}

resource "yandex_function" "telegram" {
  count              = var.telegram_bot_enabled ? 1 : 0
  name               = "${local.name}-telegram"
  folder_id          = var.folder_id
  description        = "Telegram-уведомления из проверенного monitoring release."
  labels             = local.labels
  runtime            = "golang123"
  entrypoint         = "handler.Handler"
  memory             = 128
  execution_timeout  = "35"
  concurrency        = 1
  service_account_id = yandex_iam_service_account.telegram_runtime[0].id
  user_hash          = "${var.telegram_bot.release_sha256}:async=${var.telegram_async_enabled}"
  tags               = ["production"]

  content {
    zip_filename = var.telegram_bot.release_zip
  }

  environment = {
    BOT_CONFIG_JSON = jsonencode({
      folder_id   = var.folder_id
      instance_id = yandex_compute_instance.app.id
      environment = "production"
      chat_id     = var.telegram_bot.chat_id
      secret_id   = yandex_lockbox_secret.telegram.id
      dashboards  = var.telegram_bot.dashboards
    })
  }

  metadata_options {
    aws_v1_http_endpoint = 2
    gce_http_endpoint    = 1
  }

  dynamic "async_invocation" {
    for_each = var.telegram_async_enabled ? [true] : []
    content {
      retries_count      = 1
      service_account_id = yandex_iam_service_account.telegram_invoker[0].id
    }
  }

  lifecycle {
    prevent_destroy = true

    precondition {
      condition     = filesha256(var.telegram_bot.release_zip) == var.telegram_bot.release_sha256
      error_message = "ZIP должен совпадать с SHA-256 проверенного monitoring release."
    }

    precondition {
      condition     = can(regex("^-?[1-9][0-9]*$", var.telegram_bot.chat_id))
      error_message = "Нужен подтверждённый numeric Telegram chat ID."
    }
  }
}

resource "yandex_function_iam_member" "telegram_invoke" {
  for_each    = var.telegram_bot_enabled ? toset(["functions.functionInvoker", "functions.viewer"]) : toset([])
  function_id = yandex_function.telegram[0].id
  role        = each.value
  member      = "serviceAccount:${yandex_iam_service_account.telegram_invoker[0].id}"
}

resource "yandex_function_scaling_policy" "telegram" {
  count       = var.telegram_bot_enabled ? 1 : 0
  function_id = yandex_function.telegram[0].id

  dynamic "policy" {
    for_each = toset(["production", "$latest"])
    content {
      tag                  = policy.value
      zone_instances_limit = 1
      zone_requests_limit  = 1
    }
  }
}

output "telegram_deployment" {
  value = var.telegram_bot_enabled ? {
    function_id = yandex_function.telegram[0].id
    version_id  = yandex_function.telegram[0].version
    secret_id   = yandex_lockbox_secret.telegram.id
    invoker_id  = yandex_iam_service_account.telegram_invoker[0].id
    runtime_id  = yandex_iam_service_account.telegram_runtime[0].id
  } : null
}

output "telegram_token_secret_id" {
  value = yandex_lockbox_secret.telegram.id
}
