FROM node:20
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy mã nguồn và file .env
COPY . .

# Cài đặt thư viện dotenv
RUN npm install dotenv

# Expose port
EXPOSE 6868

# Command để chạy ứng dụng
CMD ["node", "index.js"]
