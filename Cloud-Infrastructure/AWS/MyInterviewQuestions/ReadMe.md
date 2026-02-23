# AWS Interview Questions

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [What is AWS?](#what-is-aws)
- [What are the key benefits of using AWS?](#what-are-the-key-benefits-of-using-aws)
- [What are the main AWS components and How does AWS call them?](#what-are-the-main-aws-components-and-how-does-aws-call-them)
- [What is S3, and why is it called that? Compare it with common databases (caution: trick question).](#what-is-s3-and-why-is-it-called-that-compare-it-with-common-databases-caution-trick-question)
  - [What is the minimum and maximum size of individual objects that you can store in S3?](#what-is-the-minimum-and-maximum-size-of-individual-objects-that-you-can-store-in-s3)
  - [What are the different storage classes in S3?](#what-are-the-different-storage-classes-in-s3)
  - [What are the parameters for S3 pricing?](#what-are-the-parameters-for-s3-pricing)
  - [What are the different types of storage gateway?](#what-are-the-different-types-of-storage-gateway)
  - [Can I store via FTP/SFTP/FTPS to S3?](#can-i-store-via-ftpsftpftps-to-s3)
  - [Other Cloud Hetzner Object Storage](#other-cloud-hetzner-object-storage)
- [What is an AWS Snowball?](#what-is-an-aws-snowball)
- [What is Edge Computing (generally, and in AWS)?](#what-is-edge-computing-generally-and-in-aws)
- [**What are Edge Locations? Is this related to Edge Computing?**](#what-are-edge-locations-is-this-related-to-edge-computing)
- [What are the database types in RDS? (Short descriptions)](#what-are-the-database-types-in-rds-short-descriptions)
- [Explain how EC2 works.](#explain-how-ec2-works)
  - [What are the types of volumes for EC2 instances?](#what-are-the-types-of-volumes-for-ec2-instances)
  - [What is the difference between EBS and EFS?](#what-is-the-difference-between-ebs-and-efs)
  - [What does AZ-locked mean?](#what-does-az-locked-mean)
- [What is an AMI?](#what-is-an-ami)
- [What is an EIP?](#what-is-an-eip)
- [What is Route53? Why it is called so?](#what-is-route53-why-it-is-called-so)
- [How does synchronization work with a Multi-AZ RDS?](#how-does-synchronization-work-with-a-multi-az-rds)
- [What is the difference between security groups and network access control list?](#what-is-the-difference-between-security-groups-and-network-access-control-list)
- [What is an ELB? (Elastic Load Balancer)](#what-is-an-elb-elastic-load-balancer)
  - [Why is NLB is better for raw TCP WebSocket performance?](#why-is-nlb-is-better-for-raw-tcp-websocket-performance)
- [What are the two types of access that you can provide when you are creating users?](#what-are-the-two-types-of-access-that-you-can-provide-when-you-are-creating-users)
- [One of my S3 buckets is deleted but I need to restore it. Is it possible, if yes, how?](#one-of-my-s3-buckets-is-deleted-but-i-need-to-restore-it-is-it-possible-if-yes-how)
- [You receive a "Service Limit Exceeded" error when launching an EC2 instance. What are the causes and how do you resolve it?](#you-receive-a-service-limit-exceeded-error-when-launching-an-ec2-instance-what-are-the-causes-and-how-do-you-resolve-it)
- [How do you extend an EBS volume on Linux and Windows after resizing it in AWS?](#how-do-you-extend-an-ebs-volume-on-linux-and-windows-after-resizing-it-in-aws)
- [What are parameter groups in Amazon RDS, and what are they used for?](#what-are-parameter-groups-in-amazon-rds-and-what-are-they-used-for)
- [What are AWS resource tags, how are they used, and what are practical examples?](#what-are-aws-resource-tags-how-are-they-used-and-what-are-practical-examples)
- [What is the default Elastic IP address quota per AWS account, and how can it be increased?](#what-is-the-default-elastic-ip-address-quota-per-aws-account-and-how-can-it-be-increased)
- [In a Multi-AZ RDS deployment, can the standby instance be used for read or write operations alongside the primary instance?](#in-a-multi-az-rds-deployment-can-the-standby-instance-be-used-for-read-or-write-operations-alongside-the-primary-instance)
- [Which AWS services would you use to collect and process e-commerce data for near real-time analysis?](#which-aws-services-would-you-use-to-collect-and-process-e-commerce-data-for-near-real-time-analysis)
- [A company is deploying a new two-tier web application on AWS. They have a limited team, require high availability, and the application requires complex queries and table joins. Which configuration best meets these requirements?](#a-company-is-deploying-a-new-two-tier-web-application-on-aws-they-have-a-limited-team-require-high-availability-and-the-application-requires-complex-queries-and-table-joins-which-configuration-best-meets-these-requirements)
- [What are the suitable use cases for Amazon DynamoDB?](#what-are-the-suitable-use-cases-for-amazon-dynamodb)
- [Your application collects data from mobile devices every 5 minutes, stores it in DynamoDB, and daily exports per-user data to S3 for visualization. How would you optimize this architecture to reduce costs?](#your-application-collects-data-from-mobile-devices-every-5-minutes-stores-it-in-dynamodb-and-daily-exports-per-user-data-to-s3-for-visualization-how-would-you-optimize-this-architecture-to-reduce-costs)
- [You are running a website on EC2 instances deployed across multiple Availability Zones with a Multi-AZ RDS MySQL Extra Large instance. The site performs a high number of small reads and writes per second and relies on an eventual consistency model. After testing, you discover read contention on RDS MySQL. What is the best approach to resolve this?](#you-are-running-a-website-on-ec2-instances-deployed-across-multiple-availability-zones-with-a-multi-az-rds-mysql-extra-large-instance-the-site-performs-a-high-number-of-small-reads-and-writes-per-second-and-relies-on-an-eventual-consistency-model-after-testing-you-discover-read-contention-on-rds-mysql-what-is-the-best-approach-to-resolve-this)
- [A startup running a pilot with 100 sensors generates ~4GB of sensor data per month. The current stack uses Auto Scaling EC2 instances and RDS with 500GB storage. The pilot was successful and they now want to scale to 100K sensors, with data retained for at least 2 years for analysis. Which architecture would you recommend?](#a-startup-running-a-pilot-with-100-sensors-generates-4gb-of-sensor-data-per-month-the-current-stack-uses-auto-scaling-ec2-instances-and-rds-with-500gb-storage-the-pilot-was-successful-and-they-now-want-to-scale-to-100k-sensors-with-data-retained-for-at-least-2-years-for-analysis-which-architecture-would-you-recommend)
- [You have an application that requires both image rendering and general-purpose computing. Which AWS service best fits this requirement?](#you-have-an-application-that-requires-both-image-rendering-and-general-purpose-computing-which-aws-service-best-fits-this-requirement)
- [Your content management system running on EC2 is approaching 100% CPU utilization. Which options would reduce the load on the EC2 instance?](#your-content-management-system-running-on-ec2-is-approaching-100-cpu-utilization-which-options-would-reduce-the-load-on-the-ec2-instance)
- [What is Connection Draining in AWS, and what is its purpose?](#what-is-connection-draining-in-aws-and-what-is-its-purpose)
- [Which AWS service automatically terminates unhealthy EC2 instances and replaces them with new ones?](#which-aws-service-automatically-terminates-unhealthy-ec2-instances-and-replaces-them-with-new-ones)
- [What are Auto Scaling Lifecycle Hooks and what are they used for?](#what-are-auto-scaling-lifecycle-hooks-and-what-are-they-used-for)
- [To create a mirror image of your environment in another region for disaster recovery, which AWS resources do not need to be recreated in the second region?](#to-create-a-mirror-image-of-your-environment-in-another-region-for-disaster-recovery-which-aws-resources-do-not-need-to-be-recreated-in-the-second-region)
- [Which AWS services are NOT suitable for deploying an application?](#which-aws-services-are-not-suitable-for-deploying-an-application)
- [Compare Cloud Computing with Serverless Architecture. (Trick question)](#compare-cloud-computing-with-serverless-architecture-trick-question)
- [Are there capabilities unique to AWS that Azure lacks, and vice versa?](#are-there-capabilities-unique-to-aws-that-azure-lacks-and-vice-versa)

<!-- /code_chunk_output -->

## What is AWS?

AWS (Amazon Web Services) is Amazon's cloud computing platform, offering on-demand infrastructure and services (compute, storage, networking, databases, AI/ML, etc.) on a pay-as-you-go model, hosted across globally distributed data centers (Regions & Availability Zones).

## What are the key benefits of using AWS?

- Scalability: AWS allows you to easily scale resources up or down based on demand.
- Cost-effectiveness: Pay only for what you use with no upfront costs. (Not always true :))
- Reliability: AWS provides high availability and fault tolerance through its global infrastructure.
- Security: AWS offers robust security features and compliance certifications.
- Flexibility: Wide range of services and tools to support various workloads and applications.

## What are the main AWS components and How does AWS call them?

They are called services. AWS offers a wide range of services across various categories.

I expect these services to be covered in the interview (At least the service categorie names, I cannot memorize them either, the names change over time, and AWS keeps adding new services, so it's more important to understand the categories and the core services within them):

- Compute: EC2 (Elastic Compute Cloud), Lambda, ECS (Elastic Container Service), ECR (Elastic Container Registry), EKS (Elastic Kubernetes Service)
- Storage: S3 (Simple Storage Service, incl. S3 Glacier Instant/Flexible/Deep Archive), EBS (Elastic Block Store), EFS (Elastic File System), Glacier (Now called S3 Glacier), FSx (for Windows File Server, for Lustre), Storage Gateway, Snowball, Snowmobile
- Databases: RDS (Relational Database Service), DynamoDB, Aurora, ElastiCache, Neptune, DocumentDB, QLDB (Quantum Ledger Database), Timestream, Keyspaces (for Apache Cassandra), MemoryDB for Redis,
- Networking: CloudFront (CDN), Direct Connect, Transit Gateway,VPC (Virtual Private Cloud), Route 53, ELB (Elastic Load Balancing)
- Security: IAM (Identity and Access Management), KMS (Key Management Service), WAF (Web Application Firewall), Shield, CloudTrail, Secrets Manager, GuardDuty, Security Hub, Macie
- Messaging & Streaming: SQS (Simple Queue Service), SNS (Simple Notification Service), Kinesis, MSK (Managed Streaming for Kafka), EventBridge (formerly CloudWatch Events), Simple Workflow Service (SWF)
- DevOps & Developer Tools: CodeCatalyst (replaces former CodeCommit ecosystem only partially), CodeCommit (Deprecated), CodeBuild, CodeDeploy, CodePipeline,
- Monitoring Basics: CloudWatch, Amazon Managed Grafana, Amazon Managed Service for Prometheus

And following services are optional, I don't expect them to be covered in the interview but it's good to have a basic understanding of them (would be a bonus). I personally don't know all of them, but I have listed the ones I know here:

- Analytics: Redshift, EMR (Elastic MapReduce), Athena, Lake Formation, OpenSearch Service
- AI/ML: Bedrock (major omission — AWS's flagship LLM/GenAI service), Textract, Translate, SageMaker, Rekognition, Comprehend
- Monitoring & Management – Config, Systems Manager, Trusted Advisor, AWS Personal Health Dashboard, AWS Compute Optimizer,
- Cost Management: AWS Cost Explorer, AWS Budgets, AWS Cost and Usage Report, AWS Cost Anomaly Detection, AWS Cost Explorer API, AWS Cost Explorer Resource Optimization Recommendations, etc.
- Migration & Transfer: Snowball, DMS (Database Migration Service), SMS (Server Migration Service) deprecated and replaced by Application Migration Service (MGN), DataSync, Transfer Family (SFTP, FTPS, FTP)
- Mobile: Amplify, Device Farm
- IoT: IoT Core, IoT Greengrass
- AR/VR: Sumerian (deprecated, now called Amazon Sumerian), AR/VR services are now part of AWS IoT and AWS RoboMaker
- Blockchain: Managed Blockchain
- Game Development: GameLift
- Quantum Computing: Braket
- Robotics: AWS RoboMaker
- Satellite: AWS Ground Station
- Media Services: Elastic Transcoder legacy, superseded by MediaConvert, MediaLive, MediaPackage, MediaStore
- Business & End User Computing: WorkSpaces, AppStream 2.0, Chime, Connect
- Customer Engagement: Pinpoint, Connect

## What is S3, and why is it called that? Compare it with common databases (caution: trick question).

**S3 = Simple Storage Service** — the "3 S's" give it the name S3.

It is an **object storage** service, not a database. This is the trick: candidates often conflate the two. S3 is where Big Data lives. Databases are where your application's operational data lives. Both are necessary, and they serve completely different purposes.

Think of S3 like a postal warehouse — every package (object) has a unique tracking number (key). You can retrieve any package instantly by its number, but you can't search inside the packages without opening them.

S3 is the de-facto data lake foundation. Tools like Athena, EMR, Redshift Spectrum, and Glue sit on top of S3 to query massive datasets, without ever moving the data. This is why it's fundamentally different from a database: it's designed for massive scale storage and batch/analytics access patterns, not transactional queries.

|     | S3  | Database (e.g. RDS/DynamoDB) |
| --- | --- | --- |
| **Type** | Object store | Structured/semi-structured data store |
| **Access pattern** | Key → entire object (GET/PUT) | Query, filter, index, join |
| **Schema** | None | Defined (or flexible for NoSQL) |
| **Use case** | Files, backups, media, data lake | Transactional data, app state |
| **Querying** | No native query (Athena on top) | Native SQL / query API |
| **Consistency** | Strong consistency (since 2020) | Varies |

**Key trap:** S3 can _feel_ like a key-value store, but it has no transactions, no indexing, no querying natively — it's fundamentally different from databases. Candidates who say "S3 is like a NoSQL database" fail this question.

**NoSQL** is a broad term for non-relational databases — it includes document stores (MongoDB), key-value stores (Redis), column stores (Cassandra), graph DBs (Neptune). They all have **query engines, indexing, and transactions**.

**Object storage** (S3) has none of that; it's purely **store and retrieve by key**, optimized for massive scale, cheap storage, and high durability. No queries, no indexes, no transactions.

The confusion arises because some NoSQL DBs (e.g. DynamoDB) are also key-value based — but DynamoDB has indexing, querying, and transactions. S3 does not.

**Short answer:** NoSQL = database category. Object Storage = storage paradigm. They are orthogonal concepts.

### What is the minimum and maximum size of individual objects that you can store in S3?

- **Minimum:** 0 bytes
- **Maximum:** 5 TB per object

**Upload limits:**

- Single PUT: max **5 GB**
- Above 5 GB: must use **Multipart Upload** (recommended above 100 MB)
- Multipart supports up to **10,000 parts**, each between 5 MB and 5 GB

**Trap:** Candidates often say 5 GB max — wrong. 5 GB is the single PUT limit, not the object size limit.

### What are the different storage classes in S3?

| Storage Class | Use Case | Retrieval |
| --- | --- | --- |
| **S3 Standard** | Frequently accessed data | Milliseconds |
| **S3 Intelligent-Tiering** | Unknown/changing access patterns | Milliseconds |
| **S3 Standard-IA** (Infrequent Access) | Less frequent, rapid access needed | Milliseconds |
| **S3 One Zone-IA** | Infrequent, non-critical, single AZ | Milliseconds |
| **S3 Glacier Instant Retrieval** | Archives, quarterly access | Milliseconds |
| **S3 Glacier Flexible Retrieval** | Archives, occasional access | Minutes to hours |
| **S3 Glacier Deep Archive** | Long-term, rarely accessed | Up to 12 hours |
| **S3 Express One Zone** | High-performance, latency-sensitive | Single-digit ms |

**Key traps:**

- **One Zone-IA** — data lost if AZ fails, candidates often miss this
- **Intelligent-Tiering** has a small monitoring fee per object — not free
- **Glacier ≠ slow** anymore — Glacier Instant Retrieval is millisecond access
- **Express One Zone** — newest class, often unknown to candidates

**Lifecycle policies** can automate transitioning objects between classes — candidates should mention this.

### What are the parameters for S3 pricing?

**S3 pricing is based on:**

1. **Storage** — GB/month per storage class (Standard is most expensive, Deep Archive cheapest)
2. **Requests** — PUT, COPY, POST, LIST, GET, DELETE — each request type has a cost
3. **Data Transfer**
    - **Ingress (into S3)** — free
    - **Egress (out to internet)** — charged per GB
    - **Between AWS services in same region** — free
    - **Cross-region** — charged
4. **Retrieval fees** — applies to IA, Glacier classes (per GB retrieved)
5. **Minimum storage duration** — e.g. Standard-IA = 30 days minimum, Glacier Deep Archive = 180 days — deleted early, still charged
6. **Replication** — cross-region replication (CRR) incurs transfer + request costs
7. **Management features** — Intelligent-Tiering monitoring fee, S3 Inventory, Analytics, Object Tagging at scale

**Trap:** Candidates often only say "you pay for storage" — missing requests, retrieval fees, and minimum duration charges, which can dominate costs in real workloads.

### What are the different types of storage gateway?

**AWS Storage Gateway types:**

| Type | Protocol | Use Case |
| --- | --- | --- |
| **S3 File Gateway** | NFS, SMB | On-premise apps store files → backed by S3 |
| **FSx File Gateway** | SMB | On-premise Windows apps → backed by FSx for Windows |
| **Volume Gateway (Stored)** | iSCSI | Full dataset on-premise, async backup to S3 |
| **Volume Gateway (Cached)** | iSCSI | Primary data in S3, frequently accessed cached locally |
| **Tape Gateway** | iSCSI VTL | Replace physical tape backups → virtual tapes in S3/Glacier |

**Key concepts:**

- Storage Gateway runs as a **VM appliance on-premise** (or EC2)
- Bridge between **on-premise infrastructure and AWS storage**
- Primary use case: **hybrid cloud** and **data migration**

**Trap:** Candidates confuse Stored vs Cached Volume Gateway:

- **Stored** — all data local, S3 is the backup
- **Cached** — S3 is primary, local is just a cache

### Can I store via FTP/SFTP/FTPS to S3?

No. Two separate issues:

1. **FTP** — S3 uses HTTP/HTTPS REST API (GET, PUT, DELETE). No FTP protocol natively. AWS offers **Transfer Family** if you need SFTP/FTP access on top of S3, but that's an additional service.
2. **Folders** — S3 has **no real folder hierarchy**. It's a flat namespace. What appears as folders in the console are just **key prefixes** (e.g. `images/2024/photo.jpg` — the "folders" are part of the key name, nothing more).

**Trap for candidates:** If they say "yes, S3 has folders" — wrong. It's a UX illusion.

### Other Cloud Hetzner Object Storage

What Hetzner calls "Object Storage" is actually an **S3-compatible object store** (they implement the S3 API), but their **Hetzner Storage Box** is closer to a network-attached drive (supports FTP, SFTP, SMB, etc.) — that's fundamentally different.

**The distinction:**

- **True Object Storage** (S3, Hetzner Object Storage) → REST API, flat namespace, no filesystem
- **Block/File Storage** (Hetzner Storage Box, EBS, EFS) → filesystem semantics, mountable, supports FTP/SMB/NFS

Hetzner conflating these in marketing is a common source of confusion. Worth mentioning to candidates if they come from a non-AWS background.

## What is an AWS Snowball?

**AWS Snowball** is a **physical data transfer device** AWS ships to you — you load data onto it, ship it back, and AWS imports it into S3/Glacier.

**Why?** Transferring petabytes over the internet is slow and expensive. Physical transfer is faster and cheaper at scale.

**Device types:**

| Device | Capacity | Use Case |
| --- | --- | --- |
| **Snowball Edge Storage Optimized** | 80 TB usable | Pure data migration |
| **Snowball Edge Compute Optimized** | 28 TB usable + GPU option | Edge computing + migration |
| **Snowmobile** | 100 PB | Exabyte-scale, literal truck |

**Key concepts:**

- Data is **encrypted at rest (AES-256)** on the device
- Can run **EC2 instances and Lambda** on Snowball Edge (edge computing in disconnected environments)
- Snowmobile = **a shipping container on a truck** — for entire data center migrations

**Rule of thumb candidates should know:**

> If transferring data over your network would take **more than a week** → consider Snowball.

**Trap:** Snowball is not just for migration — Snowball Edge supports **edge computing** in remote/disconnected locations (oil rigs, ships, military).

## What is Edge Computing (generally, and in AWS)?

**Edge computing** means processing data **close to where it's generated** rather than sending it to a central cloud/data center.

**Why?**

- Latency — sending data to AWS and back takes time
- Bandwidth — transmitting raw data is expensive
- Connectivity — remote locations may have no reliable internet

**Examples:**

- Oil rig — process sensor data locally, sync results to AWS periodically
- Factory floor — real-time defect detection on camera feeds
- Military — operate in disconnected/classified environments
- Retail store — local inference (AI/ML) without cloud dependency

**AWS Edge services:**

- **Snowball Edge** — edge computing on a physical device
- **AWS Outposts** — AWS rack installed in your own data center
- **AWS Wavelength** — AWS compute embedded in 5G networks (ultra-low latency)
- **AWS Local Zones** — AWS infrastructure closer to large cities

**For managers:**

> Instead of sending all your factory's camera footage to Amazon's servers for analysis, edge computing processes it on-site instantly — only sending the results (e.g. "defect found") to the cloud.

## **What are Edge Locations? Is this related to Edge Computing?**

**Short answer: No — different concept, same word. Common confusion.**

**Edge Locations** in AWS are **CDN cache nodes**, part of AWS's global network used by **CloudFront, Route 53, Shield, and WAF**.

- 400+ edge locations worldwide
- Store **cached copies** of content close to end users
- Reduce latency for web content delivery (images, videos, static assets)
- Not compute nodes — purely **network/caching infrastructure**

**Comparison:**

|     | Edge Locations | Edge Computing |
| --- | --- | --- |
| **Purpose** | Cache & deliver content fast | Process data locally |
| **AWS services** | CloudFront, Route 53 | Snowball Edge, Outposts, Wavelength |
| **User benefit** | Low latency content delivery | Offline/remote processing |
| **Compute?** | No  | Yes |

**For managers:**

> Edge Locations are like regional warehouses for Netflix — instead of streaming from one central server, content is cached near you for faster delivery. Nothing to do with edge computing.

**Trap:** Candidates often conflate the two because of the shared word "edge." They are orthogonal concepts.

## What are the database types in RDS? (Short descriptions)

| Engine | Type |
| --- | --- |
| **MySQL** | Most popular open-source relational DB |
| **PostgreSQL** | Advanced open-source relational, extensible |
| **MariaDB** | MySQL fork, open-source |
| **Oracle** | Enterprise relational, bring-your-own-license or license-included |
| **SQL Server** | Microsoft relational DB |
| **Aurora MySQL** | AWS-native MySQL-compatible, 5x faster than MySQL |
| **Aurora PostgreSQL** | AWS-native PostgreSQL-compatible, 3x faster than PostgreSQL |
| **Db2** | IBM enterprise relational DB (added 2023) |

**Key point:** Aurora is not just "managed MySQL/PostgreSQL" — it's a **re-architected, cloud-native engine** with automatic storage scaling, multi-master options, and Serverless v2.

**Trap:** Candidates often forget Db2 and treat Aurora as just another MySQL flavor.

## Explain how EC2 works.

EC2 (Elastic Compute Cloud) provides **virtual machines (instances)** on-demand in AWS's data centers.

**How it works:**

AWS runs massive physical servers with hypervisors (Nitro System) that slice hardware into isolated virtual machines. You pick:

- **AMI** (Amazon Machine Image) — the OS/software template
- **Instance type** — CPU, RAM, GPU profile (e.g. `t3.medium`, `c6i.large`)
- **Storage** — EBS (persistent) or instance store (ephemeral)
- **Network** — VPC, subnet, security groups, elastic IP
- **IAM role** — what AWS services this instance can access

You get a VM, SSH in, and it behaves like any Linux/Windows server.

**Key concepts candidates must know:**

- **On-demand vs Reserved vs Spot** — cost models
- **Auto Scaling** — automatically add/remove instances based on load
- **ELB + Auto Scaling Group** — the standard HA pattern
- **Security Groups** — stateful firewall at instance level
- **User Data** — bootstrap scripts on first boot

**For managers:**

> EC2 is a rentable server in Amazon's data center. You pay by the hour, scale up when traffic spikes, scale down when it drops — no hardware to buy or maintain.

### What are the types of volumes for EC2 instances?

**EBS (Elastic Block Store) — persistent, network-attached:**

| Type | Use case |
| --- | --- |
| **gp3** (General Purpose SSD) | Default, balanced price/performance |
| **gp2** (General Purpose SSD) | Legacy, superseded by gp3 |
| **io2/io2 Block Express** | High IOPS, mission-critical DBs |
| **io1** | Legacy high IOPS, superseded by io2 |
| **st1** (Throughput HDD) | Big Data, sequential reads, cheap |
| **sc1** (Cold HDD) | Infrequent access, cheapest |

**Instance Store — ephemeral, physically attached:**

- Highest I/O performance (NVMe directly on host)
- Data lost on stop/terminate — not for persistent data
- Good for caches, temp data, buffers

**Key traps:**

- EBS volumes are **AZ-locked** — can't attach to instance in another AZ directly
- **gp2 vs gp3** — candidates should know gp3 is the current default and cheaper
- Instance store ≠ EBS — many candidates confuse or forget instance store exists

### What is the difference between EBS and EFS?

|     | EBS | EFS |
| --- | --- | --- |
| **Type** | Block storage | Network file system (NFS) |
| **Access** | Single instance (one AZ) | Multiple instances simultaneously |
| **Scope** | AZ-locked | Region-wide (multi-AZ) |
| **Protocol** | Block device (mounted as disk) | NFS v4 |
| **Scaling** | Manual (provision size) | Automatic |
| **Use case** | OS disk, DB storage | Shared storage, microservices, CMS |
| **OS support** | Linux + Windows | Linux only |
| **Cost** | Cheaper | ~3x more expensive than EBS |

**Key trap:** Candidates often forget EFS is **Linux-only** and that EBS is **AZ-locked** — you can't mount one EBS volume to instances in different AZs.

**For managers:**

> EBS is a hard drive for one server. EFS is a shared network drive that multiple servers can read/write simultaneously.

### What does AZ-locked mean?

AZ = **Availability Zone** — a physically separate data center within an AWS Region (e.g. `eu-central-1a`, `eu-central-1b`, `eu-central-1c`).

AZ-locked means the resource **exists in exactly one AZ and cannot be accessed from another AZ**.

Example: An EBS volume created in `eu-central-1a` can only be attached to an EC2 instance also running in `eu-central-1a`. An instance in `eu-central-1b` cannot use it.

**For managers:**

> Imagine AWS has 3 buildings in Frankfurt. AZ-locked means your hard drive is physically in building A — servers in building B can't use it.

## What is an AMI?

A **snapshot/template** of an EC2 instance — contains the OS, software, configuration, and optionally data. Used to launch new instances.

- Can be AWS-provided, Marketplace, or custom (you build your own)
- Region-scoped — must be copied to use in another region
- Foundation of **Auto Scaling** — all instances in a group launch from the same AMI

**For managers:**

> AMI = a master copy of a server you can clone instantly.

## What is an EIP?

**EIP (Elastic IP):**

A **static public IPv4 address** you own in AWS — survives instance stop/start/replace.

- Normal EC2 public IPs change on every stop/start
- EIP stays fixed — useful for DNS, whitelisting, failover
- **Trap:** EIP is **free only when attached to a running instance** — idle EIPs are charged (AWS discourages hoarding IPs)
- Limited to **5 per region** by default

**For managers:**

> EIP = a permanent phone number for your server that doesn't change even if you replace the hardware.

## What is Route53? Why it is called so?

**Route 53** is AWS's **managed DNS service** — translates domain names to IP addresses, routes traffic globally, and monitors endpoint health.

**Why "53"?** DNS operates on **port 53** — that's it.

**Core features:**

| Feature | Description |
| --- | --- |
| **DNS Resolution** | Authoritative DNS for your domains |
| **Domain Registration** | Buy/transfer domains directly in AWS |
| **Health Checks** | Monitor endpoints, trigger failover |
| **Traffic Policies** | Advanced routing rules |

**Routing policies candidates must know:**

| Policy | Use Case |
| --- | --- |
| **Simple** | Single resource, no logic |
| **Weighted** | A/B testing, gradual deployments |
| **Latency** | Route to lowest-latency region |
| **Failover** | Active/passive HA |
| **Geolocation** | Route based on user's country/continent |
| **Geoproximity** | Route based on geographic distance + bias |
| **Multivalue Answer** | Basic load balancing via DNS |

**Trap:** DNS is not a load balancer — candidates who say "Route 53 is a load balancer" are wrong. It's traffic routing at DNS level, which is fundamentally different from ELB.

**For managers:**

> Route 53 is like a phone book — when you type "myapp.com", it looks up which server to connect you to, and can automatically switch to a backup server if the primary fails.

## How does synchronization work with a Multi-AZ RDS?

In a Multi-AZ RDS deployment, AWS automatically creates a **synchronous standby replica** in a different Availability Zone (AZ) for high availability.

**Synchronous replication** &larr; this is the key word candidates must know.

**How it works:**

1. Write hits the **primary instance**
2. RDS **synchronously** replicates to the **standby instance** in another AZ
3. Write is only **acknowledged to the application after both** primary and standby confirm the write
4. On failure — automatic failover to standby in **60-120 seconds**, DNS record updated automatically

**Key concepts:**

|     | Multi-AZ | Read Replica |
| --- | --- | --- |
| **Replication** | Synchronous | Asynchronous |
| **Purpose** | HA / failover | Read scaling |
| **Standby readable?** | No  | Yes |
| **Automatic failover?** | Yes | No  |

**Trap:** Candidates confuse Multi-AZ with Read Replicas.

- **Multi-AZ** = availability, standby is not readable
- **Read Replica** = performance, asynchronous, can lag behind primary

**For managers:**

> Multi-AZ is like having an exact live copy of your database in a second building. If the first building burns down, the second takes over automatically within 2 minutes — no data loss.

## What is the difference between security groups and network access control list?

|     | Security Group | Network ACL |
| --- | --- | --- |
| **Level** | Instance level | Subnet level |
| **State** | Stateful | Stateless |
| **Rules** | Allow only | Allow + Deny |
| **Evaluation** | All rules evaluated | Rules evaluated in order (rule number) |
| **Default** | Deny all inbound, allow all outbound | Allow all inbound + outbound |
| **Applies to** | EC2, RDS, Lambda in VPC | All resources in subnet |

**Stateful vs Stateless — candidates must understand this:**

- **Stateful (SG):** if inbound traffic is allowed, return traffic is automatically allowed
- **Stateless (NACL):** inbound and outbound rules are independent — you must explicitly allow both directions

**Trap:** Candidates often forget NACLs are stateless and that rules are evaluated **in numeric order** — first match wins, unlike Security Groups where all rules are evaluated.

**For managers:**

> Security Group = bouncer at the door of each server. NACL = checkpoint at the entrance of the entire neighborhood. Both can be used together for defense in depth.

## What is an ELB? (Elastic Load Balancer)

**ELB (Elastic Load Balancer)** distributes incoming traffic across multiple targets (EC2, containers, Lambda, IPs) to ensure **high availability and fault tolerance**.

**Types:**

| Type | Protocol | Use Case |
| --- | --- | --- |
| **ALB** (Application) | HTTP/HTTPS (Layer 7) | Web apps, microservices, path/host-based routing |
| **NLB** (Network) | TCP/UDP/TLS (Layer 4) | Ultra-low latency, static IP, high throughput |
| **GLB** (Gateway) | IP (Layer 3) | Third-party virtual appliances (firewalls, IDS) |
| **CLB** (Classic) | Layer 4+7 | Legacy, deprecated — avoid |

**Key concepts candidates must know:**

- **Target Groups** — logical group of targets (EC2, Lambda, IPs) the LB routes to
- **Listeners** — rules defining which port/protocol to accept and where to forward
- **Health Checks** — automatically removes unhealthy targets
- **ALB path routing** — `/api/*` → service A, `/web/*` → service B
- **NLB preserves source IP** — ALB does not (uses `X-Forwarded-For`)
- **ALB + Cognito** — native authentication integration

**Trap:** CLB is deprecated — candidates proposing CLB for new architectures fail. Also: NLB ≠ ALB for WebSockets (NLB is better for raw TCP WebSocket performance).

**For managers:**

> ELB is a traffic director — if you have 10 servers, it splits incoming requests evenly across all of them, and automatically stops sending traffic to any server that goes down.

### Why is NLB is better for raw TCP WebSocket performance?

Because ALB and NLB operate at different **OSI layers**:

**ALB (Layer 7):**

- Terminates the HTTP/HTTPS connection
- Inspects, parses, and re-establishes the connection to the target
- For WebSockets: upgrades HTTP → WebSocket, but still proxies through ALB — adds overhead
- Every message passes through ALB's HTTP processing stack

**NLB (Layer 4):**

- Passes raw TCP packets through **without inspection or termination**
- Connection goes directly from client to target — NLB just forwards packets
- Zero protocol overhead — pure TCP throughput
- Microsecond latency vs milliseconds for ALB

**Analogy:**

> ALB reads every letter before forwarding it. NLB just forwards the sealed envelope without opening it.

**When ALB WebSocket is fine:**

- Standard web apps with moderate WebSocket traffic
- You need path-based routing or authentication alongside WebSockets

**When NLB is better:**

- High-frequency trading, gaming, real-time telemetry
- Thousands of persistent WebSocket connections
- Raw throughput and latency are critical

**Trap:** Candidates often don't know ALB _does_ support WebSockets — the question is about _performance_, not capability.

## What are the two types of access that you can provide when you are creating users?

When creating users in AWS IAM, you can provide two types of access: **Programmatic Access** and **Console Access**.

|     | Programmatic Access | Console Access |
| --- | --- | --- |
| **How** | Access Key ID + Secret Access Key | Username + Password (+ MFA) |
| **Used by** | CLI, SDK, API, applications | Humans via browser |
| **Credentials** | Access key pair | Password |
| **MFA** | Optional but recommended | Optional but recommended |

**Trap:**

- Secret Access Key is shown **only once** at creation — if lost, must regenerate
- Access keys should **never be hardcoded** in code — use IAM roles instead
- Candidates who don't mention IAM roles as the preferred alternative to access keys for EC2/Lambda miss a critical security best practice

**For managers:**

> There are two ways to give someone access to AWS. Console Access is like a login to a website — a person opens a browser, enters username and password, and sees the AWS dashboard. Programmatic Access is for software and scripts — instead of a password, the application uses a secret key pair to communicate with AWS automatically, without any human clicking buttons.

## One of my S3 buckets is deleted but I need to restore it. Is it possible, if yes, how?

**Short answer: No — by default, a deleted S3 bucket cannot be restored.**

**However, it depends on what was configured beforehand:**

| Feature | Recoverable? |
| --- | --- |
| **Versioning enabled** | Objects recoverable, but bucket name itself must be recreated |
| **Versioning disabled** | Objects permanently gone |
| **S3 Replication (CRR/SRR)** | Objects exist in replica bucket |
| **AWS Backup** | Restore from backup if configured |
| **CloudTrail + S3 access logs** | Can see who deleted it, not restore it |

**Key facts:**

- S3 bucket names are **globally unique** — you can recreate the same bucket name only if no one else has taken it in the meantime
- With versioning, deleted objects have a **delete marker** — removing the marker restores the object
- Without any of the above configured → **data is gone permanently**

**Trap:** Candidates who say "contact AWS support to restore" — wrong. AWS cannot restore deleted S3 data on your behalf.

**Prevention candidates should recommend:**

- Enable **Versioning**
- Enable **MFA Delete** for critical buckets
- Enable **S3 Object Lock** for compliance/immutability
- Set up **replication** for critical data

**For managers:**

> Think of S3 versioning like the version history in Google Docs — every change is saved, and you can roll back. Without it, deleting a file in S3 is like permanently shredding a document — even AWS cannot recover it. This is why backups and versioning must be configured in advance, not after the fact.

## You receive a "Service Limit Exceeded" error when launching an EC2 instance. What are the causes and how do you resolve it?

**Cause:** AWS enforces **default service quotas** per account per region — e.g. max running On-Demand instances of a specific type.

**Resolution:**

1. **Check current limits** — AWS Console → Service Quotas → EC2, or use CLI:

```bash
   aws service-quotas list-service-quotas --service-code ec2
```

2. **Request a quota increase** — Service Quotas console → Request increase (takes hours to days)
3. **Switch instance type/family** — if quota is for specific instance family (e.g. `vCPU limit for G instances`)
4. **Switch region** — each region has independent quotas
5. **Stop/terminate unused instances** — free up existing quota

**Key quotas candidates should know:**

- vCPU-based limits per instance family (not per instance count anymore)
- Elastic IPs: 5 per region default
- VPCs: 5 per region default
- Security Groups: 2500 per VPC default

**Trap:** Since 2020 AWS uses **vCPU-based limits** not instance count limits — candidates saying "you can only run X instances" are outdated.

**For managers:**

> AWS sets default caps on resources per account to prevent accidental runaway costs. If you hit a cap, you simply request AWS to raise it — usually approved within 24 hours.

## How do you extend an EBS volume on Linux and Windows after resizing it in AWS?

**Two steps required:**

1. **Resize the EBS volume** in AWS Console / CLI
2. **Extend the filesystem** inside the OS — AWS resizes the block device but does NOT touch the filesystem

* * *

**Linux:**

```bash
# Check current disk/partition state
lsblk

# Grow partition (if partitioned)
sudo growpart /dev/xvda 1

# Extend filesystem
sudo resize2fs /dev/xvda1        # ext4
sudo xfs_growfs /                # xfs (Amazon Linux 2 default)
```

**Windows:**

1. Disk Management → right-click volume → **Extend Volume**
2. Or via PowerShell:

```powershell
Resize-Partition -DriveLetter C -Size (Get-PartitionSupportedSize -DriveLetter C).SizeMax
```

* * *

**Key facts:**

- EBS modification is **online** — no reboot required
- Modification has a **6 hour cooldown** before you can modify the same volume again
- `xfs_growfs` is online, `resize2fs` is also online for mounted volumes

**Trap:** Candidates who say "just resize in console and it's done" fail — the OS-level filesystem extension is mandatory and often forgotten.

**For managers:**

> Resizing the disk in AWS is like buying a larger hard drive. But the operating system still needs to be told to use the extra space — otherwise it sits there unused.

## What are parameter groups in Amazon RDS, and what are they used for?

**Parameter Groups** are configuration profiles for RDS database engines — a collection of engine-specific settings applied to one or more DB instances.

**Think of it as:** a config file (like `my.cnf` for MySQL) managed by AWS instead of editing files directly on the server.

**Examples of parameters:**

- `max_connections` — maximum concurrent connections
- `innodb_buffer_pool_size` — MySQL memory allocation
- `log_connections` — enable/disable connection logging
- `timezone` — database timezone
- `ssl` — enforce SSL connections

**Two types:**

| Type | Description |
| --- | --- |
| **DB Parameter Group** | For single DB instances |
| **DB Cluster Parameter Group** | For Aurora clusters |

**Key facts:**

- AWS provides a **default parameter group** — cannot be modified
- Must create a **custom parameter group** to change any settings
- **Static parameters** — require DB reboot to apply
- **Dynamic parameters** — apply immediately without reboot
- Parameter groups can be **shared across multiple instances**

**Trap:** Candidates often forget you cannot edit the default parameter group — you must create a custom one. Also missing the static vs dynamic distinction.

**For managers:**

> Parameter Groups are like settings profiles for your database engine. Instead of SSH-ing into a server and editing config files manually, AWS lets you manage all database settings from a central place and apply them to multiple databases at once.

## What are AWS resource tags, how are they used, and what are practical examples?

**AWS Resource Tags** are key-value pairs that you can assign to AWS resources (EC2, S3, RDS, etc.) for **identification, organization, automation, cost management etc.**.

**Use cases:**

| Use Case | Example Tag | Value |
| --- | --- | --- |
| **Cost Allocation** | `CostCenter` | `marketing` |
| **Environment separation** | `Environment` | `prod` / `staging` / `dev` |
| **Ownership** | `Owner` | `team-backend` |
| **Automation** | `AutoShutdown` | `true` |
| **Compliance** | `DataClassification` | `confidential` |
| **Project tracking** | `Project` | `migration-2024` |

**Practical examples:**

- **Billing** — filter AWS Cost Explorer by tag to see exact spend per team/project
- **Automation** — Lambda function shuts down all EC2 instances tagged `AutoShutdown=true` at night
- **Access control** — IAM policies can enforce access based on tags (ABAC)
- **Incident response** — quickly identify all resources belonging to a specific service

**Key facts:**

- Max **50 tags** per resource
- Tag keys are **case-sensitive**
- Tags are **not retroactive** — untagged resources won't appear in tag-based reports
- **Tag policies** (AWS Organizations) enforce tagging standards across accounts

**Trap:** Candidates who only mention cost allocation miss automation and ABAC use cases. Also — tags are not inherited by child resources automatically.

**For managers:**

> Tags are like sticky labels on everything in your AWS account. Without them, your AWS bill is one giant number. With them, you can instantly see exactly how much marketing, engineering, or a specific project is spending — and automate actions based on those labels.

## What is the default Elastic IP address quota per AWS account, and how can it be increased?

The default Elastic IP (EIP) address quota per AWS account is **5 EIPs per region**.

**Key facts:**

- Limit is **per region** — 5 in `eu-central-1`, another 5 in `us-east-1`, etc.
- Can be increased via **Service Quotas** request
- EIP is **free when attached to a running instance**
- Charged when **idle** (not attached or attached to stopped instance) — AWS discourages hoarding

**Trap:** Candidates often don't know EIPs are **free in use but charged when idle** — this is a common unexpected cost source in real environments.

To increase this quota, you can request a quota increase through the **AWS Service Quotas console**.

1. AWS Console → **Service Quotas** → EC2 → search "Elastic IP"
2. Click **Request quota increase**
3. Enter desired limit → submit

Alternatively via CLI:

```bash
aws service-quotas request-service-quota-increase \
  --service-code ec2 \
  --quota-code L-0263D0A3 \
  --desired-value 20
```

Approval typically within **24-48 hours**. No guaranteed upper limit — AWS evaluates case by case.

**For managers:**

> AWS gives you 5 permanent public IP addresses per region for free as long as they're in use. If you reserve one but don't use it, AWS charges you — intentionally, to prevent companies from hoarding scarce public IP addresses.

## In a Multi-AZ RDS deployment, can the standby instance be used for read or write operations alongside the primary instance?

**No — the standby instance is not accessible for read or write operations.**

The standby exists **solely for failover** — it is completely passive.

|     | Primary | Standby |
| --- | --- | --- |
| **Read** | ✅   | ❌   |
| **Write** | ✅   | ❌   |
| **Accessible** | ✅   | ❌   |
| **Purpose** | Active workload | Failover only |

**If you need read scaling → use Read Replicas**, not Multi-AZ standby.

|     | Multi-AZ Standby | Read Replica |
| --- | --- | --- |
| **Readable** | No  | Yes |
| **Purpose** | HA/failover | Read scaling |
| **Replication** | Synchronous | Asynchronous |
| **Automatic failover** | Yes | No  |

**Trap:** This is a classic interview trap — candidates confuse Multi-AZ with Read Replicas. They serve fundamentally different purposes and are not interchangeable.

**For managers:**

> The standby database in Multi-AZ is like a spare tire — it's there if something goes wrong, but you don't drive on it. If you want to spread the workload across multiple databases, that's a different feature called Read Replicas.

## Which AWS services would you use to collect and process e-commerce data for near real-time analysis?

**Reference architecture:**

```plaintext
E-Commerce App
      ↓
Kinesis Data Streams        ← ingest real-time events (orders, clicks, payments)
      ↓
Kinesis Data Firehose        ← buffer, transform, deliver
      ↓
S3 (raw data lake)           ← store raw events
      ↓
AWS Glue                     ← ETL, schema discovery, data catalog
      ↓
Redshift / Athena            ← analytics queries
      ↓
QuickSight                   ← visualization/dashboards
```

**Service responsibilities:**

| Service | Role |
| --- | --- |
| **Kinesis Data Streams** | Real-time event ingestion |
| **Kinesis Data Firehose** | Delivery to S3/Redshift/OpenSearch |
| **Lambda** | Lightweight real-time transformations |
| **S3** | Raw data lake storage |
| **Glue** | ETL, data catalog |
| **Redshift** | Data warehouse for complex queries |
| **Athena** | Ad-hoc SQL queries directly on S3 |
| **QuickSight** | Business dashboards |
| **DynamoDB** | Real-time operational data (inventory, sessions) |
| **ElastiCache** | Low-latency caching (product pages, cart) |

**Trap:** Candidates who only mention Kinesis + S3 miss the full pipeline. Strong candidates describe the **end-to-end flow** and justify each service choice.

**For managers:**

> Think of it as a real-time conveyor belt — customer actions (clicks, purchases) are captured instantly, processed automatically, and appear in business dashboards within seconds, enabling decisions like dynamic pricing or fraud detection in near real-time.

## A company is deploying a new two-tier web application on AWS. They have a limited team, require high availability, and the application requires complex queries and table joins. Which configuration best meets these requirements?

**Answer: ELB + Auto Scaling + RDS Multi-AZ**

**Why:**

| Requirement | Solution |
| --- | --- |
| **Limited staff** | Managed services — no manual maintenance |
| **High availability** | ELB + Auto Scaling Group + RDS Multi-AZ |
| **Complex queries + joins** | RDS (relational) — not DynamoDB |

**Architecture:**

```plaintext
Route 53
    ↓
ALB (multi-AZ)
    ↓
Auto Scaling Group (EC2, min 2 AZs)
    ↓
RDS Multi-AZ (MySQL/PostgreSQL/Aurora)
```

**Key justifications:**

- **RDS** — fully managed, handles patching, backups, failover automatically — minimal staff overhead
- **Multi-AZ** — automatic failover, no manual intervention
- **Auto Scaling** — handles traffic spikes without manual capacity planning
- **ALB** — health checks, automatic traffic rerouting on instance failure
- **Aurora** — best choice if highest availability + performance needed with minimal ops overhead

**Trap:** Candidates who suggest DynamoDB fail — NoSQL cannot handle complex joins. The "complex queries and table joins" requirement explicitly points to a **relational database**.

**For managers:**

> This setup runs itself — AWS handles server failures, traffic spikes, and database failovers automatically. The small team only manages the application code, not the infrastructure.

## What are the suitable use cases for Amazon DynamoDB?

DynamoDB is a **fully managed, serverless, key-value and document NoSQL database** optimized for **high throughput, low latency, and massive scale**.

**Suitable use cases:**

| Use Case | Why DynamoDB |
| --- | --- |
| **Session management** | Fast key-value lookups, TTL for auto-expiry |
| **Shopping cart** | High write throughput, flexible schema |
| **Gaming leaderboards** | Single-digit millisecond reads at scale |
| **IoT telemetry** | Massive write ingestion, time-series patterns |
| **Real-time recommendations** | Low latency, high read throughput |
| **Mobile backends** | Serverless, scales to zero, global replication |
| **Caching layer** | DAX (DynamoDB Accelerator) for microsecond latency |
| **Event sourcing** | DynamoDB Streams for change capture |

**NOT suitable for:**

| Scenario | Use instead |
| --- | --- |
| Complex joins/queries | RDS / Aurora |
| ACID transactions across tables | RDS |
| Reporting / analytics | Redshift / Athena |
| Full-text search | OpenSearch |

**Trap:** DynamoDB does support **transactions** (since 2018) — but only within DynamoDB itself, not across services. Candidates who say "DynamoDB has no transactions" are outdated.

**For managers:**

> DynamoDB is built for speed and scale at any size — millions of requests per second with consistent millisecond response times. It trades complex querying capability for raw performance and zero infrastructure management.

## Your application collects data from mobile devices every 5 minutes, stores it in DynamoDB, and daily exports per-user data to S3 for visualization. How would you optimize this architecture to reduce costs?

**Problems with current architecture:**

| Issue | Cost Impact |
| --- | --- |
| DynamoDB storing all data indefinitely | Expensive at scale |
| Daily full export to S3 | Inefficient, costly DynamoDB reads |
| Visualization directly from DynamoDB | Wrong tool, expensive |

* * *

**Optimized architecture:**

```
Mobile Device
      ↓
API Gateway + Lambda          ← serverless ingest, no idle EC2 cost
      ↓
DynamoDB (hot data only)      ← TTL set to 24-48h, auto-delete old items
      ↓
DynamoDB Streams              ← trigger on new data, no polling
      ↓
Lambda                        ← process and aggregate per user
      ↓
S3 (cold storage, partitioned by user/date)
      ↓
Athena / QuickSight           ← visualization directly from S3
```

**Key optimizations:**

| Optimization | Saving |
| --- | --- |
| **DynamoDB TTL** | Auto-expire old items — no manual deletes, no read cost |
| **DynamoDB Streams** | Event-driven export instead of expensive daily scans |
| **S3 for cold data** | Drastically cheaper than DynamoDB long-term storage |
| **API Gateway + Lambda** | Serverless ingest — pay per request, not idle servers |
| **Athena for visualization** | Query S3 directly — pay per query, no database needed |
| **S3 Intelligent-Tiering** | Auto-move infrequent user data to cheaper storage class |
| **DynamoDB on-demand mode** | If write patterns are unpredictable — avoid over-provisioning |

**Trap:** Candidates who suggest keeping all data in DynamoDB long-term fail — DynamoDB is expensive for cold/archival data. S3 + Athena is the correct pattern for historical data at scale.

**For managers:**

> The key insight is using the right storage for the right data age. Fresh data lives in a fast, expensive database for immediate access. After 24 hours it moves automatically to cheap storage, where it can still be queried and visualized — at a fraction of the cost.

## You are running a website on EC2 instances deployed across multiple Availability Zones with a Multi-AZ RDS MySQL Extra Large instance. The site performs a high number of small reads and writes per second and relies on an eventual consistency model. After testing, you discover read contention on RDS MySQL. What is the best approach to resolve this?

**Root cause:** Too many read requests hitting the primary RDS instance → contention.

**Best approach: ElastiCache + RDS Read Replicas**

| Solution | Purpose |
| --- | --- |
| **ElastiCache (Redis/Memcached)** | Cache frequent reads — offload RDS entirely |
| **RDS Read Replicas** | Distribute read traffic across multiple instances |

* * *

**Why ElastiCache first:**

- Small, frequent reads = perfect cache candidate
- Eventual consistency model = cache staleness is acceptable
- Sub-millisecond response vs milliseconds from RDS
- Drastically reduces RDS read load

**Why Read Replicas second:**

- Cache misses still hit DB — replicas handle those
- Can add up to **5 Read Replicas** for MySQL RDS
- Application must route reads to replica endpoint, writes to primary

**Optimized architecture:**

```plaintext
EC2 (multi-AZ)
      ↓
ElastiCache (Redis)     ← serve cached reads
      ↓ (cache miss)
RDS Read Replica(s)     ← handle uncached reads
      ↓ (writes only)
RDS Primary Multi-AZ    ← writes + failover
```

**What NOT to do:**

| Wrong approach | Why |
| --- | --- |
| Upgrade to larger instance | Treats symptom, not cause |
| Add more EC2 instances | Increases read pressure on RDS |
| Switch to Multi-Master | Overkill, doesn't solve read contention |

**Trap:** Candidates who only suggest Read Replicas miss ElastiCache — with eventual consistency explicitly stated, caching is the optimal and cheaper solution. Upgrading instance size is the worst answer.

**For managers:**

> Instead of buying a bigger database server, we put a fast memory cache in front of it. Most read requests never reach the database at all — they're answered from memory in microseconds. Only new or updated data bypasses the cache and hits the database.

## A startup running a pilot with 100 sensors generates ~4GB of sensor data per month. The current stack uses Auto Scaling EC2 instances and RDS with 500GB storage. The pilot was successful and they now want to scale to 100K sensors, with data retained for at least 2 years for analysis. Which architecture would you recommend?

**First, the math:**

|     | Pilot | Production |
| --- | --- | --- |
| **Sensors** | 100 | 100,000 |
| **Data/month** | 4 GB | 4 TB |
| **Data/2 years** | ~96 GB | ~96 TB |

**RDS is the wrong tool here** — 96 TB of time-series sensor data in RDS would be:

- Extremely expensive
- Poor query performance at that scale
- Operationally painful to manage

* * *

**Recommended architecture:**

```
100K Sensors
      ↓
IoT Core                      ← managed device ingestion at scale
      ↓
Kinesis Data Streams          ← real-time ingestion buffer
      ↓
Kinesis Firehose + Lambda     ← transform, aggregate
      ↓
S3 (partitioned by date/sensor) ← cheap long-term storage (~96TB)
      ↓
Glue                          ← ETL, data catalog
      ↓
Athena / Redshift             ← 2-year historical analysis
      ↓
QuickSight                    ← visualization
```

**Key service justifications:**

| Service | Why |
| --- | --- |
| **IoT Core** | Built for massive device fleet management |
| **Kinesis** | Handles 100K concurrent sensor streams |
| **S3** | Cheapest storage at 96TB scale, durable |
| **S3 Intelligent-Tiering** | Auto-tier older data to cheaper storage classes |
| **Athena** | Query 96TB on S3 without provisioning a DB |
| **Redshift** | If complex analytical queries needed at scale |
| **Timestream** | Alternative — purpose-built time-series DB for sensor data |

**Keep from existing stack:**

- **Auto Scaling EC2** — still valid for API/application layer
- **RDS** — demote to operational data only (device registry, metadata) — not sensor data

**Trap:** Candidates who suggest scaling RDS to handle 96TB of sensor data fail — RDS is OLTP, not purpose-built for time-series analytics at petabyte scale. **Timestream** is the bonus answer — purpose-built for exactly this use case.

**For managers:**

> The current setup is like storing millions of weather readings in an Excel spreadsheet — it works for 100 rows but breaks at a million. We replace it with purpose-built tools: a pipeline that automatically ingests, stores, and analyzes terabytes of sensor data cheaply and reliably, without any manual intervention.

## You have an application that requires both image rendering and general-purpose computing. Which AWS service best fits this requirement?

**EC2 with GPU instances** — specifically the **G-family or P-family instances**.

| Instance Family | Use Case |
| --- | --- |
| **G4dn / G5** | Graphics rendering, ML inference, video transcoding |
| **G6** | Latest gen, NVIDIA L4 GPU, rendering + ML |
| **P3 / P4** | Heavy ML training, HPC |
| **C6i / C7i** | General compute (no GPU) |

**Recommended setup:**

```
ALB
  ↓
Auto Scaling Group (G4dn/G5 instances)
  ↓
S3                    ← store rendered images
  ↓
CloudFront            ← deliver rendered images globally
```

**Why not other services:**

| Service | Why not |
| --- | --- |
| **Lambda** | No GPU, 15min timeout, not for rendering |
| **ECS/EKS** | Can use GPU but needs EC2 G-family underneath anyway |
| **Elastic Beanstalk** | Too opinionated, same underlying EC2 |

**Additional considerations:**

- **Spot Instances** on G4dn — rendering is fault-tolerant, up to 90% cost saving
- **AWS Thinkbox Deadline** — if distributed rendering pipeline needed
- **S3 + CloudFront** — store and deliver rendered output efficiently

**Trap:** Candidates who answer just "EC2" without specifying GPU instance families are too vague. The rendering requirement explicitly demands GPU-capable instances.

**For managers:**

> Standard servers handle everyday tasks but struggle with image rendering — it requires specialized graphics processors (GPUs), the same chips used in gaming. AWS offers servers with these chips built in, and you only pay for them while rendering — then scale back down.

Further traps:

**The question says "render images" + "general computing" without specifying batch vs real-time** — this is the ambiguity.

- Candidates who suggest Lambda for rendering — Lambda has no GPU support and is not designed for long-running, resource-intensive tasks.
- Candidates who suggest ECS/EKS without mentioning GPU instances — they miss the critical requirement for GPUs.
- Candidates who suggest Elastic Beanstalk — it's a higher-level abstraction that doesn't give you the control needed for GPU workloads and is not commonly used for this use case.

**AWS Batch is correct if** the workload is **batch/offline rendering** — e.g. render 10,000 images overnight. Batch orchestrates jobs, provisions GPU instances underneath, and scales to zero when done.

**AWS Batch is wrong if** the workload requires **real-time/interactive rendering** — Batch has job queuing latency, not suitable for on-demand rendering per user request.

**Corrected answer:**

| Scenario | Best fit |
| --- | --- |
| **Batch/offline rendering** | AWS Batch + G4dn Spot Instances |
| **Real-time/on-demand rendering** | EC2 G-family + Auto Scaling |
| **Both** | AWS Batch for bulk + EC2 Auto Scaling for interactive |

## Your content management system running on EC2 is approaching 100% CPU utilization. Which options would reduce the load on the EC2 instance?

**Root cause first:** 100% CPU on a CMS is typically caused by:

- Serving static assets (images, CSS, JS) — should never hit CPU
- Dynamic page rendering on every request — missing cache
- Database queries on every request — missing cache

* * *

**Solutions ranked by impact:**

| Solution | How it reduces CPU |
| --- | --- |
| **CloudFront (CDN)** | Serve static assets at edge — never reaches EC2 |
| **ElastiCache (Redis)** | Cache rendered pages/DB queries — fewer compute cycles |
| **Auto Scaling** | Distribute load across multiple instances |
| **RDS Read Replicas** | Offload DB reads from application layer |
| **S3 + CloudFront** | Offload static asset serving entirely |
| **ALB + Auto Scaling** | Horizontal scaling — no single instance bottleneck |

* * *

**Optimal architecture:**

```plaintext
CloudFront (static assets + cached pages)
      ↓
ALB
      ↓
Auto Scaling Group (EC2 CMS)
      ↓
ElastiCache (Redis)     ← page/fragment cache
      ↓
RDS Multi-AZ + Read Replicas
```

**Trap:** Candidates who only say "scale up EC2 (vertical scaling)" or "add more EC2 instances" without addressing the root cause fail — a bigger instance still hits 100% CPU if static assets and DB queries are unoptimized. Fix the architecture first, scale second.

**For managers:**

> The server is doing work it shouldn't be doing — like a chef personally delivering every meal instead of having waiters. CloudFront handles static content delivery, ElastiCache answers repeated questions from memory, so the server only does actual cooking — complex, dynamic requests.

## What is Connection Draining in AWS, and what is its purpose?

**Connection Draining** (now called **Deregistration Delay** in ALB/NLB) ensures that in-flight requests are completed before an EC2 instance is removed from a load balancer.

**How it works:**

1. Instance is marked for removal (scale-in, health check fail, manual deregistration)
2. ELB **stops sending new requests** to that instance
3. ELB **waits** for existing in-flight requests to complete
4. After timeout or all requests complete → instance is deregistered/terminated

**Key facts:**

| Parameter | Value |
| --- | --- |
| **Default timeout** | 300 seconds |
| **Minimum** | 0 seconds (disabled) |
| **Maximum** | 3600 seconds |
| **CLB name** | Connection Draining |
| **ALB/NLB name** | Deregistration Delay |

**When to tune:**

- **Short-lived requests** (REST APIs) → lower to 30-60s
- **Long-running requests** (file uploads, reports) → increase to 600s+
- **Set to 0** → immediate termination, requests dropped — only for stateless, idempotent workloads

**Trap:** Candidates who don't know it was renamed to **Deregistration Delay** in ALB/NLB, or who don't mention the timeout tunability, give an incomplete answer.

**For managers:**

> When AWS needs to shut down a server, Connection Draining tells the load balancer to stop sending new visitors to that server but wait for current visitors to finish what they're doing before pulling the plug — like a store that stops letting new customers in but lets existing ones finish their shopping before closing.

## Which AWS service automatically terminates unhealthy EC2 instances and replaces them with new ones?

**Auto Scaling Groups (ASG)** with **Health Checks** enabled.

**How it works:**

1. ASG continuously monitors instance health via **EC2 status checks** and/or **ELB health checks**
2. Instance marked unhealthy
3. ASG **terminates** the unhealthy instance
4. ASG **launches a replacement** from the configured AMI to maintain desired capacity

**Two health check types ASG uses:**

| Type | What it checks |
| --- | --- |
| **EC2 health check** | Instance system/hardware status (default) |
| **ELB health check** | Application-level health (HTTP response) — must be explicitly enabled |

**Trap:** By default ASG only uses **EC2 health checks** — if the instance is running but the application is crashed, ASG won't replace it unless **ELB health checks are enabled** on the ASG. Candidates who miss this fail.

**Key distinction:**

| Service | Role |
| --- | --- |
| **ELB** | Detects unhealthy instance, stops routing traffic |
| **ASG** | Terminates and replaces unhealthy instance |

They work together — ELB detects, ASG acts.

**For managers:**

> Auto Scaling is like a self-healing system — if a server breaks, it's automatically thrown away and a fresh identical one takes its place, without any human intervention. The load balancer notices the problem first and stops sending traffic, then Auto Scaling replaces the broken server.

## What are Auto Scaling Lifecycle Hooks and what are they used for?

**Auto Scaling Lifecycle Hooks** allow you to perform custom actions during the instance launch or termination process in an Auto Scaling Group (ASG).

**Two hook types:**

| Hook | Transition | Use Case |
| --- | --- | --- |
| **Launch Hook** | Pending → InService | Install software, register with config mgmt, warm up cache |
| **Terminate Hook** | Terminating → Terminated | Drain connections, backup logs, deregister from service discovery |

**State flow with hooks:**

```plaintext
Launch:
Pending → Pending:Wait → (custom action) → Pending:Proceed → InService

Terminate:
Terminating → Terminating:Wait → (custom action) → Terminating:Proceed → Terminated
```

**How custom actions are triggered:**

| Method | Use Case |
| --- | --- |
| **SNS** | Notify external system |
| **SQS** | Queue-based processing |
| **EventBridge** | Trigger Lambda for automated actions |

**Key facts:**

- Default timeout: **3600 seconds (1 hour)**
- Instance stays paused until: timeout expires OR `complete-lifecycle-action` called
- On timeout: default result is **ABANDON** (terminate) or **CONTINUE** — configurable

**Practical examples:**

- Launch hook → wait for **Ansible/Chef** to finish configuring instance before serving traffic
- Terminate hook → **flush logs to S3**, deregister from Consul/service mesh before shutdown

**Trap:** Candidates who say "lifecycle hooks are just for health checks" fundamentally misunderstand them — they are for **custom automation during state transitions**, not health monitoring.

**For managers:**

> Lifecycle hooks are like a pause button during server startup or shutdown. Before a new server starts taking traffic, you can automatically install software or run tests. Before a server shuts down, you can save its logs or gracefully disconnect it from other systems — all automatically.

## To create a mirror image of your environment in another region for disaster recovery, which AWS resources do not need to be recreated in the second region?

**Answer: IAM Resources**

IAM is **global** — not region-specific. Users, roles, policies, and groups are automatically available in all regions.

**Global vs Regional resources:**

| Resource | Scope | Needs recreation in DR region? |
| --- | --- | --- |
| **IAM** (users, roles, policies) | Global | ❌ No |
| **Route 53** | Global | ❌ No |
| **CloudFront** | Global | ❌ No |
| **S3 bucket names** | Global namespace | ❌ No (but data needs CRR) |
| **EC2 instances** | Regional | ✅ Yes |
| **EBS volumes** | AZ-locked | ✅ Yes |
| **RDS instances** | Regional | ✅ Yes |
| **VPC** | Regional | ✅ Yes |
| **Security Groups** | Regional | ✅ Yes |
| **AMIs** | Regional | ✅ Yes (copy to DR region) |
| **ELB** | Regional | ✅ Yes |
| **ElastiCache** | Regional | ✅ Yes |

**Trap:** Candidates often forget **Route 53 and CloudFront are also global** — not just IAM. Also — S3 bucket names are globally unique but **data is regional** — Cross-Region Replication (CRR) must be configured separately.

**For managers:**

> Think of IAM like your company's HR system — it works everywhere regardless of which office you're in. Most other AWS resources are like physical office equipment — you need a separate set in each location for disaster recovery.

Further traps:

- Candidates who say "S3 buckets don't need to be recreated" are partially correct — the bucket name is global, but the data is regional. You must set up Cross-Region Replication (CRR) to keep data in sync between regions.
- Candidates who say "CloudFront distributions don't need to be recreated" are correct — CloudFront is global, but the distribution configuration and origin settings may need to be updated to point to the new region's resources.
- Candidates who say "IAM roles don't need to be recreated" are correct — IAM is global, but if the roles reference region-specific resources (e.g. an S3 bucket in the original region), you may need to update the role policies to point to the new region's resources.

**Route 53 itself is global** — hosted zones and record sets are stored globally and replicated by AWS automatically.

However in a DR context:

| Resource | Behavior |
| --- | --- |
| **Route 53 Hosted Zone** | Global, no recreation needed |
| **Record Sets** | Global, no recreation needed — but **must be updated** to point to DR region endpoints |

**The nuance:**

- The record set **exists globally** — no recreation needed ✅
- But `api.example.com → ALB in eu-central-1` becomes invalid if that region is down
- You must either:
    - **Pre-configure failover routing policy** → automatic switchover to DR region
    - **Manually update** record to point to DR region ALB → slow, error-prone

**Best practice for DR:**

```
Route 53 Failover Routing
  ├── Primary: ALB eu-central-1 (health check)
  └── Secondary: ALB us-east-1 (DR region)
```

Auto-failover when primary health check fails — no manual intervention.

**Trap:** Candidates who say "Route 53 is global so nothing to do" miss the critical point — record sets need **failover routing pre-configured** to be useful in a real DR scenario.

**Key insight for strong candidates:**

> "Global" means the resource definition exists everywhere — it does **not** mean the resource automatically works correctly in a DR scenario without configuration updates.

This is the difference between a **junior answer** ("IAM/CloudFront/Route53 are global, nothing to do") and a **senior answer** (understanding that global scope ≠ DR-ready without reviewing all resource references and configurations).

## Which AWS services are NOT suitable for deploying an application?

**Answer: IAM and Route 53**

- **IAM** — identity and access management, not a deployment platform
- **Route 53** — DNS routing, not a deployment platform

**Services used FOR deployment:**

| Service | Deployment type |
| --- | --- |
| **EC2** | VM-based deployment |
| **ECS** | Container deployment |
| **EKS** | Kubernetes deployment |
| **Lambda** | Serverless deployment |
| **Elastic Beanstalk** | PaaS, managed deployment |
| **App Runner** | Containerized web apps, fully managed |
| **CodeDeploy** | Automated deployment to EC2/ECS/Lambda |
| **Amplify** | Frontend/fullstack web deployment |

**Trap:** This is a conceptual question — candidates who hesitate on IAM and Route 53 reveal they think of AWS services purely technically without understanding their **purpose categories**:

- **Security & Identity** → IAM, KMS, Cognito
- **Networking & DNS** → Route 53, VPC, CloudFront
- **Compute & Deployment** → EC2, ECS, Lambda

**For managers:**

> Asking Route 53 or IAM to deploy your app is like asking your HR department or receptionist to build your product — wrong tool, wrong purpose.

## Compare Cloud Computing with Serverless Architecture. (Trick question)

**The trick: Serverless IS cloud computing — it's a subset, not an alternative.**

Candidates who treat them as opposing concepts fail immediately.

> That's an interesting comparison — I want to make sure we're aligned on the premise, because serverless is actually a subset of cloud computing, not a separate concept. Were you perhaps looking to compare serverless against traditional IaaS, or maybe serverless vs containerized deployments?

```
Cloud Computing
├── IaaS (EC2, EBS, VPC)
├── PaaS (Elastic Beanstalk, RDS)
└── Serverless / FaaS (Lambda, DynamoDB, S3, API Gateway)
```

**Correct comparison is abstraction level:**

|     | Traditional Cloud (IaaS) | Serverless |
| --- | --- | --- |
| **Infrastructure management** | You manage OS, patching, scaling | AWS manages everything |
| **Scaling** | Manual or Auto Scaling config | Automatic, instant |
| **Billing** | Per hour/instance | Per request/execution |
| **Idle cost** | Yes — stopped instances still cost | No — zero cost when idle |
| **Cold start** | None | Yes — first invocation latency |
| **State** | Stateful possible | Stateless by design |
| **Execution limit** | None | Lambda: 15 min max |
| **Control** | Full OS/runtime control | Limited runtime control |

**Serverless AWS services candidates should know:**

- **Lambda** — compute
- **DynamoDB** — database
- **S3** — storage
- **API Gateway** — HTTP layer
- **EventBridge** — event bus
- **Step Functions** — orchestration
- **Aurora Serverless** — relational DB

**Trap:** Candidates who say "serverless means no servers" — technically wrong. Servers exist, you just don't manage them. The correct statement is **"no server management"**.

**For managers:**

> Cloud computing is the broad concept of renting IT infrastructure over the internet. Serverless is simply the most hands-off version of it — you only write code and AWS handles everything else, billing you only for the exact milliseconds your code runs.

## Are there capabilities unique to AWS that Azure lacks, and vice versa?

**Trick question again** — at the macro level, both platforms offer equivalent services for virtually every category. A candidate who gives a definitive "AWS can do X but Azure can't" is likely wrong or citing outdated information.

**The honest senior answer:**

|     | AWS Strengths | Azure Strengths |
| --- | --- | --- |
| **Ecosystem maturity** | Broader service catalog, longer track record | Deep Microsoft/enterprise integration |
| **Unique services** | Braket (Quantum), Ground Station (Satellite), Outposts | Azure Arc (hybrid), Sentinel (SIEM), Active Directory integration |
| **AI/ML** | Bedrock (multi-model GenAI), SageMaker | OpenAI integration (Azure OpenAI Service) |
| **Hybrid** | Outposts, Local Zones | Azure Arc — stronger hybrid story |
| **Developer ecosystem** | Broader third-party integrations | Visual Studio, GitHub, DevOps native integration |
| **Enterprise identity** | Cognito, IAM | Azure AD (Entra ID) — far superior |
| **Gaming** | GameLift | PlayFab |
| **Satellite** | AWS Ground Station | No equivalent |
| **Quantum** | Braket | Azure Quantum |

**Key nuances:**

- **Azure Active Directory (Entra ID)** — no real AWS equivalent at enterprise scale. AWS Cognito and IAM Identity Center are not comparable for enterprise identity federation
- **AWS Ground Station** — no Azure equivalent
- **Azure OpenAI Service** — direct OpenAI GPT-4/o1 access natively integrated; AWS Bedrock offers multiple models but not OpenAI directly
- **Azure Arc** — manages resources across AWS, GCP, and on-premise from Azure; AWS has no direct equivalent

**Trap:** Candidates who claim fundamental capability gaps between the two platforms reveal they lack hands-on experience with both. The real differentiators are **depth, integration, and ecosystem** — not raw capability.

**For managers:**

> Both AWS and Azure can do virtually everything the other can. The real question is which platform fits your existing technology stack better. If your company runs Microsoft products — Office 365, Active Directory, Windows Server — Azure integrates more naturally. If you're building cloud-native from scratch, AWS has the broader ecosystem and longer track record.
