# AWS Interview Questions & Answers

## Q1: What is AWS?

**AWS (Amazon Web Services)** is Amazon's cloud computing platform, offering on-demand infrastructure and services (compute, storage, networking, databases, AI/ML, etc.) on a pay-as-you-go model, hosted across globally distributed data centers (Regions & Availability Zones).

---

## Q2: What are the main AWS components and how does AWS refer to them?

They are called **services**. AWS offers a wide range of services across various categories.

### Core Services (expected in interview)

**Compute:** EC2, Lambda, ECS, ECR, EKS

**Storage:** S3 (incl. S3 Glacier Instant/Flexible/Deep Archive), EBS, EFS, FSx, Storage Gateway, Snowball, Snowmobile

**Databases:** RDS, Aurora, DynamoDB, ElastiCache, Neptune, DocumentDB, QLDB, Timestream, Keyspaces, MemoryDB

**Networking:** VPC, Route 53, ELB, CloudFront, Direct Connect, Transit Gateway

**Security:** IAM, KMS, WAF, Shield, CloudTrail, Secrets Manager, GuardDuty, Security Hub, Macie

**Messaging & Streaming:** SQS, SNS, Kinesis, MSK, EventBridge

**DevOps & Developer Tools:** CodeCatalyst, CodeBuild, CodeDeploy, CodePipeline *(CodeCommit deprecated July 2024)*

**Monitoring Basics:** CloudWatch, Amazon Managed Grafana, Amazon Managed Service for Prometheus

### Optional Services (bonus knowledge)

**Analytics:** Redshift, EMR, Athena, Lake Formation, OpenSearch Service

**AI/ML:** SageMaker, Bedrock, Rekognition, Comprehend, Textract, Translate

**Management & Monitoring:** Config, Systems Manager, Trusted Advisor, AWS Health Dashboard, Compute Optimizer

**Cost Management:** Cost Explorer, Budgets, Cost and Usage Report, Cost Anomaly Detection

**Migration & Transfer:** Snowball, DMS, Application Migration Service (MGN), DataSync, Transfer Family

**Orchestration:** Step Functions, App Runner

**Mobile:** Amplify, Device Farm

**IoT:** IoT Core, IoT Greengrass

**Blockchain:** Managed Blockchain

**Game Development:** GameLift

**Quantum Computing:** Braket

**Robotics:** RoboMaker

**Satellite:** Ground Station

**Media Services:** MediaConvert, MediaLive, MediaPackage, MediaStore

**Business & End User Computing:** WorkSpaces, AppStream 2.0, Chime, Connect

**Customer Engagement:** Pinpoint, Connect

---

## Q3: What is S3 and why is it called that? Compare it with common databases.

**S3 = Simple Storage Service** — the three S's give it the name S3.

It is an **object storage** service, not a database. This is the trick: candidates often conflate the two.

| | S3 | Database (e.g. RDS/DynamoDB) |
|---|---|---|
| **Type** | Object store | Structured/semi-structured data store |
| **Access pattern** | Key → entire object (GET/PUT) | Query, filter, index, join |
| **Schema** | None | Defined (or flexible for NoSQL) |
| **Use case** | Files, backups, media, data lake | Transactional data, app state |
| **Querying** | No native query (Athena on top) | Native SQL / query API |
| **Consistency** | Strong consistency (since 2020) | Varies |

**Key trap:** S3 can feel like a key-value store, but it has no transactions, no indexing, no querying natively — it is fundamentally different from databases. Candidates who say "S3 is like a NoSQL database" fail this question.

**For managers:** Think of S3 like a postal warehouse — every package (object) has a unique tracking number (key). You can retrieve any package instantly by its number, but you cannot search inside the packages without opening them. S3 is where Big Data lives. Databases are where your application's operational data lives. Both are necessary and serve completely different purposes.

> **Note:** NoSQL is a broad term for non-relational databases — it includes document stores (MongoDB), key-value stores (Redis), column stores (Cassandra), graph DBs (Neptune). They all have query engines, indexing, and transactions. Object storage (S3) has none of that. They are orthogonal concepts.

---

## Q4: Can I use FTP to store folders in S3?

No. Two separate issues:

1. **FTP** — S3 uses HTTP/HTTPS REST API (GET, PUT, DELETE). No FTP protocol natively. AWS offers **Transfer Family** if SFTP/FTP access on top of S3 is needed.

2. **Folders** — S3 has no real folder hierarchy. It is a flat namespace. What appears as folders in the console are just **key prefixes** (e.g. `images/2024/photo.jpg` — the "folders" are part of the key name, nothing more).

**Trap:** Candidates who say "S3 has folders" are wrong. It is a UX illusion.

---

## Q5: Explain how EC2 works.

EC2 (Elastic Compute Cloud) provides **virtual machines (instances)** on-demand in AWS data centers.

AWS runs massive physical servers with hypervisors (Nitro System) that slice hardware into isolated virtual machines. You configure:

- **AMI** (Amazon Machine Image) — the OS/software template
- **Instance type** — CPU, RAM, GPU profile (e.g. `t3.medium`, `c6i.large`)
- **Storage** — EBS (persistent) or instance store (ephemeral)
- **Network** — VPC, subnet, security groups, elastic IP
- **IAM role** — what AWS services this instance can access

**Key concepts candidates must know:**

- On-demand vs Reserved vs Spot — cost models
- Auto Scaling — automatically add/remove instances based on load
- ELB + Auto Scaling Group — the standard HA pattern
- Security Groups — stateful firewall at instance level
- User Data — bootstrap scripts on first boot

**For managers:** EC2 is a rentable server in Amazon's data center. You pay by the hour, scale up when traffic spikes, scale down when it drops — no hardware to buy or maintain.

