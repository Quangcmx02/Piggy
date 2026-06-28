## Frontend 
Core: ReactJS, TypeScript.

Build Tool: Vite 

UI Framework: Material UI  + Emotion

## Backend
Core: Java 21, Spring Boot 3.x.

Architecture: Spring Cloud (API Gateway, Consul Service Discovery).

Resilience: Resilience4j (Circuit Breaker) .

Database: MySQL

Message Broker: RabbitMQ .

Scheduling: Spring Scheduled .


## Architecture
api-gateway (Port 8080): Nận request từ Client, xử lý CORS, xác thực JWT và định tuyến bằng Consul tích hợp Circuit Breaker.

identity-service (Port 8081): Quản lý User,xác thực JWT, gửi sự kiện đăng ký qua MQ.

transaction-service (Port 8082):  (Ví, Giao dịch, Danh mục, Scheduler Định kỳ, Báo cáo).

notification-service (Port 8083):  RabbitMQ  thực hiện gửi Email .


## APi chính 
Auth: POST /api/auth/login, POST /api/auth/register

User: GET /api/users/me

Wallets: GET /api/wallets, POST /api/wallets, DELETE /api/wallets/{id}

Transactions: GET /api/transactions , POST /api/transactions .

Categories: GET /api/categories, POST /api/categories

Recurring: GET /api/recurring-transactions, POST /api/recurring-transactions

Reports: GET /api/reports/monthly-summary, GET /api/reports/category-breakdown


## Demo


https://github.com/user-attachments/assets/ade42922-5b65-4f5a-af2c-5ea159b58a25






https://github.com/user-attachments/assets/97c7a46f-a813-4bb3-bc90-0ca2bb4f2f16




