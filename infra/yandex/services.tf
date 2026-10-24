resource "yandex_storage_bucket" "operations" {
  bucket                  = "somewhere-ops-${var.folder_id}"
  folder_id               = var.folder_id
  default_storage_class   = "STANDARD"
  max_size                = 21474836480
  force_destroy           = false
  disabled_statickey_auth = true

  anonymous_access_flags {
    read        = false
    list        = false
    config_read = false
  }

  lifecycle_rule {
    id      = "database-dumps-seven-days"
    enabled = true
    filter {
      prefix = "database/"
    }
    expiration {
      days = 7
    }
    abort_incomplete_multipart_upload_days = 1
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "yandex_storage_bucket_iam_binding" "backup_upload" {
  bucket  = yandex_storage_bucket.operations.bucket
  role    = "storage.uploader"
  members = ["serviceAccount:${yandex_iam_service_account.runtime.id}"]
}

resource "yandex_resourcemanager_folder_iam_member" "metrics_write" {
  folder_id = var.folder_id
  role      = "monium.metrics.writer"
  member    = "serviceAccount:${yandex_iam_service_account.runtime.id}"
}

resource "yandex_lockbox_secret" "configuration" {
  for_each            = toset(["oauth", "application", "backup"])
  name                = "${local.name}-${each.key}"
  description         = "Конфигурация somewhere: ${each.key}. Значения добавляются отдельно от Terraform/state."
  folder_id           = var.folder_id
  deletion_protection = true
  labels              = local.labels

  lifecycle {
    prevent_destroy = true
  }
}

resource "yandex_lockbox_secret_iam_member" "configuration_read" {
  for_each  = yandex_lockbox_secret.configuration
  secret_id = each.value.id
  role      = "lockbox.payloadViewer"
  member    = "serviceAccount:${yandex_iam_service_account.runtime.id}"
}