---

## Q6: What are the types of EBS volumes for EC2 instances?

### EBS (Elastic Block Store) — persistent, network-attached

| Type | Use Case |
|---|---|
| **gp3** (General Purpose SSD) | Default, balanced price/performance |
| **gp2** (General Purpose SSD) | Legacy, superseded by gp3 |
| **io2/io2 Block Express** | High IOPS, mission-critical DBs |
| **io1** | Legacy high IOPS, superseded by io2 |
| **st1** (Throughput HDD) | Big Data, sequential reads, cheap |
| **sc1** (Cold HDD) | Infrequent access, cheapest |

### Instance Store — ephemeral, physically attached

- Highest I/O performance (NVMe directly on host)
- Data lost on stop/terminate — not for persistent data
- Good for caches, temp data, buffers

**Key traps:**

- EBS volumes are AZ-locked — cannot attach to an instance in another AZ directly
- gp3 is the current default and cheaper than gp2
- Instance store ≠ EBS — many candidates confuse or forget instance store exists

---

## Q7: What is the difference between EBS and EFS?

| | EBS | EFS |
|---|---|---|
| **Type** | Block storage | Network file system (NFS) |
| **Access** | Single instance (one AZ) | Multiple instances simultaneously |
| **Scope** | AZ-locked | Region-wide (multi-AZ) |
| **Protocol** | Block device (mounted as disk) | NFS v4 |
| **Scaling** | Manual (provision size) | Automatic |
| **Use case** | OS disk, DB storage | Shared storage, microservices, CMS |
| **OS support** | Linux + Windows | Linux only |
| **Cost** | Cheaper | ~3x more expensive than EBS |

**Key trap:** EFS is Linux-only and EBS is AZ-locked — you cannot mount one EBS volume to instances in different AZs.

**For managers:** EBS is a hard drive for one server. EFS is a shared network drive that multiple servers can read and write simultaneously.

---

## Q8: What does AZ-locked mean?

AZ = **Availability Zone** — a physically separate data center within an AWS Region (e.g. `eu-central-1a`, `eu-central-1b`, `eu-central-1c`).

AZ-locked means the resource exists in exactly one AZ and cannot be accessed from another AZ. An EBS volume created in `eu-central-1a` can only be attached to an EC2 instance also running in `eu-central-1a`.

**For managers:** Imagine AWS has 3 buildings in Frankfurt. AZ-locked means your hard drive is physically in building A — servers in building B cannot use it.

---

## Q9: What are AMI and EIP?

### AMI (Amazon Machine Image)
A snapshot/template of an EC2 instance — contains the OS, software, configuration, and optionally data. Used to launch new instances.

- Can be AWS-provided, Marketplace, or custom
- Region-scoped — must be copied to use in another region
- Foundation of Auto Scaling — all instances in a group launch from the same AMI

### EIP (Elastic IP)
A static public IPv4 address you own in AWS — survives instance stop/start/replace.

- Normal EC2 public IPs change on every stop/start
- EIP stays fixed — useful for DNS, whitelisting, failover
- **Trap:** EIP is free only when attached to a running instance — idle EIPs are charged
- Limited to 5 per region by default (increasable via Service Quotas)

**For managers:** AMI = a master copy of a server you can clone instantly. EIP = a permanent phone number for your server that does not change even if you replace the hardware.

---

## Q10: What is the minimum and maximum size of individual objects stored in S3?

- **Minimum:** 0 bytes
- **Maximum:** 5 TB per object

**Upload limits:**

- Single PUT: max 5 GB
- Above 5 GB: must use **Multipart Upload** (recommended above 100 MB)
- Multipart supports up to 10,000 parts, each between 5 MB and 5 GB

**Trap:** Candidates often say 5 GB max — wrong. 5 GB is the single PUT limit, not the object size limit.

---

## Q11: What are the different storage classes in S3?

| Storage Class | Use Case | Retrieval |
|---|---|---|
| **S3 Standard** | Frequently accessed data | Milliseconds |
| **S3 Intelligent-Tiering** | Unknown/changing access patterns | Milliseconds |
| **S3 Standard-IA** | Less frequent, rapid access needed | Milliseconds |
| **S3 One Zone-IA** | Infrequent, non-critical, single AZ | Milliseconds |
| **S3 Glacier Instant Retrieval** | Archives, quarterly access | Milliseconds |
| **S3 Glacier Flexible Retrieval** | Archives, occasional access | Minutes to hours |
| **S3 Glacier Deep Archive** | Long-term, rarely accessed | Up to 12 hours |
| **S3 Express One Zone** | High-performance, latency-sensitive | Single-digit ms |

**Key traps:**

- One Zone-IA — data lost if AZ fails
- Intelligent-Tiering has a monitoring fee per object
- Glacier Instant Retrieval is millisecond access — Glacier ≠ slow anymore
- Express One Zone — newest class, often unknown to candidates
- Lifecycle policies can automate transitioning objects between classes

---

## Q12: What are the parameters for S3 pricing?

1. **Storage** — GB/month per storage class
2. **Requests** — PUT, COPY, POST, LIST, GET, DELETE — each request type has a cost
3. **Data Transfer** — ingress free, egress charged, cross-region charged
4. **Retrieval fees** — applies to IA and Glacier classes (per GB retrieved)
5. **Minimum storage duration** — Standard-IA = 30 days, Glacier Deep Archive = 180 days
6. **Replication** — CRR incurs transfer + request costs
7. **Management features** — Intelligent-Tiering monitoring fee, S3 Inventory, Analytics

**Trap:** Candidates who only mention storage costs miss requests, retrieval fees, and minimum duration charges — which can dominate costs in real workloads.

