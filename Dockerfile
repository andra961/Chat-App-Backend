#use intermediate layer for compiling typescript files into javascrpit files
FROM node:18-alpine As builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build-ws-server

FROM node:18-alpine As final
WORKDIR /app
#copy from previous later compiled js files
COPY --from=builder /app/build ./build
COPY .env .
COPY package.json .
COPY package-lock.json .
#copy prisma schema to generate prisma client
COPY ./prisma/schema.prisma ./prisma/
RUN npm install
#generate prisma client
RUN npx prisma generate
RUN npm install --omit=dev
CMD ["node", "./build/ws-server.js"]