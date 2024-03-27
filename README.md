1º En primer lugar necesitamos la base de datos
#############################################################
-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS red_social;

-- Usar la base de datos
USE red_social;

DROP TABLE IF EXISTS usuarios;

-- Creación de la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) not null,
    username varchar(100) not null unique,
 --   email VARCHAR(100) NOT NULL UNIQUE,
    contraseña CHAR(60) NOT NULL,
    fecha_nacimiento date,
    telefono varchar(100),
    foto_perfil LONGBLOB,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo boolean
);
2º Clonar el repositorio Ejemplo2 en local 
##################################################################
git clone https://github.com/ProfeMiguelTernero/Ejemplo2

3º Abrir con visual estudio code y descargar los modulos.
###############################################################
npm install

4º ejecutar el proyecto
################################################################
nodemon scrpt.js