---

## Q13: What are the different types of Storage Gateway?

| Type | Protocol | Use Case |
|---|---|---|
| **S3 File Gateway** | NFS, SMB | On-premise apps store files → backed by S3 |
| **FSx File Gateway** | SMB | On-premise Windows apps → backed by FSx for Windows |
| **Volume Gateway (Stored)** | iSCSI | Full dataset on-premise, async backup to S3 |
| **Volume Gateway (Cached)** | iSCSI | Primary data in S3, frequently accessed cached locally |
| **Tape Gateway** | iSCSI VTL | Replace physical tape backups → virtual tapes in S3/Glacier |

- Storage Gateway runs as a VM appliance on-premise (or EC2)
- Primary use case: hybrid cloud and data migration

**Trap:** Stored vs Cached Volume Gateway — Stored: all data local, S3 is the backup. Cached: S3 is primary, local is just a cache.

---

## Q14: What is AWS Snowball?

AWS Snowball is a **physical data transfer device** AWS ships to you — you load data onto it, ship it back, and AWS imports it into S3/Glacier.

| Device | Capacity | Use Case |
|---|---|---|
| **Snowball Edge Storage Optimized** | 80 TB usable | Pure data migration |
| **Snowball Edge Compute Optimized** | 28 TB usable + GPU option | Edge computing + migration |
| **Snowmobile** | 100 PB | Exabyte-scale, literal truck |

- Data is encrypted at rest (AES-256)
- Snowball Edge can run EC2 instances and Lambda
- Snowmobile = a shipping container on a truck

**Rule of thumb:** If transferring data over your network would take more than a week → consider Snowball.

**Trap:** Snowball is not just for migration — Snowball Edge supports edge computing in remote/disconnected locations (oil rigs, ships, military).

---

## Q15: What is Edge Computing?

Edge computing means processing data **close to where it is generated** rather than sending it to a central cloud/data center.

**Why:**

- Latency — sending data to AWS and back takes time
- Bandwidth — transmitting raw data is expensive
- Connectivity — remote locations may have no reliable internet

**AWS Edge services:**

| Service | Description |
|---|---|
| **Snowball Edge** | Edge computing on a physical device |
| **AWS Outposts** | AWS rack installed in your own data center |
| **AWS Wavelength** | AWS compute embedded in 5G networks |
| **AWS Local Zones** | AWS infrastructure closer to large cities |

**For managers:** Instead of sending all factory camera footage to Amazon's servers for analysis, edge computing processes it on-site instantly — only sending the results to the cloud.

---

## Q16: What are Edge Locations? Is this related to Edge Computing?

**No — different concept, same word. Common confusion.**

Edge Locations are **CDN cache nodes** — part of AWS's global network used by CloudFront, Route 53, Shield, and WAF. 400+ edge locations worldwide store cached copies of content close to end users.

| | Edge Locations | Edge Computing |
|---|---|---|
| **Purpose** | Cache & deliver content fast | Process data locally |
| **AWS services** | CloudFront, Route 53 | Snowball Edge, Outposts, Wavelength |
| **Compute?** | No | Yes |

**For managers:** Edge Locations are like regional warehouses for Netflix — content is cached near you for faster delivery. Nothing to do with edge computing.

**Trap:** Candidates conflate the two because of the shared word "edge." They are orthogonal concepts.

---

## Q17: What are the database engines available in RDS?

| Engine | Type |
|---|---|
| **MySQL** | Most popular open-source relational DB |
| **PostgreSQL** | Advanced open-source relational, extensible |
| **MariaDB** | MySQL fork, open-source |
| **Oracle** | Enterprise relational, BYOL or license-included |
| **SQL Server** | Microsoft relational DB |
| **Aurora MySQL** | AWS-native MySQL-compatible, 5x faster than MySQL |
| **Aurora PostgreSQL** | AWS-native PostgreSQL-compatible, 3x faster than PostgreSQL |
| **Db2** | IBM enterprise relational DB (added 2023) |

**Key point:** Aurora is a re-architected, cloud-native engine — not just managed MySQL/PostgreSQL. Automatic storage scaling, multi-master options, Serverless v2.

**Trap:** Candidates who forget Db2 or treat Aurora as just another MySQL flavor give an incomplete answer.

---

## Q18: What is Route 53 and why is it called that?

Route 53 is AWS's **managed DNS service** — translates domain names to IP addresses, routes traffic globally, and monitors endpoint health.

**Why "53"?** DNS operates on **port 53**.

**Routing policies:**

| Policy | Use Case |
|---|---|
| **Simple** | Single resource, no logic |
| **Weighted** | A/B testing, gradual deployments |
| **Latency** | Route to lowest-latency region |
| **Failover** | Active/passive HA |
| **Geolocation** | Route based on user's country/continent |
| **Geoproximity** | Route based on geographic distance + bias |
| **Multivalue Answer** | Basic load balancing via DNS |

**Trap:** DNS is not a load balancer. Route 53 handles traffic routing at DNS level — fundamentally different from ELB.

**For managers:** Route 53 is like a phone book — when you type "myapp.com", it looks up which server to connect you to, and can automatically switch to a backup server if the primary fails.

---

## Q19: How does synchronization work with a Multi-AZ RDS deployment?

**Synchronous replication** — key term candidates must know.

1. Write hits the primary instance
2. RDS synchronously replicates to the standby instance in another AZ
3. Write is only acknowledged after both primary and standby confirm
4. On failure — automatic failover in 60-120 seconds, DNS updated automatically

| | Multi-AZ | Read Replica |
|---|---|---|
| **Replication** | Synchronous | Asynchronous |
| **Purpose** | HA / failover | Read scaling |
| **Standby readable?** | No | Yes |
| **Automatic failover?** | Yes | No |

