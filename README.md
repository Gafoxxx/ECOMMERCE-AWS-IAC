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

### Diseño de la solucion

**La solucion cumple con los requisitos del caso de estudio?**

Si. La aplicacion implementa catalogo de productos, registro e inicio de sesion, carrito de compras, checkout, procesamiento de pago en ambiente de prueba con Mercado Pago sandbox y pantalla final de pedido. A nivel de infraestructura, el proyecto incluye VPC, subredes publicas y privadas, EC2, Bastion Host, Application Load Balancer, RDS MySQL, CloudWatch, SNS y CloudFormation.

**La topologia es eficiente y escalable?**

La topologia es eficiente para el entorno academico porque separa responsabilidades: CloudFront entrega HTTPS, el ALB distribuye trafico, las EC2 ejecutan la aplicacion en subredes privadas y RDS conserva los datos en una capa privada. La arquitectura mantiene dos instancias de aplicacion detras del balanceador, lo que mejora disponibilidad frente a una sola EC2. La parte de escalado automatico quedo adaptada por restricciones del sandbox, pero el diseno permite migrar a un Auto Scaling Group en una cuenta AWS sin esas limitaciones.

**Se han aplicado correctamente los principios de seguridad?**

Si. La base de datos no es publica, las EC2 de la aplicacion estan en subredes privadas, el acceso externo entra por CloudFront y ALB, y los security groups limitan el trafico entre capas. Los secretos se pasan como parametros de CloudFormation y no deben versionarse en Git. El Bastion Host permite un punto de administracion controlado y CloudFront agrega HTTPS sin depender de Route53.

### Implementacion de CloudFormation

**Los templates de CloudFormation son claros y concisos?**

Si. La infraestructura esta separada por responsabilidad en plantillas independientes: networking, database, compute, bastion y monitoring. Esto facilita leer, desplegar y depurar cada capa sin mezclar toda la arquitectura en un solo archivo.

**La infraestructura se despliega de manera correcta y reproducible?**

Si. Los stacks se despliegan con comandos documentados y usan exports/imports para conectar recursos entre plantillas. El despliegue sigue un orden definido: primero red, luego base de datos, computo, bastion y monitoreo. Los parametros permiten cambiar contrasenas, rama de GitHub, credenciales de Mercado Pago y correo de alertas sin modificar el codigo.

### Automatizacion

**Se ha utilizado la automatizacion para configurar las instancias y la aplicacion?**

Si. Las EC2 se configuran mediante UserData: instalan Node.js, Git y PM2, clonan el repositorio, crean el archivo `.env`, instalan dependencias y levantan la aplicacion. Tambien existe `scripts/install_dependencies.sh` como script reutilizable de instalacion.

**Se han implementado mecanismos de auto escalado?**

Parcialmente por restricciones del laboratorio. El diseno original contemplaba Auto Scaling, pero AWS Academy bloqueo `LaunchConfiguration` y `LaunchTemplate`, que son necesarios para crear grupos de auto escalado. Como alternativa viable dentro del sandbox, se dejaron dos EC2 privadas registradas en el Target Group del ALB. En una cuenta AWS normal, esas instancias se reemplazarian por un Auto Scaling Group con minimo 2, deseado 2 y maximo segun la demanda.

### Documentacion

**La documentacion es clara, concisa y completa?**

Si. El repositorio incluye una guia de despliegue, plan de proyecto, cumplimiento de rubrica y este README. La documentacion explica los comandos de despliegue, la arquitectura, las restricciones del sandbox, el flujo de Mercado Pago, la verificacion y los puntos adaptados.

### Presentacion

**La presentacion es clara y concisa?**

La sustentacion puede apoyarse en este README y en los documentos de `docs/`. La explicacion recomendada sigue una estructura simple: objetivo del proyecto, arquitectura AWS, flujo de compra, despliegue con CloudFormation, seguridad, monitoreo, retos encontrados y adaptaciones por el sandbox.

**Se han explicado los conceptos tecnicos de manera sencilla?**

Si. La solucion puede explicarse con el flujo principal: el usuario entra por CloudFront HTTPS, CloudFront envia el trafico al ALB, el ALB distribuye hacia las EC2 privadas, la aplicacion consulta RDS MySQL y Mercado Pago procesa el pago en sandbox. Esta secuencia resume los conceptos tecnicos sin perder claridad.

### Bases de datos

**Se exploraron diferentes tipos de bases de datos y su idoneidad?**

Si. Para este caso se eligio RDS MySQL porque el e-commerce maneja datos relacionales: usuarios, productos, carritos, ordenes y detalles de orden. Estas entidades tienen relaciones claras y Sequelize facilita modelarlas. DynamoDB podria servir para carritos o eventos de alta escala, pero agregaria complejidad innecesaria para el alcance academico. ElastiCache/Redis podria mejorar sesiones, cache de catalogo o carritos temporales, pero no reemplaza la persistencia principal de ordenes y usuarios. Por eso RDS MySQL es la opcion mas adecuada para esta entrega.

Presentado por: Juan Felipe Garzón Trejos - Sebastián Botero
