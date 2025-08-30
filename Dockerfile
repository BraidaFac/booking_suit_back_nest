FROM  alpine:3.19

# Instala las herramientas necesarias
RUN apk add --no-cache nodejs npm
# Instala las herramientas necesarias
RUN apk add --no-cache python3 make g++
# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el package.json y el package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias de la aplicación
RUN npm install 

# Copia el resto de los archivos de la aplicación al directorio de trabajo
COPY . .

# Compila la aplicación
RUN npm run build

# Expone el puerto que utiliza la aplicación (3000 es el puerto por defecto de NestJS)
EXPOSE 3000

# Define el comando de inicio para la aplicación
CMD ["npm", "run", "start:prod"]