**Trap:** Multi-AZ ≠ Read Replicas. Multi-AZ = availability, standby is not readable. Read Replica = performance, asynchronous, can lag.

**For managers:** Multi-AZ is like having an exact live copy of your database in a second building. If the first burns down, the second takes over automatically within 2 minutes — no data loss.

---

## Q20: What is the difference between Security Groups and Network ACLs?

| | Security Group | Network ACL |
|---|---|---|
| **Level** | Instance level | Subnet level |
| **State** | Stateful | Stateless |
| **Rules** | Allow only | Allow + Deny |
| **Evaluation** | All rules evaluated | Rules evaluated in order (rule number) |
| **Default** | Deny all inbound, allow all outbound | Allow all inbound + outbound |

**Stateful vs Stateless:**

- **Stateful (SG):** if inbound traffic is allowed, return traffic is automatically allowed
- **Stateless (NACL):** inbound and outbound rules are independent — must explicitly allow both directions

**Trap:** NACLs are stateless and rules are evaluated in numeric order — first match wins, unlike Security Groups where all rules are evaluated.

**For managers:** Security Group = bouncer at the door of each server. NACL = checkpoint at the entrance of the entire neighborhood.

---

## Q21: What is ELB (Elastic Load Balancer)?

ELB distributes incoming traffic across multiple targets to ensure high availability and fault tolerance.

| Type | Protocol | Use Case |
|---|---|---|
| **ALB** (Application) | HTTP/HTTPS (Layer 7) | Web apps, microservices, path/host-based routing |
| **NLB** (Network) | TCP/UDP/TLS (Layer 4) | Ultra-low latency, static IP, high throughput |
| **GLB** (Gateway) | IP (Layer 3) | Third-party virtual appliances (firewalls, IDS) |
| **CLB** (Classic) | Layer 4+7 | Legacy, deprecated — avoid |

**Key concepts:**

- Target Groups — logical group of targets the LB routes to
- Listeners — rules defining port/protocol and forwarding destination
- Health Checks — automatically removes unhealthy targets
- ALB path routing — `/api/*` → service A, `/web/*` → service B
- NLB preserves source IP — ALB does not (uses `X-Forwarded-For`)

**Trap:** CLB is deprecated. NLB is better than ALB for raw TCP WebSocket performance because ALB terminates and re-establishes connections (Layer 7 overhead), while NLB forwards raw TCP packets without inspection.

**For managers:** ELB is a traffic director — it splits incoming requests across all servers and automatically stops sending traffic to any server that goes down.

---

## Q22: What are the two types of access when creating IAM users?

| | Programmatic Access | Console Access |
|---|---|---|
| **How** | Access Key ID + Secret Access Key | Username + Password (+ MFA) |
| **Used by** | CLI, SDK, API, applications | Humans via browser |
| **MFA** | Optional but recommended | Optional but recommended |

**Trap:**

- Secret Access Key is shown only once at creation — if lost, must regenerate
- Access keys should never be hardcoded in code — use IAM roles instead

**For managers:** Console Access is like a website login — a person opens a browser and sees the AWS dashboard. Programmatic Access is for software and scripts — the application uses a secret key pair to communicate with AWS automatically, without any human clicking buttons.

---

## Q23: How do you convert a public subnet to a private subnet?

Remove the route to the **Internet Gateway (IGW)** from the subnet's route table. A subnet is public or private purely based on whether it has a route to an IGW.

**Full checklist:**

1. Remove IGW route (`0.0.0.0/0 → igw-xxx`) from the route table
2. Disable auto-assign public IPv4 on the subnet
3. If outbound internet still needed → attach a NAT Gateway and route `0.0.0.0/0 → nat-xxx`

**Trap:** "Private subnet" is not a separate AWS resource — the distinction is purely routing.

**For managers:** A public subnet is like a building with a front door to the street. Making it private locks that front door — servers inside can no longer be reached directly from the internet. A NAT Gateway acts as a one-way exit — they can go out, but nobody can come in.

---

## Q24: An S3 bucket was accidentally deleted. Can it be restored?

**By default: No.**

| Feature | Recoverable? |
|---|---|
| **Versioning enabled** | Objects recoverable, bucket must be recreated |
| **Versioning disabled** | Objects permanently gone |
| **S3 Replication (CRR/SRR)** | Objects exist in replica bucket |
| **AWS Backup** | Restore from backup if configured |

**Trap:** AWS cannot restore deleted S3 data on your behalf — not even via support.

**Prevention:**

- Enable Versioning
- Enable MFA Delete for critical buckets
- Enable S3 Object Lock for compliance/immutability
- Set up replication for critical data

**For managers:** Think of S3 versioning like version history in Google Docs — every change is saved, and you can roll back. Without it, deleting a file is like permanently shredding a document — even AWS cannot recover it.

---

## Q25: You receive a "Service Limit Exceeded" error when launching an EC2 instance. How do you resolve it?

**Cause:** AWS enforces default service quotas per account per region.

**Resolution:**

1. Check current limits — Service Quotas console or CLI:

   ```bash
   aws service-quotas list-service-quotas --service-code ec2
   ```

2. Request a quota increase via Service Quotas console or:

   ```bash
   aws service-quotas request-service-quota-increase \
     --service-code ec2 \
     --quota-code L-0263D0A3 \
     --desired-value 20
   ```

3. Switch instance type/family — if limit is family-specific
4. Switch region — each region has independent quotas
5. Stop/terminate unused instances

**Trap:** Since 2020 AWS uses vCPU-based limits, not instance count limits. Candidates saying "you can only run X instances" are outdated.

