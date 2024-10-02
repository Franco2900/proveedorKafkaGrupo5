-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-10-2024 a las 23:43:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `proveedor`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `despacho`
--

CREATE TABLE `despacho` (
  `id` int(11) NOT NULL,
  `id_orden_de_compra` int(11) DEFAULT NULL,
  `fecha_de_envio` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `despacho`
--

INSERT INTO `despacho` (`id`, `id_orden_de_compra`, `fecha_de_envio`) VALUES
(3, 5, '2024-10-09'),
(4, 6, '2024-10-09'),
(5, 7, '2024-10-09'),
(6, 8, '2024-10-09'),
(7, 13, '2024-10-09'),
(8, 14, '2024-10-09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `item`
--

CREATE TABLE `item` (
  `id` int(11) NOT NULL,
  `producto_codigo` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  `talle` varchar(50) NOT NULL,
  `cantidad_solicitada` int(11) NOT NULL,
  `id_orden_de_compra` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `item`
--

INSERT INTO `item` (`id`, `producto_codigo`, `color`, `talle`, `cantidad_solicitada`, `id_orden_de_compra`) VALUES
(1, 'producto_codigo1', 'Verde', 'L', 8, 4),
(2, 'producto_codigo2', 'Azul', 'M', 4, 4),
(3, 'CB123', 'Rojo', 'M', 10, 5),
(4, 'PJ456', 'Azul', 'L', 5, 5),
(5, 'CB123', 'Rojo', 'M', 10, 6),
(6, 'PJ456', 'Azul', 'L', 5, 6),
(7, 'CB123', 'Rojo', 'M', 10, 7),
(8, 'PJ456', 'Azul', 'L', 5, 7),
(9, 'CB123', 'Rojo', 'M', 10, 8),
(10, 'PJ456', 'Azul', 'L', 5, 8),
(11, 'producto_codigo1', 'Verde', 'L', 8, 9),
(12, 'producto_codigo2', 'Azul', 'M', 4, 9),
(13, 'producto_codigo1', 'Verde', 'L', 8, 10),
(14, 'producto_codigo2', 'Azul', 'M', 4, 10),
(15, 'producto_codigo1', 'Verde', 'L', 8, 11),
(16, 'producto_codigo2', 'Azul', 'M', 4, 11),
(17, 'producto_codigo1', 'Verde', 'L', 8, 12),
(18, 'producto_codigo2', 'Azul', 'M', 4, 12),
(19, 'CB123', 'Rojo', 'M', 10, 13),
(20, 'PJ456', 'Azul', 'L', 5, 13),
(21, 'CB123', 'Rojo', 'M', 10, 14),
(22, 'PJ456', 'Azul', 'L', 5, 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orden_de_compra`
--

CREATE TABLE `orden_de_compra` (
  `id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `observaciones` varchar(100) DEFAULT NULL,
  `fecha_de_solicitud` date NOT NULL,
  `fecha_de_recepcion` date DEFAULT NULL,
  `tienda_codigo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orden_de_compra`
--

INSERT INTO `orden_de_compra` (`id`, `estado`, `observaciones`, `fecha_de_solicitud`, `fecha_de_recepcion`, `tienda_codigo`) VALUES
(4, 'RECHAZADA', 'No existe el producto producto_codigo1. No existe el producto producto_codigo2. ', '2024-10-02', NULL, 'ASDF'),
(5, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'ASDF'),
(6, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'ASDF'),
(7, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'sanji32542'),
(8, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'sanji32542'),
(9, 'RECHAZADA', 'No existe el producto producto_codigo1. No existe el producto producto_codigo2. ', '2024-10-02', NULL, 'ASDF'),
(10, 'RECHAZADA', 'No existe el producto producto_codigo1. No existe el producto producto_codigo2. ', '2024-10-02', NULL, 'sanji32542'),
(11, 'RECHAZADA', 'No existe el producto producto_codigo1. No existe el producto producto_codigo2. ', '2024-10-02', NULL, 'sanji32542'),
(12, 'RECHAZADA', 'No existe el producto producto_codigo1. No existe el producto producto_codigo2. ', '2024-10-02', NULL, 'sanji32542'),
(13, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'sanji32542'),
(14, 'ACEPTADA', 'Sin observaciones', '2024-10-02', NULL, 'sanji32542');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `talle` varchar(50) NOT NULL,
  `foto` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`codigo`, `nombre`, `talle`, `foto`, `color`, `stock`) VALUES
('AAAAA', 'Campera', 'XL', 'urlFoto', 'Gris', 3),
('CB123', 'Camisa Básica', 'M', 'urlFoto', 'Rojo', 1),
('CCCCC', 'SAFJ', 'QQ', 'ASFD', 'BGER', 12),
('fasf', 'ewfwe', 'fwe', 'asdf', 'das', 5),
('PJ456', 'Pantalones Jeans', 'L', 'urlFoto', 'Azul', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `despacho`
--
ALTER TABLE `despacho`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_orden_de_compra` (`id_orden_de_compra`);

--
-- Indices de la tabla `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_orden_de_compra` (`id_orden_de_compra`);

--
-- Indices de la tabla `orden_de_compra`
--
ALTER TABLE `orden_de_compra`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`codigo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `despacho`
--
ALTER TABLE `despacho`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `item`
--
ALTER TABLE `item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `orden_de_compra`
--
ALTER TABLE `orden_de_compra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `despacho`
--
ALTER TABLE `despacho`
  ADD CONSTRAINT `despacho_ibfk_1` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `orden_de_compra` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `item`
--
ALTER TABLE `item`
  ADD CONSTRAINT `item_ibfk_1` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `orden_de_compra` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
