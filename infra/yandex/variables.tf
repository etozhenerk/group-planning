variable "cloud_id" {
  description = "ID облака владельца. Токен передаётся отдельно через YC_TOKEN."
  type        = string
}

variable "folder_id" {
  description = "ID существующего каталога для ресурсов somewhere."
  type        = string
}

variable "zone" {
  description = "Зона с подтверждённой квотой SSD для boot_disk_gib."
  type        = string
  default     = "ru-central1-d"
}

variable "boot_disk_gib" {
  description = "SSD: 10 ГБ для старта; расширение до 40 ГБ после проверки свободного места и плана без замены диска."
  type        = number
  default     = 10

  validation {
    condition     = var.boot_disk_gib >= 10 && var.boot_disk_gib <= 40 && floor(var.boot_disk_gib) == var.boot_disk_gib
    error_message = "Нужен целый размер 10–40 ГБ: минимум образа Ubuntu и предел принятой сметы."
  }
}

variable "subnet_id" {
  description = "ID существующей подсети; её сеть и правила не изменяются."
  type        = string
}

variable "image_id" {
  description = "Проверенный ID официального Ubuntu 24.04 LTS; фиксируется перед plan."
  type        = string
}

variable "admin_ipv4_cidr" {
  description = "Единственный публичный IPv4 администратора в формате x.x.x.x/32."
  type        = string

  validation {
    condition     = can(cidrnetmask(var.admin_ipv4_cidr)) && endswith(var.admin_ipv4_cidr, "/32")
    error_message = "SSH разрешён только одному IPv4 /32, не всей сети или Интернету."
  }
}

variable "admin_ssh_public_key" {
  description = "Открытый SSH Ed25519-ключ администратора, без закрытого ключа."
  type        = string

  validation {
    condition     = can(regex("^ssh-ed25519 [A-Za-z0-9+/=]+( [^\\r\\n]+)?$", var.admin_ssh_public_key))
    error_message = "Нужен однострочный открытый ssh-ed25519 ключ."
  }
}