**For managers:** AWS sets default caps on resources to prevent accidental runaway costs. Raising the cap is a simple request — usually approved within 24 hours.

---

## Q26: How do you extend an EBS volume on Linux and Windows after resizing?

Two steps required: resize in AWS, then extend the filesystem inside the OS.

**Linux:**

```bash
lsblk
sudo growpart /dev/xvda 1      # grow partition
sudo resize2fs /dev/xvda1      # ext4
sudo xfs_growfs /              # xfs (Amazon Linux 2 default)
```

**Windows:**

```powershell
Resize-Partition -DriveLetter C -Size (Get-PartitionSupportedSize -DriveLetter C).SizeMax
```

**Key facts:**

- EBS modification is online — no reboot required
- 6-hour cooldown before modifying the same volume again

**Trap:** Candidates who say "just resize in console and it's done" fail — OS-level filesystem extension is mandatory.

**For managers:** Resizing the disk in AWS is like buying a larger hard drive. The operating system still needs to be told to use the extra space — otherwise it sits there unused.

---

## Q27: What are Parameter Groups in RDS?

Parameter Groups are configuration profiles for RDS database engines — a collection of engine-specific settings applied to one or more DB instances (equivalent to `my.cnf` for MySQL, managed by AWS).

| Type | Description |
|---|---|
| **DB Parameter Group** | For single DB instances |
| **DB Cluster Parameter Group** | For Aurora clusters |

**Key facts:**

- Default parameter group cannot be modified — must create a custom one
- **Static parameters** — require DB reboot to apply
- **Dynamic parameters** — apply immediately without reboot
- Parameter groups can be shared across multiple instances

**Trap:** You cannot edit the default parameter group. Also: static vs dynamic parameter distinction is frequently missed.

**For managers:** Parameter Groups are settings profiles for your database engine. Instead of SSH-ing into a server and editing config files manually, AWS lets you manage all database settings from a central place and apply them to multiple databases at once.

---

## Q28: What are AWS resource tags and what are they used for?

Tags are **key-value metadata pairs** attached to AWS resources for organization, automation, and cost management.

| Use Case | Example Tag | Value |
|---|---|---|
| **Cost Allocation** | `CostCenter` | `marketing` |
| **Environment** | `Environment` | `prod` / `staging` / `dev` |
| **Ownership** | `Owner` | `team-backend` |
| **Automation** | `AutoShutdown` | `true` |
| **Compliance** | `DataClassification` | `confidential` |

**Key facts:**

- Max 50 tags per resource
- Tag keys are case-sensitive
- Tags are not retroactive
- Tag policies (AWS Organizations) enforce tagging standards across accounts
- IAM policies can enforce access based on tags (ABAC)

**Trap:** Candidates who only mention cost allocation miss automation and ABAC use cases. Tags are not inherited by child resources automatically.

**For managers:** Tags are like sticky labels on everything in your AWS account. Without them, your AWS bill is one giant number. With them, you can instantly see how much each team or project is spending — and automate actions based on those labels.

---

## Q29: What is the default Elastic IP quota per AWS account?

**5 Elastic IPs per region** by default. Increasable via Service Quotas.

- Free when attached to a running instance
- Charged when idle — AWS discourages hoarding

**Trap:** EIPs are free in use but charged when idle — a common unexpected cost source.

**For managers:** AWS gives you 5 permanent public IP addresses per region for free as long as they're in use. If you reserve one but don't use it, AWS charges you — intentionally, to prevent companies from hoarding scarce public IP addresses.

---

## Q30: In a Multi-AZ RDS deployment, can the standby instance be used for read or write operations?

**No — the standby instance is not accessible for read or write operations.** It exists solely for failover.

| | Primary | Standby |
|---|---|---|
| **Read** | ✅ | ❌ |
| **Write** | ✅ | ❌ |
| **Accessible** | ✅ | ❌ |

For read scaling → use **Read Replicas**, not Multi-AZ standby.

**Trap:** Classic interview trap — candidates confuse Multi-AZ with Read Replicas. They serve fundamentally different purposes.

**For managers:** The standby database is like a spare tire — it's there if something goes wrong, but you don't drive on it. For spreading workload across multiple databases, that's a separate feature called Read Replicas.

---

## Q31: Which AWS services would you use to collect and process e-commerce data for near real-time analysis?

**Reference architecture:**

```
E-Commerce App → Kinesis Data Streams → Kinesis Firehose
→ S3 (data lake) → Glue → Redshift / Athena → QuickSight
```

| Service | Role |
|---|---|
| **Kinesis Data Streams** | Real-time event ingestion |
| **Kinesis Data Firehose** | Delivery to S3/Redshift/OpenSearch |
| **Lambda** | Lightweight real-time transformations |
| **S3** | Raw data lake storage |
| **Glue** | ETL, data catalog |
| **Redshift** | Data warehouse for complex queries |
| **Athena** | Ad-hoc SQL queries directly on S3 |
| **QuickSight** | Business dashboards |
| **DynamoDB** | Real-time operational data |
| **ElastiCache** | Low-latency caching |

**Trap:** Candidates who only mention Kinesis + S3 miss the full pipeline. Strong candidates describe the end-to-end flow.

**For managers:** Think of it as a real-time conveyor belt — customer actions are captured instantly, processed automatically, and appear in dashboards within seconds.

---

## Q32: A company needs high availability, has a limited team, and the application requires complex queries and table joins. Which configuration is best?

**Answer: ELB + Auto Scaling + RDS Multi-AZ**

| Requirement | Solution |
|---|---|
| **Limited staff** | Fully managed services |
| **High availability** | ALB + Auto Scaling Group + RDS Multi-AZ |
| **Complex queries + joins** | RDS (relational) |

