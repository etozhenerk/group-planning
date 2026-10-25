variable "probe_enabled" {
  description = "Включить отдельную HTTPS-проверку после готовности DNS, TLS и /readyz."
  type        = bool
  default     = false
}

variable "probe_timer_enabled" {
  description = "Запустить минутный таймер после проверки ACTIVE-версии и записи метрик."
  type        = bool
  default     = false
}

variable "probe" {
  description = "Origin и проверенный monitoring release; токен Telegram этой функции не нужен."
  type = object({
    origin         = string
    release_zip    = string
    release_sha256 = string
  })
  default = null
}

resource "yandex_iam_service_account" "probe_runtime" {
  count       = var.probe_enabled ? 1 : 0
  name        = "${local.name}-probe"
  folder_id   = var.folder_id
  description = "Запись агрегированных результатов HTTPS-проверки в Monium."
}

resource "yandex_iam_service_account" "probe_invoker" {
  count       = var.probe_enabled ? 1 : 0
  name        = "${local.name}-probe-invoker"
  folder_id   = var.folder_id
  description = "Минутный таймер: вызов одной закрытой функции проверки."
}

resource "yandex_resourcemanager_folder_iam_member" "probe_metrics" {
  count     = var.probe_enabled ? 1 : 0
  folder_id = var.folder_id
  role      = "monium.metrics.writer"
  member    = "serviceAccount:${yandex_iam_service_account.probe_runtime[0].id}"
}

resource "yandex_function" "probe" {
  count              = var.probe_enabled ? 1 : 0
  name               = "${local.name}-probe"
  folder_id          = var.folder_id
  description        = "Проверка фиксированного HTTPS /readyz вне ВМ приложения."
  labels             = local.labels
  runtime            = "golang123"
  entrypoint         = "probe.Probe"
  memory             = 256
  execution_timeout  = "30"
  concurrency        = 1
  service_account_id = yandex_iam_service_account.probe_runtime[0].id
  user_hash          = var.probe.release_sha256
  tags               = ["production"]

  content {
    zip_filename = var.probe.release_zip
  }

  environment = {
    PROBE_CONFIG_JSON = jsonencode({
      folder_id = var.folder_id
      origin    = var.probe.origin
    })
  }

  metadata_options {
    aws_v1_http_endpoint = 2
    gce_http_endpoint    = 1
  }

  lifecycle {
    prevent_destroy = true

    precondition {
      condition     = filesha256(var.probe.release_zip) == var.probe.release_sha256
      error_message = "ZIP должен совпадать с SHA-256 проверенного monitoring release."
    }

    precondition {
      condition     = can(regex("^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\\.[a-z]{2,}$", var.probe.origin))
      error_message = "Нужен HTTPS-origin публичного домена без пути, порта и учётных данных."
    }
  }

  depends_on = [yandex_resourcemanager_folder_iam_member.probe_metrics]
}

resource "yandex_function_iam_member" "probe_invoke" {
  count       = var.probe_enabled ? 1 : 0
  function_id = yandex_function.probe[0].id
  role        = "functions.functionInvoker"
  member      = "serviceAccount:${yandex_iam_service_account.probe_invoker[0].id}"
}

resource "yandex_function_scaling_policy" "probe" {
  count       = var.probe_enabled ? 1 : 0
  function_id = yandex_function.probe[0].id

  dynamic "policy" {
    for_each = toset(["production", "$latest"])
    content {
      tag                  = policy.value
      zone_instances_limit = 1
      zone_requests_limit  = 1
    }
  }
}

resource "yandex_function_trigger" "probe" {
  count       = var.probe_enabled && var.probe_timer_enabled ? 1 : 0
  name        = "${local.name}-probe-minute"
  folder_id   = var.folder_id
  labels      = local.labels
  description = "Проверка HTTPS каждую минуту; не зависит от агента на ВМ."

  timer {
    cron_expression = "* * * * ? *"
  }

  function {
    id                 = yandex_function.probe[0].id
    tag                = "production"
    service_account_id = yandex_iam_service_account.probe_invoker[0].id
    retry_attempts     = "1"
    retry_interval     = "10"
  }

  depends_on = [yandex_function_iam_member.probe_invoke, yandex_function_scaling_policy.probe]
}

output "probe_deployment" {
  value = var.probe_enabled ? {
    function_id = yandex_function.probe[0].id
    version_id  = yandex_function.probe[0].version
    runtime_id  = yandex_iam_service_account.probe_runtime[0].id
    invoker_id  = yandex_iam_service_account.probe_invoker[0].id
    timer_id    = var.probe_timer_enabled ? yandex_function_trigger.probe[0].id : null
  } : null
}
