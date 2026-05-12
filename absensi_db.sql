-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 12, 2026 at 02:07 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `absensi_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi`
--

CREATE TABLE `absensi` (
  `id` int NOT NULL,
  `pegawai_id` int DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_pulang` time DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `tipe` varchar(50) DEFAULT NULL,
  `shift_kode` varchar(20) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `distance` double DEFAULT NULL,
  `accuracy` double DEFAULT NULL,
  `status_area` varchar(20) DEFAULT NULL,
  `status_area_pulang` varchar(20) DEFAULT NULL,
  `keterangan` text,
  `keterangan_pulang` text,
  `surat_mc` varchar(255) DEFAULT NULL,
  `is_from_jadwal` tinyint(1) NOT NULL DEFAULT '0',
  `surat_cuti` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `absensi`
--

INSERT INTO `absensi` (`id`, `pegawai_id`, `tanggal`, `jam_masuk`, `jam_pulang`, `status`, `tipe`, `shift_kode`, `latitude`, `longitude`, `distance`, `accuracy`, `status_area`, `status_area_pulang`, `keterangan`, `keterangan_pulang`, `surat_mc`, `is_from_jadwal`, `surat_cuti`) VALUES
(53, 10, '2026-05-10', '13:57:18', '16:46:46', 'Hadir', 'Hadir', 'P', 1.1165434983752418, 104.09260828105631, 51, 146, 'DALAM', 'DALAM', 'Datang 3 menit lebih awal', 'Lembur 46 menit', NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_pegawai`
--

CREATE TABLE `jadwal_pegawai` (
  `id` int NOT NULL,
  `pegawai_id` int DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `shift_kode` varchar(20) DEFAULT NULL,
  `keterangan` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `jadwal_pegawai`
--

INSERT INTO `jadwal_pegawai` (`id`, `pegawai_id`, `tanggal`, `shift_kode`, `keterangan`) VALUES
(3854, 10, '2026-05-17', 'P', NULL),
(3855, 10, '2026-05-10', 'P', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jatah_cuti`
--

CREATE TABLE `jatah_cuti` (
  `id` int NOT NULL,
  `pegawai_id` int NOT NULL,
  `tahun` year NOT NULL,
  `jatah` int NOT NULL DEFAULT '12',
  `terpakai` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pegawai`
--

CREATE TABLE `pegawai` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `nik` varchar(50) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alamat` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pegawai`
--

INSERT INTO `pegawai` (`id`, `user_id`, `nama`, `nik`, `no_hp`, `email`, `alamat`) VALUES
(10, 13, 'Tarissa Magdalena', '1234567890098', '09876543211', 'tarissamagdalenaa@gmail.com', 'Taras'),
(11, 14, 'alfath ruing', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shift`
--

CREATE TABLE `shift` (
  `id` int NOT NULL,
  `kode` varchar(20) DEFAULT NULL,
  `nama` varchar(50) DEFAULT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_pulang` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `shift`
--

INSERT INTO `shift` (`id`, `kode`, `nama`, `jam_masuk`, `jam_pulang`) VALUES
(1, 'P', 'Dinas Pagi CS', '14:00:00', '16:00:00'),
(2, 'PK', 'Dinas Pagi Kantor', '07:00:00', '19:00:00'),
(3, 'PR', 'Dinas Pagi Radar', '07:00:00', '19:00:00'),
(4, 'MR', 'Dinas Malam Radar', '19:00:00', '07:00:00'),
(5, 'MK', 'Dinas Malam Kantor', '19:00:00', '07:00:00'),
(6, 'L', 'Libur', NULL, NULL),
(7, 'CT', 'Cuti', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','pegawai') DEFAULT 'pegawai'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`) VALUES
(3, 'Admin', 'admin@absensi.com', '$2b$10$iOTaCDnbLtPtI0vKJhEbd.d7GAOeWZR/qFvnM13AcLUWfc2nnLVLG', 'admin'),
(13, 'Tarissa Magdalena', 'tarissa@absensi.com', '$2b$10$w7WmkF7fqWdjL0YEAuHnc.t1RG/FXgQfQULSmAfIIRPH.OOBEAKdO', 'pegawai'),
(14, 'alfath ruing', 'alfath.ruing', '$2b$10$U5l4M9GMstBbJaqWPZRf0eOVJHCnycRbfovGyTON/Etgw/a7fbtma', 'pegawai');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi`
--
ALTER TABLE `absensi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pegawai_tanggal` (`pegawai_id`,`tanggal`);

--
-- Indexes for table `jadwal_pegawai`
--
ALTER TABLE `jadwal_pegawai`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_jadwal` (`pegawai_id`,`tanggal`),
  ADD KEY `shift_kode` (`shift_kode`);

--
-- Indexes for table `jatah_cuti`
--
ALTER TABLE `jatah_cuti`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cuti` (`pegawai_id`,`tahun`),
  ADD UNIQUE KEY `uq_pegawai_tahun` (`pegawai_id`,`tahun`);

--
-- Indexes for table `pegawai`
--
ALTER TABLE `pegawai`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `shift`
--
ALTER TABLE `shift`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absensi`
--
ALTER TABLE `absensi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `jadwal_pegawai`
--
ALTER TABLE `jadwal_pegawai`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3856;

--
-- AUTO_INCREMENT for table `jatah_cuti`
--
ALTER TABLE `jatah_cuti`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `pegawai`
--
ALTER TABLE `pegawai`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `shift`
--
ALTER TABLE `shift`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi`
--
ALTER TABLE `absensi`
  ADD CONSTRAINT `absensi_ibfk_1` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jadwal_pegawai`
--
ALTER TABLE `jadwal_pegawai`
  ADD CONSTRAINT `jadwal_pegawai_ibfk_1` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jadwal_pegawai_ibfk_2` FOREIGN KEY (`shift_kode`) REFERENCES `shift` (`kode`) ON DELETE SET NULL;

--
-- Constraints for table `jatah_cuti`
--
ALTER TABLE `jatah_cuti`
  ADD CONSTRAINT `jatah_cuti_ibfk_1` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`);

--
-- Constraints for table `pegawai`
--
ALTER TABLE `pegawai`
  ADD CONSTRAINT `pegawai_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