```
Route 53 → ALB (multi-AZ) → Auto Scaling Group (EC2) → RDS Multi-AZ
```

**Trap:** Candidates who suggest DynamoDB fail — NoSQL cannot handle complex joins.

**For managers:** This setup runs itself — AWS handles server failures, traffic spikes, and database failovers automatically. The small team only manages the application code.

---

## Q33: What are suitable use cases for Amazon DynamoDB?

DynamoDB is a fully managed, serverless, key-value and document NoSQL database optimized for high throughput, low latency, and massive scale.

**Suitable use cases:** Session management, shopping cart, gaming leaderboards, IoT telemetry, real-time recommendations, mobile backends, event sourcing.

**NOT suitable for:** Complex joins/queries (→ RDS), reporting/analytics (→ Redshift/Athena), full-text search (→ OpenSearch).

**Trap:** DynamoDB supports transactions since 2018 — but only within DynamoDB itself. Candidates who say "DynamoDB has no transactions" are outdated.

**For managers:** DynamoDB is built for speed and scale — millions of requests per second with consistent millisecond response times. It trades complex querying capability for raw performance and zero infrastructure management.

---

## Q34: How would you optimize an architecture where mobile devices write to DynamoDB every 5 minutes and data is exported to S3 daily for visualization?

**Problems with naive architecture:** DynamoDB storing all data indefinitely is expensive. Daily full scans for export are costly. Visualizing directly from DynamoDB is the wrong tool.

**Optimized architecture:**

```
Mobile → API Gateway + Lambda → DynamoDB (TTL: 24-48h)
→ DynamoDB Streams → Lambda → S3 (partitioned by user/date)
→ Athena / QuickSight
```

**Key optimizations:**

| Optimization | Benefit |
|---|---|
| **DynamoDB TTL** | Auto-expire old items — no manual deletes, no read cost |
| **DynamoDB Streams** | Event-driven export instead of expensive daily scans |
| **S3 for cold data** | Drastically cheaper than DynamoDB long-term |
| **API Gateway + Lambda** | Serverless ingest — pay per request |
| **Athena for visualization** | Query S3 directly — pay per query |
| **S3 Intelligent-Tiering** | Auto-move infrequent data to cheaper storage class |

**Trap:** Keeping all data in DynamoDB long-term is expensive. S3 + Athena is the correct pattern for historical data at scale.

---

## Q35: EC2 across multiple AZs, Multi-AZ RDS, high read/write throughput, eventual consistency model — read contention discovered on RDS. What is the best approach?

**Best approach: ElastiCache + RDS Read Replicas**

| Solution | Purpose |
|---|---|
| **ElastiCache (Redis)** | Cache frequent reads — offload RDS entirely |
| **RDS Read Replicas** | Distribute read traffic across multiple instances |

```
EC2 → ElastiCache (Redis) → [cache miss] → RDS Read Replica(s) → [writes only] → RDS Primary Multi-AZ
```

**Trap:** Candidates who only suggest Read Replicas miss ElastiCache. With eventual consistency explicitly stated, caching is optimal. Upgrading instance size is the worst answer — it treats the symptom, not the cause.

---

## Q36: 100 sensors → pilot success → scale to 100,000 sensors, 2 years data retention. Which architecture?

**Math:**

- 100 sensors → 4 GB/month
- 100,000 sensors → 4 TB/month → ~96 TB over 2 years

RDS is the wrong tool for 96 TB of time-series sensor data.

**Recommended architecture:**

```
IoT Core → Kinesis Data Streams → Firehose + Lambda
→ S3 (partitioned) → Glue → Athena / Redshift → QuickSight
```

**Keep from existing stack:** Auto Scaling EC2 (API layer), RDS for operational/metadata only.

**Bonus answer:** **Amazon Timestream** — purpose-built time-series DB for exactly this use case.

**Trap:** Scaling RDS to handle 96 TB of sensor data is wrong. RDS is OLTP, not purpose-built for time-series analytics at petabyte scale.

---

## Q37: An application requires both image rendering and general-purpose computing. Which AWS service fits best?

**Answer depends on workload type:**

| Scenario | Best fit |
|---|---|
| **Batch/offline rendering** | AWS Batch + G4dn Spot Instances |
| **Real-time/on-demand rendering** | EC2 G-family + Auto Scaling |
| **Both** | AWS Batch for bulk + EC2 Auto Scaling for interactive |

**GPU instance families:**

| Family | Use Case |
|---|---|
| **G4dn / G5** | Graphics rendering, ML inference |
| **G6** | Latest gen, NVIDIA L4 GPU |
| **P3 / P4** | Heavy ML training, HPC |

**Trap:** Answering just "EC2" without specifying GPU instance families is too vague. Also: AWS Batch is only correct for batch/offline rendering — not real-time.

---

## Q38: EC2 CMS is approaching 100% CPU utilization. Which options reduce the load?

**Root cause:** Serving static assets, dynamic page rendering without cache, DB queries on every request.

**Solutions ranked by impact:**

| Solution | How it reduces CPU |
|---|---|
| **CloudFront** | Serve static assets at edge — never reaches EC2 |
| **ElastiCache (Redis)** | Cache rendered pages/DB queries |
| **S3 + CloudFront** | Offload static asset serving entirely |
| **ALB + Auto Scaling** | Horizontal scaling |
| **RDS Read Replicas** | Offload DB reads |

**Trap:** Candidates who only say "scale up EC2" fail — fix the architecture first, scale second.

**For managers:** The server is doing work it should not be doing. CloudFront handles static content, ElastiCache answers repeated questions from memory — the server only handles complex, dynamic requests.

---

## Q39: What is Connection Draining?

