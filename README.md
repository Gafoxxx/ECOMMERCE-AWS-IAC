# ECOMMERCE-AWS-IAC

Plataforma e-commerce construida con Node.js, Express, Sequelize y CloudFormation. El proyecto despliega una aplicacion web con catalogo, registro/login, carrito, checkout con datos de envio e integracion de Mercado Pago Checkout Pro en modo sandbox.

## Componentes principales

- Aplicacion web: HTML, CSS, JavaScript/jQuery, Express y Sequelize.
- Base de datos: RDS MySQL privado.
- Red: VPC, subredes publicas/privadas, Internet Gateway y NAT Gateway.
- Computo: dos EC2 privadas `t2.micro` ejecutando Node.js con PM2.
- Entrada publica: Application Load Balancer y CloudFront HTTPS.
- Administracion: Bastion Host publico `t2.micro`.
- Monitoreo: CloudWatch alarms, SNS y CloudTrail opcional.

## Flujo de la tienda

1. El usuario se registra o inicia sesion.
2. Explora productos con imagenes reales y vista previa.
3. Agrega productos al carrito.
4. Completa datos de envio.
5. Paga en Mercado Pago sandbox.
6. La app consulta el pago y muestra la pantalla de pedido confirmado, pendiente o rechazado.

## Despliegue rapido

Los stacks se despliegan en este orden:

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-networking \
  --template-file infra/networking.yaml

aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-database \
  --template-file infra/database.yaml \
  --parameter-overrides DBName='ecommercedb' DBUsername='dbadmin' DBPassword='CAMBIA_ESTA_PASSWORD'

aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-compute \
  --template-file infra/compute.yaml \
  --parameter-overrides \
    GitHubRepoUrl='https://github.com/Gafoxxx/ECOMMERCE-AWS-IAC' \
    GitHubBranch='main' \
    DBPassword='CAMBIA_ESTA_PASSWORD' \
    JWTSecret='CAMBIA_ESTE_SECRETO_LARGO' \
    UseCloudFrontBaseUrl='true' \
    MercadoPagoAccessToken='TOKEN_DE_PRUEBA' \
    MercadoPagoPublicKey='PUBLIC_KEY_DE_PRUEBA' \
    MercadoPagoWebhookUrl='' \
    PaymentDebugErrors='false'

aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-bastion \
  --template-file infra/bastion.yaml \
  --parameter-overrides KeyName='vockey' SSHLocation='0.0.0.0/0'

aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-monitoring \
  --template-file infra/monitoring.yaml \
  --parameter-overrides NotificationEmail='tu-correo@example.com' EnableCloudTrail='false'
```

La guia completa esta en [docs/Guia_Despliegue_AWS.md](docs/Guia_Despliegue_AWS.md).

## Documentacion

- [Guia de despliegue AWS](docs/Guia_Despliegue_AWS.md)
- [Cumplimiento de rubrica](docs/Cumplimiento_Rubrica.md)
- [Plan de proyecto](docs/Plan_Proyecto.md)

## Nota sobre el sandbox

El enunciado propone Auto Scaling, pero el sandbox de AWS Academy bloqueó `LaunchConfiguration` y `LaunchTemplate`. Por eso la version final usa dos EC2 privadas detras del ALB y deja Auto Scaling documentado como mejora para una cuenta AWS sin esa limitacion.

##Créditos del desarrollo:
- Presentado por: Juan Felipe Garzón Trejos - Sebastián Botero
- Curso: Infraestructura III
- Docente: Ing. Mario German Castillo Ramirez
