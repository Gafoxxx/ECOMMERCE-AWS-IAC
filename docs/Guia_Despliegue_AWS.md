# Guia de despliegue en AWS

Esta guia describe el despliegue actual de la plataforma e-commerce usando AWS CloudFormation. El proyecto queda publicado por HTTPS mediante CloudFront, con un Application Load Balancer al frente de dos instancias privadas y una base de datos RDS MySQL privada.

## 1. Prerrequisitos

- AWS CLI configurado con las credenciales activas del sandbox.
- Region de trabajo: `us-east-1`.
- Repositorio GitHub publicado y con los ultimos cambios en la rama que se va a desplegar.
- Key pair `vockey` disponible en el laboratorio para el Bastion Host.
- Credenciales de prueba de Mercado Pago Checkout Pro:
  - `MERCADOPAGO_ACCESS_TOKEN`
  - `MERCADOPAGO_PUBLIC_KEY`
- Un correo valido para confirmar la suscripcion SNS.

Antes de desplegar, valida que la cuenta activa sea la del sandbox:

```bash
aws sts get-caller-identity
```

## 2. Arquitectura desplegada

El orden de los stacks es importante porque las plantillas comparten valores mediante exports/imports:

1. `infra/networking.yaml`: VPC, dos subredes publicas, dos subredes privadas, Internet Gateway, NAT Gateway y security group base de la aplicacion.
2. `infra/database.yaml`: RDS MySQL privado en subredes privadas.
3. `infra/compute.yaml`: ALB publico por HTTP, CloudFront por HTTPS, Target Group y dos EC2 privadas con Node.js, PM2 y la aplicacion.
4. `infra/bastion.yaml`: Bastion Host publico `t2.micro` para administracion controlada.
5. `infra/monitoring.yaml`: CloudWatch alarms, SNS y CloudTrail opcional.

Nota del sandbox: el diseno original contemplaba Auto Scaling Group, pero el laboratorio bloqueo `LaunchConfiguration`, `LaunchTemplate` y algunas operaciones de `RunInstances` sobre volumenes. Por eso la version final usa dos EC2 privadas fijas detras del ALB. Se mantiene balanceo y redundancia en dos subredes, y se documenta Auto Scaling como mejora pendiente para una cuenta AWS sin esas restricciones.

## 3. Despliegue de stacks

Ejecutar los comandos desde la raiz del proyecto.

### Networking

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-networking \
  --template-file infra/networking.yaml
```

### Base de datos

Usa la misma `DBPassword` en `database` y `compute`.

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-database \
  --template-file infra/database.yaml \
  --parameter-overrides \
    DBName='ecommercedb' \
    DBUsername='dbadmin' \
    DBPassword='CAMBIA_ESTA_PASSWORD'
```

### Computo, ALB, CloudFront y Mercado Pago

`UseCloudFrontBaseUrl='true'` hace que las instancias creen `APP_BASE_URL` con la URL HTTPS de CloudFront. Esto es clave para Mercado Pago, porque las `back_urls` y el webhook deben salir por HTTPS.

```bash
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
    MercadoPagoAccessToken='APP_USR_O_TEST_TOKEN' \
    MercadoPagoPublicKey='APP_USR_O_TEST_PUBLIC_KEY' \
    MercadoPagoWebhookUrl='' \
    PaymentDebugErrors='false'
```

Para diagnostico temporal de Mercado Pago se puede desplegar con `PaymentDebugErrors='true'`. Cuando el error quede resuelto, vuelve a dejarlo en `false`.

### Bastion Host

Para laboratorio se puede usar `0.0.0.0/0`; para una entrega mas segura usar mi IP publica con `/32`.

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-bastion \
  --template-file infra/bastion.yaml \
  --parameter-overrides \
    KeyName='vockey' \
    SSHLocation='0.0.0.0/0'
```

Obtener la IP publica del Bastion Host:

```bash
aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name ecommerce-bastion \
  --query "Stacks[0].Outputs[?OutputKey=='BastionPublicIp'].OutputValue" \
  --output text
```

### Monitoreo

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name ecommerce-monitoring \
  --template-file infra/monitoring.yaml \
  --parameter-overrides \
    NotificationEmail='tu-correo@example.com' \
    EnableCloudTrail='false'
```



## 4. Verificacion

Obtener la URL HTTPS final:

```bash
aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name ecommerce-compute \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text
```

