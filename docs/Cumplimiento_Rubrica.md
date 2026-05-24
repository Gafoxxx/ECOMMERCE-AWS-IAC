# Cumplimiento de requisitos de infraestructura

| Requisito | Estado | Implementacion |
| --- | --- | --- |
| VPC privada y aislamiento | Cumplido | `infra/networking.yaml` crea VPC dedicada con DNS habilitado. |
| Subredes publicas y privadas | Cumplido | Dos publicas para ALB/bastion y dos privadas para app/RDS. |
| EC2 para ejecutar la aplicacion | Cumplido | `infra/compute.yaml` usa EC2 `t2.micro` mediante Auto Scaling Group. |
| Bastion Host | Cumplido | `infra/bastion.yaml` crea instancia `t2.micro` en subred publica. |
| Application Load Balancer | Cumplido | `infra/compute.yaml` crea ALB publico HTTP y Target Group en puerto 3000. |
| Auto Scaling | Cumplido | ASG con min 2, desired 2, max 6 y politica Target Tracking por CPU. |
| RDS | Cumplido | `infra/database.yaml` crea RDS MySQL `db.t3.micro` privado. |
| RDS sin Multi-AZ | Cumplido | No se habilita Multi-AZ, alineado con la restriccion del sandbox. |
| CloudWatch | Cumplido | Alarmas para CPU, targets no saludables y errores 5XX. |
| SNS | Cumplido | `infra/monitoring.yaml` crea topic y suscripcion por email. |
| CloudTrail | Parcial por permisos | El template lo soporta con `EnableCloudTrail=true`, pero el sandbox bloquea `cloudtrail:CreateTrail`. |
| Route53 | No aplica | El enunciado indica que el sandbox no permite dominios. |
| S3 para estaticos | Opcional | No requerido. Los assets se sirven desde Express; se documenta como posible mejora. |
| Seguridad de red | Cumplido | ALB publico, app privada, RDS privado y reglas por security group. |
| Tagging | Cumplido | Recursos principales tienen etiquetas `Name` y algunos `Project`. |
| Automatizacion | Cumplido | UserData instala Node.js, clona GitHub, configura `.env`, instala dependencias y arranca con PM2. |
| Documentacion | Cumplido | `docs/Guia_Despliegue_AWS.md` describe despliegue, verificacion y seguridad. |

## Notas para la presentacion

- MySQL en RDS cumple el requisito porque el enunciado permite MySQL, PostgreSQL, MariaDB o Aurora.
- PostgreSQL puede presentarse como alternativa compatible con Sequelize, pero no es necesario migrar para cumplir la rubrica.
- Systems Manager Session Manager depende de que el laboratorio exponga un IAM Instance Profile permitido. En este sandbox, el uso de perfiles IAM causo errores de permisos, por lo que se implementa bastion como mecanismo de acceso administrativo.
- CloudTrail queda documentado como opcional por una restriccion real del laboratorio: el usuario no tiene permiso `cloudtrail:CreateTrail`.
