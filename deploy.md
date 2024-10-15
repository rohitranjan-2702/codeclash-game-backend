```bash

- pnpm --filter backend dev
- npm install -g pm2
- pm2 start pnpm --name backend -- run dev --filter backend
- pm2 save

```

To deploy your monorepo app with a frontend (Next.js) and backend (Node.js) to either **EC2** or **Vercel**, follow these steps:

---

## **1. Deployment on EC2**

To deploy your app on **EC2**, you'll handle everything manually: setting up the server, environment, and running the apps.

### Step-by-Step EC2 Deployment:

### 1.1 **Set Up an EC2 Instance**

1. **Launch an EC2 instance** on AWS (Ubuntu 20.04 or any Linux distribution).

   - Choose appropriate instance type based on your needs (e.g., t2.micro for small projects, larger instances for bigger workloads).
   - Configure Security Group to allow HTTP/HTTPS (port 80/443) and SSH (port 22) access.

2. **SSH into your EC2 instance**:

   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### 1.2 **Install Node.js, pnpm, and Git**

1. **Install Node.js (v18 or higher)**:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install pnpm**:

   ```bash
   npm install -g pnpm
   ```

3. **Install Git**:

   ```bash
   sudo apt install git
   ```

### 1.3 **Clone Your Monorepo**

1. **Clone your repository** from GitHub (or wherever you host your code):

   ```bash
   git clone https://github.com/yourusername/your-monorepo.git
   cd your-monorepo
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

### 1.4 **Set Up Environment Variables**

1. Add your `.env` files for Prisma and Next.js inside the root of your project:

   - For Prisma:

     ```
     DATABASE_URL=your-database-url
     ```

   - For Next.js:
     ```
     NEXT_PUBLIC_API_URL=your-backend-api-url
     ```

### 1.5 **Deploy Database**

1. If you're using a managed database (like RDS or another service), ensure that your `DATABASE_URL` is correctly configured in `.env`.
2. Run migrations on EC2 to ensure the database is in sync:

   ```bash
   pnpm prisma:migrate
   ```

### 1.6 **Start the Backend Server**

1. **Run the backend app** (on a port like 3001):

   ```bash
   pnpm --filter backend dev
   ```

   Optionally, you can use a process manager like **PM2** to keep the backend app running in the background:

   ```bash
   npm install -g pm2
   pm2 start pnpm --name backend -- run dev --filter backend
   pm2 save
   ```

### 1.7 **Configure Next.js Frontend for Production**

1. **Build the Next.js frontend**:

   ```bash
   pnpm --filter frontend build
   ```

2. **Start the Next.js app**:

   ```bash
   pnpm --filter frontend start
   ```

   Optionally, use **PM2** for the frontend:

   ```bash
   pm2 start pnpm --name frontend -- run start --filter frontend
   pm2 save
   ```

### 1.8 **Set Up Nginx as a Reverse Proxy**

To allow your Next.js frontend and backend to work together over the same domain (e.g., serving the backend at `/api` and the frontend on the root), configure **Nginx** as a reverse proxy.

1. **Install Nginx**:

   ```bash
   sudo apt install nginx
   ```

2. **Configure Nginx**:
   Edit the default Nginx config file:

   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-ec2-ip-or-domain;

       location / {
           proxy_pass http://localhost:3000;  # Frontend (Next.js)
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/ {
           proxy_pass http://localhost:3001;  # Backend (Node.js)
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Restart Nginx**:

   ```bash
   sudo systemctl restart nginx
   ```

### 1.9 **Access Your Application**

Now you should be able to access your frontend and backend via the IP or domain of your EC2 instance:

- Frontend: `http://your-ec2-ip/`
- Backend API: `http://your-ec2-ip/api/`

---

## **2. Deployment on Vercel**

Vercel is ideal for deploying **Next.js** apps. You can deploy the frontend easily, but the backend needs another service, such as **AWS EC2, AWS Lambda, or another cloud provider** for your Node.js API.

### Step-by-Step Vercel Deployment:

### 2.1 **Deploy Frontend (Next.js) to Vercel**

1. **Install Vercel CLI**:

   ```bash
   pnpm add -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy Your Frontend to Vercel**:

   Navigate to your frontend folder:

   ```bash
   cd apps/frontend
   ```

   Deploy the app:

   ```bash
   vercel
   ```

   Follow the prompts to configure and deploy your app. Vercel will automatically detect the Next.js framework and set up an optimal deployment.

4. **Set Up Environment Variables**:

   In your Vercel dashboard, navigate to your project, and under **Settings** > **Environment Variables**, add any necessary variables such as:

   ```
   NEXT_PUBLIC_API_URL=your-backend-url
   ```

### 2.2 **Deploy Backend (Node.js) to EC2 or AWS Lambda**

For the backend, you can deploy it on **EC2** (following the previous EC2 steps) or use **AWS Lambda**, **AWS Fargate**, or another cloud provider.

If using AWS Lambda with **Serverless Framework**, here’s a basic flow:

1. **Install Serverless Framework**:

   ```bash
   npm install -g serverless
   ```

2. **Initialize Serverless in Backend**:

   Navigate to your backend folder:

   ```bash
   cd apps/backend
   serverless
   ```

   Follow the prompts to set up your backend on Lambda.

3. **Deploy to Lambda**:

   ```bash
   serverless deploy
   ```

4. **Update Frontend API URL**:

   Update the frontend `.env` or Vercel environment variables to point to your deployed API URL on Lambda.

---

### Conclusion

- **EC2 Deployment** gives you full control over your entire stack but requires manual setup of Nginx, security, and scaling.
- **Vercel Deployment** is streamlined for the frontend (Next.js), but you’ll need a separate solution for your Node.js backend.

Choose EC2 for more flexibility or Vercel + AWS Lambda for ease of deployment and scalability.
