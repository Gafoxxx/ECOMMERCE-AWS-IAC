# Guia de despliegue en AWS

Esta guia describe el orden recomendado para desplegar la plataforma e-commerce con CloudFormation.

## Prerrequisitos

- AWS CLI configurado con credenciales del laboratorio.
- Repositorio publicado en GitHub para que las instancias EC2 puedan clonarlo.
- Un email valido para recibir alertas SNS.

## Orden de stacks

Los stacks deben desplegarse en este orden porque usan exports/imports entre plantillas:

1. `infra/networking.yaml`: VPC, subredes publicas, subredes privadas, NAT Gateway y security group base de la aplicacion.
2. `infra/database.yaml`: RDS MySQL privado en subredes privadas.
3. `infra/compute.yaml`: Application Load Balancer, Launch Configuration y Auto Scaling Group.
4. `infra/bastion.yaml`: Bastion Host publico para acceso administrativo controlado.
5. `infra/monitoring.yaml`: CloudWatch alarms, SNS y CloudTrail opcional.

## Comandos

Reemplaza los valores de ejemplo antes de ejecutar.

```bash
aws cloudformation deploy \
  --stack-name ecommerce-networking \
  --template-file infra/networking.yaml
```

```bash
aws cloudformation deploy \
  --stack-name ecommerce-database \
  --template-file infra/database.yaml \
  --parameter-overrides \
    DBName=ecommercedb \
    DBUsername=dbadmin \
    DBPassword='CambiarPassword123'
```

```bash
aws cloudformation deploy \
  --stack-name ecommerce-compute \
  --template-file infra/compute.yaml \
  --parameter-overrides \
    GitHubRepoUrl='https://github.com/Gafoxxx/ECOMMERCE-AWS-IAC' \
    GitHubBranch='main' \
    DBPassword='CambiarPassword123' \
    JWTSecret='cambiar-por-un-secreto-largo-y-seguro'
```

```bash
aws cloudformation deploy \
  --stack-name ecommerce-bastion \
  --template-file infra/bastion.yaml \
  --parameter-overrides \
    KeyName='vockey' \
    SSHLocation='0.0.0.0/0'
```

Para una configuracion mas segura, reemplaza `SSHLocation='0.0.0.0/0'` por tu IP publica en formato `/32`, por ejemplo `203.0.113.10/32`.

```bash
aws cloudformation deploy \
  --stack-name ecommerce-monitoring \
  --template-file infra/monitoring.yaml \
  --parameter-overrides \
    NotificationEmail='tu-correo@example.com' \
    EnableCloudTrail=false
```

Despues de desplegar `ecommerce-monitoring`, confirma la suscripcion que llegara al correo configurado en SNS.

Si el nombre `ecommerce-monitoring` quedo bloqueado por un rollback anterior de CloudTrail, usa `ecommerce-monitoring-v2` como nombre del stack.

Si el laboratorio permite crear CloudTrail, cambia `EnableCloudTrail=false` por `EnableCloudTrail=true`. En algunos sandboxes academicos esta accion esta bloqueada por permisos IAM.

## Verificacion

Obtiene la URL publica del balanceador:

```bash
aws cloudformation describe-stacks \
  --stack-name ecommerce-compute \
  --query "Stacks[0].Outputs[?OutputKey=='ALBUrl'].OutputValue" \
  --output text
```

Abre la URL entregada por el ALB y valida:

- `GET /health` responde `{"status":"ok"}`.
- El catalogo carga productos.
- El registro/login funciona.
- El carrito permite agregar y eliminar productos.
- El checkout simulado crea una orden y vacia el carrito.

## Seguridad aplicada

- Las instancias EC2 de la aplicacion se ubican en subredes privadas.
- El ALB es el unico punto publico HTTP.
- RDS no es publico y solo acepta MySQL desde el security group de la aplicacion.
- El Bastion Host vive en una subred publica y restringe SSH por CIDR configurable.
- CloudTrail puede registrar actividad de la cuenta en un bucket S3 privado si el laboratorio permite `cloudtrail:CreateTrail`.

## Monitoreo

El stack `monitoring.yaml` crea:

- Alarma de CPU alta del Auto Scaling Group.
- Alarma de targets no saludables en el ALB.
- Alarma de errores 5XX de la aplicacion.
- Topico SNS para notificaciones por email.
- CloudTrail opcional con validacion de logs.

## Auto Scaling

El stack `compute.yaml` mantiene dos instancias por defecto y escala hasta seis instancias. La politica `TargetTrackingScaling` busca mantener la CPU promedio del Auto Scaling Group alrededor del 60 por ciento, respetando el limite del laboratorio de maximo 9 instancias EC2.
