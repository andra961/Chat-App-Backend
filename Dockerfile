FROM node:18-alpine As builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build-ws-server
# CMD ["npm", "run", "ws-server"]

FROM node:18-alpine As final
WORKDIR /app
COPY --from=builder /app/build ./build
COPY .env .
COPY package.json .
COPY package-lock.json .
COPY ./prisma/schema.prisma ./prisma/
RUN npm install
RUN npx prisma generate
RUN npm install --omit=dev
CMD ["node", "./build/ws-server.js"]