CloudFront puede tardar algunos minutos en quedar completamente desplegado. Puedes revisar su estado asi:

```bash
DIST_ID=$(aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name ecommerce-compute \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront get-distribution \
  --id "$DIST_ID" \
  --query "Distribution.Status" \
  --output text
```

Validaciones funcionales:

- `GET /health` responde `{"status":"ok"}`.
- El catalogo carga productos con imagenes reales desde `app/public/assets/images`.
- El usuario puede registrarse e iniciar sesion.
- El usuario puede abrir la vista previa de un producto.
- El carrito permite agregar y eliminar productos.
- El checkout solicita datos de envio.
- El boton de pago crea una preferencia de Mercado Pago Checkout Pro y redirige al sandbox.
- Al volver desde Mercado Pago, la aplicacion muestra la pantalla de pedido con productos, entrega, total y estado.

Validar targets saludables del ALB:

```bash
TG_ARN=$(aws elbv2 describe-target-groups \
  --region us-east-1 \
  --names Ecommerce-TG \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)

aws elbv2 describe-target-health \
  --region us-east-1 \
  --target-group-arn "$TG_ARN" \
  --query "TargetHealthDescriptions[].{Instance:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}" \
  --output table
```

## 5. Mercado Pago en modo prueba

La integracion usa Checkout Pro en sandbox. Para probar:

1. Entra a la aplicacion por la URL HTTPS de CloudFront.
2. Registra o inicia sesion con un usuario de la tienda.
3. Agrega productos al carrito y completa el formulario de envio.
4. Selecciona pago con Mercado Pago.
5. En el checkout de Mercado Pago usa un comprador de prueba y tarjetas de prueba de la misma cuenta sandbox.

La app crea la preferencia con:

- `items` del carrito.
- `payer` con datos del formulario de envio.
- `back_urls` hacia `/payment/success`, `/payment/failure` y `/payment/pending`.
- `notification_url` hacia `/api/payments/webhook` cuando `APP_BASE_URL` es HTTPS.
- `external_reference` para relacionar el pago con la orden local.

Si Mercado Pago responde error `400`, activa temporalmente `PaymentDebugErrors='true'` y revisa en DevTools:

```text
Network -> /api/payments/create-preference -> Response
```

## 6. Seguridad aplicada

- Las EC2 de la aplicacion estan en subredes privadas.
- RDS no es publico y solo acepta MySQL desde el security group de la aplicacion.
- El ALB es publico solo por HTTP y CloudFront entrega HTTPS al usuario final.
- CloudFront usa el certificado administrado por AWS del dominio `cloudfront.net`.
- El Bastion Host esta en subred publica y permite restringir SSH por CIDR.
- Los secretos se inyectan por parametros de CloudFormation y no deben versionarse.
- CloudTrail esta disponible como opcion si el sandbox permite crearlo.

## 7. Monitoreo

El stack `monitoring.yaml` crea:

- Topic SNS para notificaciones por email.
- Alarmas de CPU alta para las dos instancias privadas.
- Alarma de targets no saludables en el ALB.
- Alarma de errores HTTP 5XX devueltos por la aplicacion.
- CloudTrail opcional con bucket S3 privado para auditoria.

## 8. Solucion de problemas

Si un stack queda en `ROLLBACK_COMPLETE`, elimina el stack fallido antes de volver a desplegar:

```bash
aws cloudformation delete-stack \
  --region us-east-1 \
  --stack-name ecommerce-compute
```

Si CloudFront carga pero la app no responde, revisa:

- Que los targets del ALB esten `healthy`.
- Que las instancias privadas hayan podido salir por NAT para clonar GitHub e instalar dependencias.
- Que `GitHubBranch` apunte a una rama existente.
- Que `DBPassword` sea igual a la usada en `ecommerce-database`.

Para ver la salida de arranque de una instancia desde AWS:

```bash
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name ecommerce-compute \
  --query "Stacks[0].Outputs[?OutputKey=='WebAppInstance1Id'].OutputValue" \
  --output text)

aws ec2 get-console-output \
  --region us-east-1 \
  --instance-id "$INSTANCE_ID" \
  --latest \
  --output text
```

Si Mercado Pago no vuelve a la pantalla de pedido, confirma que estas usando la URL de CloudFront y que `APP_BASE_URL` no quedo con la URL HTTP del ALB.