Connection Draining (called **Deregistration Delay** in ALB/NLB) ensures in-flight requests complete before an EC2 instance is removed from a load balancer.

1. Instance marked for removal
2. ELB stops sending new requests
3. ELB waits for existing requests to complete
4. After timeout or completion → instance deregistered

| Parameter | Value |
|---|---|
| **Default timeout** | 300 seconds |
| **Minimum** | 0 seconds (disabled) |
| **Maximum** | 3600 seconds |

**Tuning guidance:** Short-lived APIs → 30-60s. Long-running uploads/reports → 600s+.

**Trap:** Candidates who don't know it was renamed to Deregistration Delay in ALB/NLB give an incomplete answer.

**For managers:** When AWS needs to shut down a server, Connection Draining stops sending new visitors but lets current ones finish — like a store that stops letting new customers in but lets existing ones complete their shopping before closing.

---

## Q40: Which AWS service automatically terminates unhealthy EC2 instances and replaces them?

**Answer: Auto Scaling Group (ASG)**

1. ASG monitors instance health via EC2 status checks and/or ELB health checks
2. Instance marked unhealthy
3. ASG terminates the unhealthy instance
4. ASG launches a replacement from the configured AMI

| Service | Role |
|---|---|
| **ELB** | Detects unhealthy instance, stops routing traffic |
| **ASG** | Terminates and replaces unhealthy instance |

**Trap:** By default ASG only uses EC2 health checks — if the instance is running but the application is crashed, ASG won't replace it unless ELB health checks are explicitly enabled on the ASG.

**For managers:** Auto Scaling is a self-healing system — if a server breaks, it is automatically thrown away and a fresh identical one takes its place, without any human intervention.

---

## Q41: What are Auto Scaling Lifecycle Hooks?

Lifecycle Hooks pause an EC2 instance during a state transition, allowing custom actions before the instance enters service or terminates.

| Hook | Transition | Use Case |
|---|---|---|
| **Launch Hook** | Pending → InService | Install software, register with config mgmt, warm up cache |
| **Terminate Hook** | Terminating → Terminated | Drain connections, backup logs, deregister from service discovery |

**State flow:**

```
Launch:    Pending → Pending:Wait → (custom action) → Pending:Proceed → InService
Terminate: Terminating → Terminating:Wait → (custom action) → Terminating:Proceed → Terminated
```

**Trigger methods:** SNS, SQS, EventBridge → Lambda

- Default timeout: 3600 seconds
- On timeout: ABANDON (terminate) or CONTINUE — configurable

**Trap:** Lifecycle hooks are for custom automation during state transitions — not health monitoring.

**For managers:** Lifecycle hooks are a pause button during server startup or shutdown. Before a new server starts taking traffic, you can automatically install software. Before shutdown, you can save logs or gracefully disconnect from other systems.

---

## Q42: For disaster recovery in another region, which AWS resources do NOT need to be recreated?

**Global resources (no recreation needed):**

| Resource | Notes |
|---|---|
| **IAM** (users, roles, policies) | Global — but update policies referencing region-specific ARNs |
| **Route 53** | Global — but configure failover routing policies pre-emptively |
| **CloudFront** | Global — but update origin settings to point to DR region |
| **S3 bucket names** | Global namespace — but data is regional, configure CRR |

**Regional resources (must be recreated):** EC2, EBS, RDS, VPC, Security Groups, AMIs, ELB, ElastiCache

**Key insight:** "Global" means the resource definition exists everywhere — it does NOT mean the resource automatically works correctly in a DR scenario without configuration updates.

**Trap:** Candidates who say "IAM/CloudFront/Route53 are global, nothing to do" miss the nuance — global scope ≠ DR-ready without reviewing all resource references and configurations.

---

## Q43: Which AWS services would you NOT use to deploy an application?

**Answer: IAM and Route 53**

- **IAM** — identity and access management, not a deployment platform
- **Route 53** — DNS routing, not a deployment platform

**Services used FOR deployment:** EC2, ECS, EKS, Lambda, Elastic Beanstalk, App Runner, CodeDeploy, Amplify

**Trap:** Candidates who hesitate reveal they think of AWS services purely technically without understanding their purpose categories.

**For managers:** Asking Route 53 or IAM to deploy your app is like asking HR or the receptionist to build your product — wrong tool, wrong purpose.

---

## Q44: Compare Cloud Computing with Serverless Architecture. (Trick question)

**The trick: Serverless IS cloud computing — it is a subset, not an alternative.**

```
Cloud Computing
├── IaaS (EC2, EBS, VPC)
├── PaaS (Elastic Beanstalk, RDS)
└── Serverless / FaaS (Lambda, DynamoDB, S3, API Gateway)
```

| | Traditional Cloud (IaaS) | Serverless |
|---|---|---|
| **Infrastructure management** | You manage OS, patching, scaling | AWS manages everything |
| **Scaling** | Manual or Auto Scaling config | Automatic, instant |
| **Billing** | Per hour/instance | Per request/execution |
| **Idle cost** | Yes | No |
| **Cold start** | None | Yes — first invocation latency |
| **Execution limit** | None | Lambda: 15 min max |

**Trap:** "Serverless means no servers" is technically wrong. Servers exist — you just don't manage them. Correct statement: "no server management."

**For managers:** Cloud computing is the broad concept of renting IT infrastructure over the internet. Serverless is the most hands-off version — you only write code and AWS handles everything else, billing you only for the exact milliseconds your code runs.

---

## Q45: Are there capabilities unique to AWS that Azure lacks, and vice versa? (Trick question)

At the macro level, both platforms offer equivalent services for virtually every category. A candidate who gives a definitive "AWS can do X but Azure cannot" is likely wrong or citing outdated information.

