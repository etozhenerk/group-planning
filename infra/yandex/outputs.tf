output "public_ipv4" {
  description = "IPv4 для записи A домена smwhere.ru после готовности приложения."
  value       = yandex_vpc_address.public.external_ipv4_address[0].address
}

output "instance_id" {
  value = yandex_compute_instance.app.id
}

output "disk_id" {
  value = yandex_compute_disk.boot.id
}

output "runtime_service_account_id" {
  value = yandex_iam_service_account.runtime.id
}
