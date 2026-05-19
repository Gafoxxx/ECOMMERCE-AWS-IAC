Plan de Proyecto: Despliegue de Plataforma E-Commerce Escalable en AWS
1. Introducción
Este proyecto consiste en el diseño y despliegue de una infraestructura en la nube para una startup que lanza su primer producto: una plataforma de comercio electrónico. Se utilizará un enfoque de Infraestructura como Código (IaC) para garantizar un despliegue seguro, escalable y reproducible.

2. Objetivos
2.1 Objetivo General
Desplegar una aplicación web escalable en AWS utilizando CloudFormation, integrando servicios de cómputo, base de datos y redes bajo mejores prácticas de arquitectura en la nube.
2.2 Objetivos EspecíficosConsolidar los conocimientos en diseño de arquitecturas escalables y seguras.  Implementar la automatización de infraestructura mediante plantillas de CloudFormation.  Configurar mecanismos de alta disponibilidad y auto escalado para gestionar la demanda del tráfico.  Asegurar la persistencia de datos mediante el uso de servicios administrados de bases de datos (RDS). 

3. Alcance del ProyectoEl proyecto abarca tanto el desarrollo de las funcionalidades básicas de la aplicación como la configuración completa de la infraestructura de soporte: 

 3.1 Funcionalidades de la AplicaciónCatálogo de productos: 

 -Visualización de nombres, descripciones y precios.  
 -Carrito de compras: Gestión de productos y cálculo del total.  
 -Proceso de pago: Simulación de transacciones con un servicio ficticio.  
 -Registro de usuarios: Sistema de autenticación con usuario y contraseña.  

 3.2 Componentes de Infraestructura

 -Red virtual privada (VPC) con subredes públicas y privadas.  

 -Balanceador de carga (ALB) y grupos de Auto Scaling.  

 -Instancia de base de datos relacional (RDS).  

 -Monitoreo proactivo y alertas mediante CloudWatch y SNS.

 4. Stack Tecnológico

4.1 Desarrollo (App)

 -Front-end: HTML, CSS, JavaScript (jQuery).  

 -Back-end: Node.js con el framework Express.js.  

 -ORM: Sequelize para la interacción con la base de datos.  

4.2 Infraestructura (Cloud)

 -Proveedor: AWS (Amazon Web Services).

 -IaC: AWS CloudFormation.  

 -Base de Datos: AWS RDS (MySQL/PostgreSQL).  

 -Servidor de Salto: Bastion Host para acceso seguro.

 5. Restricciones del Entorno (Sandbox)

 -El despliegue se ajustará a las limitaciones específicas del entorno de laboratorio:

 -Límite de Cómputo: Máximo 9 instancias EC2 en total.  

 -Base de Datos: Instancias tipo db.t3.micro a db.t3.medium sin soporte para Multi-AZ.  

 -Permisos: Acceso de solo lectura en IAM (uso de roles predefinidos).  

 -Red: No se permite el registro de dominios en Route53.

 ![alt text](image.png)