# Dev-only image — the mock-gateway is a test double for the tenant-local
# harness (Story 7.1/7.2). It is never built or published for production.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
EXPOSE 8787
CMD ["npm", "run", "dev"]
