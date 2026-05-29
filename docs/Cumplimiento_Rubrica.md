# Cumplimiento de rubrica

## Funcionalidades de la aplicacion

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| Catalogo de productos | Cumplido | `app/routes/products.js`, `app/models/Product.js` y `app/public/index.html` muestran nombre, descripcion, precio, stock e imagenes reales. |
| Carrito de compras | Cumplido | `app/routes/cart.js`, `app/models/Cart.js` y `app/models/CartItem.js` permiten agregar, eliminar y calcular total. |
| Registro e inicio de sesion | Cumplido | `app/routes/auth.js`, `app/models/User.js`, JWT y bcrypt. |
| API REST | Cumplido | Rutas `/api/auth`, `/api/products`, `/api/cart`, `/api/checkout`, `/api/payments` y `/api/upload`. |
| ORM | Cumplido | Sequelize en `app/config/db.js` y modelos bajo `app/models`. |
| Proceso de pago simulado | Cumplido/mejorado | El enunciado pide pago ficticio. El proyecto usa Mercado Pago Checkout Pro en sandbox, por lo que el pago sigue siendo de prueba pero con flujo realista. |
| Pantalla de pedido confirmado | Cumplido | Retornos `/payment/success`, `/payment/failure`, `/payment/pending` consultan estado y muestran datos de orden y envio. |

## Infraestructura AWS

| Requisito | Estado | Implementacion |
| --- | --- | --- |
| VPC privada y aislamiento | Cumplido | `infra/networking.yaml` crea VPC dedicada con DNS habilitado. |
| Subredes publicas y privadas | Cumplido | Dos publicas para ALB/bastion y dos privadas para aplicacion/RDS. |
| Internet Gateway y NAT Gateway | Cumplido | Publicas salen por IGW; privadas salen por NAT para instalar dependencias y clonar GitHub. |
| EC2 para ejecutar la aplicacion | Cumplido | `infra/compute.yaml` crea dos EC2 `t2.micro` privadas con Amazon Linux 2023, Node.js y PM2. |
| Bastion Host | Cumplido | `infra/bastion.yaml` crea una instancia `t2.micro` en subred publica con SSH restringible por CIDR. |
| Application Load Balancer | Cumplido | `infra/compute.yaml` crea ALB publico, listener HTTP y Target Group hacia puerto 3000. |
| HTTPS publico | Cumplido como mejora | CloudFront entrega HTTPS con certificado administrado por AWS y reenvia al ALB por HTTP. |
| Auto Scaling | Parcial/adaptado | El diseno original lo contemplaba, pero AWS Academy bloqueo `LaunchConfiguration` y `LaunchTemplate`. La version final mantiene dos instancias privadas balanceadas; el auto escalado queda como mejora para una cuenta sin esa restriccion. |
| RDS | Cumplido | `infra/database.yaml` crea RDS MySQL `db.t3.micro` privado. |
| RDS sin Multi-AZ | Cumplido | No se habilita Multi-AZ, alineado con la restriccion del sandbox. |
| S3 para estaticos | No requerido | El enunciado lo marca como opcional. Los assets se sirven desde Express. |
| Route53 | No aplica | El enunciado indica que el sandbox no permite registrar dominios. |
| Systems Manager Session Manager | Adaptado por permisos | Requiere perfiles IAM/SSM que el sandbox no deja administrar completamente. Se incluye Bastion Host como mecanismo de administracion solicitado. |
| CloudWatch | Cumplido | `infra/monitoring.yaml` crea alarmas para CPU de EC2, targets no saludables y errores 5XX. |
| SNS | Cumplido | `infra/monitoring.yaml` crea topic y suscripcion por email. |
| CloudTrail | Parcial por permisos | El template lo soporta con `EnableCloudTrail=true`, pero algunos sandboxes bloquean `cloudtrail:CreateTrail`. |
| Tagging | Cumplido | Recursos principales incluyen etiquetas `Name` y `Project` cuando aplica. |
| Seguridad de red | Cumplido | ALB publico, app privada, RDS privado y reglas por security group. |

## CloudFormation y automatizacion

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| Infraestructura como codigo | Cumplido | Plantillas en `infra/*.yaml`. |
| Despliegue reproducible | Cumplido | Guia con comandos por stack en `docs/Guia_Despliegue_AWS.md`. |
| Scripts de configuracion | Cumplido | `UserData` de `infra/compute.yaml` instala Node.js, Git, PM2, clona GitHub, crea `.env`, instala dependencias y levanta la app. |
| Parametrizacion | Cumplido | Password DB, JWT secret, rama GitHub, URL base y credenciales Mercado Pago se pasan por parametros. |
| Optimizacion de recursos | Cumplido | Instancias `t2.micro`, RDS `db.t3.micro`, volumenes de 8 GB para EC2 y CloudFront `PriceClass_100`. |

## Entregables

| Entregable | Estado | Evidencia |
| --- | --- | --- |
| Plan de proyecto | Cumplido | `docs/Plan_Proyecto.md`. |
| Codigo en repositorio Git | Cumplido | Aplicacion, infraestructura y documentacion estan versionadas. |
| Scripts de configuracion | Cumplido | `scripts/install_dependencies.sh` y `UserData` en CloudFormation. |
| Documentacion de despliegue | Cumplido | `docs/Guia_Despliegue_AWS.md`. |
| Presentacion | Pendiente fuera del repo | El enunciado la solicita. Debe prepararse con arquitectura, desafios y lecciones aprendidas. |

## Riesgos y notas para sustentacion

- Auto Scaling es el unico punto funcionalmente adaptado por restriccion del sandbox. En una cuenta AWS normal se reemplazarian las dos EC2 fijas por un ASG con Launch Template, minimo 2, deseado 2 y maximo hasta el limite permitido.
- Mercado Pago esta en sandbox: cumple el objetivo academico de simular pagos sin dinero real, pero demuestra un flujo de pago mas cercano a produccion.
- CloudFront se uso para resolver HTTPS sin Route53 ni ACM propio, porque el sandbox no permite registrar dominios.
- Session Manager depende de permisos IAM/instance profile que el laboratorio no expone completamente; se incluye Bastion Host como mecanismo de administracion solicitado por el enunciado.