| | AWS Strengths | Azure Strengths |
|---|---|---|
| **Ecosystem maturity** | Broader service catalog, longer track record | Deep Microsoft/enterprise integration |
| **Unique services** | Ground Station, Braket | Azure Arc, Sentinel |
| **AI/ML** | Bedrock (multi-model GenAI) | Azure OpenAI Service (native GPT-4/o1) |
| **Hybrid** | Outposts, Local Zones | Azure Arc — stronger hybrid story |
| **Enterprise identity** | Cognito, IAM Identity Center | Azure AD (Entra ID) — far superior |
| **Satellite** | AWS Ground Station | No equivalent |
| **Quantum** | Braket | Azure Quantum |

**Trap:** Candidates who claim fundamental capability gaps reveal they lack hands-on experience with both. The real differentiators are depth, integration, and ecosystem — not raw capability.

**For managers:** Both AWS and Azure can do virtually everything the other can. The real question is which fits your existing technology stack. Microsoft stack → Azure. Cloud-native from scratch → AWS has the broader ecosystem.

---

## Additional Questions

---

## Q46: What is AWS IAM and what are its core components?

**IAM (Identity and Access Management)** controls who can do what in your AWS account.

**Core components:**

| Component | Description |
|---|---|
| **Users** | Individual identities for humans |
| **Groups** | Collection of users with shared permissions |
| **Roles** | Temporary identities assumed by services or users |
| **Policies** | JSON documents defining permissions |

**Policy types:**

| Type | Description |
|---|---|
| **Managed Policy** | AWS-managed or customer-managed, reusable |
| **Inline Policy** | Embedded directly in a user/group/role |
| **Permission Boundary** | Maximum permissions a role/user can have |
| **SCP (Service Control Policy)** | Organization-level guardrails via AWS Organizations |

**Key principle:** Least privilege — grant only the permissions required, nothing more.

**Trap:** Candidates who don't distinguish between roles and users fail. Roles are for services and temporary access — never create long-lived access keys when a role suffices.

---

## Q47: What is AWS VPC and what are its core components?

**VPC (Virtual Private Cloud)** is a logically isolated network within AWS where you launch resources.

**Core components:**

| Component | Description |
|---|---|
| **Subnets** | IP ranges within a VPC (public or private) |
| **Route Tables** | Control traffic routing between subnets |
| **Internet Gateway (IGW)** | Enables internet access for public subnets |
| **NAT Gateway** | Allows private subnets to initiate outbound internet traffic |
| **Security Groups** | Stateful firewall at instance level |
| **Network ACLs** | Stateless firewall at subnet level |
| **VPC Peering** | Private connectivity between two VPCs |
| **VPC Endpoints** | Private access to AWS services without internet |
| **Transit Gateway** | Hub for connecting multiple VPCs and on-premise networks |

**Default VPC:** Every region has a default VPC — never use it for production.

**Trap:** Candidates who don't mention VPC Endpoints miss a critical security/cost pattern — traffic to S3 and DynamoDB should go through VPC Endpoints, not over the internet.

---

## Q48: What is AWS CloudWatch and what can it do?

**CloudWatch** is AWS's observability service — monitoring, logging, alerting, and dashboards.

| Feature | Description |
|---|---|
| **Metrics** | Collect and track resource/application metrics |
| **Alarms** | Trigger actions based on metric thresholds |
| **Logs** | Aggregate logs from EC2, Lambda, RDS, etc. |
| **Log Insights** | Query and analyze log data |
| **Dashboards** | Visualize metrics across services |
| **Events / EventBridge** | Respond to state changes in AWS resources |
| **Synthetics** | Canary scripts to monitor endpoints |
| **Container Insights** | ECS/EKS monitoring |

**Key integrations:**

- Alarms → SNS → Email/PagerDuty
- Alarms → Auto Scaling → scale in/out
- Alarms → Lambda → automated remediation

**Trap:** Candidates who confuse CloudWatch with CloudTrail fail. CloudWatch = performance monitoring. CloudTrail = API audit log (who did what, when).

---

## Q49: What is the difference between CloudWatch and CloudTrail?

| | CloudWatch | CloudTrail |
|---|---|---|
| **Purpose** | Performance monitoring | API audit logging |
| **What it tracks** | Metrics, logs, resource health | API calls, user actions |
| **Use case** | Detect CPU spike, lambda errors | Who deleted the S3 bucket, when |
| **Retention** | Configurable | 90 days default, S3 for long-term |
| **Real-time?** | Yes | Near real-time |

**For managers:** CloudWatch is your system health dashboard — it tells you if servers are overloaded. CloudTrail is your security audit log — it tells you who changed what and when.

---

## Q50: What is AWS Lambda and what are its limits?

**Lambda** is a serverless compute service — run code without provisioning servers.

**Key limits:**

| Limit | Value |
|---|---|
| **Max execution time** | 15 minutes |
| **Memory** | 128 MB – 10,240 MB |
| **Deployment package** | 50 MB (zip), 250 MB (unzipped) |
| **Ephemeral storage (/tmp)** | 512 MB – 10,240 MB |
| **Concurrent executions** | 1,000 per region (default, increasable) |
| **Environment variables** | 4 KB total |

**Trigger sources:** API Gateway, S3, DynamoDB Streams, Kinesis, SNS, SQS, EventBridge, CloudWatch, Cognito, ALB

**Cold start:** First invocation after idle period incurs initialization latency. Mitigation: Provisioned Concurrency.

**Trap:** Lambda is stateless — no persistent local storage between invocations. Use S3, DynamoDB, or ElastiCache for state. Also: Lambda inside a VPC has higher cold start latency.

---

*End of AWS Interview Q&A*
