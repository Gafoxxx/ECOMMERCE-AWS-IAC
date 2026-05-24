# ECOMMERCE-AWS-IAC

Secure e-commerce platform built with Node.js, Express and Sequelize, deployed on AWS through CloudFormation.

The project includes:

- Basic e-commerce app: product catalog, user registration/login, cart and simulated checkout.
- Networking stack: VPC, public/private subnets, Internet Gateway and NAT Gateway.
- Data stack: private RDS MySQL database.
- Compute stack: Application Load Balancer and Auto Scaling Group running EC2 instances.
- Bastion stack: public Bastion Host for controlled administrative access.
- Monitoring stack: CloudWatch alarms, SNS notifications and CloudTrail audit logs.

Deployment guide: [docs/Guia_Despliegue_AWS.md](docs/Guia_Despliegue_AWS.md)
Rubric coverage: [docs/Cumplimiento_Rubrica.md](docs/Cumplimiento_Rubrica.md)
